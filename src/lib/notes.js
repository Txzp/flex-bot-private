// Genera la "nota" sin IA: una frase según el rango + un detalle real del perfil.
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TIER_LINES = {
  es: {
    legend: ['Esto no es un perfil, es una reliquia 👑', 'Discord debería ponerte en un museo 🏛️', 'Nivel leyenda desbloqueado 💎', 'Los demás solo pueden mirar 👀'],
    og: ['OG de verdad, se nota 🔥', 'Perfil con historia, respeto 🫡', 'Esto huele a 2016 y me encanta 😮‍💨', 'Pocos llegan a este nivel 🏆'],
    gold: ['Perfil sólido, nada que envidiar ✨', 'Buen flex, pero se puede más 😏', 'Va por buen camino 📈', 'Tiene su estilo, eso cuenta 💅'],
    silver: ['Normalito, pero con potencial 🙂', 'Ni frío ni caliente 🫤', 'Está bien… para empezar 😅', 'Le falta ese toque OG 🤏'],
    bronze: ['Perfil de NPC detectado 🤖', 'Todavía hay tiempo bro 💀', 'Ese perfil necesita ayuda urgente 🚑', 'Cuenta en modo tutorial 🎮'],
  },
  en: {
    legend: ['This isn\'t a profile, it\'s a relic 👑', 'Discord should put you in a museum 🏛️', 'Legend tier unlocked 💎', 'Everyone else can only watch 👀'],
    og: ['A real OG, you can tell 🔥', 'Profile with history, respect 🫡', 'This smells like 2016 and I love it 😮‍💨', 'Few make it to this level 🏆'],
    gold: ['Solid profile, nothing to envy ✨', 'Nice flex, but there\'s more 😏', 'On the right track 📈', 'It has style, that counts 💅'],
    silver: ['Pretty average, but with potential 🙂', 'Not bad, not great 🫤', 'It\'s fine… for a start 😅', 'Missing that OG touch 🤏'],
    bronze: ['NPC profile detected 🤖', 'There\'s still time bro 💀', 'This profile needs urgent help 🚑', 'Account still in tutorial mode 🎮'],
  },
};

const DETAIL = {
  es: {
    shortName: (a) => `Un ${a.username.tag} así no se ve todos los días.`,
    word: (a) => `"${a.username.name}" es palabra real, eso vale oro.`,
    oldAccount: (a) => `Cuenta de ${a.age.year}, eso ya es historia.`,
    ogBadge: (a) => `Ese ${a.ogBadges[0].label} es puro flex.`,
    manyBadges: (a) => `${a.badges.length} badges, colección seria.`,
    animated: () => 'Avatar animado, vibes de Nitro.',
    digits: () => 'Esos números en el username te bajan puntos.',
    longName: (a) => `${a.username.len} letras de username… muy largo.`,
    newAccount: (a) => `Cuenta de ${a.age.year}, todavía muy nueva.`,
    noBadges: () => 'Sin badges, sin flex.',
  },
  en: {
    shortName: (a) => `A ${a.username.tag} like this isn't seen every day.`,
    word: (a) => `"${a.username.name}" is a real word, that's gold.`,
    oldAccount: (a) => `Account from ${a.age.year}, that's history.`,
    ogBadge: (a) => `That ${a.ogBadges[0].label} is pure flex.`,
    manyBadges: (a) => `${a.badges.length} badges, serious collection.`,
    animated: () => 'Animated avatar, Nitro vibes.',
    digits: () => 'Those numbers in the username cost you points.',
    longName: (a) => `${a.username.len}-character username… way too long.`,
    newAccount: (a) => `Account from ${a.age.year}, still pretty new.`,
    noBadges: () => 'No badges, no flex.',
  },
};

function buildNote(a, lang = 'es') {
  const L = TIER_LINES[lang] ? lang : 'es';
  const d = DETAIL[L];
  const good = [];
  const bad = [];

  if (a.username.len <= 4) good.push(d.shortName);
  if (a.username.isWord) good.push(d.word);
  if (a.age.year <= 2017) good.push(d.oldAccount);
  if (a.ogBadges.length) good.push(d.ogBadge);
  if (a.badges.length >= 3) good.push(d.manyBadges);
  if (a.extras.animatedAvatar) good.push(d.animated);

  if (a.username.digitCount >= 2) bad.push(d.digits);
  if (a.username.len >= 12) bad.push(d.longName);
  if (a.age.year >= 2023) bad.push(d.newAccount);
  if (!a.badges.length) bad.push(d.noBadges);

  const highScore = a.score >= 5.5;
  const pool = highScore ? (good.length ? good : bad) : (bad.length ? bad : good);
  const detail = pool.length ? pick(pool)(a) : '';
  const line = pick(TIER_LINES[L][a.tier.key]);
  return detail ? `${line} — ${detail}` : line;
}

module.exports = { buildNote };
