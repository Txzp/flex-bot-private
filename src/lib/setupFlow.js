// Setup sin embeds y sin tiempo límite.
// Los botones guardan el paso en su customId (afsetup:...), así funcionan
// aunque pasen horas o el bot se reinicie.
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { t } = require('./i18n');
const { setGuild, getLang } = require('./storage');
const { helpButtonRow } = require('./help');
const { CREDIT, COLOR } = require('../config');

const PREFIX = 'afsetup';
const NEEDED = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
];
const embed = (title, desc) => new EmbedBuilder().setColor(COLOR).setTitle(title).setDescription(desc).setFooter({ text: CREDIT });

// Paso 0: bienvenida (siempre en inglés)
function welcomeView(guild) {
  return {
    content: null,
    embeds: [
      embed(
        `⚡ AirFlex is now in ${guild.name}!`,
        "AirFlex rates your profile from **0 to 10**. Ready to flex? 👑\n\n**Let's get it ready in 2 steps.**"
      ),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${PREFIX}:start`).setLabel("Let's Start").setEmoji('🚀').setStyle(ButtonStyle.Primary)
      ),
    ],
    allowedMentions: { parse: [] },
  };
}

// Paso 1: idioma
function languageView() {
  return {
    content: null,
    embeds: [embed('🌐 Choose your language / Elige tu idioma', 'Step **1 of 2**')],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${PREFIX}:lang:en`).setLabel('English').setEmoji('🇺🇸').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`${PREFIX}:lang:es`).setLabel('Español').setEmoji('🇪🇸').setStyle(ButtonStyle.Secondary)
      ),
    ],
  };
}

// Paso 2: canal
function channelView(lang, warning) {
  return {
    content: null,
    embeds: [embed(t(lang, 'setup.channel.title'), t(lang, 'setup.channel.desc') + (warning ? `\n\n${warning}` : ''))],
    components: [
      new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(`${PREFIX}:chan:${lang}`)
          .setPlaceholder(t(lang, 'setup.channel.placeholder'))
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setMinValues(1)
          .setMaxValues(1)
      ),
    ],
    allowedMentions: { parse: [] },
  };
}

function isSetupInteraction(interaction) {
  return (interaction.isButton() || interaction.isChannelSelectMenu()) && interaction.customId.startsWith(`${PREFIX}:`);
}

async function handleSetupInteraction(interaction) {
  const [, step, lang] = interaction.customId.split(':');

  // Solo admins pueden tocar el setup (sirve para el mensaje público de bienvenida)
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: t(getLang(interaction.guildId), 'setup.onlyAdmins'), flags: MessageFlags.Ephemeral });
  }

  if (step === 'start') return interaction.update(languageView());
  if (step === 'lang') return interaction.update(channelView(lang));

  if (step === 'chan') {
    const channel = interaction.channels.first();
    const me = interaction.guild.members.me ?? (await interaction.guild.members.fetchMe());
    if (!channel.permissionsFor(me)?.has(NEEDED)) {
      return interaction.update(channelView(lang, t(lang, 'setup.noPerms', { channel: `${channel}` })));
    }
    await setGuild(interaction.guildId, { lang, channelId: channel.id, setupBy: interaction.user.id });
    return interaction.update({
      content: null,
      embeds: [embed(t(lang, 'setup.done.title'), t(lang, 'setup.done.desc', { channel: `${channel}` }))],
      components: [helpButtonRow(lang)],
      allowedMentions: { parse: [] },
    });
  }
}

// Cuando el bot entra a un servidor nuevo: manda la bienvenida al primer canal donde pueda escribir
async function sendJoinWelcome(guild) {
  try {
    const me = guild.members.me ?? (await guild.members.fetchMe());
    const canSend = (ch) => ch?.isTextBased?.() && ch.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]);
    let channel = canSend(guild.systemChannel) ? guild.systemChannel : null;
    if (!channel) {
      channel = guild.channels.cache
        .filter((ch) => ch.type === ChannelType.GuildText && canSend(ch))
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .first();
    }
    if (channel) await channel.send(welcomeView(guild));
  } catch (err) {
    console.error('[join welcome]', err.message);
  }
}

module.exports = { welcomeView, isSetupInteraction, handleSetupInteraction, sendJoinWelcome };
