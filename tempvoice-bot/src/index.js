require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const Database = require('./database');
const fs = require('fs');
const path = require('path');

class TempVoiceBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.db = new Database(process.env.DATABASE_PATH);
        this.tempChannels = new Map(); // In-memory cache for quick access
        this.commands = new Collection();
        
        this.init();
    }

    async init() {
        await this.loadCommands();
        await this.setupEventHandlers();
        await this.login();
    }

    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                this.commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    async setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', async () => {
            console.log(`✅ ${this.client.user.tag} is online!`);
            
            // Load existing temp channels into cache
            await this.loadTempChannelsCache();
            
            // Set bot status
            this.client.user.setActivity('Creating temporary voice channels!', { type: 'WATCHING' });
        });

        // Voice state update event (main functionality)
        this.client.on('voiceStateUpdate', async (oldState, newState) => {
            await this.handleVoiceStateUpdate(oldState, newState);
        });

        // Slash command interaction
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            }
        });

        // Error handling
        this.client.on('error', console.error);
        this.client.on('warn', console.warn);
    }

    async loadTempChannelsCache() {
        try {
            for (const guild of this.client.guilds.cache.values()) {
                const tempChannels = await this.db.getAllTempChannels(guild.id);
                for (const tempChannel of tempChannels) {
                    // Verify channel still exists
                    const channel = guild.channels.cache.get(tempChannel.channel_id);
                    if (channel) {
                        this.tempChannels.set(tempChannel.channel_id, {
                            guildId: tempChannel.guild_id,
                            ownerId: tempChannel.owner_id,
                            textChannelId: tempChannel.text_channel_id
                        });
                    } else {
                        // Clean up database if channel doesn't exist
                        await this.db.removeTempChannel(tempChannel.channel_id);
                    }
                }
            }
            console.log(`Loaded ${this.tempChannels.size} temporary channels into cache`);
        } catch (error) {
            console.error('Error loading temp channels cache:', error);
        }
    }

    async handleVoiceStateUpdate(oldState, newState) {
        try {
            // Handle joining a voice channel
            if (newState.channelId && newState.channelId !== oldState.channelId) {
                await this.handleVoiceJoin(newState);
            }

            // Handle leaving a voice channel
            if (oldState.channelId && oldState.channelId !== newState.channelId) {
                await this.handleVoiceLeave(oldState);
            }
        } catch (error) {
            console.error('Error handling voice state update:', error);
        }
    }

    async handleVoiceJoin(voiceState) {
        const { member, guild, channelId } = voiceState;
        
        // Get guild configuration
        const config = await this.db.getGuildConfig(guild.id);
        if (!config || !config.creator_channel_id) return;

        // Check if user joined the creator channel
        if (channelId === config.creator_channel_id) {
            await this.createTempChannel(member, guild, config);
        }
    }

    async handleVoiceLeave(voiceState) {
        const { channelId, guild } = voiceState;
        
        // Check if it's a temporary channel
        if (!this.tempChannels.has(channelId)) return;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        // If channel is empty, delete it
        if (channel.members.size === 0) {
            await this.deleteTempChannel(channelId, guild);
        }
    }

    async createTempChannel(member, guild, config) {
        try {
            // Check if user already has a temp channel
            const existingChannel = Array.from(this.tempChannels.entries())
                .find(([_, data]) => data.ownerId === member.id && data.guildId === guild.id);
            
            if (existingChannel) {
                const [channelId] = existingChannel;
                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    // Move user to existing channel
                    await member.voice.setChannel(channel);
                    return;
                }
            }

            // Get category for temp channels
            const category = guild.channels.cache.get(config.temp_category_id);
            
            // Create channel name
            const channelName = config.temp_channel_name
                .replace('{username}', member.displayName)
                .replace('{user}', member.user.username);

            // Create the temporary voice channel
            const tempChannel = await guild.channels.create({
                name: channelName,
                type: 2, // Voice channel
                parent: category?.id,
                userLimit: config.default_limit || 0,
                bitrate: config.default_bitrate || 64000,
                permissionOverwrites: [
                    {
                        id: member.id,
                        allow: ['ManageChannels', 'MoveMembers', 'MuteMembers', 'DeafenMembers']
                    }
                ]
            });

            // Move user to the new channel
            await member.voice.setChannel(tempChannel);

            // Create text channel if enabled
            let textChannelId = null;
            if (config.auto_text_channels) {
                const textChannel = await guild.channels.create({
                    name: `💬-${channelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    type: 0, // Text channel
                    parent: category?.id,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: ['ViewChannel']
                        },
                        {
                            id: member.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
                textChannelId = textChannel.id;

                // Send welcome message with controls
                await this.sendChannelControls(textChannel, member, tempChannel);
            }

            // Add to database and cache
            await this.db.addTempChannel(tempChannel.id, guild.id, member.id, textChannelId);
            this.tempChannels.set(tempChannel.id, {
                guildId: guild.id,
                ownerId: member.id,
                textChannelId
            });

            console.log(`Created temp channel ${tempChannel.name} for ${member.displayName}`);

        } catch (error) {
            console.error('Error creating temp channel:', error);
        }
    }

    async deleteTempChannel(channelId, guild) {
        try {
            const tempChannelData = this.tempChannels.get(channelId);
            if (!tempChannelData) return;

            // Delete voice channel
            const voiceChannel = guild.channels.cache.get(channelId);
            if (voiceChannel) {
                await voiceChannel.delete('Temporary channel empty');
            }

            // Delete text channel if exists
            if (tempChannelData.textChannelId) {
                const textChannel = guild.channels.cache.get(tempChannelData.textChannelId);
                if (textChannel) {
                    await textChannel.delete('Temporary channel cleanup');
                }
            }

            // Remove from database and cache
            await this.db.removeTempChannel(channelId);
            this.tempChannels.delete(channelId);

            console.log(`Deleted temp channel ${channelId}`);

        } catch (error) {
            console.error('Error deleting temp channel:', error);
        }
    }

    async sendChannelControls(textChannel, owner, voiceChannel) {
        const embed = new EmbedBuilder()
            .setTitle('🎙️ Voice Channel Controls')
            .setDescription(`Welcome to your temporary voice channel, ${owner}!`)
            .addFields(
                { name: '🔧 Channel Management', value: 'Use the buttons below or slash commands to manage your channel', inline: false },
                { name: '📝 Available Commands', value: '`/voice name` - Change channel name\n`/voice limit` - Set user limit\n`/voice lock` - Lock/unlock channel\n`/voice bitrate` - Change audio quality', inline: false }
            )
            .setColor('#00ff00')
            .setTimestamp();

        await textChannel.send({ embeds: [embed] });
    }

    async handleSlashCommand(interaction) {
        const command = this.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, this.db, this.tempChannels);
        } catch (error) {
            console.error('Error executing command:', error);
            
            const errorMessage = 'There was an error executing this command!';
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }

    async handleButtonInteraction(interaction) {
        // Handle button interactions for voice channel controls
        // This will be implemented in the commands
        const customId = interaction.customId;
        
        if (customId.startsWith('voice_')) {
            // Forward to voice command handler
            const voiceCommand = this.commands.get('voice');
            if (voiceCommand && voiceCommand.handleButton) {
                await voiceCommand.handleButton(interaction, this.db, this.tempChannels);
            }
        }
    }

    async login() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Failed to login:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('Shutting down bot...');
        this.db.close();
        this.client.destroy();
    }
}

// Create and start the bot
const bot = new TempVoiceBot();

// Graceful shutdown
process.on('SIGINT', async () => {
    await bot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await bot.shutdown();
    process.exit(0);
});

module.exports = TempVoiceBot;