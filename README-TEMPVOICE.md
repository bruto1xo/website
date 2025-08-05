# 🎤 TempVoice Bot

A Discord bot that creates temporary voice channels, similar to TempVoice.xyz. Users can join a "creator channel" to automatically generate their own temporary voice channel, which gets deleted when empty.

## ✨ Features

- **Automatic Channel Creation**: Join a creator channel to instantly get your own temporary voice channel
- **Automatic Cleanup**: Channels are automatically deleted when empty
- **Channel Controls**: Full control over your temporary channel
- **Permission Management**: Allow or block specific users from your channel
- **Customizable Settings**: Configure channel names, limits, bitrates, and more
- **Database Storage**: Persistent configuration using SQLite
- **Multiple Servers**: Works across multiple Discord servers simultaneously

## 🎮 Commands

### Admin Commands
- `/setup [name] [limit] [bitrate]` - Set up TempVoice for your server
- `/info` - Show bot information and server configuration

### User Commands
- `/voice rename <name>` - Rename your temporary channel
- `/voice limit <users>` - Set user limit (0 = no limit)
- `/voice lock` - Lock your channel (prevent new users)
- `/voice unlock` - Unlock your channel
- `/voice permit <user>` - Allow a specific user to join your locked channel
- `/voice reject <user>` - Block a specific user from your channel
- `/voice claim` - Claim ownership of a temporary channel (if owner left)
- `/voice transfer <user>` - Transfer channel ownership to another user

## 🚀 Quick Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the bot token
6. Under "Privileged Gateway Intents", enable:
   - Server Members Intent
   - Message Content Intent

### 2. Install and Configure

```bash
# Clone or download the bot files
git clone <your-repo> tempvoice-bot
cd tempvoice-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your bot token and client ID
nano .env
```

### 3. Configure Environment

Edit the `.env` file:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_bot_client_id_here

# Database Configuration
DB_PATH=./data/tempvoice.db

# Bot Configuration
PREFIX=!
DEFAULT_CATEGORY_NAME=TempVoice
DEFAULT_CREATOR_CHANNEL_NAME=➕ Join to Create
```

### 4. Invite Bot to Your Server

Use this invite link (replace CLIENT_ID with your bot's client ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=288374865&scope=bot%20applications.commands
```

**Required Permissions:**
- Manage Channels
- Move Members
- Connect
- View Channel
- Use Slash Commands

### 5. Start the Bot

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

## 📖 Usage Guide

### For Server Administrators

1. **Initial Setup**
   ```
   /setup name:{username}'s Channel limit:0 bitrate:64
   ```
   This creates a category and creator channel with your specified settings.

2. **Customize Settings**
   - `name`: Template for channel names (use `{username}` for user's display name)
   - `limit`: Default user limit for new channels (0 = no limit)
   - `bitrate`: Default audio quality in kbps (8-384)

3. **View Configuration**
   ```
   /info
   ```
   Shows current server settings and bot statistics.

### For Users

1. **Create a Temporary Channel**
   - Join the "➕ Join to Create" channel
   - You'll be automatically moved to your new temporary channel
   - The channel is automatically named based on your display name

2. **Control Your Channel**
   - Use `/voice` commands while in your temporary channel
   - Only you (the owner) can modify channel settings
   - Other users can claim ownership if you leave

3. **Channel Management**
   - **Rename**: `/voice rename My Cool Channel`
   - **Set Limit**: `/voice limit 5`
   - **Lock/Unlock**: `/voice lock` or `/voice unlock`
   - **User Control**: `/voice permit @friend` or `/voice reject @annoying_user`

## 🔧 Advanced Configuration

### Database Location
By default, the database is stored in `./data/tempvoice.db`. You can change this in the `.env` file:
```env
DB_PATH=/path/to/your/database.db
```

### Custom Channel Names
You can use variables in channel name templates:
- `{username}` - User's display name
- Example: `{username}'s Room` becomes "John's Room"

### Permission System
The bot automatically gives channel owners these permissions:
- Manage Channels
- Manage Roles  
- Mute Members
- Deafen Members
- Move Members

## 🛠️ Development

### Project Structure
```
tempvoice-bot/
├── src/
│   ├── commands/          # Slash commands
│   │   ├── setup.js
│   │   ├── voice.js
│   │   └── info.js
│   ├── events/            # Discord event handlers
│   │   ├── ready.js
│   │   ├── voiceStateUpdate.js
│   │   └── interactionCreate.js
│   ├── utils/             # Utility modules
│   │   ├── database.js
│   │   └── commandHandler.js
│   └── index.js           # Main bot file
├── data/                  # Database storage
├── .env.example           # Environment template
├── .gitignore
├── package.json
└── README.md
```

### Adding New Commands
1. Create a new file in `src/commands/`
2. Export an object with `data` (SlashCommandBuilder) and `execute` function
3. The command will be automatically loaded and registered

### Event Handling
Event handlers in `src/events/` are automatically loaded. Each should export:
- `name`: Discord.js event name
- `once`: Boolean (optional, for one-time events)
- `execute`: Function to handle the event

## 🐛 Troubleshooting

### Common Issues

1. **Bot doesn't respond to commands**
   - Check if bot has required permissions
   - Verify bot is online and token is correct
   - Ensure slash commands are registered (check console logs)

2. **Channels not being created**
   - Verify bot has "Manage Channels" permission
   - Check if bot can see and connect to voice channels
   - Review console for error messages

3. **Database errors**
   - Ensure `data/` directory exists and is writable
   - Check disk space and permissions

4. **Permission errors**
   - Bot needs specific permissions in the category/channels
   - Check role hierarchy (bot role should be above managed roles)

### Enable Debug Logging
Add this to your `.env` file:
```env
DEBUG=true
```

## 📋 Requirements

- **Node.js**: Version 16.0.0 or higher
- **Discord.js**: Version 14.x
- **SQLite3**: For database storage
- **Permissions**: Bot needs specific Discord permissions (see setup guide)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Inspired by [TempVoice.xyz](https://tempvoice.xyz/) and similar Discord bots.

## 📞 Support

If you need help or have questions:
1. Check the troubleshooting section above
2. Review the configuration guide
3. Open an issue on GitHub
4. Join our support Discord server (if available)

---

**Made with ❤️ for the Discord community**