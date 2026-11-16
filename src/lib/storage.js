// Guarda:
//  - guilds: configuración de cada servidor (idioma + canal)
// Con MONGODB_URI → MongoDB Atlas. Sin MONGODB_URI → archivos en data/ (para probar en tu PC).
// Todo se mantiene en memoria para que leer sea instantáneo.
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILES = { guilds: path.join(DATA_DIR, 'guilds.json') };
const cache = { guilds: {} };
const cols = { guilds: null };

async function init() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('airflex');
    for (const name of Object.keys(cache)) {
      cols[name] = db.collection(name);
      const docs = await cols[name].find({}).toArray();
      cache[name] = Object.fromEntries(docs.map(({ _id, ...rest }) => [_id, rest]));
    }
    console.log(`🗄️  MongoDB conectado (${Object.keys(cache.guilds).length} servidores)`);
  } else {
    for (const name of Object.keys(cache)) {
      try {
        cache[name] = JSON.parse(fs.readFileSync(FILES[name], 'utf8'));
      } catch {
        cache[name] = {};
      }
    }
    console.log(`🗄️  Usando data/*.json (${Object.keys(cache.guilds).length} servidores)`);
  }
}

function saveFile(name) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILES[name] + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache[name], null, 2));
  fs.renameSync(tmp, FILES[name]);
}

async function put(name, id, data) {
  cache[name][id] = { ...(cache[name][id] || {}), ...data, updatedAt: new Date().toISOString() };
  if (cols[name]) await cols[name].updateOne({ _id: id }, { $set: cache[name][id] }, { upsert: true });
  else saveFile(name);
  return cache[name][id];
}

async function remove(name, id) {
  const existed = Boolean(cache[name][id]);
  delete cache[name][id];
  if (cols[name]) await cols[name].deleteOne({ _id: id });
  else saveFile(name);
  return existed;
}

// Servidores
const getGuild = (guildId) => cache.guilds[guildId] || null;
const setGuild = (guildId, data) => put('guilds', guildId, data);
const deleteGuild = (guildId) => remove('guilds', guildId);
const getLang = (guildId) => cache.guilds[guildId]?.lang || 'en';

module.exports = { init, getGuild, setGuild, deleteGuild, getLang };
