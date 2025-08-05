const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Database = require('./utils/database');
const { setupCommands } = require('./utils/commandHandler');

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize collections
client.commands = new Collection();
client.tempChannels = new Collection(); // Track temporary channels

// Initialize database
const db = new Database();

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, db));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client, db));
    }
}

// Setup slash commands
setupCommands(client);

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);