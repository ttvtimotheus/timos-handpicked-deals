import { URL } from 'url';

const TAGS = {
  'amazon.de': process.env.AMAZON_TAG_DE,
  'www.amazon.de': process.env.AMAZON_TAG_DE,
  'smile.amazon.de': process.env.AMAZON_TAG_DE,
  'amazon.co.uk': process.env.AMAZON_TAG_UK,
  'www.amazon.co.uk': process.env.AMAZON_TAG_UK,
  'smile.amazon.co.uk': process.env.AMAZON_TAG_UK,
  'amazon.com': process.env.AMAZON_TAG_US,
  'www.amazon.com': process.env.AMAZON_TAG_US,
  'smile.amazon.com': process.env.AMAZON_TAG_US,
};

const SHORT_DOMAINS = ['amzn.to'];

async function resolveShortLink(shortUrl) {
  try {
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'TimosHandpickedDeals/1.0' }
    });
    return response.url;
  } catch (error) {
    console.error(`Failed to resolve short link ${shortUrl}:`, error.message);
    return shortUrl;
  }
}

export async function rewriteAmazonUrl(urlStr) {
  if (!urlStr) return urlStr;

  try {
    let targetUrl = urlStr;
    const u = new URL(urlStr);

    if (SHORT_DOMAINS.includes(u.hostname)) {
      targetUrl = await resolveShortLink(urlStr);
    }

    const parsed = new URL(targetUrl);
    const tag = TAGS[parsed.hostname];

    if (tag) {
      parsed.searchParams.set('tag', tag);
      // Ensure HTTPS
      parsed.protocol = 'https:';
      return parsed.toString();
    }

    return targetUrl;
  } catch (e) {
    // If invalid URL or error, return original
    return urlStr;
  }
}
