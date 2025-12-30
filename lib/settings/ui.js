import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { Settings } from './storage.js';
import { db } from '../db.js';

export async function renderSettings(guildId) {
  const settings = Settings.get(guildId);
  
  const embed = new EmbedBuilder()
    .setTitle("Timo's Handpicked Deals - Settings")
    .setColor(0x0099ff)
    .setDescription("Configure how the bot behaves in this server.")
    .addFields(
      { name: 'Autopost', value: settings.autopost_enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Channel', value: settings.post_channel_id ? `<#${settings.post_channel_id}>` : 'Not Set', inline: true },
      { name: 'Poll Interval', value: `${settings.poll_interval_seconds}s`, inline: true },
      { name: 'Sources', value: `MyDealz: ${settings.source_mydealz_enabled ? '✅' : '❌'}\nHotUKDeals: ${settings.source_hotukdeals_enabled ? '✅' : '❌'}`, inline: true },
      { name: 'Amazon Rewrite', value: settings.amazon_rewrite_enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Max Posts/Poll', value: `${settings.max_posts_per_poll}`, inline: true },
      { name: 'Min Temp (MyDealz)', value: settings.mydealz_min_temperature ? `${settings.mydealz_min_temperature}°` : 'None', inline: true },
      { name: 'Allowlist', value: settings.keyword_allowlist ? `\`${settings.keyword_allowlist}\`` : 'None', inline: false },
      { name: 'Blocklist', value: settings.keyword_blocklist ? `\`${settings.keyword_blocklist}\`` : 'None', inline: false }
    )
    .setFooter({ text: "timo's handpicked deals" });

  // Row 1: Toggles
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('toggle_autopost')
      .setLabel(settings.autopost_enabled ? 'Disable Autopost' : 'Enable Autopost')
      .setStyle(settings.autopost_enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('toggle_amazon')
      .setLabel('Amazon Rewrite')
      .setStyle(settings.amazon_rewrite_enabled ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('toggle_source_mydealz')
      .setLabel('MyDealz')
      .setStyle(settings.source_mydealz_enabled ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('toggle_source_hotukdeals')
      .setLabel('HotUKDeals')
      .setStyle(settings.source_hotukdeals_enabled ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  // Row 2: Channel
  const row2 = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('select_channel')
      .setPlaceholder('Select Autopost Channel')
      .setChannelTypes(ChannelType.GuildText)
  );

  // Row 3: Interval
  const row3 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_interval')
      .setPlaceholder('Poll Interval')
      .addOptions([
        { label: '1 Minute', value: '60', default: settings.poll_interval_seconds === 60 },
        { label: '2 Minutes', value: '120', default: settings.poll_interval_seconds === 120 },
        { label: '5 Minutes', value: '300', default: settings.poll_interval_seconds === 300 },
        { label: '10 Minutes', value: '600', default: settings.poll_interval_seconds === 600 },
        { label: '30 Minutes', value: '1800', default: settings.poll_interval_seconds === 1800 }
      ]),
  );

  // Row 4: Max Posts
  const row4 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_max_posts')
      .setPlaceholder('Max Posts per Poll')
      .addOptions([
        { label: '1 Post', value: '1', default: settings.max_posts_per_poll === 1 },
        { label: '3 Posts', value: '3', default: settings.max_posts_per_poll === 3 },
        { label: '5 Posts', value: '5', default: settings.max_posts_per_poll === 5 },
        { label: '10 Posts', value: '10', default: settings.max_posts_per_poll === 10 }
      ])
  );

  // Row 5: Actions
  const row5 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('edit_allowlist').setLabel('Allowlist').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('edit_blocklist').setLabel('Blocklist').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('edit_mintemp').setLabel('Min Temp').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('post_test').setLabel('Test Deal').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('reset_settings').setLabel('Reset').setStyle(ButtonStyle.Danger),
  );

  return { embeds: [embed], components: [row1, row2, row3, row4, row5] };
}

export async function handleSettingsInteraction(interaction) {
  if (!interaction.guildId) return;

  // Permission check
  if (!interaction.member.permissions.has('ManageGuild') && !interaction.member.permissions.has('Administrator')) {
    return interaction.reply({ content: 'You do not have permission to change settings.', ephemeral: true });
  }

  const settings = Settings.get(interaction.guildId);

  // Handle Modals
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_allowlist') {
      const value = interaction.fields.getTextInputValue('input_allowlist');
      Settings.set(interaction.guildId, { keyword_allowlist: value || null });
    } else if (interaction.customId === 'modal_blocklist') {
      const value = interaction.fields.getTextInputValue('input_blocklist');
      Settings.set(interaction.guildId, { keyword_blocklist: value || null });
    } else if (interaction.customId === 'modal_mintemp') {
      const value = interaction.fields.getTextInputValue('input_mintemp');
      const intVal = parseInt(value, 10);
      Settings.set(interaction.guildId, { mydealz_min_temperature: isNaN(intVal) ? null : intVal });
    }
    
    const payload = await renderSettings(interaction.guildId);
    return interaction.update(payload);
  }

  // Handle Buttons
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'toggle_autopost':
        Settings.set(interaction.guildId, { autopost_enabled: settings.autopost_enabled ? 0 : 1 });
        break;
      case 'toggle_amazon':
        Settings.set(interaction.guildId, { amazon_rewrite_enabled: settings.amazon_rewrite_enabled ? 0 : 1 });
        break;
      case 'toggle_source_mydealz':
        Settings.set(interaction.guildId, { source_mydealz_enabled: settings.source_mydealz_enabled ? 0 : 1 });
        break;
      case 'toggle_source_hotukdeals':
        Settings.set(interaction.guildId, { source_hotukdeals_enabled: settings.source_hotukdeals_enabled ? 0 : 1 });
        break;
      case 'reset_settings':
        Settings.set(interaction.guildId, {
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
        });
        break;
      case 'post_test':
         await interaction.reply({ content: "Test deal request acknowledged.", ephemeral: true });
         return; 
      
      case 'edit_allowlist':
      case 'edit_blocklist':
      case 'edit_mintemp':
        return showModal(interaction);
    }
    const payload = await renderSettings(interaction.guildId);
    return interaction.update(payload);
  }

  // Handle Selects
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_interval') {
      Settings.set(interaction.guildId, { poll_interval_seconds: parseInt(interaction.values[0], 10) });
    } else if (interaction.customId === 'select_max_posts') {
      Settings.set(interaction.guildId, { max_posts_per_poll: parseInt(interaction.values[0], 10) });
    }
    const payload = await renderSettings(interaction.guildId);
    return interaction.update(payload);
  }

  if (interaction.isChannelSelectMenu()) {
    if (interaction.customId === 'select_channel') {
      Settings.set(interaction.guildId, { post_channel_id: interaction.values[0] });
    }
    const payload = await renderSettings(interaction.guildId);
    return interaction.update(payload);
  }
}

async function showModal(interaction) {
  const settings = Settings.get(interaction.guildId);
  
  if (interaction.customId === 'edit_allowlist') {
    const modal = new ModalBuilder()
      .setCustomId('modal_allowlist')
      .setTitle('Edit Keyword Allowlist');
    const input = new TextInputBuilder()
      .setCustomId('input_allowlist')
      .setLabel('Keywords (comma separated)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(settings.keyword_allowlist || '');
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'edit_blocklist') {
    const modal = new ModalBuilder()
      .setCustomId('modal_blocklist')
      .setTitle('Edit Keyword Blocklist');
    const input = new TextInputBuilder()
      .setCustomId('input_blocklist')
      .setLabel('Keywords (comma separated)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(settings.keyword_blocklist || '');
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (interaction.customId === 'edit_mintemp') {
    const modal = new ModalBuilder()
      .setCustomId('modal_mintemp')
      .setTitle('Edit Min Temperature');
    const input = new TextInputBuilder()
      .setCustomId('input_mintemp')
      .setLabel('Minimum Temperature (number)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(settings.mydealz_min_temperature ? settings.mydealz_min_temperature.toString() : '');
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }
}
