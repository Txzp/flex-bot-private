const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { t } = require('../lib/i18n');
const { getLang, deleteVerified } = require('../lib/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unverify')
    .setDescription('Delete your verification data from AirFlex')
    .setDescriptionLocalizations({ 'es-ES': 'Borra tus datos de verificación de AirFlex', 'es-419': 'Borra tus datos de verificación de AirFlex' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const lang = getLang(interaction.guildId);
    const existed = await deleteVerified(interaction.user.id);
    await interaction.reply({ content: t(lang, existed ? 'unverify.done' : 'unverify.none'), flags: MessageFlags.Ephemeral });
  },
};
