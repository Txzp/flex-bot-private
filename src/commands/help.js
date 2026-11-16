const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { helpView } = require('../lib/help');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show AirFlex commands')
    .setDescriptionLocalizations({ 'es-ES': 'Muestra los comandos de AirFlex', 'es-419': 'Muestra los comandos de AirFlex' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.reply(helpView(interaction.guildId, { ephemeral: true }));
  },
};
