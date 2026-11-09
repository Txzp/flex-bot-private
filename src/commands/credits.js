// /credits — muestra al creador de AirFlex. Es público y se borra solo a los 7 segundos.
const { SlashCommandBuilder, InteractionContextType, EmbedBuilder } = require('discord.js');
const { COLOR, VERSION } = require('../config');

const DELETE_AFTER_MS = 7_000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('Who made AirFlex')
    .setDescriptionLocalizations({ 'es-ES': 'Quién creó AirFlex', 'es-419': 'Quién creó AirFlex' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    // FOUNDER_ID en Render = tu ID de Discord → sale como mención real (@k940) sin pingear
    const founderId = (process.env.FOUNDER_ID || '').trim();
    const founder = founderId ? `<@${founderId}>` : '**@k940**';

    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle('⚡ AirFlex · Credits')
      .addFields(
        { name: '👑 Founder', value: founder, inline: true },
        { name: '📝 Description', value: 'i like flex or larp', inline: true }
      )
      .setFooter({ text: `AirFlex ${VERSION} · www.airflex.fun` });

    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    setTimeout(() => interaction.deleteReply().catch(() => null), DELETE_AFTER_MS);
  },
};
