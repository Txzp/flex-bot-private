const { ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('./i18n');
const { getGuild, getLang } = require('./storage');
const { text, separator, footer, payload } = require('./ui');
const { COLOR, VERSION, WEBSITE } = require('../config');

const HELP_BUTTON_ID = 'airflex_help';

function helpButtonRow(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(HELP_BUTTON_ID).setLabel(t(lang, 'help.button')).setStyle(ButtonStyle.Secondary)
  );
}

/** Lista de comandos como contenedor V2 (sirve para /help, el botón Help y !AirHelp). */
function helpView(guildId, { ephemeral = false } = {}) {
  const lang = getLang(guildId);
  const cfg = getGuild(guildId);
  const channelLine = cfg?.channelId ? t(lang, 'help.channel', { channel: `<#${cfg.channelId}>` }) : t(lang, 'help.noChannel');

  const container = new ContainerBuilder()
    .setAccentColor(COLOR)
    .addTextDisplayComponents(text(`## ${t(lang, 'help.title')}`), text(channelLine))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text(t(lang, 'help.flex')))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text(t(lang, 'help.misc')))
    .addSeparatorComponents(separator())
    .addTextDisplayComponents(text(`**${t(lang, 'help.adminTitle')}**\n${t(lang, 'help.admin')}`))
    .addSeparatorComponents(separator(false))
    .addTextDisplayComponents(footer(`AirFlex ${VERSION} · ${WEBSITE}`));

  return payload(container, { ephemeral });
}

module.exports = { HELP_BUTTON_ID, helpButtonRow, helpView };
