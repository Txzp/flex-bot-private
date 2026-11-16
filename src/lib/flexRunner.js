// Lógica compartida de /flex y /random: revisar canal y cooldown, analizar y mandar la tarjeta.
const { ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { t } = require('./i18n');
const { getGuild, getLang } = require('./storage');
const { analyzeUser } = require('./analyzer');
const { getFullProfile } = require('./profile');
const { buildNote } = require('./notes');
const { renderCard } = require('./card');
const { helpButtonRow } = require('./help');
const { text, separator, footer, payload } = require('./ui');
const { COOLDOWN_MS, WEBSITE } = require('../config');

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

function ageLabel(lang, months) {
  if (months < 12) return t(lang, 'card.months', { n: months });
  const years = Math.floor(months / 12);
  return years === 1 ? t(lang, 'card.year') : t(lang, 'card.years', { n: years });
}

/** Contenedor V2 con la tarjeta, la nota y un resumen rápido. */
function flexView(lang, user, analysis, note, intro) {
  const scoreText = Number.isInteger(analysis.score) ? String(analysis.score) : analysis.score.toFixed(1);
  const name = user.globalName || user.username;
  const badgeCount = analysis.badges.length + analysis.perks.filter((p) => p.rarity).length;
  const stats = [
    `**${t(lang, 'flex.statUsername')}** · \`${user.username}\` (${analysis.username.tag})`,
    `**${t(lang, 'flex.statAccount')}** · ${analysis.age.year} · ${ageLabel(lang, analysis.age.months)}`,
    `**${t(lang, 'flex.statBadges')}** · ${badgeCount || t(lang, 'card.none')}`,
  ].join('\n');

  const container = new ContainerBuilder().setAccentColor(parseInt(analysis.tier.color.slice(1), 16));
  if (intro) container.addTextDisplayComponents(text(intro)).addSeparatorComponents(separator());
  container
    .addTextDisplayComponents(text(`## ${t(lang, 'flex.title', { name })}  ·  ${t(lang, 'flex.score', { score: scoreText })}`), text(`-# ${analysis.tier.label}`))
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://airflex.png')))
    .addTextDisplayComponents(text(`> ${note}`))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text(stats))
    .addActionRowComponents(helpButtonRow(lang))
    .addSeparatorComponents(separator(false))
    .addTextDisplayComponents(footer(WEBSITE));
  return container;
}

/**
 * Analiza a targetId y edita la respuesta (ya diferida) con la tarjeta.
 * @param {string} [intro] texto opcional arriba de la tarjeta (ej. el anuncio de /random)
 */
async function sendFlex(interaction, targetId, intro) {
  const lang = getLang(interaction.guildId);
  try {
    // Perfil completo: JSON crudo de la API + boosts en servidores en común
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

    await interaction.editReply(
      payload(flexView(lang, user, analysis, note, intro), { files: [new AttachmentBuilder(png, { name: 'airflex.png' })] })
    );
  } catch (err) {
    console.error('[flex]', err);
    cooldowns.delete(interaction.user.id);
    await interaction.editReply({ content: t(lang, 'flex.error'), components: [], files: [] }).catch(() => null);
  }
}

module.exports = { precheck, sendFlex };
