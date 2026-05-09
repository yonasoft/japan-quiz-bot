const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all Japan Quiz bot commands"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Japan Quiz Bot - Help")
      .setColor(0xE01E37)
      .setDescription("Test your knowledge of Japanese history, culture, food, geography, pop culture, and society!")
      .addFields(
        {
          name: "Quiz Commands",
          value: "/quiz - Start a random question
/quiz mode:type - Type your answer
/quiz category:history - Pick a specific category
Categories: history, culture, food, geography, popculture, society"
        },
        {
          name: "Score Commands",
          value: "/leaderboard - All-time server leaderboard
/leaderboard range:daily - Today
/leaderboard range:weekly - This week
/leaderboard range:monthly - This month
/leaderboard range:yearly - This year
/mystats - Your personal stats across all ranges"
        },
        {
          name: "Admin Commands",
          value: "/quizconfig setchannel - Set channel for daily questions
/quizconfig settime hour:22 - Set daily post time (default 22:00)
/quizconfig setmode - Set default answer mode
/quizconfig status - View current config
Requires Manage Server permission"
        },
        {
          name: "How It Works",
          value: "Multiple choice: click A B C D buttons within 30 seconds
Type mode: type your answer in chat within 30 seconds
A daily question is posted automatically at the configured time
Scores are tracked daily, weekly, monthly, yearly, and all-time"
        }
      )
      .setFooter({ text: "300+ questions across 6 categories - Good luck!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
