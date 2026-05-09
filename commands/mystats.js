const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserStats } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mystats')
    .setDescription('See your Japan Quiz statistics'),

  async execute(interaction) {
    const stats = getUserStats(interaction.user.id, interaction.guildId);

    function fmt(s) {
      const total = s.correct + s.incorrect;
      const acc = total > 0 ? `${Math.round((s.correct / total) * 100)}%` : 'N/A';
      return `✅ ${s.correct} correct | ${total} played | ${acc} accuracy`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${interaction.user.username}'s Japan Quiz Stats`)
      .setColor(0x5865F2)
      .addFields(
        { name: '📅 Today', value: fmt(stats.daily), inline: false },
        { name: '📆 This Week', value: fmt(stats.weekly), inline: false },
        { name: '🗓️ This Month', value: fmt(stats.monthly), inline: false },
        { name: '🏆 All Time', value: fmt(stats.alltime), inline: false }
      )
      .setFooter({ text: 'Keep answering to improve your rank!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
