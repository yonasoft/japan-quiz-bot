const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quizconfig')
    .setDescription('Configure the Japan Quiz bot for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('Set the channel for daily quiz questions')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('The channel to post daily questions').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('settime')
        .setDescription('Set the daily quiz time (default: 22:00)')
        .addIntegerOption(opt =>
          opt.setName('hour').setDescription('Hour (0-23)').setRequired(true).setMinValue(0).setMaxValue(23)
        )
        .addIntegerOption(opt =>
          opt.setName('minute').setDescription('Minute (0-59)').setRequired(false).setMinValue(0).setMaxValue(59)
        )
    )
    .addSubcommand(sub =>
      sub.setName('setmode')
        .setDescription('Set the default quiz mode')
        .addStringOption(opt =>
          opt.setName('mode').setDescription('Default answer mode').setRequired(true)
            .addChoices(
              { name: 'Multiple Choice', value: 'multiple' },
              { name: 'Type Answer', value: 'type' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('setcount')
        .setDescription('Set the number of daily quiz questions (default: 5, max: 20)')
        .addIntegerOption(opt =>
          opt.setName('count').setDescription('Number of questions (1-20)').setRequired(true).setMinValue(1).setMaxValue(20)
        )
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Show current bot configuration')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'setchannel') {
      const channel = interaction.options.getChannel('channel');
      setGuildConfig(guildId, 'daily_channel_id', channel.id);
      await interaction.reply({ content: `✅ Daily quiz channel set to <#${channel.id}>`, ephemeral: true });

    } else if (sub === 'settime') {
      const hour = interaction.options.getInteger('hour');
      const minute = interaction.options.getInteger('minute') ?? 0;
      setGuildConfig(guildId, 'daily_hour', hour);
      setGuildConfig(guildId, 'daily_minute', minute);
      await interaction.reply({
        content: `✅ Daily quiz time set to **${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}** server time`,
        ephemeral: true
      });

    } else if (sub === 'setmode') {
      const mode = interaction.options.getString('mode');
      setGuildConfig(guildId, 'default_mode', mode);
      await interaction.reply({ content: `✅ Default mode set to **${mode === 'multiple' ? 'Multiple Choice' : 'Type Answer'}**`, ephemeral: true });

    } else if (sub === 'setcount') {
      const count = interaction.options.getInteger('count');
      setGuildConfig(guildId, 'daily_count', count);
      await interaction.reply({ content: `✅ Daily quiz will now send **${count} question${count !== 1 ? 's' : ''}** per day`, ephemeral: true });

    } else if (sub === 'status') {
      const config = getGuildConfig(guildId);
      const channel = config.daily_channel_id ? `<#${config.daily_channel_id}>` : 'Not set';
      const time = `${String(config.daily_hour).padStart(2, '0')}:${String(config.daily_minute).padStart(2, '0')}`;
      const count = config.daily_count ?? 5;
      await interaction.reply({
        content: `**Japan Quiz Config**\n📢 Daily Channel: ${channel}\n⏰ Daily Time: ${time}\n🎮 Default Mode: ${config.default_mode}\n❓ Daily Questions: ${count}`,
        ephemeral: true
      });
    }
  }
};
