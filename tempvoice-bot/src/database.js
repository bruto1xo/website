const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor(dbPath = './tempvoice.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                return;
            }
            console.log('Connected to SQLite database');
            this.createTables();
        });
    }

    createTables() {
        // Guild configurations table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS guild_configs (
                guild_id TEXT PRIMARY KEY,
                creator_channel_id TEXT,
                temp_category_id TEXT,
                temp_channel_name TEXT DEFAULT '🔊 {username}''s Channel',
                default_limit INTEGER DEFAULT 0,
                default_bitrate INTEGER DEFAULT 64000,
                auto_text_channels BOOLEAN DEFAULT false,
                editable_channels BOOLEAN DEFAULT true,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Temporary channels table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS temp_channels (
                channel_id TEXT PRIMARY KEY,
                guild_id TEXT,
                owner_id TEXT,
                text_channel_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guild_id) REFERENCES guild_configs (guild_id)
            )
        `);

        // Channel permissions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS channel_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id TEXT,
                user_id TEXT,
                permission_type TEXT CHECK(permission_type IN ('allow', 'deny')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES temp_channels (channel_id)
            )
        `);
    }

    // Guild configuration methods
    getGuildConfig(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM guild_configs WHERE guild_id = ?',
                [guildId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    setGuildConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const {
                creator_channel_id,
                temp_category_id,
                temp_channel_name,
                default_limit,
                default_bitrate,
                auto_text_channels,
                editable_channels
            } = config;

            this.db.run(`
                INSERT OR REPLACE INTO guild_configs 
                (guild_id, creator_channel_id, temp_category_id, temp_channel_name, 
                 default_limit, default_bitrate, auto_text_channels, editable_channels, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                guildId,
                creator_channel_id,
                temp_category_id,
                temp_channel_name,
                default_limit,
                default_bitrate,
                auto_text_channels,
                editable_channels
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Temporary channel methods
    addTempChannel(channelId, guildId, ownerId, textChannelId = null) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO temp_channels (channel_id, guild_id, owner_id, text_channel_id) VALUES (?, ?, ?, ?)',
                [channelId, guildId, ownerId, textChannelId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    getTempChannel(channelId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM temp_channels WHERE channel_id = ?',
                [channelId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    removeTempChannel(channelId) {
        return new Promise((resolve, reject) => {
            // First remove permissions
            this.db.run(
                'DELETE FROM channel_permissions WHERE channel_id = ?',
                [channelId],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    // Then remove the channel
                    this.db.run(
                        'DELETE FROM temp_channels WHERE channel_id = ?',
                        [channelId],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.changes);
                        }
                    );
                }
            );
        });
    }

    getAllTempChannels(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM temp_channels WHERE guild_id = ?',
                [guildId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Permission methods
    addChannelPermission(channelId, userId, permissionType) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO channel_permissions (channel_id, user_id, permission_type) VALUES (?, ?, ?)',
                [channelId, userId, permissionType],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    getChannelPermissions(channelId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM channel_permissions WHERE channel_id = ?',
                [channelId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    removeChannelPermission(channelId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM channel_permissions WHERE channel_id = ? AND user_id = ?',
                [channelId, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing database:', err);
                else console.log('Database connection closed');
            });
        }
    }
}

module.exports = Database;