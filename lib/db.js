import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'deals.db');

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

function init() {
  const schema = `
    CREATE TABLE IF NOT EXISTS settings (
      guild_id TEXT PRIMARY KEY,
      autopost_enabled INTEGER NOT NULL DEFAULT 1,
      post_channel_id TEXT,
      source_mydealz_enabled INTEGER NOT NULL DEFAULT 1,
      source_hotukdeals_enabled INTEGER NOT NULL DEFAULT 1,
      poll_interval_seconds INTEGER NOT NULL DEFAULT 120,
      max_posts_per_poll INTEGER NOT NULL DEFAULT 5,
      keyword_allowlist TEXT,
      keyword_blocklist TEXT,
      mydealz_min_temperature INTEGER,
      amazon_rewrite_enabled INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sent_deals (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      deal_id TEXT NOT NULL,
      source TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      posted_at INTEGER NOT NULL,
      PRIMARY KEY (guild_id, channel_id, deal_id)
    );

    CREATE TABLE IF NOT EXISTS deals_cache (
      guild_id TEXT NOT NULL,
      deal_id TEXT NOT NULL,
      source TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price TEXT,
      temperature INTEGER,
      published_at INTEGER,
      raw_json TEXT,
      inserted_at INTEGER NOT NULL,
      PRIMARY KEY (guild_id, deal_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sent_deals_posted_at ON sent_deals(posted_at);
    CREATE INDEX IF NOT EXISTS idx_deals_cache_inserted_at ON deals_cache(inserted_at);
    CREATE INDEX IF NOT EXISTS idx_deals_cache_temperature ON deals_cache(temperature);
  `;

  db.exec(schema);
  console.log("Database initialized at", DB_PATH);
}

export { db, init };
