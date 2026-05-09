# 🎌 Japan Quiz Bot

A Discord bot that tests your knowledge of Japanese history, culture, food, geography, pop culture, and society. Features daily automated quizzes, a leaderboard, and personal stats tracking.

## Features

- **300+ questions** across 6 categories
- **Two answer modes** — multiple choice (buttons) or type your answer
- **Daily automated quizzes** — configurable time, channel, and question count (default 5, up to 20)
- **Leaderboard** — tracked daily, weekly, monthly, yearly, and all-time
- **Per-user stats** with accuracy tracking
- **Per-server configuration** — each server has its own settings and scores

## Commands

### Quiz
| Command | Description |
|---|---|
| `/quiz` | Start a random question (multiple choice) |
| `/quiz mode:type` | Start a question in type-answer mode |
| `/quiz category:history` | Filter by a specific category |

**Categories:** `history` · `culture` · `food` · `geography` · `popculture` · `society`

### Scores
| Command | Description |
|---|---|
| `/leaderboard` | All-time server leaderboard |
| `/leaderboard range:daily` | Today's leaderboard |
| `/leaderboard range:weekly` | This week's leaderboard |
| `/leaderboard range:monthly` | This month's leaderboard |
| `/leaderboard range:yearly` | This year's leaderboard |
| `/mystats` | Your personal stats (ephemeral) |

### Admin (Requires Manage Server)
| Command | Description |
|---|---|
| `/quizconfig setchannel` | Set the channel for daily quizzes |
| `/quizconfig settime hour:22 minute:0` | Set the daily quiz time |
| `/quizconfig setmode` | Set default answer mode (multiple choice or type) |
| `/quizconfig setcount` | Set number of daily questions (1–20, default 5) |
| `/quizconfig status` | View current server configuration |

### Other
| Command | Description |
|---|---|
| `/help` | Show all commands |

## How It Works

- **Multiple choice** — Four buttons (A B C D) appear. You have 30 seconds to click one. Each user can only answer once per question.
- **Type answer** — Type your answer in chat within 30 seconds. Fuzzy matching is used (partial matches count).
- **Daily quiz** — At the configured time, the bot posts a series of questions (default 5) to the configured channel, one after another. A summary message posts when the session ends.

## Self-Hosting

### Prerequisites
- Node.js 20+
- A Discord application with a bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/yonasoft/japan-quiz-bot.git
   cd japan-quiz-bot
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   ```env
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_application_id
   GUILD_ID=your_server_id        # optional: leave blank for global commands
   DAILY_CHANNEL_ID=               # optional: set via /quizconfig setchannel
   DAILY_HOUR=22
   DAILY_MINUTE=0
   ```

3. Register slash commands with Discord:
   ```bash
   node deploy-commands.js
   ```
   If `GUILD_ID` is set, commands appear instantly in that server. Without it, global registration takes up to 1 hour.

4. Start the bot:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Deploying to Railway

1. Push the repo to GitHub
2. Create a new Railway project from the repo
3. Set all environment variables in the Railway dashboard
4. Railway will auto-deploy on every push using the `nixpacks` builder

> **Note:** After deploying, run `node deploy-commands.js` locally with your production env vars to register commands with Discord.

## Project Structure

```
japan-quiz-bot/
├── commands/          # Slash command handlers
│   ├── config.js      # /quizconfig
│   ├── help.js        # /help
│   ├── leaderboard.js # /leaderboard
│   ├── mystats.js     # /mystats
│   └── quiz.js        # /quiz
├── data/
│   └── questions.json # Question bank
├── db/
│   └── database.js    # SQLite setup and queries
├── events/
│   └── daily.js       # Daily quiz cron scheduler
├── utils/
│   └── quizEngine.js  # Quiz round logic
├── deploy-commands.js # One-time command registration script
└── index.js           # Bot entry point
```

## Tech Stack

- [discord.js](https://discord.js.org/) v14
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [node-cron](https://github.com/node-cron/node-cron)
- [dotenv](https://github.com/motdotla/dotenv)
