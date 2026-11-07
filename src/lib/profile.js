// Junta TODO lo que Discord le permite ver a un bot sobre un usuario.
// 1) JSON crudo de GET /users/{id} (public_flags, banner, decoración, nameplate, server tag, display name styles…)
//    → se lee directo de la API, así no dependemos de que discord.js entienda campos nuevos.
// 2) Boost: revisa el servidor actual + los servidores en común que el bot ya tiene en caché.
// 3) Datos verificados con /verify (OAuth2): Nitro real y conexiones.
const { Routes } = require('discord.js');
const storage = require('./storage');

const MAX_GUILD_CHECKS = 25;

async function fetchRawUser(client, userId) {
  try {
    return await client.rest.get(Routes.user(userId));
  } catch (err) {
    console.error('[profile] GET /users falló:', err.message);
    return null;
  }
}

// Busca si el usuario boostea en algún servidor donde también está AirFlex
async function findBoosts(client, userId, currentGuild) {
  const boosts = [];
  let owner = false;
  const guilds = [currentGuild, ...client.guilds.cache.filter((g) => g.id !== currentGuild?.id).values()].filter(Boolean);
  let checks = 0;
  for (const guild of guilds) {
    let member = guild.members.cache.get(userId) || null;
    // El servidor actual siempre se consulta; los demás solo si están en caché o quedan consultas
    if (!member && (guild.id === currentGuild?.id || checks < MAX_GUILD_CHECKS)) {
      checks++;
      member = await guild.members.fetch(userId).catch(() => null);
    }
    if (!member) continue;
    if (member.premiumSince) boosts.push({ guildId: guild.id, since: member.premiumSince });
    if (guild.id === currentGuild?.id && guild.ownerId === userId) owner = true;
  }
  return { boosts, owner };
}

/**
 * @returns {Promise<{user, raw, boosts, owner, verified}>}
 */
async function getFullProfile(client, userId, currentGuild) {
  const [user, raw] = await Promise.all([client.users.fetch(userId, { force: true }), fetchRawUser(client, userId)]);
  const { boosts, owner } = await findBoosts(client, userId, currentGuild);
  const verified = storage.getVerified(userId);

  // Si discord.js no trajo flags pero la API sí, se usan los de la API
  const publicFlags = raw?.public_flags ?? raw?.flags ?? user.flags?.bitfield ?? 0;

  if (process.env.AIRFLEX_DEBUG === '1') {
    console.log(`[debug] ${user.username} (${userId}) public_flags=${publicFlags} flags=[${user.flags?.toArray().join(',')}] banner=${raw?.banner} deco=${!!raw?.avatar_decoration_data} boosts=${boosts.length} verified=${!!verified}`);
  }

  return { user, raw, publicFlags, boosts, owner, verified };
}

module.exports = { getFullProfile, fetchRawUser };
