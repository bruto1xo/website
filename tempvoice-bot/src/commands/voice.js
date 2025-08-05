const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Manage your temporary voice channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('name')
                .setDescription('Change your voice channel name')
                .addStringOption(option =>
                    option
                        .setName('new_name')
                        .setDescription('New name for your voice channel')
                        .setRequired(true)
                        .setMaxLength(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('limit')
                .setDescription('Set user limit for your voice channel')
                .addIntegerOption(option =>
                    option
                        .setName('user_limit')
                        .setDescription('Number of users (0 = unlimited)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(99)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bitrate')
                .setDescription('Change voice channel bitrate')
                .addIntegerOption(option =>
                    option
                        .setName('quality')
                        .setDescription('Audio quality')
                        .setRequired(true)
                        .addChoices(
                            { name: '8kbps (Phone Quality)', value: 8000 },
                            { name: '16kbps (Low Quality)', value: 16000 },
                            { name: '32kbps (Normal Quality)', value: 32000 },
                            { name: '64kbps (Good Quality)', value: 64000 },
                            { name: '96kbps (High Quality)', value: 96000 },
                            { name: '128kbps (Very High Quality)', value: 128000 },
                            { name: '256kbps (Extreme Quality)', value: 256000 },
                            { name: '384kbps (Maximum Quality)', value: 384000 }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock or unlock your voice channel')
                .addBooleanOption(option =>
                    option
                        .setName('locked')
                        .setDescription('Lock the channel (true) or unlock it (false)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hide')
                .setDescription('Hide or show your voice channel')
                .addBooleanOption(option =>
                    option
                        .setName('hidden')
                        .setDescription('Hide the channel (true) or show it (false)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('permit')
                .setDescription('Allow a user to join your locked channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to permit')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reject')
                .setDescription('Remove a user from your channel and prevent them from joining')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to reject')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim ownership of the current temp channel if the owner left')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transfer ownership of your temp channel to another user')
                .addUserOption(option =>
                    option
                        .setName('new_owner')
                        .setDescription('New owner of the channel')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('text')
                .setDescription('Create or delete a temporary text channel')
                .addBooleanOption(option =>
                    option
                        .setName('create')
                        .setDescription('Create text channel (true) or delete it (false)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Send an invite to your voice channel to a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to invite')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Custom message to send with the invite')
                        .setRequired(false)
                        .setMaxLength(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('controls')
                .setDescription('Show voice channel control buttons')
        ),

    async execute(interaction, db, tempChannels) {
        const subcommand = interaction.options.getSubcommand();
        const userChannel = interaction.member.voice.channel;

        // Check if user is in a voice channel
        if (!userChannel) {
            return await interaction.reply({
                content: '❌ You must be in a voice channel to use this command!',
                ephemeral: true
            });
        }

        // Check if it's a temp channel
        const tempChannelData = tempChannels.get(userChannel.id);
        if (!tempChannelData) {
            return await interaction.reply({
                content: '❌ You must be in a temporary voice channel to use this command!',
                ephemeral: true
            });
        }

        // Get guild config to check if editing is allowed
        const config = await db.getGuildConfig(interaction.guild.id);
        if (!config || !config.editable_channels) {
            return await interaction.reply({
                content: '❌ Voice channel editing is disabled on this server!',
                ephemeral: true
            });
        }

        // Check ownership for most commands
        const isOwner = tempChannelData.ownerId === interaction.user.id;
        const requiresOwnership = !['claim', 'controls'].includes(subcommand);

        if (requiresOwnership && !isOwner) {
            return await interaction.reply({
                content: '❌ Only the channel owner can use this command!',
                ephemeral: true
            });
        }

        // Execute subcommand
        switch (subcommand) {
            case 'name':
                await this.handleName(interaction, userChannel);
                break;
            case 'limit':
                await this.handleLimit(interaction, userChannel);
                break;
            case 'bitrate':
                await this.handleBitrate(interaction, userChannel);
                break;
            case 'lock':
                await this.handleLock(interaction, userChannel);
                break;
            case 'hide':
                await this.handleHide(interaction, userChannel);
                break;
            case 'permit':
                await this.handlePermit(interaction, userChannel, db);
                break;
            case 'reject':
                await this.handleReject(interaction, userChannel, db);
                break;
            case 'claim':
                await this.handleClaim(interaction, userChannel, db, tempChannels);
                break;
            case 'transfer':
                await this.handleTransfer(interaction, userChannel, db, tempChannels);
                break;
            case 'text':
                await this.handleText(interaction, userChannel, tempChannelData, config);
                break;
            case 'invite':
                await this.handleInvite(interaction, userChannel);
                break;
            case 'controls':
                await this.handleControls(interaction, userChannel, tempChannelData);
                break;
        }
    },

    async handleName(interaction, channel) {
        const newName = interaction.options.getString('new_name');
        
        try {
            await channel.setName(newName);
            await interaction.reply({
                content: `✅ Channel name changed to **${newName}**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error changing channel name:', error);
            await interaction.reply({
                content: '❌ Failed to change channel name. Make sure it\'s not too long or contains invalid characters.',
                ephemeral: true
            });
        }
    },

    async handleLimit(interaction, channel) {
        const limit = interaction.options.getInteger('user_limit');
        
        try {
            await channel.setUserLimit(limit);
            await interaction.reply({
                content: `✅ Channel user limit set to **${limit === 0 ? 'unlimited' : limit}**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error changing user limit:', error);
            await interaction.reply({
                content: '❌ Failed to change user limit.',
                ephemeral: true
            });
        }
    },

    async handleBitrate(interaction, channel) {
        const bitrate = interaction.options.getInteger('quality');
        
        try {
            await channel.setBitrate(bitrate);
            await interaction.reply({
                content: `✅ Channel bitrate set to **${bitrate/1000}kbps**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error changing bitrate:', error);
            await interaction.reply({
                content: '❌ Failed to change bitrate. Your server might not support this quality level.',
                ephemeral: true
            });
        }
    },

    async handleLock(interaction, channel) {
        const locked = interaction.options.getBoolean('locked');
        
        try {
            if (locked) {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    Connect: false
                });
            } else {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    Connect: null
                });
            }
            
            await interaction.reply({
                content: `✅ Channel ${locked ? 'locked' : 'unlocked'}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error locking/unlocking channel:', error);
            await interaction.reply({
                content: '❌ Failed to change channel lock status.',
                ephemeral: true
            });
        }
    },

    async handleHide(interaction, channel) {
        const hidden = interaction.options.getBoolean('hidden');
        
        try {
            if (hidden) {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    ViewChannel: false
                });
            } else {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    ViewChannel: null
                });
            }
            
            await interaction.reply({
                content: `✅ Channel ${hidden ? 'hidden' : 'shown'}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error hiding/showing channel:', error);
            await interaction.reply({
                content: '❌ Failed to change channel visibility.',
                ephemeral: true
            });
        }
    },

    async handlePermit(interaction, channel, db) {
        const user = interaction.options.getUser('user');
        
        try {
            await channel.permissionOverwrites.edit(user, {
                Connect: true,
                ViewChannel: true
            });
            
            await db.addChannelPermission(channel.id, user.id, 'allow');
            
            await interaction.reply({
                content: `✅ **${user.tag}** can now join your channel`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error permitting user:', error);
            await interaction.reply({
                content: '❌ Failed to permit user.',
                ephemeral: true
            });
        }
    },

    async handleReject(interaction, channel, db) {
        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        
        try {
            // Disconnect user if they're in the channel
            if (member && member.voice.channel?.id === channel.id) {
                await member.voice.disconnect('Rejected from temporary channel');
            }
            
            await channel.permissionOverwrites.edit(user, {
                Connect: false,
                ViewChannel: false
            });
            
            await db.addChannelPermission(channel.id, user.id, 'deny');
            
            await interaction.reply({
                content: `✅ **${user.tag}** has been rejected from your channel`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error rejecting user:', error);
            await interaction.reply({
                content: '❌ Failed to reject user.',
                ephemeral: true
            });
        }
    },

    async handleClaim(interaction, channel, db, tempChannels) {
        const tempChannelData = tempChannels.get(channel.id);
        const owner = interaction.guild.members.cache.get(tempChannelData.ownerId);
        
        // Check if owner is still in the channel
        if (owner && owner.voice.channel?.id === channel.id) {
            return await interaction.reply({
                content: '❌ The channel owner is still in the channel!',
                ephemeral: true
            });
        }
        
        try {
            // Update permissions
            await channel.permissionOverwrites.edit(interaction.user, {
                ManageChannels: true,
                MoveMembers: true,
                MuteMembers: true,
                DeafenMembers: true
            });
            
            // Update database
            await db.addTempChannel(channel.id, interaction.guild.id, interaction.user.id, tempChannelData.textChannelId);
            
            // Update cache
            tempChannels.set(channel.id, {
                ...tempChannelData,
                ownerId: interaction.user.id
            });
            
            await interaction.reply({
                content: '✅ You are now the owner of this channel!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error claiming channel:', error);
            await interaction.reply({
                content: '❌ Failed to claim channel.',
                ephemeral: true
            });
        }
    },

    async handleTransfer(interaction, channel, db, tempChannels) {
        const newOwner = interaction.options.getUser('new_owner');
        const newOwnerMember = interaction.guild.members.cache.get(newOwner.id);
        
        // Check if new owner is in the channel
        if (!newOwnerMember || newOwnerMember.voice.channel?.id !== channel.id) {
            return await interaction.reply({
                content: '❌ The new owner must be in the voice channel!',
                ephemeral: true
            });
        }
        
        try {
            const tempChannelData = tempChannels.get(channel.id);
            
            // Remove old owner permissions
            await channel.permissionOverwrites.edit(interaction.user, {
                ManageChannels: null,
                MoveMembers: null,
                MuteMembers: null,
                DeafenMembers: null
            });
            
            // Add new owner permissions
            await channel.permissionOverwrites.edit(newOwner, {
                ManageChannels: true,
                MoveMembers: true,
                MuteMembers: true,
                DeafenMembers: true
            });
            
            // Update database
            await db.addTempChannel(channel.id, interaction.guild.id, newOwner.id, tempChannelData.textChannelId);
            
            // Update cache
            tempChannels.set(channel.id, {
                ...tempChannelData,
                ownerId: newOwner.id
            });
            
            await interaction.reply({
                content: `✅ Channel ownership transferred to **${newOwner.tag}**`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error transferring ownership:', error);
            await interaction.reply({
                content: '❌ Failed to transfer ownership.',
                ephemeral: true
            });
        }
    },

    async handleText(interaction, channel, tempChannelData, config) {
        const createText = interaction.options.getBoolean('create');
        
        try {
            if (createText) {
                if (tempChannelData.textChannelId) {
                    return await interaction.reply({
                        content: '❌ A text channel already exists for this voice channel!',
                        ephemeral: true
                    });
                }
                
                const textChannel = await interaction.guild.channels.create({
                    name: `💬-${channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    type: 0,
                    parent: channel.parent,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: ['ViewChannel']
                        },
                        ...channel.members.map(member => ({
                            id: member.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }))
                    ]
                });
                
                // Update database and cache
                tempChannelData.textChannelId = textChannel.id;
                
                await interaction.reply({
                    content: `✅ Created text channel ${textChannel}`,
                    ephemeral: true
                });
            } else {
                if (!tempChannelData.textChannelId) {
                    return await interaction.reply({
                        content: '❌ No text channel exists for this voice channel!',
                        ephemeral: true
                    });
                }
                
                const textChannel = interaction.guild.channels.cache.get(tempChannelData.textChannelId);
                if (textChannel) {
                    await textChannel.delete('Text channel removed by owner');
                }
                
                tempChannelData.textChannelId = null;
                
                await interaction.reply({
                    content: '✅ Text channel deleted',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error managing text channel:', error);
            await interaction.reply({
                content: '❌ Failed to manage text channel.',
                ephemeral: true
            });
        }
    },

    async handleInvite(interaction, channel) {
        const user = interaction.options.getUser('user');
        const customMessage = interaction.options.getString('message') || '';
        
        try {
            const invite = await channel.createInvite({
                maxAge: 300, // 5 minutes
                maxUses: 1,
                unique: true,
                reason: 'Temporary voice channel invite'
            });
            
            const embed = new EmbedBuilder()
                .setTitle('🎙️ Voice Channel Invitation')
                .setDescription(`**${interaction.user.tag}** has invited you to join their voice channel!`)
                .addFields(
                    { name: '📞 Channel', value: channel.name, inline: true },
                    { name: '👥 Current Users', value: `${channel.members.size}/${channel.userLimit || '∞'}`, inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();
            
            if (customMessage) {
                embed.addFields({ name: '💬 Message', value: customMessage, inline: false });
            }
            
            const inviteButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Join Voice Channel')
                        .setStyle(ButtonStyle.Link)
                        .setURL(invite.url)
                        .setEmoji('🎤')
                );
            
            try {
                await user.send({ embeds: [embed], components: [inviteButton] });
                await interaction.reply({
                    content: `✅ Invitation sent to **${user.tag}**`,
                    ephemeral: true
                });
            } catch {
                await interaction.reply({
                    content: `❌ Could not send DM to **${user.tag}**. They may have DMs disabled.`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error creating invite:', error);
            await interaction.reply({
                content: '❌ Failed to create invite.',
                ephemeral: true
            });
        }
    },

    async handleControls(interaction, channel, tempChannelData) {
        const embed = new EmbedBuilder()
            .setTitle('🎙️ Voice Channel Controls')
            .setDescription(`**${channel.name}**\n👥 ${channel.members.size}/${channel.userLimit || '∞'} users`)
            .addFields(
                { name: '🔊 Bitrate', value: `${channel.bitrate/1000}kbps`, inline: true },
                { name: '👑 Owner', value: `<@${tempChannelData.ownerId}>`, inline: true },
                { name: '🔗 Text Channel', value: tempChannelData.textChannelId ? `<#${tempChannelData.textChannelId}>` : 'None', inline: true }
            )
            .setColor('#0099ff')
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('voice_lock')
                    .setLabel('Lock')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId('voice_hide')
                    .setLabel('Hide')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👁️'),
                new ButtonBuilder()
                    .setCustomId('voice_text')
                    .setLabel('Text Channel')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💬'),
                new ButtonBuilder()
                    .setCustomId('voice_claim')
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👑')
            );

        await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    },

    // Handle button interactions
    async handleButton(interaction, db, tempChannels) {
        const customId = interaction.customId.replace('voice_', '');
        const userChannel = interaction.member.voice.channel;

        if (!userChannel || !tempChannels.has(userChannel.id)) {
            return await interaction.reply({
                content: '❌ You must be in a temporary voice channel!',
                ephemeral: true
            });
        }

        const tempChannelData = tempChannels.get(userChannel.id);
        const isOwner = tempChannelData.ownerId === interaction.user.id;

        switch (customId) {
            case 'lock':
                if (!isOwner) {
                    return await interaction.reply({ content: '❌ Only the channel owner can lock the channel!', ephemeral: true });
                }
                // Toggle lock status
                const isLocked = userChannel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id)?.deny?.has('Connect');
                await userChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    Connect: isLocked ? null : false
                });
                await interaction.reply({ content: `✅ Channel ${isLocked ? 'unlocked' : 'locked'}`, ephemeral: true });
                break;
                
            case 'hide':
                if (!isOwner) {
                    return await interaction.reply({ content: '❌ Only the channel owner can hide the channel!', ephemeral: true });
                }
                const isHidden = userChannel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id)?.deny?.has('ViewChannel');
                await userChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    ViewChannel: isHidden ? null : false
                });
                await interaction.reply({ content: `✅ Channel ${isHidden ? 'shown' : 'hidden'}`, ephemeral: true });
                break;
                
            case 'text':
                if (!isOwner) {
                    return await interaction.reply({ content: '❌ Only the channel owner can manage text channels!', ephemeral: true });
                }
                // Toggle text channel
                if (tempChannelData.textChannelId) {
                    const textChannel = interaction.guild.channels.cache.get(tempChannelData.textChannelId);
                    if (textChannel) await textChannel.delete();
                    tempChannelData.textChannelId = null;
                    await interaction.reply({ content: '✅ Text channel deleted', ephemeral: true });
                } else {
                    const textChannel = await interaction.guild.channels.create({
                        name: `💬-${userChannel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                        type: 0,
                        parent: userChannel.parent,
                        permissionOverwrites: [
                            { id: interaction.guild.roles.everyone.id, deny: ['ViewChannel'] },
                            ...userChannel.members.map(member => ({
                                id: member.id,
                                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                            }))
                        ]
                    });
                    tempChannelData.textChannelId = textChannel.id;
                    await interaction.reply({ content: `✅ Created ${textChannel}`, ephemeral: true });
                }
                break;
                
            case 'claim':
                const owner = interaction.guild.members.cache.get(tempChannelData.ownerId);
                if (owner && owner.voice.channel?.id === userChannel.id) {
                    return await interaction.reply({ content: '❌ The channel owner is still in the channel!', ephemeral: true });
                }
                await userChannel.permissionOverwrites.edit(interaction.user, {
                    ManageChannels: true, MoveMembers: true, MuteMembers: true, DeafenMembers: true
                });
                tempChannelData.ownerId = interaction.user.id;
                await interaction.reply({ content: '✅ You are now the owner of this channel!', ephemeral: true });
                break;
        }
    }
};