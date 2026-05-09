const cron = require('node-cron');
const { getAllGuildConfigs } = require('../db/database');
const { runQuizRound } = require('../utils/quizEngine');

// Runs every minute, checks each guild's configured time
function startDailyScheduler(client) {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const configs = getAllGuildConfigs();

    for (const config of configs) {
      if (config.daily_hour === currentHour && config.daily_minute === currentMinute) {
        try {
          const channel = await client.channels.fetch(config.daily_channel_id);
          if (!channel) continue;

          await channel.send('🌸 **Daily Japan Quiz!** A new question is here — how much do you know?');
          await runQuizRound(channel, config.default_mode || 'multiple');
        } catch (err) {
          console.error(`[Daily Quiz] Failed for guild ${config.guild_id}:`, err.message);
        }
      }
    }
  });

  console.log('[Scheduler] Daily quiz scheduler started.');
}

module.exports = { startDailyScheduler };
