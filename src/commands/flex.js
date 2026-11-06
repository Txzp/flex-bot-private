const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { t } = require('../lib/i18n');
const { getLang } = require('../lib/storage');
const { precheck, sendFlex } = require('../lib/flexRunner');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flex')
    .setDescription('Rate a Discord profile from 0 to 10')
    .setDescriptionLocalizations({ 'es-ES': 'Califica un perfil de Discord del 0 al 10', 'es-419': 'Califica un perfil de Discord del 0 al 10' })
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) =>
      o
        .setName('user')
        .setNameLocalizations({ 'es-ES': 'usuario', 'es-419': 'usuario' })
        .setDescription('User to analyze (empty = you)')
        .setDescriptionLocalizations({ 'es-ES': 'Usuario a analizar (vacío = tú)', 'es-419': 'Usuario a analizar (vacío = tú)' })
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    if (target.bot) {
      return interaction.reply({ content: t(getLang(interaction.guildId), 'flex.bot'), flags: MessageFlags.Ephemeral });
    }
    if (!(await precheck(interaction))) return;
    await interaction.deferReply();
    await sendFlex(interaction, target.id);
  },
};
