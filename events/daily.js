const cron = require('node-cron');
const { getAllGuildConfigs } = require('../db/database');
const { runQuizRound, getRandomQuestion } = require('../utils/quizEngine');

const DEFAULT_QUESTION_COUNT = 5;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

          const mode = config.default_mode || 'multiple';
          const count = config.daily_count ?? DEFAULT_QUESTION_COUNT;
          await channel.send(`🌸 **Daily Japan Quiz!** ${count} questions incoming — how much do you know?`);

          const usedIds = [];
          for (let i = 0; i < count; i++) {
            const question = getRandomQuestion(usedIds);
            usedIds.push(question.id);
            await channel.send(`**Question ${i + 1} of ${count}**`);
            await runQuizRound(channel, mode, question, 10 * 60 * 1000);
            if (i < count - 1) await sleep(5000);
          }

          await channel.send('🎉 **Daily quiz complete!** Check `/leaderboard` to see today\'s scores.');
        } catch (err) {
          console.error(`[Daily Quiz] Failed for guild ${config.guild_id}:`, err.message);
        }
      }
    }
  });

  console.log('[Scheduler] Daily quiz scheduler started.');
}

module.exports = { startDailyScheduler };
