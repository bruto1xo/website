# 🚀 Quick Setup Guide

Get your TempVoice bot running in 5 minutes!

## 1. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "TempVoice Bot")
3. Go to "Bot" section and click "Create Bot"
4. Copy the bot token (keep this secret!)
5. Go to "OAuth2" > "URL Generator":
   - Select "bot" and "applications.commands" scopes
   - Select these permissions:
     - Manage Channels
     - Move Members
     - View Channels
     - Connect
     - Create Instant Invite
     - Send Messages
     - Use Slash Commands
6. Copy the generated URL and open it to invite the bot to your server

## 2. Bot Installation

```bash
# 1. Download/clone the bot files
cd tempvoice-bot

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env file with your details
```

Edit `.env` file:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_server_id_here  # Optional: for testing
```

## 3. Start the Bot

```bash
# Deploy commands to Discord
npm run deploy

# Start the bot
npm start
```

## 4. Configure in Discord

1. In your Discord server, run: `/setup create`
2. Select a voice channel as the "creator channel"
3. Optionally customize other settings
4. Done! Users can now join the creator channel to make temp channels

## 5. Test It Out

1. Join the creator channel you configured
2. You should automatically get moved to a new temporary channel
3. When everyone leaves, the channel will be deleted
4. Use `/voice controls` to see management options

## 🎉 You're Done!

Your TempVoice bot is now ready! Users can:
- Join the creator channel to get their own temp channel
- Use `/voice` commands to customize their channels
- Enjoy automatic cleanup when channels are empty

## Need Help?

- Use `/help` in Discord for command information
- Check the main README.md for detailed documentation
- Ensure the bot has proper permissions in your server