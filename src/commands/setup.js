const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require('discord.js');
const { welcomeView } = require('../lib/setupFlow');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up AirFlex (language and channel)')
    .setDescriptionLocalizations({ 'es-ES': 'Configura AirFlex (idioma y canal)', 'es-419': 'Configura AirFlex (idioma y canal)' })
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // solo admins

  async execute(interaction) {
    // Los botones los maneja lib/setupFlow.js (no expiran)
    await interaction.reply(welcomeView(interaction.guild));
  },
};
