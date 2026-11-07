// /debug @user — (Admins) muestra en privado los datos CRUDOS que Discord le da al bot sobre un usuario.
// Sirve para revisar reportes de "no me detecta tal badge".
const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, EmbedBuilder, MessageFlags, UserFlagsBitField } = require('discord.js');
const { getFullProfile } = require('../lib/profile');
const { analyzeUser } = require('../lib/analyzer');
const { COLOR } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('(Admins) Show the raw profile data Discord gives AirFlex')
    .setDescriptionLocalizations({ 'es-ES': '(Admins) Muestra los datos crudos del perfil', 'es-419': '(Admins) Muestra los datos crudos del perfil' })
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((o) => o.setName('user').setDescription('User to inspect').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('user');
    const profile = await getFullProfile(interaction.client, target.id, interaction.guild);
    const { raw, publicFlags, boosts, owner, verified } = profile;
    const a = analyzeUser(profile.user, profile);

    let flagNames = [];
    try {
      flagNames = new UserFlagsBitField(Number(publicFlags) || 0).toArray();
    } catch {
      /* flags raros */
    }
    const yes = (v) => (v ? '✅' : '❌');
    const lines = [
      `**public_flags:** \`${publicFlags}\` → ${flagNames.length ? flagNames.map((f) => `\`${f}\``).join(', ') : '*(ninguno)*'}`,
      `**Badges detectadas:** ${a.badges.map((b) => b.label).join(', ') || '*(ninguna)*'}`,
      `**Perks:** ${a.perks.map((p) => p.label || p.key).join(', ') || '*(ninguno)*'}`,
      '',
      `${yes(raw?.avatar?.startsWith('a_'))} Avatar animado · ${yes(raw?.banner)} Banner · ${yes(raw?.banner?.startsWith('a_'))} Banner animado`,
      `${yes(raw?.avatar_decoration_data)} Decoración · ${yes(raw?.collectibles?.nameplate)} Nameplate · ${yes(raw?.display_name_styles)} Display name style`,
      `${yes(raw?.primary_guild?.tag)} Server tag${raw?.primary_guild?.tag ? ` \`${raw.primary_guild.tag}\`` : ''} · ${yes(owner)} Owner aquí`,
      `**Boosts en servidores con AirFlex:** ${boosts.length}`,
      `**Nitro:** ${a.nitro ? `${a.nitro.label} (${a.nitro.real ? 'real, por /verify' : 'deducido'})` : '❌ no detectado'}`,
      `**/verify:** ${verified ? `✅ (${(verified.connections || []).length} conexiones públicas)` : '❌'}`,
      '',
      `**Nota:** ${a.score}/10 · base ${a.breakdown.base} + username ${a.breakdown.username} + edad ${a.breakdown.age} + badges ${a.breakdown.badges} + extras ${a.breakdown.extras}`,
    ];

    const keys = raw ? Object.keys(raw).join(', ') : 'sin respuesta';
    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(`🔍 Debug · @${profile.user.username}`)
      .setDescription(lines.join('\n'))
      .addFields({ name: 'Campos que devolvió la API', value: `\`\`\`${keys.slice(0, 1000)}\`\`\`` });
    await interaction.editReply({ embeds: [embed] });
  },
};
