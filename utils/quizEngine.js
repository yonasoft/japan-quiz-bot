const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { recordAnswer } = require('../db/database');
const questions = require('../data/questions.json');

const CATEGORY_EMOJI = {
  history:    '⛩️',
  culture:    '🎎',
  food:       '🍜',
  geography:  '🗾',
  popculture: '🎌',
  society:    '🏯'
};

const DIFFICULTY_COLOR = {
  easy:   0x57F287,  // green
  medium: 0xFEE75C,  // yellow
  hard:   0xED4245   // red
};

function getRandomQuestion(usedIds = []) {
  const pool = usedIds.length > 0
    ? questions.filter(q => !usedIds.includes(q.id))
    : questions;

  if (pool.length === 0) return questions[Math.floor(Math.random() * questions.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleOptions(question) {
  const options = [...question.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function buildMultipleChoiceEmbed(question, shuffledOptions) {
  const labels = ['🇦', '🇧', '🇨', '🇩'];
  const optionText = shuffledOptions.map((opt, i) => `${labels[i]} ${opt}`).join('\n');
  const emoji = CATEGORY_EMOJI[question.category] || '❓';

  return new EmbedBuilder()
    .setTitle(`${emoji} Japan Quiz`)
    .setDescription(`**${question.question}**\n\n${optionText}`)
    .setColor(DIFFICULTY_COLOR[question.difficulty])
    .setFooter({ text: `Category: ${question.category} • Difficulty: ${question.difficulty} • 30 seconds` })
    .setTimestamp();
}

function buildTypeAnswerEmbed(question) {
  const emoji = CATEGORY_EMOJI[question.category] || '❓';

  return new EmbedBuilder()
    .setTitle(`${emoji} Japan Quiz — Type Your Answer`)
    .setDescription(`**${question.question}**`)
    .setColor(DIFFICULTY_COLOR[question.difficulty])
    .setFooter({ text: `Category: ${question.category} • Difficulty: ${question.difficulty} • 30 seconds` })
    .setTimestamp();
}

function buildResultEmbed(question, shuffledOptions, answeredUsers, mode) {
  const labels = ['🇦', '🇧', '🇨', '🇩'];
  const emoji = CATEGORY_EMOJI[question.category] || '❓';

  let description = `**${question.question}**\n\n✅ **Answer: ${question.answer}**\n\n`;

  if (answeredUsers.correct.length > 0) {
    description += `**Got it right:** ${answeredUsers.correct.map(u => `<@${u}>`).join(', ')}\n`;
  } else {
    description += `**Nobody got it right this time!**\n`;
  }

  if (answeredUsers.incorrect.length > 0) {
    description += `**Wrong:** ${answeredUsers.incorrect.map(u => `<@${u}>`).join(', ')}`;
  }

  return new EmbedBuilder()
    .setTitle(`${emoji} Result`)
    .setDescription(description)
    .setColor(0x5865F2)
    .setTimestamp();
}

function buildButtons(shuffledOptions) {
  const labels = ['🇦', '🇧', '🇨', '🇩'];
  const buttons = shuffledOptions.map((opt, i) =>
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${i}`)
      .setLabel(labels[i])
      .setStyle(ButtonStyle.Primary)
  );

  return new ActionRowBuilder().addComponents(buttons);
}

async function runQuizRound(channel, mode = 'multiple', questionOverride = null) {
  const question = questionOverride || getRandomQuestion();
  const shuffledOptions = shuffleOptions(question);
  const correctIndex = shuffledOptions.indexOf(question.answer);

  const answeredUsers = { correct: [], incorrect: [] };
  const allAnswered = new Set();

  let quizMessage;

  return new Promise(async (resolve) => {
    if (mode === 'multiple') {
      const embed = buildMultipleChoiceEmbed(question, shuffledOptions);
      const row = buildButtons(shuffledOptions);
      quizMessage = await channel.send({ embeds: [embed], components: [row] });

      const collector = quizMessage.createMessageComponentCollector({ time: 30_000 });

      collector.on('collect', async (interaction) => {
        if (allAnswered.has(interaction.user.id)) {
          return interaction.reply({ content: 'You already answered!', ephemeral: true });
        }

        allAnswered.add(interaction.user.id);
        const chosenIndex = parseInt(interaction.customId.replace('quiz_answer_', ''));
        const isCorrect = chosenIndex === correctIndex;

        recordAnswer(interaction.user.id, channel.guildId, interaction.user.username, isCorrect);

        if (isCorrect) {
          answeredUsers.correct.push(interaction.user.id);
          await interaction.reply({ content: '✅ Correct!', ephemeral: true });
        } else {
          answeredUsers.incorrect.push(interaction.user.id);
          await interaction.reply({ content: `❌ Wrong! The answer was **${question.answer}**`, ephemeral: true });
        }
      });

      collector.on('end', async () => {
        const resultEmbed = buildResultEmbed(question, shuffledOptions, answeredUsers, mode);
        await quizMessage.edit({ embeds: [resultEmbed], components: [] });
        resolve();
      });

    } else {
      const embed = buildTypeAnswerEmbed(question);
      quizMessage = await channel.send({ embeds: [embed] });

      const filter = (msg) => !msg.author.bot;
      const collector = channel.createMessageCollector({ filter, time: 30_000 });

      collector.on('collect', async (msg) => {
        if (allAnswered.has(msg.author.id)) return;

        const userAnswer = msg.content.trim().toLowerCase();
        const correctAnswer = question.answer.toLowerCase();

        const isCorrect = userAnswer === correctAnswer ||
          userAnswer.includes(correctAnswer) ||
          correctAnswer.includes(userAnswer);

        allAnswered.add(msg.author.id);
        recordAnswer(msg.author.id, channel.guildId, msg.author.username, isCorrect);

        if (isCorrect) {
          answeredUsers.correct.push(msg.author.id);
          await msg.react('✅');
        } else {
          answeredUsers.incorrect.push(msg.author.id);
          await msg.react('❌');
        }
      });

      collector.on('end', async () => {
        const resultEmbed = buildResultEmbed(question, shuffledOptions, answeredUsers, mode);
        await channel.send({ embeds: [resultEmbed] });
        resolve();
      });
    }
  });
}

module.exports = { runQuizRound, getRandomQuestion };
