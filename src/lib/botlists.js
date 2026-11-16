// Sincroniza la lista de slash commands con listas de bots públicas (discordbotlist.com).
// Se dispara al arrancar, justo después de registrar los comandos en Discord.
// El token lo lees del env DBL_TOKEN (Render → Environment). Sin token, no hace nada.

const API = 'https://discordbotlist.com/api/v1';

/**
 * @param {string} clientId
 * @param {Array} discordCommands  los mismos JSON que mandas a Discord
 */
async function syncDiscordBotList(clientId, discordCommands) {
  const token = (process.env.DBL_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  if (!token) return; // sin token, se omite sin ruido

  // discordbotlist.com acepta "el mismo JSON que mandas a Discord" (name, description, type, options…)
  const body = discordCommands.map((c) => ({
    name: c.name,
    description: c.description,
    type: c.type ?? 1,
    ...(c.options ? { options: c.options } : {}),
  }));

  try {
    const res = await fetch(`${API}/bots/${clientId}/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`📋 discordbotlist.com: ${body.length} comandos sincronizados`);
    } else {
      const text = await res.text().catch(() => '');
      console.error(`⚠️  discordbotlist.com rechazó la sincronización (${res.status}): ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.error('⚠️  discordbotlist.com no respondió:', err.message);
  }
}

module.exports = { syncDiscordBotList };
