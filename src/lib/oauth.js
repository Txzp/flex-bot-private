// /verify — "Login with Discord" (OAuth2). Es la forma OFICIAL de que un usuario
// le muestre al bot datos que la API normal no da:
//   - premium_type: tipo de Nitro REAL (Nitro / Basic / Classic)
//   - conexiones públicas de su perfil (Spotify, Steam, Xbox, GitHub…)
// Solo guardamos el tipo de Nitro y los TIPOS de conexiones públicas (no nombres de cuentas).
// El token de acceso se revoca al terminar: no se guarda nada para volver a entrar.
const crypto = require('node:crypto');
const storage = require('./storage');

const API = 'https://discord.com/api/v10';
const STATE_TTL_MS = 15 * 60 * 1000;

const cfg = () => {
  const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
  return { clientId: clean(process.env.CLIENT_ID), secret: clean(process.env.CLIENT_SECRET), publicUrl: clean(process.env.PUBLIC_URL) };
};

function isConfigured() {
  const c = cfg();
  return Boolean(c.clientId && c.secret && c.publicUrl);
}

const redirectUri = () => `${cfg().publicUrl}/callback`;

function sign(payload) {
  return crypto.createHmac('sha256', cfg().secret).update(payload).digest('base64url').slice(0, 32);
}

function makeState(userId) {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function readState(state) {
  const parts = String(state || '').split('.');
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const expected = sign(`${userId}.${ts}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Date.now() - Number(ts) > STATE_TTL_MS) return null;
  return userId;
}

function authorizeUrl(userId) {
  const params = new URLSearchParams({
    client_id: cfg().clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: 'identify connections',
    state: makeState(userId),
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

async function discordForm(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.status === 200 ? res.json().catch(() => ({})) : {};
}

async function discordGet(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function page(ok, title, text) {
  const color = ok ? '#23A55A' : '#ED4245';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AirFlex · ${esc(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e0f13;color:#f2f3f5;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
.card{max-width:420px;margin:16px;padding:32px;border-radius:20px;background:#17181f;border:2px solid ${color};text-align:center}
h1{margin:0 0 8px;font-size:24px}p{color:#b5bac1;line-height:1.5}.dot{width:56px;height:56px;border-radius:50%;background:${color};margin:0 auto 16px;display:grid;place-items:center;font-size:28px;font-weight:700}
a{color:#8b5cf6}</style></head><body><div class="card"><div class="dot">${ok ? '✓' : '!'}</div><h1>${esc(title)}</h1><p>${text}</p>
<p><a href="https://www.airflex.fun/">airflex.fun</a></p></div></body></html>`;
}

/** Maneja GET /callback. Devuelve true si atendió la ruta. */
async function handleCallback(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/callback') return false;
  const send = (status, html) => {
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  };

  if (!isConfigured()) return send(503, page(false, 'Not available', 'Verification is not configured yet.')), true;
  if (url.searchParams.get('error')) return send(400, page(false, 'Cancelled', 'You cancelled the verification. You can try again with <b>/verify</b>.')), true;

  const expectedUser = readState(url.searchParams.get('state'));
  const code = url.searchParams.get('code');
  if (!expectedUser || !code) return send(400, page(false, 'Link expired', 'This link expired or is invalid. Run <b>/verify</b> again in Discord.')), true;

  const { clientId, secret } = cfg();
  let token;
  try {
    token = await discordForm('/oauth2/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: clientId,
      client_secret: secret,
    });
    const me = await discordGet('/users/@me', token.access_token);
    if (me.id !== expectedUser) {
      return send(403, page(false, 'Wrong account', 'You logged in with a different Discord account than the one that ran <b>/verify</b>.')), true;
    }
    let connections = [];
    try {
      const list = await discordGet('/users/@me/connections', token.access_token);
      // Solo conexiones PÚBLICAS (visibility 1 = se ven en el perfil), y solo el tipo
      connections = [...new Set(list.filter((c) => c.visibility === 1).map((c) => c.type))];
    } catch {
      /* sin conexiones */
    }
    await storage.setVerified(me.id, { premiumType: me.premium_type ?? 0, connections, verifiedAt: new Date().toISOString() });
    console.log(`✅ Verificado: ${me.username} (${me.id}) nitro=${me.premium_type ?? 0} conexiones=${connections.length}`);
    send(200, page(true, 'Verified!', `Thanks <b>@${esc(me.username)}</b>. Go back to Discord and use <b>/flex</b> to see your verified card.`));
  } catch (err) {
    console.error('[oauth]', err.message);
    send(500, page(false, 'Something went wrong', 'Discord rejected the verification. Try <b>/verify</b> again in a minute.'));
  } finally {
    // Revoca el token: AirFlex no guarda acceso a la cuenta
    if (token?.access_token) {
      discordForm('/oauth2/token/revoke', { token: token.access_token, token_type_hint: 'access_token', client_id: clientId, client_secret: secret }).catch(() => null);
    }
  }
  return true;
}

module.exports = { isConfigured, authorizeUrl, handleCallback };
