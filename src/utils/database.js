const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = process.env.DB_PATH || './data/tempvoice.db';
        this.ensureDataDirectory();
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    init() {
        const sql = `
            CREATE TABLE IF NOT EXISTS guild_configs (
                guild_id TEXT PRIMARY KEY,
                creator_channel_id TEXT,
                category_id TEXT,
                channel_name_template TEXT DEFAULT '{username}''s Channel',
                user_limit INTEGER DEFAULT 0,
                bitrate INTEGER DEFAULT 64000,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS temp_channels (
                channel_id TEXT PRIMARY KEY,
                guild_id TEXT,
                owner_id TEXT,
                creator_channel_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guild_id) REFERENCES guild_configs (guild_id)
            );

            CREATE TABLE IF NOT EXISTS channel_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id TEXT,
                user_id TEXT,
                permission_type TEXT, -- 'allow', 'deny'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES temp_channels (channel_id)
            );
        `;

        this.db.exec(sql, (err) => {
            if (err) {
                console.error('Database initialization error:', err);
            } else {
                console.log('Database initialized successfully');
            }
        });
    }

    // Guild configuration methods
    getGuildConfig(guildId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM guild_configs WHERE guild_id = ?';
            this.db.get(sql, [guildId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    setGuildConfig(guildId, config) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO guild_configs 
                (guild_id, creator_channel_id, category_id, channel_name_template, user_limit, bitrate, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;
            this.db.run(sql, [
                guildId,
                config.creator_channel_id,
                config.category_id,
                config.channel_name_template || '{username}\'s Channel',
                config.user_limit || 0,
                config.bitrate || 64000
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Temporary channel methods
    addTempChannel(channelId, guildId, ownerId, creatorChannelId) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO temp_channels (channel_id, guild_id, owner_id, creator_channel_id) VALUES (?, ?, ?, ?)';
            this.db.run(sql, [channelId, guildId, ownerId, creatorChannelId], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    getTempChannel(channelId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM temp_channels WHERE channel_id = ?';
            this.db.get(sql, [channelId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    removeTempChannel(channelId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM temp_channels WHERE channel_id = ?';
            this.db.run(sql, [channelId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    getAllTempChannels(guildId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM temp_channels WHERE guild_id = ?';
            this.db.all(sql, [guildId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // Channel permissions methods
    addChannelPermission(channelId, userId, permissionType) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO channel_permissions (channel_id, user_id, permission_type) VALUES (?, ?, ?)';
            this.db.run(sql, [channelId, userId, permissionType], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    removeChannelPermission(channelId, userId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM channel_permissions WHERE channel_id = ? AND user_id = ?';
            this.db.run(sql, [channelId, userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    getChannelPermissions(channelId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM channel_permissions WHERE channel_id = ?';
            this.db.all(sql, [channelId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    close() {
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) console.error('Database close error:', err);
                else console.log('Database connection closed');
                resolve();
            });
        });
    }
}

module.exports = Database;