const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show information about TempVoice Bot and its features'),

    async execute(interaction, db, tempChannels) {
        try {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🎙️ TempVoice Bot - Help & Information')
                .setDescription('A powerful Discord bot for creating temporary voice channels, similar to TempVoice.xyz!')
                .addFields(
                    {
                        name: '🚀 **Getting Started**',
                        value: '1. Use `/setup create` to configure temporary voice channels\n2. Join the creator channel to create your own temp channel\n3. Use `/voice` commands to manage your channel',
                        inline: false
                    },
                    {
                        name: '⚙️ **Setup Commands**',
                        value: '`/setup create` - Configure temporary voice channels\n`/setup info` - View current configuration\n`/setup remove` - Remove the setup',
                        inline: true
                    },
                    {
                        name: '🎤 **Voice Commands**',
                        value: '`/voice name` - Change channel name\n`/voice limit` - Set user limit\n`/voice bitrate` - Change audio quality\n`/voice lock` - Lock/unlock channel\n`/voice hide` - Hide/show channel',
                        inline: true
                    },
                    {
                        name: '👥 **User Management**',
                        value: '`/voice permit` - Allow specific users\n`/voice reject` - Remove and block users\n`/voice claim` - Claim abandoned channels\n`/voice transfer` - Transfer ownership',
                        inline: true
                    },
                    {
                        name: '💬 **Text Channels**',
                        value: '`/voice text` - Create/delete text channel\n`/voice invite` - Send invite to users\n`/voice controls` - Show control buttons',
                        inline: true
                    },
                    {
                        name: '✨ **Key Features**',
                        value: '• **Auto-deletion** when empty\n• **Owner permissions** for channel control\n• **Optional text channels** with voice channels\n• **Advanced permission system**\n• **Multiple setup types** and configurations\n• **Button interface** for easy control',
                        inline: false
                    },
                    {
                        name: '🔧 **Bot Permissions Required**',
                        value: '• Manage Channels\n• Move Members\n• View Channels\n• Connect\n• Create Instant Invite',
                        inline: true
                    },
                    {
                        name: '📊 **Current Status**',
                        value: `Active temp channels: ${tempChannels.size}\nServers using TempVoice: ${interaction.client.guilds.cache.size}`,
                        inline: true
                    }
                )
                .setColor('#00ff88')
                .setTimestamp()
                .setFooter({
                    text: 'TempVoice Bot • Temporary Voice Channels Made Easy',
                    iconURL: interaction.client.user.displayAvatarURL()
                });

            // Add setup status for this guild
            const config = await db.getGuildConfig(interaction.guild.id);
            if (config && config.creator_channel_id) {
                const creatorChannel = interaction.guild.channels.cache.get(config.creator_channel_id);
                helpEmbed.addFields({
                    name: '📍 **This Server**',
                    value: `Setup: ✅ **Configured**\nCreator Channel: ${creatorChannel || '❌ Not found'}\nEditable Channels: ${config.editable_channels ? 'Yes' : 'No'}`,
                    inline: false
                });
            } else {
                helpEmbed.addFields({
                    name: '📍 **This Server**',
                    value: '❌ **Not configured** - Use `/setup create` to get started!',
                    inline: false
                });
            }

            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });

        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({
                content: '❌ An error occurred while displaying help information.',
                ephemeral: true
            });
        }
    }
};