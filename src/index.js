require('dotenv').config();
const http = require('node:http');
const { Client, GatewayIntentBits, Events, ActivityType, MessageFlags, Collection } = require('discord.js');
const commands = require('./commands');
const storage = require('./lib/storage');
const { HELP_BUTTON_ID, helpEmbed } = require('./lib/help');
const { isSetupInteraction, handleSetupInteraction, sendJoinWelcome } = require('./lib/setupFlow');
const { t } = require('./lib/i18n');
const { VERSION, HELP_PREFIX } = require('./config');

const TOKEN = (process.env.DISCORD_TOKEN || '').trim().replace(/^["']|["']$/g, '');
if (!TOKEN) {
  console.error('❌ Falta DISCORD_TOKEN en el archivo .env (o en las variables del hosting)');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // necesario para !AirHelp (actívalo en el Developer Portal)
  ],
});

client.commands = new Collection(commands.map((c) => [c.data.name, c]));

client.once(Events.ClientReady, async (c) => {
  console.log(`⚡ AirFlex ${VERSION} conectado como ${c.user.tag} en ${c.guilds.cache.size} servidores`);
  c.user.setActivity('/flex · /help', { type: ActivityType.Watching });

  // Registra los slash commands GLOBALMENTE en cada arranque (todos los servidores, actuales y nuevos).
  // Así basta con hacer git push: no hace falta correr npm run deploy a mano.
  try {
    const registered = await c.application.commands.set(commands.map((cmd) => cmd.data.toJSON()));
    console.log(`✅ ${registered.size} comandos globales listos: ${[...registered.values()].map((x) => '/' + x.name).join(' ')}`);
  } catch (err) {
    console.error('❌ No se pudieron registrar los comandos:', err.message);
  }

  // Borra comandos "de servidor" viejos (de npm run deploy:test) → evita comandos DUPLICADOS
  let cleaned = 0;
  for (const guild of c.guilds.cache.values()) {
    try {
      const local = await guild.commands.fetch();
      if (local.size) {
        await guild.commands.set([]);
        cleaned++;
      }
    } catch {
      /* sin acceso a ese servidor */
    }
  }
  if (cleaned) console.log(`🧹 Comandos duplicados borrados en ${cleaned} servidor(es)`);
});

// Bot añadido a un servidor nuevo → mensaje de bienvenida con el setup
client.on(Events.GuildCreate, (guild) => {
  console.log(`➕ Nuevo servidor: ${guild.name} (${guild.id})`);
  sendJoinWelcome(guild);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }
    if (isSetupInteraction(interaction)) return handleSetupInteraction(interaction);
    if (interaction.isButton() && interaction.customId === HELP_BUTTON_ID) {
      await interaction.reply({ embeds: [helpEmbed(interaction.guildId)], flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error('[interaction]', err);
    const lang = interaction.guildId ? storage.getLang(interaction.guildId) : 'en';
    const payload = { content: t(lang, 'error.generic'), flags: MessageFlags.Ephemeral };
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => null);
      else await interaction.reply(payload).catch(() => null);
    }
  }
});

// !AirHelp
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.content.trim().toLowerCase() !== HELP_PREFIX) return;
  await message.reply({ embeds: [helpEmbed(message.guild.id)], allowedMentions: { repliedUser: false } }).catch(() => null);
});

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

// Mini servidor web: el hosting gratis (Render) lo necesita, y el ping de cron-job.org lo mantiene despierto 24/7
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`AirFlex ${VERSION} online · ${client.isReady() ? client.guilds.cache.size + ' servers' : 'starting'}`);
  })
  .listen(PORT, () => console.log(`🌐 Keep-alive en el puerto ${PORT}`));

(async () => {
  await storage.init();
  await client.login(TOKEN);
})().catch((err) => {
  console.error('❌ No se pudo iniciar:', err.message);
  process.exit(1);
});
