import { Events } from 'discord.js';
import { config } from 'dotenv';
import { client } from './lib/client.js';
import { execute as executeGiveMeADeal } from './lib/commands/givemeadeal.js';
import { handleSettingsInteraction } from './lib/settings/ui.js';
import { Poller } from './lib/poller.js';
import { init as initDb } from './lib/db.js';

config();

// Structured logging helper
const log = (level, message, meta = {}) => {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "timo's handpicked deals",
    ...meta
  }));
};

// Initialize DB
try {
  initDb();
  log('info', 'Database initialized');
} catch (e) {
  log('error', 'Failed to initialize database', { error: e.message });
  process.exit(1);
}

// Initialize Poller
const poller = new Poller(client);

client.once(Events.ClientReady, c => {
  log('info', `Ready! Logged in as ${c.user.tag}`);
  
  // Start polling
  poller.start();
  log('info', 'Poller started');
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'givemeadeal') {
        log('info', 'Command received', { 
          command: 'givemeadeal', 
          user: interaction.user.tag, 
          guild: interaction.guildId 
        });
        await executeGiveMeADeal(interaction);
      }
    } else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isModalSubmit()) {
      // Check if it's a settings interaction
      // We can identify by customId prefix or just let the handler check
      // Our settings handler handles specific IDs.
      const settingsIds = [
        'toggle_', 'select_', 'edit_', 'reset_', 'post_', 'modal_'
      ];
      
      if (settingsIds.some(prefix => interaction.customId.startsWith(prefix))) {
         log('info', 'Settings interaction', { 
           customId: interaction.customId, 
           user: interaction.user.tag, 
           guild: interaction.guildId 
         });
         await handleSettingsInteraction(interaction);
      }
    }
  } catch (error) {
    log('error', 'Interaction error', { error: error.message, stack: error.stack });
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
    }
  }
});

// Graceful Shutdown
const shutdown = () => {
  log('info', 'Shutting down...');
  poller.stop();
  client.destroy();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Login
if (!process.env.DISCORD_TOKEN) {
  log('error', 'DISCORD_TOKEN not provided');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(e => {
  log('error', 'Login failed', { error: e.message });
  process.exit(1);
});
