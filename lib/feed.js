import Parser from 'rss-parser';
import { rewriteAmazonUrl } from './amazon.js';

const parser = new Parser({
  customFields: {
    item: [
      ['pepper:merchant', 'merchant'],
      ['pepper:temperature', 'temperature'],
    ]
  }
});

function parseTemperature(title, description, customTemp) {
  // Try custom field first
  if (customTemp) {
    const match = customTemp.toString().match(/(-?\d+)/);
    if (match) return parseInt(match[0], 10);
  }

  // Look in title: "123°" or "123 Grad"
  const titleMatch = title.match(/(-?\d+)\s*(?:°|grad|deg)/i);
  if (titleMatch) return parseInt(titleMatch[1], 10);

  return null;
}

function parsePrice(title, description) {
  // Look for currency symbols or patterns
  // €12.99, 12.99€, £12.99, 12.99£, 12,99 €
  const priceRegex = /((?:£|€|\$)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)|(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s?(?:£|€|\$|EUR|GBP|USD))/i;
  
  const titleMatch = title.match(priceRegex);
  if (titleMatch) return titleMatch[0].trim();

  // If not in title, maybe in description? (Less reliable, might pick up other numbers)
  return null;
}

function cleanDescription(html) {
  if (!html) return null;
  // Basic HTML strip (rss-parser usually gives contentSnippet which is plain text, or content which is HTML)
  // We prefer contentSnippet if available, but let's be safe
  return html.replace(/<[^>]*>?/gm, '')
             .replace(/\s+/g, ' ')
             .trim()
             .substring(0, 600);
}

export async function fetchFeed(url, sourceName, settings) {
  try {
    const feed = await parser.parseURL(url);
    const deals = [];

    for (const item of feed.items) {
      // Basic normalization
      const title = item.title || 'No Title';
      const link = item.link;
      const guid = item.guid || link;
      const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
      const description = cleanDescription(item.contentSnippet || item.content);
      
      const temperature = parseTemperature(title, description, item['pepper:temperature']);
      const price = parsePrice(title, description);

      // Rewriting URL if needed
      let finalUrl = link;
      if (settings.amazon_rewrite_enabled) {
        finalUrl = await rewriteAmazonUrl(link);
      }

      const deal = {
        deal_id: guid,
        source: sourceName,
        title,
        url: finalUrl,
        description,
        price,
        temperature,
        published_at: pubDate,
        raw_json: JSON.stringify(item)
      };

      if (filterDeal(deal, settings)) {
        deals.push(deal);
      }
    }

    return deals;
  } catch (error) {
    console.error(`Error fetching feed ${url}:`, error.message);
    return [];
  }
}

function filterDeal(deal, settings) {
  // 1. Min Temperature (only for mydealz usually, but logic applies generic if temp exists)
  if (settings.mydealz_min_temperature !== null && deal.temperature !== null) {
    if (deal.temperature < settings.mydealz_min_temperature) {
      return false;
    }
  }

  // 2. Blocklist
  if (settings.keyword_blocklist) {
    const blocklist = settings.keyword_blocklist.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const textToCheck = (deal.title + ' ' + (deal.description || '')).toLowerCase();
    for (const word of blocklist) {
      if (textToCheck.includes(word)) return false;
    }
  }

  // 3. Allowlist (if set, must match at least one)
  if (settings.keyword_allowlist) {
    const allowlist = settings.keyword_allowlist.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    if (allowlist.length > 0) {
      const textToCheck = (deal.title + ' ' + (deal.description || '')).toLowerCase();
      const match = allowlist.some(word => textToCheck.includes(word));
      if (!match) return false;
    }
  }

  return true;
}
