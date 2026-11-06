const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { t } = require('../lib/i18n');
const { getLang } = require('../lib/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency')
    .setDescriptionLocalizations({ 'es-ES': 'Mide la latencia del bot', 'es-419': 'Mide la latencia del bot' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const lang = getLang(interaction.guildId);
    let ms = interaction.client.ws.ping;
    // Al arrancar el bot el ping del websocket puede ser -1: usamos el tiempo de respuesta
    if (!ms || ms < 0) ms = Math.max(1, Date.now() - interaction.createdTimestamp);
    await interaction.reply(t(lang, 'ping.reply', { ms: Math.round(ms) }));
  },
};
