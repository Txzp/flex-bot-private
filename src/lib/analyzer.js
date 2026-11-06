// Analiza un perfil de Discord y calcula la nota 0-10 SIN IA, solo con reglas.
// Datos que la API de Discord sí da a los bots: username, fecha de creación (del ID),
// badges públicos, avatar/banner (y si son animados), decoración y tag de servidor.
// La "About me"/descripción NO está disponible para bots.

// Badges públicos, ordenados de más raro a menos raro.
const BADGES = [
  { flag: 'Staff', key: 'staff', label: 'Discord Staff', points: 3, og: true, color: '#5865F2' },
  { flag: 'Partner', key: 'partner', label: 'Partner', points: 2.5, og: true, color: '#4087ED' },
  { flag: 'BugHunterLevel2', key: 'bug2', label: 'Bug Hunter Gold', points: 2.5, og: true, color: '#E0B000' },
  { flag: 'Hypesquad', key: 'hsevents', label: 'HypeSquad Events', points: 2, og: true, color: '#F6A623' },
  { flag: 'PremiumEarlySupporter', key: 'early', label: 'Early Supporter', points: 2, og: true, color: '#B45CFF' },
  { flag: 'VerifiedDeveloper', key: 'devbadge', label: 'Early Bot Dev', points: 2, og: true, color: '#3E70DD' },
  { flag: 'BugHunterLevel1', key: 'bug1', label: 'Bug Hunter', points: 1.5, og: true, color: '#3BA55C' },
  { flag: 'CertifiedModerator', key: 'mod', label: 'Mod Alumni', points: 1.5, og: true, color: '#00A8E8' },
  { flag: 'ActiveDeveloper', key: 'activedev', label: 'Active Developer', points: 0.5, og: false, color: '#23A55A' },
  { flag: 'HypeSquadOnlineHouse1', key: 'bravery', label: 'Bravery', points: 0.25, og: false, color: '#9C84EF' },
  { flag: 'HypeSquadOnlineHouse2', key: 'brilliance', label: 'Brilliance', points: 0.25, og: false, color: '#F47B67' },
  { flag: 'HypeSquadOnlineHouse3', key: 'balance', label: 'Balance', points: 0.25, og: false, color: '#45DDC0' },
];

// Palabras comunes: un username que sea palabra real vale más.
const WORDS = new Set(
  (
    'ace,air,ash,axe,bad,bat,bee,bit,bot,box,boy,bug,cat,cry,cut,day,dev,die,dog,dry,egg,end,eye,fan,fat,fly,fox,fun,gem,god,gun,hat,hex,ice,ink,jet,joy,key,kid,king,lab,law,leg,lie,lip,log,low,mad,map,max,mix,mob,mud,net,new,odd,oil,old,one,owl,pan,pen,pet,pig,pop,pro,raw,ray,red,rex,rip,rob,rot,run,sad,sea,sky,sly,spy,sun,tea,top,toy,war,wax,web,wet,win,wolf,zen,zip,' +
    'angel,anime,apex,arch,aura,baby,bear,beast,blade,blaze,blood,blue,bold,bone,boss,brave,cash,chaos,chill,clan,cloud,code,cold,cool,crow,crown,cyber,dark,dawn,dead,death,demon,devil,dream,drip,duck,dust,echo,edge,elite,ember,epic,evil,fade,fake,fire,flex,flow,frost,fury,game,ghost,glow,gold,grim,hero,holy,hype,icon,jade,joke,kill,lazy,legend,light,lion,lord,lost,love,luna,luck,lucky,magic,mars,mist,moon,neon,nova,omega,onyx,peak,pink,pixel,prime,pure,queen,rage,rain,rich,ruby,rush,saint,shadow,shark,silent,silk,slay,smoke,snow,soul,star,steel,storm,sugar,swag,tiger,toxic,venom,void,wave,wild,wind,wing,zero,' +
    'sol,luz,rey,mar,fe,paz,oro,mal,gato,lobo,amor,vida,nube,fuego,alma,cielo,noche,diablo,rosa,luna,flor'
  ).split(',')
);

function badgeList(user) {
  const flags = user.flags;
  if (!flags) return [];
  return BADGES.filter((b) => {
    try {
      return flags.has(b.flag);
    } catch {
      return false;
    }
  });
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

/**
 * @param {import('discord.js').User} user  — usuario ya traído con force:true (para tener banner)
 * @param {import('discord.js').GuildMember|null} member — miembro en el servidor actual (para Owner/Booster)
 */
function analyzeUser(user, member = null) {
  const username = analyzeUsername(user.username);
  const age = analyzeAge(user.createdAt);
  const badges = badgeList(user);

  const animatedAvatar = Boolean(user.avatar && user.avatar.startsWith('a_'));
  const hasBanner = Boolean(user.banner);
  const animatedBanner = Boolean(user.banner && user.banner.startsWith('a_'));
  const decoration = Boolean(user.avatarDecorationData?.asset);
  const tagOn = user.primaryGuild?.tag && user.primaryGuild.identityEnabled !== false;
  const guildTag = tagOn ? user.primaryGuild.tag : null;
  const nameplate = Boolean(user.collectibles?.nameplate);
  const owner = Boolean(member && member.guild?.ownerId === user.id);
  const booster = Boolean(member?.premiumSince);

  // "Perks": cosas que se ven en el perfil pero NO son badges públicos de la API.
  // Nitro se deduce: banner propio o avatar animado solo se pueden tener con Nitro.
  const perks = [];
  if (hasBanner || animatedAvatar) perks.push({ key: 'nitro', color: '#FF73FA' });
  if (booster) perks.push({ key: 'booster', color: '#F47FFF' });
  if (owner) perks.push({ key: 'owner', color: '#FAA61A' });
  if (nameplate) perks.push({ key: 'nameplate', color: '#5AC8FA' });

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

  const BASE = 1;
  const raw = BASE + username.points + age.points + badgePoints + extrasPoints;
  const score = Math.max(0, Math.min(10, Math.round(raw * 10) / 10));

  return {
    score,
    tier: tierFor(score),
    username,
    age,
    badges,
    ogBadges: badges.filter((b) => b.og),
    perks,
    extras: { animatedAvatar, hasBanner, animatedBanner, decoration, guildTag, nameplate, owner, booster },
    breakdown: { base: BASE, username: username.points, age: age.points, badges: badgePoints, extras: extrasPoints },
  };
}

module.exports = { analyzeUser, analyzeUsername, BADGES, tierFor };
