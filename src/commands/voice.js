const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Control your temporary voice channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rename')
                .setDescription('Rename your temporary voice channel')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('New name for your channel')
                        .setRequired(true)
                        .setMaxLength(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('limit')
                .setDescription('Set user limit for your temporary voice channel')
                .addIntegerOption(option =>
                    option.setName('users')
                        .setDescription('Maximum number of users (0 = no limit)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(99)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock your temporary voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock your temporary voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('permit')
                .setDescription('Allow a user to join your locked channel')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to allow')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reject')
                .setDescription('Prevent a user from joining your channel')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to block')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim ownership of this temporary channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transfer')
                .setDescription('Transfer ownership of your channel to another user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to transfer ownership to')
                        .setRequired(true))),

    async execute(interaction, client, db) {
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member;
        const channel = member.voice.channel;

        // Check if user is in a voice channel
        if (!channel) {
            return interaction.reply({
                content: '❌ You must be in a voice channel to use this command!',
                ephemeral: true
            });
        }

        // Check if it's a temporary channel
        const tempChannelData = client.tempChannels.get(channel.id);
        if (!tempChannelData) {
            return interaction.reply({
                content: '❌ This is not a temporary voice channel!',
                ephemeral: true
            });
        }

        try {
            switch (subcommand) {
                case 'rename':
                    await handleRename(interaction, channel, tempChannelData, client, db);
                    break;
                case 'limit':
                    await handleLimit(interaction, channel, tempChannelData, client, db);
                    break;
                case 'lock':
                    await handleLock(interaction, channel, tempChannelData, true);
                    break;
                case 'unlock':
                    await handleLock(interaction, channel, tempChannelData, false);
                    break;
                case 'permit':
                    await handlePermit(interaction, channel, tempChannelData, client, db);
                    break;
                case 'reject':
                    await handleReject(interaction, channel, tempChannelData, client, db);
                    break;
                case 'claim':
                    await handleClaim(interaction, channel, tempChannelData, client, db);
                    break;
                case 'transfer':
                    await handleTransfer(interaction, channel, tempChannelData, client, db);
                    break;
            }
        } catch (error) {
            console.error(`Voice command error (${subcommand}):`, error);
            await interaction.reply({
                content: '❌ An error occurred while executing this command.',
                ephemeral: true
            });
        }
    }
};

async function handleRename(interaction, channel, tempChannelData, client, db) {
    const member = interaction.member;
    const newName = interaction.options.getString('name');

    // Check ownership
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({
            content: '❌ Only the channel owner can rename the channel!',
            ephemeral: true
        });
    }

    // Filter inappropriate names (basic profanity filter)
    const inappropriateWords = ['fuck', 'shit', 'damn', 'bitch', 'ass', 'nigger', 'faggot'];
    const lowerName = newName.toLowerCase();
    if (inappropriateWords.some(word => lowerName.includes(word))) {
        return interaction.reply({
            content: '❌ Channel name contains inappropriate content!',
            ephemeral: true
        });
    }

    await channel.setName(newName);
    await interaction.reply({
        content: `✅ Channel renamed to: **${newName}**`,
        ephemeral: true
    });
}

async function handleLimit(interaction, channel, tempChannelData, client, db) {
    const member = interaction.member;
    const limit = interaction.options.getInteger('users');

    // Check ownership
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({
            content: '❌ Only the channel owner can change the user limit!',
            ephemeral: true
        });
    }

    await channel.setUserLimit(limit);
    await interaction.reply({
        content: `✅ User limit set to: **${limit === 0 ? 'No limit' : limit}**`,
        ephemeral: true
    });
}

async function handleLock(interaction, channel, tempChannelData, lock) {
    const member = interaction.member;
    const guild = interaction.guild;

    // Check ownership
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({
            content: '❌ Only the channel owner can lock/unlock the channel!',
            ephemeral: true
        });
    }

    await channel.permissionOverwrites.edit(guild.roles.everyone, {
        Connect: lock ? false : null
    });

    await interaction.reply({
        content: `${lock ? '🔒' : '🔓'} Channel ${lock ? 'locked' : 'unlocked'}!`,
        ephemeral: true
    });
}

async function handlePermit(interaction, channel, tempChannelData, client, db) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser('user');

    // Check ownership
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({
            content: '❌ Only the channel owner can permit users!',
            ephemeral: true
        });
    }

    await channel.permissionOverwrites.edit(targetUser, {
        Connect: true
    });

    // Store in database
    await db.addChannelPermission(channel.id, targetUser.id, 'allow');

    await interaction.reply({
        content: `✅ **${targetUser.username}** can now join your channel!`,
        ephemeral: true
    });
}

async function handleReject(interaction, channel, tempChannelData, client, db) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser('user');

    // Check ownership
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({
            content: '❌ Only the channel owner can reject users!',
            ephemeral: true
        });
    }

    // Can't reject the owner
    if (targetUser.id === member.id) {
        return interaction.reply({
            content: '❌ You cannot reject yourself from your own channel!',
            ephemeral: true
        });
    }

    await channel.permissionOverwrites.edit(targetUser, {
        Connect: false
    });

    // Kick user if they're currently in the channel
    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    if (targetMember && targetMember.voice.channel && targetMember.voice.channel.id === channel.id) {
        try {
            await targetMember.voice.disconnect('Rejected from temporary channel');
        } catch (error) {
            console.error('Failed to disconnect rejected user:', error);
        }
    }

    // Store in database
    await db.addChannelPermission(channel.id, targetUser.id, 'deny');

    await interaction.reply({
        content: `❌ **${targetUser.username}** has been rejected from your channel!`,
        ephemeral: true
    });
}

async function handleClaim(interaction, channel, tempChannelData, client, db) {
    const member = interaction.member;

    // Check if current owner is still in the channel
    const currentOwner = interaction.guild.members.cache.get(tempChannelData.ownerId);
    if (currentOwner && currentOwner.voice.channel && currentOwner.voice.channel.id === channel.id) {
        return interaction.reply({
            content: '❌ The current owner is still in the channel!',
            ephemeral: true
        });
    }

    // Transfer ownership
    tempChannelData.ownerId = member.id;
    client.tempChannels.set(channel.id, tempChannelData);

    // Update channel permissions
    await channel.permissionOverwrites.edit(member, {
        ManageChannels: true,
        ManageRoles: true,
        MuteMembers: true,
        DeafenMembers: true,
        MoveMembers: true
    });

    // Remove old owner permissions if they exist
    if (currentOwner) {
        await channel.permissionOverwrites.edit(currentOwner, {
            ManageChannels: null,
            ManageRoles: null,
            MuteMembers: null,
            DeafenMembers: null,
            MoveMembers: null
        });
    }

    await interaction.reply({
        content: '✅ You are now the owner of this channel!',
        ephemeral: true
    });
}

async function handleTransfer(interaction, channel, tempChannelData, client, db) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser('user');

    // Check ownership
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({
            content: '❌ Only the channel owner can transfer ownership!',
            ephemeral: true
        });
    }

    // Check if target user is in the channel
    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    if (!targetMember || !targetMember.voice.channel || targetMember.voice.channel.id !== channel.id) {
        return interaction.reply({
            content: '❌ The target user must be in this channel!',
            ephemeral: true
        });
    }

    // Transfer ownership
    tempChannelData.ownerId = targetUser.id;
    client.tempChannels.set(channel.id, tempChannelData);

    // Update permissions
    await channel.permissionOverwrites.edit(targetMember, {
        ManageChannels: true,
        ManageRoles: true,
        MuteMembers: true,
        DeafenMembers: true,
        MoveMembers: true
    });

    await channel.permissionOverwrites.edit(member, {
        ManageChannels: null,
        ManageRoles: null,
        MuteMembers: null,
        DeafenMembers: null,
        MoveMembers: null
    });

    await interaction.reply({
        content: `✅ Channel ownership transferred to **${targetUser.username}**!`,
        ephemeral: true
    });
}