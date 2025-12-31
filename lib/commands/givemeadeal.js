import { SlashCommandBuilder } from 'discord.js';
import { db } from '../db.js';
import { createDealEmbed } from '../embed.js';
import { renderSettings, handleSettingsInteraction } from '../settings/ui.js';
import { fetchFeed } from '../feed.js';
import { Settings } from '../settings/storage.js';

export const data = new SlashCommandBuilder()
  .setName('givemeadeal')
  .setDescription('Get a handpicked deal')
  .addStringOption(option =>
    option.setName('option')
      .setDescription('Choose what kind of deal you want')
      .setRequired(true)
      .addChoices(
        { name: 'Random', value: 'random' },
        { name: 'Hot', value: 'hot' },
        { name: 'Timo Mode', value: 'timo' },
        { name: 'Settings', value: 'settings' }
      ));

export async function execute(interaction) {
  const option = interaction.options.getString('option');
  const guildId = interaction.guildId;

  if (option === 'settings') {
    const hasPerms = interaction.memberPermissions.has('ManageGuild') || interaction.memberPermissions.has('Administrator');
    const payload = await renderSettings(guildId, !hasPerms);
    return interaction.reply({ ...payload, ephemeral: true });
  }

  // Defer reply for deal fetching as it might take a moment if cache is empty
  await interaction.deferReply();

  try {
    let deal = null;
    let mode = 'normal';

    if (option === 'random') {
      deal = await getRandomDeal(guildId);
    } else if (option === 'hot') {
      deal = await getHotDeal(guildId);
    } else if (option === 'timo') {
      mode = 'timo';
      deal = await getTimoDeal(guildId);
    }

    if (!deal) {
      // If no deal found, try to seed cache first
      await seedCache(guildId);
      // Try again
      if (option === 'random') deal = await getRandomDeal(guildId);
      else if (option === 'hot') deal = await getHotDeal(guildId);
      else if (option === 'timo') deal = await getTimoDeal(guildId);
    }

    if (!deal) {
      return interaction.editReply({ content: "Sorry, I couldn't find any deals right now! Try again later." });
    }

    const embed = createDealEmbed(deal, mode);
    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.editReply({ content: 'Something went wrong while fetching a deal.' });
  }
}

// Helpers

async function seedCache(guildId) {
  const settings = Settings.get(guildId);
  // Fetch one source to populate cache
  const url = process.env.MYDEALZ_FEED_URL || 'https://www.mydealz.de/rss/hot';
  const deals = await fetchFeed(url, 'mydealz', settings);
  
  // Use the poller's updateCache logic or duplicate it here?
  // Let's duplicate strictly for the DB insert part to avoid circular dependency with Poller class instance
  // or simple DB calls.
  const insert = db.prepare(`
    INSERT OR REPLACE INTO deals_cache (
      guild_id, deal_id, source, url, title, description,
      price, temperature, published_at, raw_json, inserted_at
    ) VALUES (
      @guild_id, @deal_id, @source, @url, @title, @description,
      @price, @temperature, @published_at, @raw_json, @inserted_at
    )
  `);
  
  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(item);
  });

  const items = deals.map(d => ({
    ...d,
    guild_id: guildId,
    inserted_at: Date.now()
  }));

  insertMany(items);
}

async function getRandomDeal(guildId) {
  return db.prepare(`
    SELECT * FROM deals_cache 
    WHERE guild_id = ? 
    ORDER BY RANDOM() 
    LIMIT 1
  `).get(guildId);
}

async function getHotDeal(guildId) {
  // Highest temperature, fallback to inserted_at
  // Prefer mydealz if available? The prompt says "optionally prefer mydealz".
  // Let's just sort by temp desc.
  return db.prepare(`
    SELECT * FROM deals_cache 
    WHERE guild_id = ? 
    ORDER BY temperature DESC NULLS LAST, inserted_at DESC 
    LIMIT 1
  `).get(guildId);
}

async function getTimoDeal(guildId) {
  const settings = Settings.get(guildId);
  
  // If allowlist is configured, try to find a match first
  if (settings.keyword_allowlist) {
    const allowlist = settings.keyword_allowlist.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    if (allowlist.length > 0) {
      // We can't easily do complex like query in sqlite for array of keywords without building dynamic SQL
      // So fetch recent ones and filter in memory or use a simple LIKE if single.
      // Let's fetch top 50 recent and pick one that matches.
      const candidates = db.prepare(`
        SELECT * FROM deals_cache 
        WHERE guild_id = ? 
        ORDER BY inserted_at DESC 
        LIMIT 50
      `).all(guildId);

      const matched = candidates.filter(d => {
        const text = (d.title + ' ' + (d.description || '')).toLowerCase();
        return allowlist.some(w => text.includes(w));
      });

      if (matched.length > 0) {
        return matched[Math.floor(Math.random() * matched.length)];
      }
    }
  }

  // Fallback to random
  return getRandomDeal(guildId);
}
