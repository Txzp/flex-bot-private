// Dibuja la tarjeta de preview del perfil (PNG) con @napi-rs/canvas.
const path = require('node:path');
const fs = require('node:fs');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { t } = require('./i18n');

const FONT_DIR = path.join(__dirname, '..', '..', 'assets', 'fonts');
for (const [file, family] of [
  ['Poppins-Bold.ttf', 'PoppinsBold'],
  ['Poppins-Regular.ttf', 'Poppins'],
  ['Poppins-Italic.ttf', 'PoppinsItalic'],
]) {
  const p = path.join(FONT_DIR, file);
  if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, family);
}

const W = 1000;
const H = 580;
const C = {
  bg: '#0E0F13',
  panel: '#17181F',
  panel2: '#1F2029',
  text: '#F2F3F5',
  muted: '#9AA0AE',
  line: '#2A2C37',
};

// Quita emojis (la fuente no los tiene y saldrían cuadritos)
const stripEmoji = (s) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();

async function fetchImage(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await loadImage(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
  return s + '…';
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fitText(ctx, kept[maxLines - 1] + '…', maxWidth);
    return kept;
  }
  return lines;
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function ageText(lang, months) {
  if (months < 12) return t(lang, 'card.months', { n: months });
  const years = Math.floor(months / 12);
  return years === 1 ? t(lang, 'card.year') : t(lang, 'card.years', { n: years });
}

/**
 * @param {object} p
 * @param {object} p.analysis  resultado de analyzeUser
 * @param {string} p.displayName
 * @param {string} p.username
 * @param {string} p.avatarURL      PNG estático
 * @param {string|null} p.bannerURL PNG estático
 * @param {string|null} p.decorationURL
 * @param {number|null} p.accentColor
 * @param {string} p.note
 * @param {string} p.lang
 * @returns {Promise<Buffer>}
 */
async function renderCard(p) {
  const { analysis: a, lang } = p;
  const tier = a.tier;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fondo
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fillStyle = C.bg;
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.clip();

  // Banner
  const BANNER_H = 190;
  const [avatar, banner, deco, tagIcon] = await Promise.all([
    fetchImage(p.avatarURL),
    fetchImage(p.bannerURL),
    fetchImage(p.decorationURL),
    fetchImage(p.tagBadgeURL),
  ]);
  if (banner) {
    drawCover(ctx, banner, 0, 0, W, BANNER_H);
  } else {
    const accent = p.accentColor != null ? `#${p.accentColor.toString(16).padStart(6, '0')}` : '#3B2A6B';
    const g = ctx.createLinearGradient(0, 0, W, BANNER_H);
    g.addColorStop(0, accent);
    g.addColorStop(1, tier.color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, BANNER_H);
  }
  const shade = ctx.createLinearGradient(0, BANNER_H - 80, 0, BANNER_H);
  shade.addColorStop(0, 'rgba(14,15,19,0)');
  shade.addColorStop(1, 'rgba(14,15,19,0.85)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, BANNER_H);

  // Marca arriba a la derecha
  ctx.font = '18px PoppinsBold';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('AIRFLEX', W - 30, 38);
  ctx.textAlign = 'left';

  // Avatar
  const AX = 50;
  const AY = 115;
  const AS = 150;
  ctx.beginPath();
  ctx.arc(AX + AS / 2, AY + AS / 2, AS / 2 + 8, 0, Math.PI * 2);
  ctx.fillStyle = C.bg;
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(AX + AS / 2, AY + AS / 2, AS / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, AX, AY, AS, AS);
  else {
    ctx.fillStyle = C.panel2;
    ctx.fillRect(AX, AY, AS, AS);
  }
  ctx.restore();
  if (deco) {
    const DS = AS * 1.2;
    ctx.drawImage(deco, AX + AS / 2 - DS / 2, AY + AS / 2 - DS / 2, DS, DS);
  }

  // Nombre y username
  const NX = 225;
  const LEFT_W = 520;
  ctx.fillStyle = C.text;
  ctx.font = '40px PoppinsBold';
  ctx.fillText(fitText(ctx, stripEmoji(p.displayName) || p.username, LEFT_W), NX, 242);
  ctx.font = '22px Poppins';
  ctx.fillStyle = C.muted;
  const handle = fitText(ctx, `@${p.username}`, LEFT_W - 140);
  ctx.fillText(handle, NX, 276);

  // Tag de servidor (como en Discord: [icono] TAG)
  if (a.extras.guildTag) {
    const tx = NX + ctx.measureText(handle).width + 14;
    ctx.font = '17px PoppinsBold';
    const tw = ctx.measureText(a.extras.guildTag).width + (tagIcon ? 26 : 0) + 18;
    roundRect(ctx, tx, 254, tw, 28, 8);
    ctx.fillStyle = C.panel2;
    ctx.fill();
    let ix = tx + 9;
    if (tagIcon) {
      ctx.drawImage(tagIcon, ix, 259, 18, 18);
      ix += 24;
    }
    ctx.fillStyle = C.text;
    ctx.fillText(a.extras.guildTag, ix, 275);
  }

  // Badges (pastillas)
  let bx = 50;
  let by = 300;
  ctx.font = '17px PoppinsBold';
  const perkPills = a.perks.map((pk) => ({ label: t(lang, `perk.${pk.key}`), color: pk.color, og: false }));
  let shown = [...a.badges, ...perkPills];
  if (!shown.length) shown = [{ label: t(lang, 'card.noBadges'), color: '#4E5058', og: false }];
  for (const b of shown) {
    const label = b.og ? `${b.label}  OG` : b.label;
    const w = ctx.measureText(label).width + 30;
    if (bx + w > 50 + 680) {
      bx = 50;
      by += 42;
      if (by > 342) break;
    }
    roundRect(ctx, bx, by, w, 32, 16);
    ctx.fillStyle = b.color + (b.color.length === 7 ? '33' : '');
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.fillText(label, bx + 15, by + 22);
    bx += w + 10;
  }

  // Stats (4 cajitas)
  const SY = 392;
  const SW = 162;
  const stats = [
    [t(lang, 'card.username'), `${a.username.tag}${a.username.lettersOnly ? ' · ' + t(lang, 'card.letters') : ''}`],
    [t(lang, 'card.account'), `${a.age.year} · ${ageText(lang, a.age.months)}`],
    [t(lang, 'card.badges'), a.badges.length ? `${a.badges.length}  (${a.ogBadges.length} OG)` : t(lang, 'card.none')],
    [
      t(lang, 'card.extras'),
      [
        a.extras.animatedAvatar && t(lang, 'card.animated'),
        a.extras.hasBanner && t(lang, 'card.banner'),
        a.extras.decoration && t(lang, 'card.deco'),
        a.extras.guildTag && t(lang, 'card.tag'),
      ]
        .filter(Boolean)
        .join(' · ') || t(lang, 'card.none'),
    ],
  ];
  stats.forEach(([label, value], i) => {
    const x = 50 + i * (SW + 10);
    roundRect(ctx, x, SY, SW, 74, 14);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.font = '14px Poppins';
    ctx.fillStyle = C.muted;
    ctx.fillText(label.toUpperCase(), x + 14, SY + 26);
    // Achica la letra si el texto no cabe (16px → 12px) antes de cortarlo
    let size = 16;
    ctx.font = `${size}px PoppinsBold`;
    while (size > 12 && ctx.measureText(value).width > SW - 24) {
      size -= 1;
      ctx.font = `${size}px PoppinsBold`;
    }
    ctx.fillStyle = C.text;
    ctx.fillText(fitText(ctx, value, SW - 24), x + 14, SY + 54);
  });

  // Medidor de puntuación (derecha)
  const GX = 870;
  const GY = 340;
  const GR = 92;
  roundRect(ctx, 760, 215, 220, 251, 20);
  ctx.fillStyle = C.panel;
  ctx.fill();
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  ctx.lineCap = 'round';
  ctx.lineWidth = 14;
  ctx.strokeStyle = C.line;
  ctx.beginPath();
  ctx.arc(GX, GY, GR - 14, start, end);
  ctx.stroke();
  ctx.strokeStyle = tier.color;
  ctx.shadowColor = tier.color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(GX, GY, GR - 14, start, start + (end - start) * (a.score / 10));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.text;
  ctx.font = '52px PoppinsBold';
  const scoreText = Number.isInteger(a.score) ? `${a.score}` : a.score.toFixed(1);
  ctx.fillText(scoreText, GX, GY + 14);
  ctx.font = '18px Poppins';
  ctx.fillStyle = C.muted;
  ctx.fillText('/ 10', GX, GY + 42);
  ctx.font = '22px PoppinsBold';
  ctx.fillStyle = tier.color;
  ctx.fillText(tier.label, GX, GY + 104);
  ctx.textAlign = 'left';

  // Nota
  const NY = 484;
  roundRect(ctx, 50, NY, W - 100, 70, 16);
  ctx.fillStyle = C.panel2;
  ctx.fill();
  ctx.fillStyle = tier.color;
  ctx.fillRect(50, NY + 14, 5, 42);
  ctx.font = '19px PoppinsItalic';
  ctx.fillStyle = C.text;
  const lines = wrapLines(ctx, `“${stripEmoji(p.note)}”`, W - 150, 2);
  const lineY = lines.length === 1 ? NY + 43 : NY + 30;
  lines.forEach((l, i) => ctx.fillText(l, 75, lineY + i * 26));

  ctx.restore();

  // Borde del color del rango
  roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 27);
  ctx.strokeStyle = tier.color;
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas.encode('png');
}

module.exports = { renderCard };
