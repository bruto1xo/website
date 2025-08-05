const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client, db) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Set bot activity
        client.user.setActivity('for voice channels', { type: ActivityType.Watching });
        
        // Clean up any orphaned temporary channels on startup
        await cleanupOrphanedChannels(client, db);
    }
};

async function cleanupOrphanedChannels(client, db) {
    try {
        console.log('Cleaning up orphaned temporary channels...');
        
        for (const guild of client.guilds.cache.values()) {
            const tempChannels = await db.getAllTempChannels(guild.id);
            
            for (const tempChannelData of tempChannels) {
                const channel = guild.channels.cache.get(tempChannelData.channel_id);
                
                if (!channel) {
                    // Channel doesn't exist anymore, remove from database
                    await db.removeTempChannel(tempChannelData.channel_id);
                    client.tempChannels.delete(tempChannelData.channel_id);
                    continue;
                }
                
                // Check if channel is empty
                if (channel.members.size === 0) {
                    try {
                        await channel.delete('Cleanup: Empty temporary channel');
                        await db.removeTempChannel(tempChannelData.channel_id);
                        client.tempChannels.delete(tempChannelData.channel_id);
                    } catch (error) {
                        console.error(`Failed to delete orphaned channel ${tempChannelData.channel_id}:`, error);
                    }
                } else {
                    // Channel exists and has members, add to tracking
                    client.tempChannels.set(tempChannelData.channel_id, {
                        ownerId: tempChannelData.owner_id,
                        guildId: tempChannelData.guild_id,
                        creatorChannelId: tempChannelData.creator_channel_id
                    });
                }
            }
        }
        
        console.log('Cleanup completed');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}