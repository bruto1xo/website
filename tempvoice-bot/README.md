# 🎙️ TempVoice Bot

A powerful Discord bot for creating temporary voice channels, similar to TempVoice.xyz! Users can join a designated "creator" channel to automatically generate their own temporary voice channel that gets deleted when empty.

## ✨ Features

### 🎤 **Core Functionality**
- **Automatic channel creation** when joining creator channel
- **Auto-deletion** when channel becomes empty
- **Owner permissions** for full channel control
- **Multiple users per channel** with configurable limits

### 🔧 **Channel Management**
- **Change channel name** with custom templates
- **Set user limits** (0 = unlimited)
- **Adjust bitrate** for audio quality (8kbps to 384kbps)
- **Lock/unlock channels** to control access
- **Hide/show channels** from other users
- **Transfer ownership** to other users
- **Claim abandoned channels** when owner leaves

### 👥 **User Permissions**
- **Permit specific users** to join locked channels
- **Reject and block users** from your channel
- **Disconnect unwanted users** automatically
- **Manage individual permissions** per channel

### 💬 **Text Channel Integration**
- **Optional text channels** created with voice channels
- **Private text channels** only visible to voice channel members
- **Automatic cleanup** when voice channel is deleted
- **Toggle text channels** on/off per voice channel

### 🎨 **Advanced Features**
- **Custom channel naming** with variables (`{username}`, `{user}`)
- **Button-based interface** for easy control
- **Invite system** with custom messages
- **Multiple setup configurations** per server
- **Database persistence** across bot restarts

## 🚀 Quick Start

### 1. **Bot Setup**
1. Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a bot and copy the token
3. Invite the bot with the following permissions:
   - Manage Channels
   - Move Members
   - View Channels
   - Connect
   - Create Instant Invite
   - Send Messages
   - Use Slash Commands

### 2. **Installation**
```bash
# Clone or download the bot files
cd tempvoice-bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. **Configuration**
Edit `.env` file with your bot details:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_test_guild_id_here  # Optional: for faster testing
```

### 4. **Deploy Commands**
```bash
# Deploy slash commands
npm run deploy
```

### 5. **Start the Bot**
```bash
# Start the bot
npm start

# Or use development mode with auto-restart
npm run dev
```

## 📋 Commands

### ⚙️ **Setup Commands** (Requires "Manage Channels" permission)

| Command | Description | Options |
|---------|-------------|---------|
| `/setup create` | Configure temporary voice channels | Creator channel, category, settings |
| `/setup info` | View current configuration | None |
| `/setup remove` | Remove setup and cleanup channels | None |

#### Setup Options:
- **Creator Channel**: Voice channel users join to create temp channels
- **Category**: Category to organize temp channels (auto-created if not provided)
- **Channel Name**: Template for naming (use `{username}` for user's display name)
- **Default Limit**: Default user limit for new channels (0 = unlimited)
- **Bitrate**: Default audio quality (8000-384000)
- **Auto Text Channels**: Create private text channels automatically
- **Editable**: Allow users to modify their channels

### 🎤 **Voice Commands** (Must be in a temporary voice channel)

| Command | Description | Owner Only |
|---------|-------------|------------|
| `/voice name <new_name>` | Change channel name | ✅ |
| `/voice limit <number>` | Set user limit (0 = unlimited) | ✅ |
| `/voice bitrate <quality>` | Change audio quality | ✅ |
| `/voice lock <true/false>` | Lock or unlock channel | ✅ |
| `/voice hide <true/false>` | Hide or show channel | ✅ |
| `/voice permit <user>` | Allow user to join locked channel | ✅ |
| `/voice reject <user>` | Remove and block user | ✅ |
| `/voice transfer <user>` | Transfer ownership | ✅ |
| `/voice text <true/false>` | Create/delete text channel | ✅ |
| `/voice invite <user>` | Send invite to user | ✅ |
| `/voice claim` | Claim ownership if owner left | ❌ |
| `/voice controls` | Show control buttons | ❌ |

### 📖 **Utility Commands**

| Command | Description |
|---------|-------------|
| `/help` | Show bot information and commands |

## 🎮 Button Interface

The bot provides an easy-to-use button interface accessible via `/voice controls`:

- 🔒 **Lock Button**: Toggle channel lock status
- 👁️ **Hide Button**: Toggle channel visibility
- 💬 **Text Button**: Create/delete text channel
- 👑 **Claim Button**: Claim ownership if owner left

## 🏗️ Setup Examples

### Basic Setup
```
/setup create creator_channel:#Join-to-Create
```
Creates a simple setup with default settings.

### Advanced Setup
```
/setup create 
  creator_channel:#🎤┃Join-to-Create
  category:#Voice-Channels
  channel_name:🎮 {username}'s Game Room
  default_limit:5
  bitrate:128000
  auto_text_channels:true
  editable:true
```
Creates a gaming-focused setup with text channels and high quality audio.

### Private Setup
```
/setup create 
  creator_channel:#Private-Rooms
  channel_name:🔒 {username}'s Private Room
  default_limit:2
  auto_text_channels:true
  editable:false
```
Creates private rooms that users cannot modify.

## 🗄️ Database

The bot uses SQLite for data persistence with the following tables:

- **guild_configs**: Server-specific configurations
- **temp_channels**: Active temporary channels tracking
- **channel_permissions**: Individual user permissions per channel

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DISCORD_TOKEN` | Discord bot token | - | ✅ |
| `CLIENT_ID` | Discord application client ID | - | ✅ |
| `GUILD_ID` | Test guild ID for faster command deployment | - | ❌ |
| `DATABASE_PATH` | SQLite database file path | `./tempvoice.db` | ❌ |
| `DEFAULT_BITRATE` | Default bitrate for new channels | `64000` | ❌ |
| `MAX_TEMP_CHANNELS` | Maximum temp channels per guild | `10` | ❌ |
| `TEMP_CHANNEL_TIMEOUT` | Timeout before cleanup (ms) | `300000` | ❌ |

### Guild Configuration

Each server can customize:
- Creator channel for temp channel generation
- Category for organizing temp channels
- Channel naming template with variables
- Default user limits and audio quality
- Auto text channel creation
- Whether users can edit their channels

## 🛡️ Permissions

### Required Bot Permissions
- **Manage Channels**: Create, delete, and modify voice/text channels
- **Move Members**: Move users to their temporary channels
- **View Channels**: See and access channels in categories
- **Connect**: Join voice channels for management
- **Create Instant Invite**: Generate invite links
- **Send Messages**: Send control messages and embeds
- **Use Slash Commands**: Execute application commands

### User Permissions
- **Channel Owners**: Full control over their temporary channels
- **Server Admins**: Can use setup commands and modify configurations
- **Regular Users**: Can create channels and use basic voice commands

## 🚨 Troubleshooting

### Common Issues

**Bot not responding to commands:**
- Ensure bot has "Use Slash Commands" permission
- Check if commands are deployed (`npm run deploy`)
- Verify bot is online and token is correct

**Can't create channels:**
- Bot needs "Manage Channels" permission
- Check if category exists and bot can access it
- Verify bot role is above channel category in hierarchy

**Commands not appearing:**
- Run command deployment script
- Wait a few minutes for Discord to sync
- Try in a different server if using guild-specific deployment

**Database errors:**
- Ensure write permissions in bot directory
- Check if SQLite3 is properly installed
- Delete database file to reset (will lose configurations)

### Error Messages

| Error | Solution |
|-------|----------|
| "Missing permissions" | Grant required permissions to bot role |
| "Channel not found" | Re-run setup or check if channels were deleted |
| "Setup not found" | Run `/setup create` to configure the server |
| "Not in temp channel" | Use commands only in temporary voice channels |
| "Only owner can..." | Transfer ownership or claim the channel |

## 🔄 Updates & Maintenance

### Updating the Bot
1. Backup your database file
2. Download new bot files
3. Run `npm install` for new dependencies
4. Restart the bot

### Database Maintenance
- Database automatically cleans up deleted channels
- Restart bot to refresh channel cache
- Backup database regularly for safety

## 🤝 Support & Contributing

### Getting Help
- Use `/help` command for in-Discord assistance
- Check troubleshooting section above
- Review Discord bot documentation

### Feature Requests
The bot includes all major features from TempVoice.xyz and more:
- ✅ Temporary voice channels with auto-deletion
- ✅ User permission system (permit/reject)
- ✅ Channel customization (name, limit, bitrate)
- ✅ Lock and hide functionality
- ✅ Text channel integration
- ✅ Button-based controls
- ✅ Invite system with custom messages
- ✅ Ownership transfer and claiming
- ✅ Advanced setup configurations

## 📜 License

This project is licensed under the MIT License - see the package.json file for details.

## 🙏 Acknowledgments

- Inspired by TempVoice.xyz and VoiceMaster
- Built with Discord.js v14
- Uses SQLite for reliable data persistence

---

**Made with ❤️ for the Discord community**

*Creating temporary voice channels has never been easier!*