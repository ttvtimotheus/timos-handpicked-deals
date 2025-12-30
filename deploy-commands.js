import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { data } from './lib/commands/givemeadeal.js';

config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID; // Usually retrieved from token, but good to have explicit or inferred.
// Actually, for a single command script we might need to parse token or just ask user to set CLIENT_ID.
// Let's assume user provides DISCORD_CLIENT_ID or we try to fetch it if we were logged in, but this is a standalone script.
// The prompt didn't explicitly ask for DISCORD_CLIENT_ID in env, but it's required for REST deployment.
// I'll check if I can get away with just token if I don't have client ID? No, Routes.applicationCommands requires application ID.
// I will expect DISCORD_CLIENT_ID in env or try to derive it (jwt decode token? no).
// Let's just assume DISCORD_CLIENT_ID is provided or add it to .env.example.

if (!token) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}
if (!process.env.DISCORD_CLIENT_ID) {
  console.error('Missing DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const commands = [data.toJSON()];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // global deployment
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
