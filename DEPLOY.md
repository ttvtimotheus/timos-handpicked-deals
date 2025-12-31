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

## Maintenance

- **Update Code**: Pull new changes or copy new files, then run `docker-compose up -d --build` again.
- **Stop Bot**: `docker-compose down`.
- **Backup Database**: The database is stored in the `./data` folder on your host machine. You can simply backup this folder.
