const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, Role, ChannelType, OverwriteType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const prefix = '+';
const dataFile = path.join(__dirname, 'bot_data.json');
let data = {};

function loadData() {
    if (fs.existsSync(dataFile)) {
        data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } else {
        data = {
            verifications: {}, // staff_id: count
            jails: {}, // staff_id: count
            warns: {}, // user_id: count
            jail_cases: {}, // user_id: case string
            sas_list: [], // list of user_ids
            premium_users: [], // list of user_ids
            premium_roles: {}, // user_id: role_id
            premium_channels: {}, // user_id: channel_id
        };
        saveData();
    }
}

function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

loadData();

// Hardcoded role names (create these roles in your server)
const VERIFIED_ROLE = 'Verified';
const UNVERIFIED_ROLE = 'Unverified';
const BOY_ROLE = 'Boy';
const GIRL_ROLE = 'Girl';
const JAIL_ROLE = 'Jailed';
const MUTED_ROLE = 'Muted'; // For chat mute

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Verification commands
    if (command === 'vb') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const verified = message.guild.roles.cache.find(r => r.name === VERIFIED_ROLE);
        const unverified = message.guild.roles.cache.find(r => r.name === UNVERIFIED_ROLE);
        const boy = message.guild.roles.cache.find(r => r.name === BOY_ROLE);
        if (verified && unverified && boy) {
            await member.roles.add([verified, boy]);
            await member.roles.remove(unverified);
        }
        const staffId = message.author.id;
        data.verifications[staffId] = (data.verifications[staffId] || 0) + 1;
        saveData();
        message.reply(`${member.user.tag} verified as Boy.`);
    } else if (command === 'vg') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const verified = message.guild.roles.cache.find(r => r.name === VERIFIED_ROLE);
        const unverified = message.guild.roles.cache.find(r => r.name === UNVERIFIED_ROLE);
        const girl = message.guild.roles.cache.find(r => r.name === GIRL_ROLE);
        if (verified && unverified && girl) {
            await member.roles.add([verified, girl]);
            await member.roles.remove(unverified);
        }
        const staffId = message.author.id;
        data.verifications[staffId] = (data.verifications[staffId] || 0) + 1;
        saveData();
        message.reply(`${member.user.tag} verified as Girl.`);
    } else if (command === 'lbvb') {
        const sortedVer = Object.entries(data.verifications).sort((a, b) => b[1] - a[1]).slice(0, 10);
        let msg = 'Top 10 Verifiers:\n';
        for (let i = 0; i < sortedVer.length; i++) {
            const user = await client.users.fetch(sortedVer[i][0]);
            msg += `${i + 1}. ${user.tag} - ${sortedVer[i][1]}\n`;
        }
        message.reply(msg);
    }

    // SAS list
    else if (command === 'sas') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = member.id;
        if (!data.sas_list.includes(uid)) {
            data.sas_list.push(uid);
            saveData();
        }
        message.reply(`${member.user.tag} added to SAS list.`);
    } else if (command === 'unsas') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = member.id;
        const index = data.sas_list.indexOf(uid);
        if (index > -1) {
            data.sas_list.splice(index, 1);
            saveData();
        }
        message.reply(`${member.user.tag} removed from SAS list.`);
    } else if (command === 'saslist') {
        let msg = 'SAS List:\n';
        for (const uid of data.sas_list) {
            const user = await client.users.fetch(uid);
            msg += `- ${user.tag}\n`;
        }
        message.reply(msg);
    }

    // Jail commands
    else if (command === 'jail') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const jailRole = message.guild.roles.cache.find(r => r.name === JAIL_ROLE);
        if (jailRole) {
            // Remove all roles except @everyone
            const rolesToRemove = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.id);
            await member.roles.remove(rolesToRemove);
            await member.roles.add(jailRole);
        }
        const staffId = message.author.id;
        data.jails[staffId] = (data.jails[staffId] || 0) + 1;
        data.jail_cases[member.id] = `Jailed by ${message.author.tag} on ${new Date().toISOString()}`;
        saveData();
        message.reply(`${member.user.tag} has been jailed.`);
    } else if (command === 'unjail') {
        const member = message.mentions.members.first();
        const gender = args[0] || ''; // optional 'g' for girl
        if (!member) return message.reply('Mention a user.');
        const jailRole = message.guild.roles.cache.find(r => r.name === JAIL_ROLE);
        if (jailRole) {
            await member.roles.remove(jailRole);
        }
        const verified = message.guild.roles.cache.find(r => r.name === VERIFIED_ROLE);
        if (gender.toLowerCase() === 'g') {
            const girl = message.guild.roles.cache.find(r => r.name === GIRL_ROLE);
            await member.roles.add([verified, girl]);
            message.reply(`${member.user.tag} unjailed as Girl.`);
        } else {
            const boy = message.guild.roles.cache.find(r => r.name === BOY_ROLE);
            await member.roles.add([verified, boy]);
            message.reply(`${member.user.tag} unjailed as Boy.`);
        }
        delete data.jail_cases[member.id];
        saveData();
    } else if (command === 'jailcase') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const caseInfo = data.jail_cases[member.id];
        message.reply(caseInfo ? caseInfo : `No jail case for ${member.user.tag}.`);
    } else if (command === 'lbj') {
        const sortedJails = Object.entries(data.jails).sort((a, b) => b[1] - a[1]).slice(0, 10);
        let msg = 'Top 10 Jailers:\n';
        for (let i = 0; i < sortedJails.length; i++) {
            const user = await client.users.fetch(sortedJails[i][0]);
            msg += `${i + 1}. ${user.tag} - ${sortedJails[i][1]}\n`;
        }
        message.reply(msg);
    }

    // Warn commands
    else if (command === 'warn') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = member.id;
        data.warns[uid] = (data.warns[uid] || 0) + 1;
        saveData();
        message.reply(`${member.user.tag} has been warned. Total warns: ${data.warns[uid]}`);
        if (data.warns[uid] >= 3) {
            // Auto jail
            const jailRole = message.guild.roles.cache.find(r => r.name === JAIL_ROLE);
            if (jailRole) {
                const rolesToRemove = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.id);
                await member.roles.remove(rolesToRemove);
                await member.roles.add(jailRole);
            }
            data.jails[message.author.id] = (data.jails[message.author.id] || 0) + 1; // Credit the warner?
            data.jail_cases[uid] = `Auto-jailed after 3 warns by ${message.author.tag} on ${new Date().toISOString()}`;
            saveData();
            message.reply(`${member.user.tag} auto-jailed after 3 warns.`);
        }
    } else if (command === 'unwarn') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = member.id;
        if (data.warns[uid] && data.warns[uid] > 0) {
            data.warns[uid] -= 1;
            saveData();
        }
        message.reply(`Warn removed from ${member.user.tag}. Total warns: ${data.warns[uid] || 0}`);
    } else if (command === 'warns') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const count = data.warns[member.id] || 0;
        message.reply(`${member.user.tag} has ${count} warns.`);
    }

    // Other moderation
    else if (command === 'nick') {
        const member = message.mentions.members.first();
        const newNick = args.slice(1).join(' ');
        if (!member || !newNick) return message.reply('Usage: +nick [user] [new nick]');
        await member.setNickname(newNick);
        message.reply(`${member.user.tag}'s nickname changed to ${newNick}.`);
    } else if (command === 'crole') {
        const name = args.join(' ');
        if (!name) return message.reply('Provide a role name.');
        const role = await message.guild.roles.create({ name });
        message.reply(`Role "${name}" created.`);
    } else if (command === 'cc') {
        const catId = args[0];
        const name = args.slice(1).join(' ');
        if (!catId || !name) return message.reply('Usage: +cc [category ID] [channel name]');
        const category = message.guild.channels.cache.get(catId);
        if (category && category.type === ChannelType.GuildCategory) {
            await message.guild.channels.create({ name, type: ChannelType.GuildText, parent: category });
            message.reply(`Channel "${name}" created in category "${category.name}".`);
        } else {
            message.reply('Invalid category ID.');
        }
    } else if (command === 'caty') {
        const name = args.join(' ');
        if (!name) return message.reply('Provide a category name.');
        await message.guild.channels.create({ name, type: ChannelType.GuildCategory });
        message.reply(`Category "${name}" created.`);
    } else if (command === 'role') {
        // Simple reaction-based self-role
        const msg = await message.channel.send('React to get/remove roles:\n1️⃣ for Role1\n2️⃣ for Role2');
        await msg.react('1️⃣');
        await msg.react('2️⃣');
    } else if (command === 'mr') {
        const role = message.mentions.roles.first();
        if (!role) return message.reply('Mention a role.');
        const wasMentionable = role.mentionable;
        await role.edit({ mentionable: true });
        await message.channel.send(role.toString());
        await role.edit({ mentionable: wasMentionable });
    } else if (command === 'sirol') {
        const roomId = args[0];
        if (!roomId) return message.reply('Provide a room ID.');
        if (!message.member.voice.channel) return message.reply('You must be in a voice channel.');
        const sourceVc = message.member.voice.channel;
        const targetVc = message.guild.channels.cache.get(roomId);
        if (targetVc && targetVc.type === ChannelType.GuildVoice) {
            for (const [id, member] of sourceVc.members) {
                await member.voice.setChannel(targetVc);
            }
            message.reply('All members moved to the new room.');
        } else {
            message.reply('Invalid voice channel ID.');
        }
    } else if (command === 'ban') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        await member.ban();
        message.reply(`${member.user.tag} has been banned.`);
    } else if (command === 'unban') {
        const userId = args[0];
        if (!userId) return message.reply('Provide a user ID.');
        await message.guild.bans.remove(userId);
        const user = await client.users.fetch(userId);
        message.reply(`${user.tag} has been unbanned.`);
    } else if (command === 'vmute') {
        const member = message.mentions.members.first();
        const time = parseInt(args[1]);
        if (!member || isNaN(time)) return message.reply('Usage: +vmute [user] [time in minutes]');
        await member.timeout(time * 60 * 1000);
        message.reply(`${member.user.tag} voice muted for ${time} minutes.`);
    } else if (command === 'cmute') {
        const member = message.mentions.members.first();
        const time = parseInt(args[1]);
        if (!member || isNaN(time)) return message.reply('Usage: +cmute [user] [time in minutes]');
        const mutedRole = message.guild.roles.cache.find(r => r.name === MUTED_ROLE);
        if (mutedRole) {
            await member.roles.add(mutedRole);
            message.reply(`${member.user.tag} chat muted for ${time} minutes.`);
            setTimeout(async () => {
                await member.roles.remove(mutedRole);
            }, time * 60 * 1000);
        }
    } else if (command === 'addrole') {
        const role = message.mentions.roles.first();
        if (!role) return message.reply('Mention a role.');
        await message.channel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: true });
        message.reply(`${role.name} added to this channel.`);
    } else if (command === 'denyrole') {
        const role = message.mentions.roles.first();
        if (!role) return message.reply('Mention a role.');
        await message.channel.permissionOverwrites.edit(role, { ViewChannel: false, SendMessages: false });
        message.reply(`${role.name} denied from this channel.`);
    } else if (command === 'holders') {
        const roleId = args[0];
        if (!roleId) return message.reply('Provide a role ID.');
        const role = message.guild.roles.cache.get(roleId);
        if (role) {
            const mentions = role.members.map(m => m.toString()).join(' ');
            message.reply(`Holders of ${role.name}: ${mentions}`);
        } else {
            message.reply('Role not found.');
        }
    }

    // Voice commands
    else if (command === 'join') {
        if (!message.member.voice.channel) return message.reply('You must be in a voice channel.');
        const connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        message.reply('Bot joined your voice channel.');
    } else if (command === 'vc') {
        const voiceChannels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        let membersInVoice = 0;
        message.guild.channels.cache.forEach(c => {
            if (c.type === ChannelType.GuildVoice) membersInVoice += c.members.size;
        });
        message.reply(`Voice channels: ${voiceChannels}\nMembers in voice: ${membersInVoice}`);
    } else if (command === 'aji') {
        const member = message.mentions.members.first();
        const channelId = args[1];
        if (!member || !channelId) return message.reply('Usage: +aji [user] [channel ID]');
        const channel = message.guild.channels.cache.get(channelId);
        if (channel && channel.type === ChannelType.GuildVoice) {
            await member.voice.setChannel(channel);
            message.reply(`${member.user.tag} moved to ${channel.name}.`);
        }
    } else if (command === 'vkick') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        await member.voice.setChannel(null);
        message.reply(`${member.user.tag} kicked from voice.`);
    }

    // Premium commands
    else if (command === 'premadd') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = member.id;
        if (!data.premium_users.includes(uid)) {
            data.premium_users.push(uid);
            const role = await message.guild.roles.create({ name: `Premium - ${member.user.tag}`, color: 'GOLD' });
            data.premium_roles[uid] = role.id;
            await member.roles.add(role);
            saveData();
            message.reply(`${member.user.tag} added to premium list.`);
        }
    } else if (command === 'premremove') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = member.id;
        const index = data.premium_users.indexOf(uid);
        if (index > -1) {
            data.premium_users.splice(index, 1);
            const roleId = data.premium_roles[uid];
            if (roleId) {
                const role = message.guild.roles.cache.get(roleId);
                if (role) await member.roles.remove(role);
                delete data.premium_roles[uid];
            }
            saveData();
            message.reply(`${member.user.tag} removed from premium list.`);
        }
    } else if (command === 'padd') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = message.author.id;
        if (data.premium_users.includes(uid)) {
            const roleId = data.premium_roles[uid];
            if (roleId) {
                const role = message.guild.roles.cache.get(roleId);
                if (role) {
                    await member.roles.add(role);
                    message.reply(`Gave your premium role to ${member.user.tag}.`);
                }
            }
        }
    } else if (command === 'premove') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Mention a user.');
        const uid = message.author.id;
        if (data.premium_users.includes(uid)) {
            const roleId = data.premium_roles[uid];
            if (roleId) {
                const role = message.guild.roles.cache.get(roleId);
                if (role) {
                    await member.roles.remove(role);
                    message.reply(`Removed your premium role from ${member.user.tag}.`);
                }
            }
        }
    } else if (command === 'pname') {
        const newName = args.join(' ');
        if (!newName) return message.reply('Provide a new name.');
        const uid = message.author.id;
        if (data.premium_users.includes(uid)) {
            const roleId = data.premium_roles[uid];
            if (roleId) {
                const role = message.guild.roles.cache.get(roleId);
                if (role) {
                    await role.edit({ name: newName });
                    message.reply('Premium role name changed.');
                }
            }
        }
    } else if (command === 'pcolor') {
        const hexColor = args[0];
        if (!hexColor) return message.reply('Provide a hex color.');
        const uid = message.author.id;
        if (data.premium_users.includes(uid)) {
            const roleId = data.premium_roles[uid];
            if (roleId) {
                const role = message.guild.roles.cache.get(roleId);
                if (role) {
                    await role.edit({ color: parseInt(hexColor.replace