const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { helpEmbed } = require('../lib/help');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show AirFlex commands')
    .setDescriptionLocalizations({ 'es-ES': 'Muestra los comandos de AirFlex', 'es-419': 'Muestra los comandos de AirFlex' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.reply({ embeds: [helpEmbed(interaction.guildId)], flags: MessageFlags.Ephemeral });
  },
};
