// Lógica compartida de /flex y /random: revisar canal y cooldown, analizar y mandar la tarjeta.
const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { t } = require('./i18n');
const { getGuild, getLang } = require('./storage');
const { analyzeUser } = require('./analyzer');
const { getFullProfile } = require('./profile');
const { buildNote } = require('./notes');
const { renderCard } = require('./card');
const { helpButtonRow } = require('./help');
const { COOLDOWN_MS } = require('../config');

const cooldowns = new Map();

/** Devuelve true si se puede seguir; si no, ya respondió al usuario. */
async function precheck(interaction) {
  const lang = getLang(interaction.guildId);
  const cfg = getGuild(interaction.guildId);

  if (cfg?.channelId && interaction.channelId !== cfg.channelId) {
    await interaction.reply({ content: t(lang, 'flex.wrongChannel', { channel: `<#${cfg.channelId}>` }), flags: MessageFlags.Ephemeral });
    return false;
  }
  const left = COOLDOWN_MS - (Date.now() - (cooldowns.get(interaction.user.id) || 0));
  if (left > 0) {
    await interaction.reply({ content: t(lang, 'flex.cooldown', { seconds: Math.ceil(left / 1000) }), flags: MessageFlags.Ephemeral });
    return false;
  }
  cooldowns.set(interaction.user.id, Date.now());
  return true;
}

/**
 * Analiza a targetId y edita la respuesta (ya diferida) con la tarjeta.
 * @param {string} [intro] texto opcional arriba de la tarjeta (ej. el anuncio de /random)
 */
async function sendFlex(interaction, targetId, intro) {
  const lang = getLang(interaction.guildId);
  try {
    // Perfil completo: JSON crudo de la API + boosts en servidores en común + datos de /verify
    const profile = await getFullProfile(interaction.client, targetId, interaction.guild);
    const { user } = profile;

    const analysis = analyzeUser(user, profile);
    const note = buildNote(analysis, lang);
    const png = await renderCard({
      analysis,
      lang,
      note,
      displayName: user.globalName || user.username,
      username: user.username,
      avatarURL: user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }),
      bannerURL: user.banner ? user.bannerURL({ extension: 'png', size: 1024, forceStatic: true }) : null,
      decorationURL: user.avatarDecorationURL({ size: 256 }),
      tagBadgeURL: analysis.extras.guildTag ? user.guildTagBadgeURL({ size: 64 }) : null,
      accentColor: user.accentColor ?? null,
    });

    const scoreText = Number.isInteger(analysis.score) ? analysis.score : analysis.score.toFixed(1);
    const embed = new EmbedBuilder()
      .setColor(parseInt(analysis.tier.color.slice(1), 16))
      .setTitle(t(lang, 'flex.title', { name: user.globalName || user.username, score: scoreText }))
      .setDescription(`> ${note}`)
      .setImage('attachment://airflex.png')
      .setFooter({ text: analysis.verified ? `✅ Verified · ${analysis.tier.label}` : analysis.tier.label });

    await interaction.editReply({
      content: intro || null,
      embeds: [embed],
      files: [new AttachmentBuilder(png, { name: 'airflex.png' })],
      components: [helpButtonRow(lang)],
      allowedMentions: { parse: [] },
    });
  } catch (err) {
    console.error('[flex]', err);
    cooldowns.delete(interaction.user.id);
    await interaction.editReply({ content: t(lang, 'flex.error'), embeds: [], files: [], components: [] }).catch(() => null);
  }
}

module.exports = { precheck, sendFlex };
