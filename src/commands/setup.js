const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set up temporary voice channels for your server')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name template for temporary channels (use {username} for user display name)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Default user limit for temporary channels (0 = no limit)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(99))
        .addIntegerOption(option =>
            option.setName('bitrate')
                .setDescription('Default bitrate for temporary channels (in kbps)')
                .setRequired(false)
                .setMinValue(8)
                .setMaxValue(384))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, client, db) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const nameTemplate = interaction.options.getString('name') || '{username}\'s Channel';
        const userLimit = interaction.options.getInteger('limit') || 0;
        const bitrate = (interaction.options.getInteger('bitrate') || 64) * 1000; // Convert to bps

        try {
            // Check bot permissions
            const botMember = guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has([
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.ViewChannel
            ])) {
                return interaction.editReply({
                    content: '❌ I need the following permissions to work properly:\n• Manage Channels\n• Move Members\n• Connect\n• View Channel'
                });
            }

            // Get existing configuration
            let guildConfig = await db.getGuildConfig(guild.id);
            let category, creatorChannel;

            if (guildConfig && guildConfig.category_id && guildConfig.creator_channel_id) {
                // Check if existing setup still exists
                category = guild.channels.cache.get(guildConfig.category_id);
                creatorChannel = guild.channels.cache.get(guildConfig.creator_channel_id);

                if (category && creatorChannel) {
                    // Update existing configuration
                    await db.setGuildConfig(guild.id, {
                        creator_channel_id: creatorChannel.id,
                        category_id: category.id,
                        channel_name_template: nameTemplate,
                        user_limit: userLimit,
                        bitrate: bitrate
                    });

                    return interaction.editReply({
                        content: `✅ **TempVoice Updated!**\n\n` +
                                `📂 **Category:** ${category.name}\n` +
                                `🎤 **Creator Channel:** ${creatorChannel.name}\n` +
                                `📝 **Name Template:** ${nameTemplate}\n` +
                                `👥 **User Limit:** ${userLimit === 0 ? 'No limit' : userLimit}\n` +
                                `🎵 **Bitrate:** ${bitrate / 1000}kbps\n\n` +
                                `Join the creator channel to create a temporary voice channel!`
                    });
                }
            }

            // Create new category
            category = await guild.channels.create({
                name: process.env.DEFAULT_CATEGORY_NAME || 'TempVoice',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageRoles,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.MoveMembers
                        ],
                    }
                ]
            });

            // Create creator channel
            creatorChannel = await guild.channels.create({
                name: process.env.DEFAULT_CREATOR_CHANNEL_NAME || '➕ Join to Create',
                type: ChannelType.GuildVoice,
                parent: category,
                userLimit: 1, // Force users to be moved immediately
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageRoles,
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.MoveMembers
                        ],
                    }
                ]
            });

            // Save configuration to database
            await db.setGuildConfig(guild.id, {
                creator_channel_id: creatorChannel.id,
                category_id: category.id,
                channel_name_template: nameTemplate,
                user_limit: userLimit,
                bitrate: bitrate
            });

            await interaction.editReply({
                content: `✅ **TempVoice Setup Complete!**\n\n` +
                        `📂 **Category:** ${category.name}\n` +
                        `🎤 **Creator Channel:** ${creatorChannel.name}\n` +
                        `📝 **Name Template:** ${nameTemplate}\n` +
                        `👥 **User Limit:** ${userLimit === 0 ? 'No limit' : userLimit}\n` +
                        `🎵 **Bitrate:** ${bitrate / 1000}kbps\n\n` +
                        `Join the creator channel to create a temporary voice channel!\n\n` +
                        `Use \`/voice\` commands to control your temporary channel.`
            });

        } catch (error) {
            console.error('Setup command error:', error);
            await interaction.editReply({
                content: '❌ An error occurred during setup. Please make sure I have the required permissions.'
            });
        }
    }
};