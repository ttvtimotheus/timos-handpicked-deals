import { db } from '../db.js';

const DEFAULT_SETTINGS = {
  autopost_enabled: 1,
  post_channel_id: null,
  source_mydealz_enabled: 1,
  source_hotukdeals_enabled: 1,
  poll_interval_seconds: 120,
  max_posts_per_poll: 5,
  keyword_allowlist: null,
  keyword_blocklist: null,
  mydealz_min_temperature: null,
  amazon_rewrite_enabled: 1
};

export const Settings = {
  get(guildId) {
    const row = db.prepare('SELECT * FROM settings WHERE guild_id = ?').get(guildId);
    if (!row) return { ...DEFAULT_SETTINGS, guild_id: guildId };
    return row;
  },

  set(guildId, settings) {
    const current = this.get(guildId);
    const updated = { ...current, ...settings, updated_at: Date.now() };

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (
        guild_id, autopost_enabled, post_channel_id,
        source_mydealz_enabled, source_hotukdeals_enabled,
        poll_interval_seconds, max_posts_per_poll,
        keyword_allowlist, keyword_blocklist,
        mydealz_min_temperature, amazon_rewrite_enabled,
        updated_at
      ) VALUES (
        @guild_id, @autopost_enabled, @post_channel_id,
        @source_mydealz_enabled, @source_hotukdeals_enabled,
        @poll_interval_seconds, @max_posts_per_poll,
        @keyword_allowlist, @keyword_blocklist,
        @mydealz_min_temperature, @amazon_rewrite_enabled,
        @updated_at
      )
    `);

    stmt.run(updated);
    return updated;
  },

  getAll() {
    return db.prepare('SELECT * FROM settings').all();
  }
};
