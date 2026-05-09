const { SlashCommandBuilder } = require('discord.js');
const { runQuizRound } = require('../utils/quizEngine');
const { getGuildConfig } = require('../db/database');
const questions = require('../data/questions.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Start a Japan quiz question!')
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
    ),

  async execute(interaction) {
    const config = getGuildConfig(interaction.guildId);
    const mode = interaction.options.getString('mode') || config.default_mode || 'multiple';
    const category = interaction.options.getString('category');

    let questionPool = [...questions];
    if (category) {
      questionPool = questionPool.filter(q => q.category === category);
      if (questionPool.length === 0) {
        return interaction.reply({ content: `No questions found for category: **${category}**`, ephemeral: true });
      }
    }

    const question = questionPool[Math.floor(Math.random() * questionPool.length)];

    await interaction.reply({ content: '🎌 **Japan Quiz starting!**', ephemeral: false });
    await runQuizRound(interaction.channel, mode, question);
  }
};
