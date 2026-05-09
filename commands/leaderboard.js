const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard, getUserStats } = require('../db/database');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the Japan Quiz leaderboard')
    .addStringOption(option =>
      option
        .setName('range')
        .setDescription('Time range (default: all time)')
        .setRequired(false)
        .addChoices(
          { name: 'Today', value: 'daily' },
          { name: 'This Week', value: 'weekly' },
          { name: 'This Month', value: 'monthly' },
          { name: 'This Year', value: 'yearly' },
          { name: 'All Time', value: 'alltime' }
        )
    ),

  async execute(interaction) {
    const range = interaction.options.getString('range') || 'alltime';
    const board = getLeaderboard(interaction.guildId, range);

    const rangeLabels = {
      daily: "Today's",
      weekly: "This Week's",
      monthly: "This Month's",
      yearly: "This Year's",
      alltime: "All-Time"
    };

    if (board.length === 0) {
      return interaction.reply({
        content: `📭 No scores recorded for **${rangeLabels[range]}** yet. Start with \`/quiz\`!`,
        ephemeral: false
      });
    }

    const rows = board.map((entry, i) => {
      const medal = MEDALS[i] || `**${i + 1}.**`;
      const acc = entry.total > 0 ? `${entry.accuracy}%` : 'N/A';
      return `${medal} **${entry.username}** — ✅ ${entry.correct} correct | ${entry.total} played | ${acc} accuracy`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`🏯 Japan Quiz — ${rangeLabels[range]} Leaderboard`)
      .setDescription(rows.join('\n'))
      .setColor(0xE01E37)
      .setFooter({ text: 'Use /quiz to play! • /mystats to see your stats' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
