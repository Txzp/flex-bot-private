// Registra los slash commands en Discord.
//   npm run deploy         → GLOBAL: funcionan en todos los servidores donde esté el bot (pueden tardar hasta 1 hora)
//   npm run deploy:test    → solo en tu servidor de pruebas (GUILD_ID), aparecen al instante
//   npm run deploy:clear   → borra los comandos de prueba de GUILD_ID (para que no salgan repetidos)
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands');

const clean = (v) => (v || '').trim().replace(/^["']|["']$/g, '');
const TOKEN = clean(process.env.DISCORD_TOKEN);
const CLIENT_ID = clean(process.env.CLIENT_ID);
const GUILD_ID = clean(process.env.GUILD_ID);
const mode = process.argv[2] || 'global';

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Falta DISCORD_TOKEN o CLIENT_ID en el archivo .env');
  process.exit(1);
}
if ((mode === 'test' || mode === 'clear') && !GUILD_ID) {
  console.error('❌ Para este modo necesitas GUILD_ID en el .env');
  process.exit(1);
}

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    if (mode === 'clear') {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
      return console.log(`🧹 Comandos de prueba borrados del servidor ${GUILD_ID}`);
    }
    const body = commands.map((c) => c.data.toJSON());
    const route = mode === 'test' ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) : Routes.applicationCommands(CLIENT_ID);
    const data = await rest.put(route, { body });
    console.log(`✅ ${data.length} comandos registrados ${mode === 'test' ? `en el servidor ${GUILD_ID}` : 'GLOBALMENTE'}:`);
    data.forEach((c) => console.log(`   /${c.name}`));
  } catch (err) {
    console.error('❌ Error registrando comandos:', err);
    process.exit(1);
  }
})();
