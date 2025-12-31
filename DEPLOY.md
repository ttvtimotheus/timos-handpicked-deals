# Deployment Guide

This bot is containerized using Docker, which makes deployment on a vServer very straightforward.

## Prerequisites

- A vServer (VPS) running Linux (Ubuntu/Debian recommended).
- **Docker** and **Docker Compose** installed on the server.

## Deployment Steps

### 1. Transfer Files to Server

You can copy the project files to your server using `scp` (replace `user@your-server-ip` with your actual details):

```bash
# Run this from your local computer
scp -r . user@your-server-ip:~/timos-handpicked-deals
```

*Alternatively, if you are using git, you can `git clone` your repository on the server.*

### 2. Configure Environment

SSH into your server and navigate to the project directory:

```bash
ssh user@your-server-ip
cd ~/timos-handpicked-deals
```

Create the `.env` file (if you didn't copy it):

```bash
cp .env.example .env
nano .env
```

**Make sure to fill in:**
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `MYDEALZ_FEED_URL` (optional)
- `HOTUKDEALS_FEED_URL` (optional)
- Amazon Tags (optional)

### 3. Start the Bot

Build and start the container using Docker Compose:

```bash
docker-compose up -d --build
```

- `-d`: Runs in detached mode (in the background).
- `--build`: Rebuilds the image to ensure latest code is used.

### 4. Register Slash Commands

After starting the bot for the first time (or if you changed command definitions), you need to register the slash commands with Discord. Run this command inside the running container:

```bash
docker-compose exec bot npm run deploy
```

### 5. Verify

Check the logs to make sure everything is running smoothly:

```bash
docker-compose logs -f
```

## Deployment via Portainer

If you prefer using a UI like Portainer, follow these steps. Since the project requires building from source, the **Git Repository** method is recommended.

### 1. Push Code to Git
Push your project code to a Git repository (e.g., GitHub, GitLab) that your Portainer instance can access.

### 2. Create Stack
1. Log in to Portainer.
2. Go to **Stacks** -> **Add stack**.
3. Name: `timos-deals`.
4. Build method: Select **Repository**.
5. **Repository URL**: Enter the URL of your Git repository.
   - If it's a private repo, ensure you toggle "Authentication" and provide credentials.
6. **Compose path**: `docker-compose.yml` (default).

### 3. Environment Variables
In the **Environment variables** section, add your secrets manually (instead of using a `.env` file):

- `DISCORD_TOKEN`: `your_token_here`
- `DISCORD_CLIENT_ID`: `your_client_id_here`
- `MYDEALZ_FEED_URL`: `https://www.mydealz.de/rss/hot`
- `HOTUKDEALS_FEED_URL`: `https://www.hotukdeals.com/rss/all` (or working URL)
- Amazon Tags if applicable.

### 4. Deploy
Click **Deploy the stack**. Portainer will clone your repo, build the Docker image, and start the container.

### 5. Register Commands (One-time)
1. In Portainer, go to **Containers**.
2. Find the `timos-handpicked-deals` container.
3. Click the **>_ Console** icon (Exec).
4. Select `/bin/sh` or `/bin/ash` and click **Connect**.
5. In the terminal window, run:
   ```bash
   npm run deploy
   ```
6. You should see "Successfully reloaded application commands".

## Maintenance

- **Update Code**: Pull new changes or copy new files, then run `docker-compose up -d --build` again.

- **Stop Bot**: `docker-compose down`.
- **Backup Database**: The database is stored in the `./data` folder on your host machine. You can simply backup this folder.
