const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState, client, db) {
        try {
            // Handle user joining a channel
            if (!oldState.channelId && newState.channelId) {
                await handleUserJoin(newState, client, db);
            }
            
            // Handle user leaving a channel
            if (oldState.channelId && !newState.channelId) {
                await handleUserLeave(oldState, client, db);
            }
            
            // Handle user switching channels
            if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                await handleUserLeave(oldState, client, db);
                await handleUserJoin(newState, client, db);
            }
        } catch (error) {
            console.error('Error in voiceStateUpdate:', error);
        }
    }
};

async function handleUserJoin(newState, client, db) {
    const { member, channel, guild } = newState;
    
    if (!member || !channel || !guild) return;
    
    // Get guild configuration
    const guildConfig = await db.getGuildConfig(guild.id);
    if (!guildConfig || !guildConfig.creator_channel_id) return;
    
    // Check if user joined a creator channel
    if (channel.id === guildConfig.creator_channel_id) {
        await createTempChannel(member, channel, guildConfig, client, db);
    }
}

async function handleUserLeave(oldState, client, db) {
    const { channel, guild } = oldState;
    
    if (!channel || !guild) return;
    
    // Check if the channel is a temporary channel and is now empty
    const tempChannelData = client.tempChannels.get(channel.id);
    if (tempChannelData && channel.members.size === 0) {
        await deleteTempChannel(channel, client, db);
    }
}

async function createTempChannel(member, creatorChannel, guildConfig, client, db) {
    try {
        const guild = member.guild;
        const category = guild.channels.cache.get(guildConfig.category_id);
        
        // Generate channel name
        const channelName = guildConfig.channel_name_template.replace('{username}', member.displayName);
        
        // Create the temporary voice channel
        const tempChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildVoice,
            parent: category,
            userLimit: guildConfig.user_limit,
            bitrate: Math.min(guildConfig.bitrate, guild.premiumTier >= 1 ? 128000 : 96000),
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageRoles,
                        PermissionFlagsBits.MuteMembers,
                        PermissionFlagsBits.DeafenMembers,
                        PermissionFlagsBits.MoveMembers
                    ],
                }
            ]
        });
        
        // Move the user to the new channel
        try {
            await member.voice.setChannel(tempChannel);
        } catch (error) {
            console.error('Failed to move user to temp channel:', error);
            // If we can't move the user, delete the channel
            await tempChannel.delete();
            return;
        }
        
        // Store in database and memory
        await db.addTempChannel(tempChannel.id, guild.id, member.id, creatorChannel.id);
        client.tempChannels.set(tempChannel.id, {
            ownerId: member.id,
            guildId: guild.id,
            creatorChannelId: creatorChannel.id
        });
        
        console.log(`Created temporary channel: ${tempChannel.name} for ${member.displayName}`);
        
    } catch (error) {
        console.error('Error creating temporary channel:', error);
    }
}

async function deleteTempChannel(channel, client, db) {
    try {
        // Remove from tracking
        client.tempChannels.delete(channel.id);
        await db.removeTempChannel(channel.id);
        
        // Delete the channel
        await channel.delete('Temporary channel became empty');
        
        console.log(`Deleted temporary channel: ${channel.name}`);
        
    } catch (error) {
        console.error('Error deleting temporary channel:', error);
    }
}