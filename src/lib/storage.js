// Guarda la configuración de cada servidor (idioma + canal).
// - Con MONGODB_URI en el .env → MongoDB Atlas (gratis, no se pierde nunca). Úsalo en el hosting.
// - Sin MONGODB_URI → archivo data/guilds.json (bien para probar en tu PC).
// Todo se mantiene en memoria para que leer sea instantáneo.
const fs = require('node:fs');
const path = require('node:path');

const FILE = path.join(__dirname, '..', '..', 'data', 'guilds.json');
let cache = {};
let collection = null;

async function init() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    collection = client.db('airflex').collection('guilds');
    const docs = await collection.find({}).toArray();
    cache = Object.fromEntries(docs.map(({ _id, ...rest }) => [_id, rest]));
    console.log(`🗄️  MongoDB conectado (${docs.length} servidores configurados)`);
  } else {
    try {
      cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
      cache = {};
    }
    console.log(`🗄️  Usando data/guilds.json (${Object.keys(cache).length} servidores configurados)`);
  }
}

function saveFile() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, FILE);
}

function getGuild(guildId) {
  return cache[guildId] || null;
}

async function setGuild(guildId, data) {
  cache[guildId] = { ...(cache[guildId] || {}), ...data, updatedAt: new Date().toISOString() };
  if (collection) {
    await collection.updateOne({ _id: guildId }, { $set: cache[guildId] }, { upsert: true });
  } else {
    saveFile();
  }
  return cache[guildId];
}

function getLang(guildId) {
  return cache[guildId]?.lang || 'en';
}

module.exports = { init, getGuild, setGuild, getLang };
