// Genera tarjetas de prueba sin conectarse a Discord: npm run test-card (o: npm run test-card -- en)
// Usa un banner y avatar dibujados aquí mismo para probar que la tarjeta toma el tema del perfil.
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');
const { UserFlagsBitField, UserFlags } = require('discord.js');
const { analyzeUser } = require('./lib/analyzer');
const { buildNote } = require('./lib/notes');
const { renderCard } = require('./lib/card');

function fakeImage(w, h, c1, c2) {
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  return `data:image/png;base64,${c.toBuffer('image/png').toString('base64')}`;
}

const cases = [
  {
    file: 'test-card.png',
    display: 'scriptbx',
    user: {
      id: 'me',
      username: 'zk',
      createdAt: new Date('2016-03-14'),
      flags: new UserFlagsBitField(UserFlags.PremiumEarlySupporter | UserFlags.VerifiedDeveloper | UserFlags.ActiveDeveloper | UserFlags.HypeSquadOnlineHouse1),
      avatar: 'a_123',
      banner: 'abc',
      avatarDecorationData: { asset: 'x' },
      primaryGuild: { tag: '0km', identityEnabled: true },
      collectibles: { nameplate: { asset: 'x' } },
    },
    member: { guild: { ownerId: 'me' }, premiumSince: new Date() },
    banner: fakeImage(1000, 200, '#0f766e', '#22d3ee'),
    avatar: fakeImage(256, 256, '#f97316', '#be123c'),
    accent: null,
  },
  {
    file: 'test-card-npc.png',
    display: 'juanito',
    user: { id: 'x', username: 'juan_pro2847', createdAt: new Date('2025-02-01'), flags: new UserFlagsBitField(0), avatar: null, banner: null },
    member: null,
    banner: null,
    avatar: null,
    accent: 0x9d174d,
  },
];

(async () => {
  const lang = process.argv[2] || 'es';
  for (const c of cases) {
    const analysis = analyzeUser(c.user, c.member);
    const note = buildNote(analysis, lang);
    const png = await renderCard({
      analysis,
      lang,
      note,
      displayName: c.display,
      username: c.user.username,
      avatarURL: c.avatar,
      bannerURL: c.banner,
      decorationURL: null,
      tagBadgeURL: null,
      accentColor: c.accent,
    });
    const out = path.join(__dirname, '..', c.file);
    fs.writeFileSync(out, png);
    console.log(`${c.file}: ${analysis.score}/10 (${analysis.tier.label}) — ${note}`);
  }
})();
