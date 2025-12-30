import { EmbedBuilder } from 'discord.js';

export function createDealEmbed(deal, mode = 'normal') {
  const embed = new EmbedBuilder()
    .setTitle(deal.title)
    .setURL(deal.url)
    .setColor(0x0099ff)
    .setTimestamp(deal.published_at ? new Date(deal.published_at) : new Date());

  if (deal.description) {
    embed.setDescription(deal.description);
  }

  // Fields
  if (deal.price) {
    embed.addFields({ name: 'Price', value: deal.price, inline: true });
  }
  
  if (deal.temperature !== null) {
    let emoji = '🔥';
    if (deal.temperature < 0) emoji = '❄️';
    embed.addFields({ name: 'Temperature', value: `${emoji} ${deal.temperature}°`, inline: true });
  }

  embed.addFields({ name: 'Source', value: deal.source, inline: true });

  // Footer
  if (mode === 'timo') {
    embed.setFooter({ text: "timo mode · timo's handpicked deals" });
    embed.setColor(0xff5500); // Orange-ish for Timo
    
    // Timo mode extra field
    const timoQuotes = [
      "Timo thinks this is neat!",
      "Grab it before it's gone!",
      "Handpicked with code!",
      "Beep boop, great deal!",
      "Wallet safe? Maybe not."
    ];
    const randomQuote = timoQuotes[Math.floor(Math.random() * timoQuotes.length)];
    embed.addFields({ name: "Timo Says", value: randomQuote, inline: false });

  } else {
    embed.setFooter({ text: "timo's handpicked deals" });
  }

  return embed;
}
