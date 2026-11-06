const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('./i18n');
const { getGuild, getLang } = require('./storage');
const { COLOR, CREDIT } = require('../config');

const HELP_BUTTON_ID = 'airflex_help';

function helpButtonRow(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(HELP_BUTTON_ID).setLabel(t(lang, 'help.button')).setEmoji('❓').setStyle(ButtonStyle.Secondary)
  );
}

function helpEmbed(guildId) {
  const lang = getLang(guildId);
  const cfg = getGuild(guildId);
  const channelLine = cfg?.channelId ? t(lang, 'help.channel', { channel: `<#${cfg.channelId}>` }) : t(lang, 'help.noChannel');
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(t(lang, 'help.title'))
    .setDescription(`${t(lang, 'help.desc')}\n\n${channelLine}`)
    .setFooter({ text: CREDIT });
}

module.exports = { HELP_BUTTON_ID, helpButtonRow, helpEmbed };
