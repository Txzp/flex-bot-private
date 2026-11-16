// Setup con Components V2 (contenedor + separadores nativos de Discord) y sin tiempo límite.
// Los botones guardan el paso en su customId (afsetup:...), así funcionan
// aunque pasen horas o el bot se reinicie.
const {
  ContainerBuilder,
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
const { text, separator, footer, payload } = require('./ui');
const { COLOR, WEBSITE } = require('../config');

const PREFIX = 'afsetup';
const NEEDED = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
];

// Paso 0: bienvenida (siempre en inglés, aún no se eligió idioma)
function welcomeView(guild) {
  const container = new ContainerBuilder()
    .setAccentColor(COLOR)
    .addTextDisplayComponents(text(`## AirFlex is now in ${guild.name}`), text('Rate any profile from **0 to 10** with a preview card: username, account age, badges and extras.'))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text('Two quick steps and it is ready: **language** and **channel**.'))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`${PREFIX}:start`).setLabel('Start setup').setStyle(ButtonStyle.Primary))
    )
    .addSeparatorComponents(separator(false))
    .addTextDisplayComponents(footer(`Admins only · ${WEBSITE}`));
  return payload(container);
}

// Paso 1: idioma
function languageView() {
  const container = new ContainerBuilder()
    .setAccentColor(COLOR)
    .addTextDisplayComponents(text('## Language · Idioma'), text('-# Step 1 of 2 · Paso 1 de 2'))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text('Choose the language AirFlex will use in this server.\nElige el idioma que AirFlex usará en este servidor.'))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${PREFIX}:lang:en`).setLabel('English').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`${PREFIX}:lang:es`).setLabel('Español').setStyle(ButtonStyle.Secondary)
      )
    );
  return payload(container);
}

// Paso 2: canal (con el dropdown de canales)
function channelView(lang, warning) {
  const container = new ContainerBuilder()
    .setAccentColor(COLOR)
    .addTextDisplayComponents(text(`## ${t(lang, 'setup.channel.title')}`), text(`-# ${t(lang, 'setup.step', { n: 2 })}`))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text(t(lang, 'setup.channel.desc')));
  if (warning) container.addTextDisplayComponents(text(warning));
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(`${PREFIX}:chan:${lang}`)
        .setPlaceholder(t(lang, 'setup.channel.placeholder'))
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setMinValues(1)
        .setMaxValues(1)
    )
  );
  return payload(container);
}

// Paso final
function doneView(lang, channel) {
  const container = new ContainerBuilder()
    .setAccentColor(0x23a55a)
    .addTextDisplayComponents(text(`## ${t(lang, 'setup.done.title')}`), text(t(lang, 'setup.done.desc', { channel: `${channel}` })))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text(t(lang, 'setup.done.hint')))
    .addActionRowComponents(helpButtonRow(lang))
    .addSeparatorComponents(separator(false))
    .addTextDisplayComponents(footer(WEBSITE));
  return payload(container);
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
    return interaction.update(doneView(lang, channel));
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
