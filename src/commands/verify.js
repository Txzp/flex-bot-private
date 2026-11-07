const { SlashCommandBuilder, InteractionContextType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { t } = require('../lib/i18n');
const { getLang, getVerified } = require('../lib/storage');
const oauth = require('../lib/oauth');
const { COLOR } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your account to show your real Nitro and connections')
    .setDescriptionLocalizations({ 'es-ES': 'Verifica tu cuenta para mostrar tu Nitro real y tus conexiones', 'es-419': 'Verifica tu cuenta para mostrar tu Nitro real y tus conexiones' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const lang = getLang(interaction.guildId);
    if (!oauth.isConfigured()) {
      return interaction.reply({ content: t(lang, 'verify.off'), flags: MessageFlags.Ephemeral });
    }
    const already = getVerified(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(t(lang, 'verify.title'))
      .setDescription(t(lang, 'verify.desc') + (already ? `\n\n${t(lang, 'verify.already')}` : ''));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t(lang, 'verify.button')).setURL(oauth.authorizeUrl(interaction.user.id))
    );
    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  },
};
