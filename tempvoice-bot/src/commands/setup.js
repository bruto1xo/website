const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup temporary voice channels for your server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new temporary voice channel setup')
                .addChannelOption(option =>
                    option
                        .setName('creator_channel')
                        .setDescription('Voice channel users join to create temp channels')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('Category to create temp channels in')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('channel_name')
                        .setDescription('Template for temp channel names (use {username} for user name)')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('default_limit')
                        .setDescription('Default user limit for temp channels (0 = unlimited)')
                        .setMinValue(0)
                        .setMaxValue(99)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option
                        .setName('bitrate')
                        .setDescription('Default bitrate for temp channels (8000-384000)')
                        .setMinValue(8000)
                        .setMaxValue(384000)
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('auto_text_channels')
                        .setDescription('Create private text channels with voice channels')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('editable')
                        .setDescription('Allow users to edit their temp channels')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View current setup configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove temporary voice channel setup')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, db, tempChannels) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            await this.handleCreate(interaction, db);
        } else if (subcommand === 'info') {
            await this.handleInfo(interaction, db);
        } else if (subcommand === 'remove') {
            await this.handleRemove(interaction, db, tempChannels);
        }
    },

    async handleCreate(interaction, db) {
        try {
            const creatorChannel = interaction.options.getChannel('creator_channel');
            const category = interaction.options.getChannel('category');
            const channelName = interaction.options.getString('channel_name') || '🔊 {username}\'s Channel';
            const defaultLimit = interaction.options.getInteger('default_limit') || 0;
            const bitrate = interaction.options.getInteger('bitrate') || 64000;
            const autoTextChannels = interaction.options.getBoolean('auto_text_channels') ?? false;
            const editable = interaction.options.getBoolean('editable') ?? true;

            // Validate permissions
            const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
            
            if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.reply({
                    content: '❌ I need the "Manage Channels" permission to create temporary voice channels!',
                    ephemeral: true
                });
            }

            // If no category provided, create one
            let categoryId = category?.id;
            if (!category) {
                try {
                    const newCategory = await interaction.guild.channels.create({
                        name: '🎙️ Temporary Channels',
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
                            }
                        ]
                    });
                    categoryId = newCategory.id;
                } catch (error) {
                    console.error('Error creating category:', error);
                    return await interaction.reply({
                        content: '❌ Failed to create category for temporary channels. Please provide one manually.',
                        ephemeral: true
                    });
                }
            }

            // Save configuration to database
            const config = {
                creator_channel_id: creatorChannel.id,
                temp_category_id: categoryId,
                temp_channel_name: channelName,
                default_limit: defaultLimit,
                default_bitrate: bitrate,
                auto_text_channels: autoTextChannels,
                editable_channels: editable
            };

            await db.setGuildConfig(interaction.guild.id, config);

            const embed = new EmbedBuilder()
                .setTitle('✅ Temporary Voice Channels Setup Complete!')
                .setDescription('Your server is now configured for temporary voice channels!')
                .addFields(
                    { name: '🎤 Creator Channel', value: `${creatorChannel}`, inline: true },
                    { name: '📁 Category', value: `<#${categoryId}>`, inline: true },
                    { name: '📝 Channel Name Template', value: `\`${channelName}\``, inline: true },
                    { name: '👥 Default User Limit', value: `${defaultLimit === 0 ? 'Unlimited' : defaultLimit}`, inline: true },
                    { name: '🔊 Default Bitrate', value: `${bitrate/1000}kbps`, inline: true },
                    { name: '💬 Auto Text Channels', value: autoTextChannels ? 'Enabled' : 'Disabled', inline: true },
                    { name: '⚙️ User Editable', value: editable ? 'Yes' : 'No', inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: 'Users can now join the creator channel to create temporary voice channels!' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in setup create:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting up temporary voice channels.',
                ephemeral: true
            });
        }
    },

    async handleInfo(interaction, db) {
        try {
            const config = await db.getGuildConfig(interaction.guild.id);

            if (!config) {
                return await interaction.reply({
                    content: '❌ Temporary voice channels are not set up for this server. Use `/setup create` to get started!',
                    ephemeral: true
                });
            }

            const creatorChannel = interaction.guild.channels.cache.get(config.creator_channel_id);
            const category = interaction.guild.channels.cache.get(config.temp_category_id);

            const embed = new EmbedBuilder()
                .setTitle('📋 Temporary Voice Channels Configuration')
                .addFields(
                    { name: '🎤 Creator Channel', value: creatorChannel ? `${creatorChannel}` : '❌ Channel not found', inline: true },
                    { name: '📁 Category', value: category ? `${category}` : '❌ Category not found', inline: true },
                    { name: '📝 Channel Name Template', value: `\`${config.temp_channel_name}\``, inline: true },
                    { name: '👥 Default User Limit', value: `${config.default_limit === 0 ? 'Unlimited' : config.default_limit}`, inline: true },
                    { name: '🔊 Default Bitrate', value: `${config.default_bitrate/1000}kbps`, inline: true },
                    { name: '💬 Auto Text Channels', value: config.auto_text_channels ? 'Enabled' : 'Disabled', inline: true },
                    { name: '⚙️ User Editable', value: config.editable_channels ? 'Yes' : 'No', inline: true }
                )
                .setColor('#0099ff')
                .setTimestamp();

            // Count active temp channels
            const tempChannelCount = Array.from(tempChannels.values())
                .filter(data => data.guildId === interaction.guild.id).length;

            if (tempChannelCount > 0) {
                embed.addFields({ name: '📊 Active Temp Channels', value: `${tempChannelCount}`, inline: true });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error in setup info:', error);
            await interaction.reply({
                content: '❌ An error occurred while retrieving setup information.',
                ephemeral: true
            });
        }
    },

    async handleRemove(interaction, db, tempChannels) {
        try {
            const config = await db.getGuildConfig(interaction.guild.id);

            if (!config) {
                return await interaction.reply({
                    content: '❌ No temporary voice channel setup found for this server.',
                    ephemeral: true
                });
            }

            // Remove configuration
            await db.setGuildConfig(interaction.guild.id, {
                creator_channel_id: null,
                temp_category_id: null,
                temp_channel_name: '🔊 {username}\'s Channel',
                default_limit: 0,
                default_bitrate: 64000,
                auto_text_channels: false,
                editable_channels: true
            });

            // Clean up any existing temp channels
            const guildTempChannels = Array.from(tempChannels.entries())
                .filter(([_, data]) => data.guildId === interaction.guild.id);

            for (const [channelId, data] of guildTempChannels) {
                try {
                    const voiceChannel = interaction.guild.channels.cache.get(channelId);
                    if (voiceChannel) {
                        await voiceChannel.delete('Setup removed');
                    }

                    if (data.textChannelId) {
                        const textChannel = interaction.guild.channels.cache.get(data.textChannelId);
                        if (textChannel) {
                            await textChannel.delete('Setup removed');
                        }
                    }

                    await db.removeTempChannel(channelId);
                    tempChannels.delete(channelId);
                } catch (cleanupError) {
                    console.error('Error cleaning up temp channel:', cleanupError);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Setup Removed')
                .setDescription('Temporary voice channel setup has been removed from this server.')
                .addFields(
                    { name: '🧹 Cleanup', value: `Removed ${guildTempChannels.length} active temporary channels`, inline: false }
                )
                .setColor('#ff9900')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in setup remove:', error);
            await interaction.reply({
                content: '❌ An error occurred while removing the setup.',
                ephemeral: true
            });
        }
    }
};