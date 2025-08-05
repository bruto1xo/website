const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client, db) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            
            try {
                await command.execute(interaction, client, db);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                
                const errorMessage = 'There was an error while executing this command!';
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: errorMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                }
            }
        }
        
        // Handle button interactions
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction, client, db);
        }
        
        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            await handleSelectMenuInteraction(interaction, client, db);
        }
    }
};

async function handleButtonInteraction(interaction, client, db) {
    const { customId, member, channel } = interaction;
    
    // Check if this is a temporary channel control
    const tempChannelData = client.tempChannels.get(channel.id);
    if (!tempChannelData) {
        return interaction.reply({ content: 'This is not a temporary channel!', ephemeral: true });
    }
    
    // Check if user is the channel owner
    if (tempChannelData.ownerId !== member.id) {
        return interaction.reply({ content: 'Only the channel owner can use these controls!', ephemeral: true });
    }
    
    try {
        switch (customId) {
            case 'temp_lock':
                await toggleChannelLock(interaction, channel);
                break;
            case 'temp_unlock':
                await toggleChannelLock(interaction, channel);
                break;
            case 'temp_rename':
                await interaction.reply({ content: 'Use the `/voice rename` command to rename your channel.', ephemeral: true });
                break;
            case 'temp_limit':
                await interaction.reply({ content: 'Use the `/voice limit` command to change the user limit.', ephemeral: true });
                break;
            default:
                await interaction.reply({ content: 'Unknown action!', ephemeral: true });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
        await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
}

async function handleSelectMenuInteraction(interaction, client, db) {
    // Handle select menu interactions if needed
    await interaction.reply({ content: 'Select menu interactions not implemented yet.', ephemeral: true });
}

async function toggleChannelLock(interaction, channel) {
    const guild = interaction.guild;
    const everyoneRole = guild.roles.everyone;
    
    // Get current permissions
    const currentPerms = channel.permissionOverwrites.cache.get(everyoneRole.id);
    const isLocked = currentPerms && currentPerms.deny.has('Connect');
    
    if (isLocked) {
        // Unlock the channel
        await channel.permissionOverwrites.edit(everyoneRole, {
            Connect: true
        });
        await interaction.reply({ content: '🔓 Channel unlocked!', ephemeral: true });
    } else {
        // Lock the channel
        await channel.permissionOverwrites.edit(everyoneRole, {
            Connect: false
        });
        await interaction.reply({ content: '🔒 Channel locked!', ephemeral: true });
    }
}