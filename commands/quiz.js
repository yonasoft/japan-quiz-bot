const { SlashCommandBuilder } = require('discord.js');
const { runQuizRound, getRandomQuestion } = require('../utils/quizEngine');
const { getGuildConfig } = require('../db/database');
const questions = require('../data/questions.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Start a Japan quiz!')
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('Answer mode (default: multiple choice)')
        .setRequired(false)
        .addChoices(
          { name: 'Multiple Choice', value: 'multiple' },
          { name: 'Type Answer', value: 'type' }
        )
    )
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Filter by category (optional)')
        .setRequired(false)
        .addChoices(
          { name: '⛩️ History', value: 'history' },
          { name: '🎎 Culture', value: 'culture' },
          { name: '🍜 Food', value: 'food' },
          { name: '🗾 Geography', value: 'geography' },
          { name: '🎌 Pop Culture', value: 'popculture' },
          { name: '🏯 Society', value: 'society' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('count')
        .setDescription('Number of questions (1–20, default 1)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guildId);
    const mode = interaction.options.getString('mode') || config.default_mode || 'multiple';
    const category = interaction.options.getString('category');
    const count = interaction.options.getInteger('count') ?? 1;

    let questionPool = [...questions];
    if (category) {
      questionPool = questionPool.filter(q => q.category === category);
      if (questionPool.length === 0) {
        return interaction.reply({ content: `No questions found for category: **${category}**`, ephemeral: true });
      }
    }

    await interaction.reply({ content: `🎌 **Japan Quiz starting!** ${count} question${count > 1 ? 's' : ''} incoming!`, ephemeral: false });

    const usedIds = [];
    for (let i = 0; i < count; i++) {
      let question;
      if (category) {
        const available = questionPool.filter(q => !usedIds.includes(q.id));
        question = available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : questionPool[Math.floor(Math.random() * questionPool.length)];
      } else {
        question = getRandomQuestion(usedIds);
      }
      usedIds.push(question.id);

      if (count > 1) {
        await interaction.channel.send(`**Question ${i + 1} of ${count}**`);
      }
      await runQuizRound(interaction.channel, mode, question);
      if (i < count - 1) await sleep(3000);
    }

    if (count > 1) {
      await interaction.channel.send('🎉 **Quiz complete!** Check `/leaderboard` to see scores.');
    }
  }
};
