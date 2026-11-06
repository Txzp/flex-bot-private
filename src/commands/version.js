const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { t } = require('../lib/i18n');
const { getLang } = require('../lib/storage');
const { VERSION } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('version')
    .setDescription('Show the bot version')
    .setDescriptionLocalizations({ 'es-ES': 'Muestra la versión del bot', 'es-419': 'Muestra la versión del bot' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.reply(t(getLang(interaction.guildId), 'version.reply', { version: VERSION }));
  },
};
