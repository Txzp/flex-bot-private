// Dibuja la tarjeta de preview del perfil (PNG) con @napi-rs/canvas.
// El "tema" de la tarjeta se saca de tu perfil: color de banner (accent color),
// colores dominantes del banner y del avatar → se ve parecida a tu perfil de Discord.
const path = require('node:path');
const fs = require('node:fs');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { t } = require('./i18n');
const { RARITY } = require('./analyzer');

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
const H = 620;
const BADGE_CDN = (hash) => `https://cdn.discordapp.com/badge-icons/${hash}.png`;

// ---------- utilidades ----------
const stripEmoji = (s) => String(s || '').replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rgb = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
const hexToRgb = (hex) => {
  const n = typeof hex === 'number' ? hex : parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (c1, c2, t) => c1.map((v, i) => v + (c2[i] - v) * t);

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

// Color dominante "vivo" de una imagen (ignora casi-negros, casi-blancos y grises)
function dominantColor(img) {
  if (!img) return null;
  const S = 32;
  const c = createCanvas(S, S);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, S, S);
  const d = x.getImageData(0, 0, S, S).data;
  let r = 0, g = 0, b = 0, wsum = 0;
  let ar = 0, ag = 0, ab = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const R = d[i], G = d[i + 1], B = d[i + 2];
    ar += R; ag += G; ab += B; n++;
    const max = Math.max(R, G, B), min = Math.min(R, G, B);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lum = (R + G + B) / 765;
    if (lum < 0.08 || lum > 0.95) continue;
    const w = sat * sat + 0.02;
    r += R * w; g += G * w; b += B * w; wsum += w;
  }
  if (wsum > 0.5) return [r / wsum, g / wsum, b / wsum];
  return n ? [ar / n, ag / n, ab / n] : null;
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

// Ícono de badge: imagen oficial o círculo de color si no cargó
function drawBadgeIcon(ctx, img, color, x, y, size) {
  if (img) {
    ctx.drawImage(img, x, y, size, size);
    return;
  }
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2.4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------- tarjeta ----------
/**
 * @param {object} p
 * @param {object} p.analysis  resultado de analyzeUser
 * @param {string} p.displayName
 * @param {string} p.username
 * @param {string} p.avatarURL
 * @param {string|null} p.bannerURL
 * @param {string|null} p.decorationURL
 * @param {string|null} p.tagBadgeURL
 * @param {number|null} p.accentColor
 * @param {string} p.note
 * @param {string} p.lang
 * @returns {Promise<Buffer>}
 */
async function renderCard(p) {
  const { analysis: a, lang } = p;
  const tier = a.tier;
  const tierRGB = hexToRgb(tier.color);

  // Badges + perks en una sola lista (con su ícono)
  const items = [
    ...a.badges.map((b) => ({ label: b.short || b.label, color: b.color, rarity: b.rarity, icon: b.icon })),
    ...a.perks.map((pk) => ({ label: pk.label || t(lang, `perk.${pk.key}`), color: pk.color, rarity: pk.rarity, icon: pk.icon })),
  ];

  const [avatar, banner, deco, tagIcon, ...icons] = await Promise.all([
    fetchImage(p.avatarURL),
    fetchImage(p.bannerURL),
    fetchImage(p.decorationURL),
    fetchImage(p.tagBadgeURL),
    ...items.map((it) => fetchImage(it.icon ? BADGE_CDN(it.icon) : null)),
  ]);

  // ---- Tema sacado del perfil ----
  const accent = p.accentColor != null ? hexToRgb(p.accentColor) : null;
  const bannerColor = dominantColor(banner);
  const avatarColor = dominantColor(avatar);
  const primary = bannerColor || accent || avatarColor || [88, 101, 242];
  const secondary = avatarColor || accent || mix(primary, tierRGB, 0.5);
  const bgTop = mix(primary, [10, 10, 14], 0.72);
  const bgBottom = mix(secondary, [10, 10, 14], 0.84);
  const ink = [242, 243, 245];
  const muted = [190, 195, 205];
  const panel = rgb([0, 0, 0], 0.32);
  const panel2 = rgb([0, 0, 0], 0.42);
  const ring = mix(primary, [10, 10, 14], 0.6);

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Fondo con degradado del tema (como los Profile Themes de Discord)
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 30);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, rgb(bgTop));
  bg.addColorStop(1, rgb(bgBottom));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Brillo suave del color del rango abajo a la derecha
  const glow = ctx.createRadialGradient(W - 130, H - 200, 10, W - 130, H - 200, 420);
  glow.addColorStop(0, rgb(tierRGB, 0.18));
  glow.addColorStop(1, rgb(tierRGB, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ---- Banner ----
  const BANNER_H = 200;
  if (banner) {
    drawCover(ctx, banner, 0, 0, W, BANNER_H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, BANNER_H);
    g.addColorStop(0, rgb(accent || primary));
    g.addColorStop(1, rgb(mix(accent || primary, secondary, 0.6)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, BANNER_H);
  }
  const shade = ctx.createLinearGradient(0, BANNER_H - 90, 0, BANNER_H);
  shade.addColorStop(0, rgb(bgTop, 0));
  shade.addColorStop(1, rgb(bgTop, 0.9));
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, BANNER_H);

  // Marca
  ctx.font = '18px PoppinsBold';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, W - 132, 18, 108, 32, 16);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('AIRFLEX', W - 40, 41);
  ctx.textAlign = 'left';

  // ---- Avatar ----
  const AX = 48;
  const AY = 118;
  const AS = 156;
  ctx.beginPath();
  ctx.arc(AX + AS / 2, AY + AS / 2, AS / 2 + 9, 0, Math.PI * 2);
  ctx.fillStyle = rgb(ring);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(AX + AS / 2, AY + AS / 2, AS / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, AX, AY, AS, AS);
  else {
    ctx.fillStyle = rgb(primary);
    ctx.fillRect(AX, AY, AS, AS);
  }
  ctx.restore();
  if (deco) {
    const DS = AS * 1.2;
    ctx.drawImage(deco, AX + AS / 2 - DS / 2, AY + AS / 2 - DS / 2, DS, DS);
  }

  // ---- Fila de íconos de badges (como en el perfil de Discord) ----
  // Solo badges de verdad (con rareza): no cuenta conexiones, Owner ni Nameplate
  const badgeIdx = items.map((it, i) => (it.rarity ? i : -1)).filter((i) => i >= 0);
  if (badgeIdx.length) {
    const IS = 30;
    const GAP = 6;
    const max = Math.min(badgeIdx.length, 12);
    const bw = max * IS + (max - 1) * GAP + 22;
    const bx = W - 40 - bw;
    const by = 214;
    roundRect(ctx, bx, by, bw, IS + 16, 12);
    ctx.fillStyle = panel2;
    ctx.fill();
    for (let k = 0; k < max; k++) {
      const i = badgeIdx[k];
      drawBadgeIcon(ctx, icons[i], items[i].color, bx + 11 + k * (IS + GAP), by + 8, IS);
    }
  }

  // ---- Nombre, @username y Server Tag ----
  const NX = 228;
  const nameMax = badgeIdx.length ? 360 : 520;
  ctx.fillStyle = rgb(ink);
  ctx.font = '42px PoppinsBold';
  ctx.fillText(fitText(ctx, stripEmoji(p.displayName) || p.username, nameMax), NX, 250);
  ctx.font = '22px Poppins';
  ctx.fillStyle = rgb(muted);
  const handle = fitText(ctx, `@${p.username}`, 300);
  ctx.fillText(handle, NX, 284);

  let chipX = NX + ctx.measureText(handle).width + 12;
  if (a.extras.guildTag) {
    const tx = chipX;
    ctx.font = '17px PoppinsBold';
    const tw = ctx.measureText(a.extras.guildTag).width + (tagIcon ? 26 : 0) + 18;
    roundRect(ctx, tx, 262, tw, 28, 8);
    ctx.fillStyle = panel2;
    ctx.fill();
    let ix = tx + 9;
    if (tagIcon) {
      ctx.drawImage(tagIcon, ix, 267, 18, 18);
      ix += 24;
    }
    ctx.fillStyle = rgb(ink);
    ctx.fillText(a.extras.guildTag, ix, 283);
    chipX = tx + tw + 8;
  }

  // Chip ✓ VERIFIED (hizo /verify con su cuenta de Discord)
  if (a.verified) {
    ctx.font = '13px PoppinsBold';
    const label = 'VERIFIED';
    const vw = ctx.measureText(label).width + 40;
    roundRect(ctx, chipX, 263, vw, 26, 13);
    ctx.fillStyle = '#23A55A';
    ctx.fill();
    // palomita dibujada (la fuente no trae el símbolo)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(chipX + 11, 276);
    ctx.lineTo(chipX + 15, 280);
    ctx.lineTo(chipX + 22, 271);
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, chipX + 28, 281);
  }

  // ---- Pastillas con nombre de cada badge ----
  let px = 48;
  let py = 310;
  const pills = items.length ? items : [{ label: t(lang, 'card.noBadges'), color: '#4E5058', og: false }];
  pills.forEach((it, i) => {
    const hasIcon = items.length > 0;
    const r = it.rarity ? RARITY[it.rarity] : null;
    ctx.font = '14px PoppinsBold';
    const labelW = ctx.measureText(it.label).width;
    ctx.font = '10px PoppinsBold';
    const tagW = r ? ctx.measureText(r.label).width + 14 : 0;
    const w = labelW + (hasIcon ? 44 : 26) + (r ? tagW + 6 : 0);
    if (px + w > 48 + 660) {
      px = 48;
      py += 34;
    }
    if (py > 310 + 34 * 2) return;
    roundRect(ctx, px, py, w, 28, 14);
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = r ? r.color : it.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    let lx = px + 15;
    if (hasIcon) {
      drawBadgeIcon(ctx, icons[i], it.color, px + 7, py + 4, 20);
      lx = px + 32;
    }
    ctx.font = '14px PoppinsBold';
    ctx.fillStyle = rgb(ink);
    ctx.fillText(it.label, lx, py + 19);
    if (r) {
      const tx = lx + labelW + 6;
      roundRect(ctx, tx, py + 7, tagW, 14, 7);
      ctx.fillStyle = r.color;
      ctx.fill();
      ctx.font = '10px PoppinsBold';
      ctx.fillStyle = '#111217';
      ctx.fillText(r.label, tx + 7, py + 18);
    }
    px += w + 6;
  });

  // ---- Stats ----
  const SY = 420;
  const SW = 163;
  const extras = [
    a.extras.animatedAvatar && t(lang, 'card.animated'),
    a.extras.hasBanner && t(lang, 'card.banner'),
    a.extras.decoration && t(lang, 'card.deco'),
    a.extras.guildTag && t(lang, 'card.tag'),
    a.extras.boostCount > 1 && `${a.extras.boostCount} boosts`,
  ].filter(Boolean);
  const stats = [
    [t(lang, 'card.username'), `${a.username.tag}${a.username.lettersOnly ? ' · ' + t(lang, 'card.letters') : ''}`],
    [t(lang, 'card.account'), `${a.age.year} · ${ageText(lang, a.age.months)}`],
    [
      t(lang, 'card.badges'),
      badgeIdx.length
        ? [String(badgeIdx.length), a.rarityCount.legendary && `${a.rarityCount.legendary} LEG`, a.rarityCount.rare && `${a.rarityCount.rare} RARE`]
            .filter(Boolean)
            .join(' · ')
        : t(lang, 'card.none'),
    ],
    [t(lang, 'card.extras'), extras.join(' · ') || t(lang, 'card.none')],
  ];
  stats.forEach(([label, value], i) => {
    const x = 48 + i * (SW + 10);
    roundRect(ctx, x, SY, SW, 70, 14);
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.font = '13px Poppins';
    ctx.fillStyle = rgb(muted);
    ctx.fillText(label.toUpperCase(), x + 14, SY + 24);
    let size = 16;
    ctx.font = `${size}px PoppinsBold`;
    while (size > 12 && ctx.measureText(value).width > SW - 24) {
      size -= 1;
      ctx.font = `${size}px PoppinsBold`;
    }
    ctx.fillStyle = rgb(ink);
    ctx.fillText(fitText(ctx, value, SW - 24), x + 14, SY + 52);
  });

  // ---- Medidor ----
  const BOX = { x: 752, y: 290, w: 208, h: 200 };
  roundRect(ctx, BOX.x, BOX.y, BOX.w, BOX.h, 20);
  ctx.fillStyle = panel;
  ctx.fill();
  const GX = BOX.x + BOX.w / 2;
  const GY = BOX.y + 92;
  const GR = 66;
  const start = Math.PI * 0.75;
  const end = Math.PI * 2.25;
  ctx.lineCap = 'round';
  ctx.lineWidth = 13;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(GX, GY, GR, start, end);
  ctx.stroke();
  ctx.strokeStyle = tier.color;
  ctx.shadowColor = tier.color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(GX, GY, GR, start, start + (end - start) * clamp(a.score / 10, 0.001, 1));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.fillStyle = rgb(ink);
  ctx.font = '46px PoppinsBold';
  const scoreText = Number.isInteger(a.score) ? `${a.score}` : a.score.toFixed(1);
  ctx.fillText(scoreText, GX, GY + 14);
  ctx.font = '16px Poppins';
  ctx.fillStyle = rgb(muted);
  ctx.fillText('/ 10', GX, GY + 38);
  ctx.font = '22px PoppinsBold';
  ctx.fillStyle = tier.color;
  ctx.fillText(tier.label, GX, BOX.y + BOX.h - 18);
  ctx.textAlign = 'left';

  // ---- Nota ----
  const NY = 510;
  roundRect(ctx, 48, NY, W - 88, 82, 16);
  ctx.fillStyle = panel2;
  ctx.fill();
  ctx.fillStyle = tier.color;
  roundRect(ctx, 48, NY + 16, 5, 52, 3);
  ctx.fill();
  ctx.font = '19px PoppinsItalic';
  ctx.fillStyle = rgb(ink);
  const lines = wrapLines(ctx, `“${stripEmoji(p.note)}”`, W - 150, 2);
  const lineY = lines.length === 1 ? NY + 50 : NY + 36;
  lines.forEach((l, i) => ctx.fillText(l, 74, lineY + i * 28));

  ctx.restore();

  // Borde del color del rango
  roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 29);
  ctx.strokeStyle = tier.color;
  ctx.lineWidth = 3;
  ctx.stroke();

  return canvas.encode('png');
}

module.exports = { renderCard, dominantColor };
