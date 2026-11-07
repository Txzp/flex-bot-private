// Analiza un perfil de Discord y calcula la nota 0-10 SIN IA, solo con reglas.
// Datos que la API de Discord sí da a los bots: username, fecha de creación (del ID),
// badges públicos, avatar/banner (y si son animados), decoración y tag de servidor.
// La "About me"/descripción NO está disponible para bots.

const { UserFlagsBitField } = require('discord.js');

// Badges públicos (public_flags de la API de Discord), agrupados por rareza.
// flag = nombre en discord.js (user.flags.toArray()) · id = nombre oficial en la API.
// icon = hash del PNG oficial: https://cdn.discordapp.com/badge-icons/{icon}.png
const RARITY = {
  legendary: { label: 'LEGENDARY', color: '#FFC83D', order: 0 },
  rare: { label: 'RARE', color: '#5AA9FF', order: 1 },
  special: { label: 'SPECIAL', color: '#FF73FA', order: 2 },
};

const BADGES = [
  // LEGENDARY
  { flag: 'Staff', id: 'staff', label: 'Discord Staff', short: 'Staff', rarity: 'legendary', points: 3, color: '#5865F2', icon: '5e74e9b61934fc1f67c65515d1f7e60d' },
  { flag: 'Partner', id: 'partner', label: 'Partnered Server Owner', short: 'Partner', rarity: 'legendary', points: 2.5, color: '#4087ED', icon: '3f9748e53446a137a052f3454e2de41e' },
  { flag: 'BugHunterLevel2', id: 'bug_hunter_level_2', label: 'Bug Hunter Level 2', short: 'Bug Hunter 2', rarity: 'legendary', points: 2.5, color: '#E0B000', icon: '848f79194d4be5ff5f81505cbd0ce1e6' },
  { flag: 'PremiumEarlySupporter', id: 'early_supporter', label: 'Early Supporter', short: 'Early Supporter', rarity: 'legendary', points: 2.5, color: '#B45CFF', icon: '7060786766c9c840eb3019e725d2b358' },
  // RARE
  { flag: 'BugHunterLevel1', id: 'bug_hunter_level_1', label: 'Bug Hunter Level 1', short: 'Bug Hunter 1', rarity: 'rare', points: 1.5, color: '#3BA55C', icon: '2717692c7dca7289b35297368a940dd0' },
  { flag: 'CertifiedModerator', id: 'certified_moderator', label: 'Moderator Alumni', short: 'Mod Alumni', rarity: 'rare', points: 1.5, color: '#00A8E8', icon: 'fee1624003e2fee35cb398e125dc479b' },
  { flag: 'VerifiedDeveloper', id: 'verified_developer', label: 'Early Verified Bot Developer', short: 'Early Bot Dev', rarity: 'rare', points: 1.5, color: '#3E70DD', icon: '6df5892e0f35b051f8b61eace34f4967' },
  // SPECIAL
  { flag: 'Hypesquad', id: 'hypesquad', label: 'HypeSquad Events', short: 'HypeSquad Events', rarity: 'special', points: 1, color: '#F6A623', icon: 'bf01d1073931f921909045f3a39fd264' },
  { flag: 'HypeSquadOnlineHouse1', id: 'hypesquad_house_1', label: 'HypeSquad Bravery', short: 'Bravery', rarity: 'special', points: 0.25, color: '#9C84EF', icon: '8a88d63823d8a71cd5e390baa45efa02' },
  { flag: 'HypeSquadOnlineHouse2', id: 'hypesquad_house_2', label: 'HypeSquad Brilliance', short: 'Brilliance', rarity: 'special', points: 0.25, color: '#F47B67', icon: '011940fd013da3f7fb926e4a1cd2e618' },
  { flag: 'HypeSquadOnlineHouse3', id: 'hypesquad_house_3', label: 'HypeSquad Balance', short: 'Balance', rarity: 'special', points: 0.25, color: '#45DDC0', icon: '3aa41de486fa12454c3761e8e223442e' },
  { flag: 'ActiveDeveloper', id: 'active_developer', label: 'Active Developer', short: 'Active Dev', rarity: 'special', points: 0.5, color: '#23A55A', icon: '6bdc42827a38498929a4920da12695d9' },
].map((b) => ({ ...b, key: b.id, og: b.rarity !== 'special' }));

// Perks que AirFlex deduce (NO vienen en public_flags). Rareza: SPECIAL.
const PERK_ICONS = {
  nitro: '2ba85e8026a8614b640c2837bcdfe21b', // premium
  booster: '51040c70d4f20a921ad6674ff86fc95c', // guild_booster_lvl1 (el nivel real no se puede saber)
};

// Palabras comunes: un username que sea palabra real vale más.
const WORDS = new Set(
  (
    'ace,air,ash,axe,bad,bat,bee,bit,bot,box,boy,bug,cat,cry,cut,day,dev,die,dog,dry,egg,end,eye,fan,fat,fly,fox,fun,gem,god,gun,hat,hex,ice,ink,jet,joy,key,kid,king,lab,law,leg,lie,lip,log,low,mad,map,max,mix,mob,mud,net,new,odd,oil,old,one,owl,pan,pen,pet,pig,pop,pro,raw,ray,red,rex,rip,rob,rot,run,sad,sea,sky,sly,spy,sun,tea,top,toy,war,wax,web,wet,win,wolf,zen,zip,' +
    'angel,anime,apex,arch,aura,baby,bear,beast,blade,blaze,blood,blue,bold,bone,boss,brave,cash,chaos,chill,clan,cloud,code,cold,cool,crow,crown,cyber,dark,dawn,dead,death,demon,devil,dream,drip,duck,dust,echo,edge,elite,ember,epic,evil,fade,fake,fire,flex,flow,frost,fury,game,ghost,glow,gold,grim,hero,holy,hype,icon,jade,joke,kill,lazy,legend,light,lion,lord,lost,love,luna,luck,lucky,magic,mars,mist,moon,neon,nova,omega,onyx,peak,pink,pixel,prime,pure,queen,rage,rain,rich,ruby,rush,saint,shadow,shark,silent,silk,slay,smoke,snow,soul,star,steel,storm,sugar,swag,tiger,toxic,venom,void,wave,wild,wind,wing,zero,' +
    'sol,luz,rey,mar,fe,paz,oro,mal,gato,lobo,amor,vida,nube,fuego,alma,cielo,noche,diablo,rosa,luna,flor'
  ).split(',')
);

// Lee los public_flags (número crudo de la API) con UserFlagsBitField.toArray() y los cruza con la tabla de arriba
function badgeList(publicFlags) {
  let names = [];
  try {
    names = new UserFlagsBitField(Number(publicFlags) || 0).toArray();
  } catch {
    names = [];
  }
  const owned = new Set(names);
  return BADGES.filter((b) => owned.has(b.flag)).sort((a, b) => RARITY[a.rarity].order - RARITY[b.rarity].order);
}

function analyzeUsername(raw) {
  const name = String(raw || '').toLowerCase();
  const len = name.length;
  const lettersOnly = /^[a-z]+$/.test(name);
  const digitCount = (name.match(/[0-9]/g) || []).length;
  const symbols = (name.match(/[._]/g) || []).length;
  const isWord = lettersOnly && WORDS.has(name);
  const repeated = /^(.)\1+$/.test(name); // ej: "aaa", "zzzz"

  let points = 0;
  if (len <= 2) points += 4;
  else if (len === 3) points += 3;
  else if (len === 4) points += 2;
  else if (len === 5) points += 1;
  else if (len <= 7) points += 0.5;

  if (lettersOnly && len <= 8) points += 1;
  if (isWord) points += 1;
  if (repeated && len <= 4) points += 0.5;
  if (digitCount >= 3) points -= 1;
  else if (digitCount > 0 && len > 4) points -= 0.5;
  if (symbols >= 2) points -= 0.5;

  return { name, len, lettersOnly, isWord, digitCount, symbols, tag: `${len}c`, points };
}

function analyzeAge(createdAt) {
  const year = createdAt.getUTCFullYear();
  const months = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (30.44 * 24 * 3600 * 1000)));
  let points = 0;
  if (year <= 2015) points = 3;
  else if (year === 2016) points = 2.5;
  else if (year === 2017) points = 2;
  else if (year === 2018) points = 1.5;
  else if (year === 2019) points = 1;
  else if (year <= 2021) points = 0.5;
  return { year, months, points };
}

function tierFor(score) {
  if (score >= 9.5) return { key: 'legend', label: 'LEGEND', color: '#FF3D7F' };
  if (score >= 8) return { key: 'og', label: 'OG', color: '#FFC83D' };
  if (score >= 5.5) return { key: 'gold', label: 'GOLD', color: '#E8B04B' };
  if (score >= 3) return { key: 'silver', label: 'SILVER', color: '#B8C4D6' };
  return { key: 'bronze', label: 'NPC', color: '#C27C4E' };
}

// Nombres bonitos de las conexiones (OAuth2 /verify)
const CONNECTIONS = {
  spotify: ['Spotify', '#1DB954'], steam: ['Steam', '#66C0F4'], xbox: ['Xbox', '#107C10'], playstation: ['PlayStation', '#2E6DB4'],
  github: ['GitHub', '#8B949E'], twitch: ['Twitch', '#9146FF'], youtube: ['YouTube', '#FF0000'], tiktok: ['TikTok', '#25F4EE'],
  twitter: ['X', '#E7E9EA'], instagram: ['Instagram', '#E1306C'], reddit: ['Reddit', '#FF4500'], roblox: ['Roblox', '#E2231A'],
  riotgames: ['Riot Games', '#EB0029'], leagueoflegends: ['League', '#C89B3C'], epicgames: ['Epic Games', '#CCCCCC'],
  battlenet: ['Battle.net', '#148EFF'], crunchyroll: ['Crunchyroll', '#F47521'], bluesky: ['Bluesky', '#1185FE'],
};
const NITRO_TYPES = { 1: 'Nitro Classic', 2: 'Nitro', 3: 'Nitro Basic' };

/**
 * @param {import('discord.js').User} user  — usuario traído con force:true
 * @param {object} ctx — datos extra de lib/profile.js: { publicFlags, raw, boosts, owner, verified }
 */
function analyzeUser(user, ctx = {}) {
  const raw = ctx.raw || {};
  const verified = ctx.verified || null;
  const username = analyzeUsername(user.username);
  const age = analyzeAge(user.createdAt);
  const badges = badgeList(ctx.publicFlags ?? raw.public_flags ?? user.flags?.bitfield ?? 0);

  const avatarHash = raw.avatar ?? user.avatar;
  const bannerHash = raw.banner ?? user.banner;
  const animatedAvatar = Boolean(avatarHash && avatarHash.startsWith('a_'));
  const hasBanner = Boolean(bannerHash);
  const animatedBanner = Boolean(bannerHash && bannerHash.startsWith('a_'));
  const decoration = Boolean(raw.avatar_decoration_data?.asset || user.avatarDecorationData?.asset);
  const pg = raw.primary_guild || (user.primaryGuild && { tag: user.primaryGuild.tag, identity_enabled: user.primaryGuild.identityEnabled });
  const guildTag = pg?.tag && pg.identity_enabled !== false ? pg.tag : null;
  const nameplate = Boolean(raw.collectibles?.nameplate || user.collectibles?.nameplate);
  const nameStyles = Boolean(raw.display_name_styles); // fuente/efecto del display name = Nitro
  const owner = Boolean(ctx.owner);
  const boosts = ctx.boosts || [];
  const booster = boosts.length > 0;

  // Nitro: si hizo /verify usamos el dato REAL de Discord; si no, se deduce por cosas que solo da Nitro
  let nitro = null;
  if (verified && verified.premiumType != null) {
    if (verified.premiumType > 0) nitro = { label: NITRO_TYPES[verified.premiumType] || 'Nitro', real: true };
  } else if (hasBanner || animatedAvatar || animatedBanner || nameStyles) {
    nitro = { label: 'Nitro', real: false };
  }

  const connections = (verified?.connections || []).map((type) => {
    const [label, color] = CONNECTIONS[type] || [type.charAt(0).toUpperCase() + type.slice(1), '#99AAB5'];
    return { type, label, color };
  });

  // "Perks": cosas que se ven en el perfil pero NO son badges públicos de la API.
  const perks = [];
  if (nitro) perks.push({ key: 'nitro', label: nitro.label, rarity: 'special', color: '#FF73FA', icon: PERK_ICONS.nitro });
  if (booster) perks.push({ key: 'booster', rarity: 'special', color: '#F47FFF', icon: PERK_ICONS.booster });
  if (owner) perks.push({ key: 'owner', rarity: null, color: '#FAA61A' });
  if (nameplate) perks.push({ key: 'nameplate', rarity: null, color: '#5AC8FA' });
  for (const c of connections.slice(0, 3)) perks.push({ key: `conn_${c.type}`, label: c.label, rarity: null, color: c.color });
  if (connections.length > 3) perks.push({ key: 'conn_more', label: `+${connections.length - 3}`, rarity: null, color: '#99AAB5' });

  const badgePoints = badges.reduce((s, b) => s + b.points, 0);
  let extrasPoints = 0;
  if (animatedAvatar) extrasPoints += 1;
  if (hasBanner) extrasPoints += 0.75;
  if (animatedBanner) extrasPoints += 0.5;
  if (decoration) extrasPoints += 0.5;
  if (guildTag) extrasPoints += 0.5;
  if (nameplate) extrasPoints += 0.5;
  if (booster) extrasPoints += 0.5;
  if (owner) extrasPoints += 0.25;
  if (nitro) extrasPoints += nitro.real ? 0.75 : 0.5;
  if (boosts.length > 1) extrasPoints += 0.25;
  if (verified) extrasPoints += 0.25;
  extrasPoints += Math.min(1, connections.length * 0.25);

  const BASE = 1;
  const total = BASE + username.points + age.points + badgePoints + extrasPoints;
  const score = Math.max(0, Math.min(10, Math.round(total * 10) / 10));

  return {
    score,
    tier: tierFor(score),
    username,
    age,
    badges,
    ogBadges: badges.filter((b) => b.og),
    rarityCount: {
      legendary: badges.filter((b) => b.rarity === 'legendary').length,
      rare: badges.filter((b) => b.rarity === 'rare').length,
      special: badges.filter((b) => b.rarity === 'special').length + perks.filter((pk) => pk.rarity === 'special').length,
    },
    perks,
    verified: Boolean(verified),
    connections,
    nitro,
    extras: { animatedAvatar, hasBanner, animatedBanner, decoration, guildTag, nameplate, owner, booster, boostCount: boosts.length, nameStyles },
    breakdown: { base: BASE, username: username.points, age: age.points, badges: badgePoints, extras: extrasPoints },
  };
}

module.exports = { analyzeUser, analyzeUsername, BADGES, RARITY, tierFor };
