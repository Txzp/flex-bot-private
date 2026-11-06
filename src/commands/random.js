// /random — elige a alguien al azar y lo califica.
// Sin el intent privilegiado de miembros, el bot no puede listar a todo el servidor,
// así que elige entre la gente que habló hace poco en el canal + los miembros que ya conoce.
// Bonus: así casi siempre sale alguien activo, que es más divertido.
const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { t } = require('../lib/i18n');
const { getLang } = require('../lib/storage');
const { precheck, sendFlex } = require('../lib/flexRunner');

async function candidates(interaction) {
  const ids = new Set();
  try {
    const msgs = await interaction.channel.messages.fetch({ limit: 100 });
    msgs.forEach((m) => !m.author.bot && ids.add(m.author.id));
  } catch {
    /* sin permiso de leer historial */
  }
  interaction.guild.members.cache.forEach((m) => !m.user.bot && ids.add(m.id));
  return [...ids];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Pick a random user from the server and rate them')
    .setDescriptionLocalizations({ 'es-ES': 'Elige a alguien al azar y lo califica', 'es-419': 'Elige a alguien al azar y lo califica' })
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    if (!(await precheck(interaction))) return;
    await interaction.deferReply();
    const lang = getLang(interaction.guildId);

    const pool = await candidates(interaction);
    if (!pool.length) return interaction.editReply(t(lang, 'random.none'));

    const pick = pool[Math.floor(Math.random() * pool.length)];
    await sendFlex(interaction, pick, t(lang, 'random.pick', { user: `<@${pick}>` }));
  },
};
