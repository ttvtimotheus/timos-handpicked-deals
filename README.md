# Timo's Handpicked Deals

A Discord bot that polls MyDealz and HotUKDeals for new deals, posts them to your server, and offers an interactive slash command interface.

## Features

- **Auto Polling**: Automatically fetches and posts new deals to a configured channel.
- **Slash Commands**: `/givemeadeal` with options:
  - `random`: Get a random recent deal.
  - `hot`: Get the hottest deal available.
  - `timo`: Get a handpicked deal with a special "Timo Mode" flair.
  - `settings`: Interactive settings UI to configure the bot directly from Discord.
- **Interactive Settings**:
  - Enable/Disable sources (MyDealz, HotUKDeals).
  - Toggle Autoposting.
  - Set Poll Interval and Max Posts per Poll.
  - Manage Keyword Allowlist and Blocklist.
  - Set Minimum Temperature for MyDealz.
  - Toggle Amazon Link Rewriting.
- **Amazon Link Rewriting**: Automatically expands short links (amzn.to) and adds your affiliate tags.
- **Deduplication**: Ensures deals are only posted once per channel.
- **SQLite Persistence**: Stores settings and deal history locally.

## Setup

### 1. Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new Application.
3. Go to **Bot** and click **Add Bot**.
4. Copy the **Token** (this is your `DISCORD_TOKEN`).
5. Copy the **Application ID** from the **General Information** page (this is your `DISCORD_CLIENT_ID`).
6. Enable **Message Content Intent** (optional but recommended for future proofing, though this bot mainly uses interactions and RSS).
7. Generate an Invite URL:
   - Go to **OAuth2** -> **URL Generator**.
   - Scopes: `bot`, `applications.commands`.
   - Bot Permissions: `Send Messages`, `Embed Links`, `View Channels`, `Manage Guild` (for settings access checks, though the bot checks user perms).
   - Copy the URL and invite the bot to your server.

### 2. Deployment

You can run the bot using Docker Compose (recommended) or directly with Node.js.

#### Using Docker Compose

1. Clone or copy this repository.
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and fill in your `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`. Add your Amazon Tags if you have them.
4. Run the bot:
   ```bash
   docker-compose up -d --build
   ```

#### Manual Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` as above.
3. Deploy Slash Commands (run this once or when commands change):
   ```bash
   npm run deploy
   ```
4. Start the bot:
   ```bash
   npm start
   ```

### 3. Usage

1. In your Discord server, run `/givemeadeal settings`.
2. Configure the **Autopost Channel** (required for auto posting).
3. Enable **Autopost** if strictly desired (enabled by default).
4. The bot will now poll for deals and post them!
5. Users can use `/givemeadeal random` or `/givemeadeal hot` to get deals on demand.

## Configuration

| Environment Variable | Description | Default |
|----------------------|-------------|---------|
| `DISCORD_TOKEN` | Your Bot Token | Required |
| `DISCORD_CLIENT_ID` | Your Application ID | Required |
| `MYDEALZ_FEED_URL` | RSS Feed URL for MyDealz | `https://www.mydealz.de/rss/hot` |
| `HOTUKDEALS_FEED_URL` | RSS Feed URL for HotUKDeals | `https://www.hotukdeals.com/rss/all` |
| `POLL_INTERVAL_SECONDS` | Default polling interval | `120` |
| `AMAZON_TAG_DE` | Amazon.de Affiliate Tag | - |
| `AMAZON_TAG_UK` | Amazon.co.uk Affiliate Tag | - |

## Project Structure

- `lib/`: Core logic modules.
  - `client.js`: Discord client initialization.
  - `poller.js`: RSS polling and posting logic.
  - `feed.js`: RSS parsing and normalization.
  - `amazon.js`: Link rewriting logic.
  - `db.js`: SQLite database setup.
  - `settings/`: Settings storage and UI components.
  - `commands/`: Slash command definitions.
- `index.js`: Main entry point.
- `deploy-commands.js`: Script to register slash commands.

## Notes

- The bot uses `better-sqlite3` which requires a build environment if you are not using the Docker image.
- Ensure the `./data` directory is writable if running manually.
