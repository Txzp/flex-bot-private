// Genera una tarjeta de prueba sin conectarse a Discord: npm run test-card
const fs = require('node:fs');
const path = require('node:path');
const { UserFlagsBitField, UserFlags } = require('discord.js');
const { analyzeUser } = require('./lib/analyzer');
const { buildNote } = require('./lib/notes');
const { renderCard } = require('./lib/card');

const fakeUser = {
  username: 'zk',
  createdAt: new Date('2016-03-14'),
  flags: new UserFlagsBitField(UserFlags.PremiumEarlySupporter | UserFlags.Hypesquad | UserFlags.HypeSquadOnlineHouse1),
  avatar: 'a_123',
  banner: 'abc',
  avatarDecorationData: { asset: 'x' },
  primaryGuild: { tag: '0km', identityEnabled: true },
  collectibles: { nameplate: { asset: 'x' } },
};

(async () => {
  const lang = process.argv[2] || 'es';
  const fakeMember = { guild: { ownerId: 'me' }, premiumSince: new Date() };
  fakeUser.id = 'me';
  const analysis = analyzeUser(fakeUser, fakeMember);
  const note = buildNote(analysis, lang);
  const png = await renderCard({
    analysis,
    lang,
    note,
    displayName: 'scriptbx',
    username: fakeUser.username,
    avatarURL: null,
    bannerURL: null,
    decorationURL: null,
    tagBadgeURL: null,
    accentColor: 0x5b21b6,
  });
  const out = path.join(__dirname, '..', 'test-card.png');
  fs.writeFileSync(out, png);
  console.log(`Nota: ${analysis.score}/10 (${analysis.tier.label}) — ${note}`);
  console.log(`Tarjeta guardada en ${out}`);
})();
