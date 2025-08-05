const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show TempVoice bot information and server configuration'),

    async execute(interaction, client, db) {
        await interaction.deferReply();

        try {
            const guild = interaction.guild;
            const guildConfig = await db.getGuildConfig(guild.id);
            
            const embed = new EmbedBuilder()
                .setTitle('🎤 TempVoice Bot Information')
                .setColor(0x5865F2)
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    {
                        name: '📊 Bot Statistics',
                        value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Uptime:** ${getUptime()}`,
                        inline: true
                    },
                    {
                        name: '🔧 Bot Version',
                        value: '**Version:** 1.0.0\n**Library:** discord.js v14\n**Node.js:** ' + process.version,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: 'TempVoice Bot - Create temporary voice channels', 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTimestamp();

            if (guildConfig) {
                const category = guild.channels.cache.get(guildConfig.category_id);
                const creatorChannel = guild.channels.cache.get(guildConfig.creator_channel_id);
                const tempChannels = await db.getAllTempChannels(guild.id);

                embed.addFields({
                    name: '⚙️ Server Configuration',
                    value: `**Category:** ${category ? category.name : 'Not found'}\n` +
                           `**Creator Channel:** ${creatorChannel ? creatorChannel.name : 'Not found'}\n` +
                           `**Name Template:** ${guildConfig.channel_name_template}\n` +
                           `**Default Limit:** ${guildConfig.user_limit === 0 ? 'No limit' : guildConfig.user_limit}\n` +
                           `**Default Bitrate:** ${guildConfig.bitrate / 1000}kbps\n` +
                           `**Active Temp Channels:** ${tempChannels.length}`,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '⚙️ Server Configuration',
                    value: '❌ TempVoice is not set up on this server.\nUse `/setup` to get started!',
                    inline: false
                });
            }

            embed.addFields({
                name: '📖 How to Use',
                value: '1. Use `/setup` to configure TempVoice\n' +
                       '2. Join the creator channel to create a temporary channel\n' +
                       '3. Use `/voice` commands to control your channel\n' +
                       '4. Your channel will be deleted when empty',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Info command error:', error);
            await interaction.editReply({
                content: '❌ An error occurred while fetching information.'
            });
        }
    }
};

function getUptime() {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}d `;
    if (hours > 0) uptimeStr += `${hours}h `;
    if (minutes > 0) uptimeStr += `${minutes}m `;
    uptimeStr += `${seconds}s`;

    return uptimeStr;
}