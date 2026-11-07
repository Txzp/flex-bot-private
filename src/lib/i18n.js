// Todos los textos del bot en español e inglés.
// Uso: t(lang, 'clave', { variable: valor })
// La bienvenida del setup siempre sale en inglés (todavía no se eligió idioma).
const STRINGS = {
  es: {
    // Setup (pasos después de elegir idioma)
    'setup.onlyAdmins': '🔒 Solo los admins (permiso **Gestionar servidor**) pueden configurar AirFlex.',
    'setup.channel.title': '📍 ¿Dónde se podrá usar AirFlex?',
    'setup.channel.desc': 'Paso **2 de 2**\nElige el canal donde funcionarán los comandos.',
    'setup.channel.placeholder': 'Selecciona un canal…',
    'setup.done.title': '✅ ¡Todo listo!',
    'setup.done.desc': 'AirFlex está activo en {channel}.\nPrueba con `/flex` o `/random` 🔥',
    'setup.noPerms':
      '⚠️ No puedo escribir en {channel}. Dame permisos de **Ver canal**, **Enviar mensajes**, **Insertar enlaces** y **Adjuntar archivos** ahí, o elige otro canal.',

    // Verify
    'verify.off': '🔒 La verificación todavía no está activada en este bot.',
    'verify.title': '✅ Verifica tu cuenta',
    'verify.desc':
      'Inicia sesión con Discord para que AirFlex muestre tu **Nitro real** (Nitro, Basic o Classic) y tus **conexiones públicas** (Spotify, Steam, Xbox…) en tu tarjeta, con la insignia **VERIFIED**.\n\n' +
      '🔐 No vemos tu contraseña ni tus mensajes. Solo guardamos tu tipo de Nitro y los tipos de conexiones públicas. Puedes borrarlo cuando quieras con `/unverify`.\n' +
      '⏱️ El link vale 15 minutos.',
    'verify.button': 'Login with Discord',
    'verify.already': 'ℹ️ Ya estás verificado. Hazlo otra vez si cambiaste de Nitro o de conexiones.',
    'unverify.done': '🗑️ Tus datos de verificación fueron borrados.',
    'unverify.none': 'ℹ️ No tenías datos de verificación guardados.',

    // Help
    'help.button': 'Help',
    'help.title': '❓ Comandos de AirFlex',
    'help.desc':
      '`/flex` — Analiza **tu** perfil y te da una nota del 0 al 10 con un preview.\n' +
      '`/flex @user` — Analiza el perfil de **otro** usuario.\n' +
      '`/random` — 🎲 Elige a alguien al azar del servidor y lo califica.\n' +
      '`/verify` — ✅ Verifica tu cuenta: Nitro real y conexiones en tu tarjeta.\n' +
      '`/unverify` — Borra tus datos de verificación.\n' +
      '`/ping` — 🏓 Mide la latencia del bot.\n' +
      '`/version` — Muestra la versión del bot.\n' +
      '`/help` o `!AirHelp` — Muestra esta lista.\n' +
      '`/setup` — (Admins) Elegir idioma y canal.\n' +
      '`/debug @user` — (Admins) Ver los datos crudos de un perfil.',
    'help.channel': '📍 Canal de AirFlex: {channel}',
    'help.noChannel': '📍 Aún no hay canal configurado. Un admin puede usar `/setup`.',

    // Flex / Random
    'flex.wrongChannel': '📍 AirFlex solo funciona en {channel}. ¡Ve para allá!',
    'flex.bot': '🤖 Los bots no flexean, solo humanos.',
    'flex.error': '😵 No pude analizar ese perfil. Intenta de nuevo en un momento.',
    'flex.title': '{name} — {score}/10',
    'flex.cooldown': '⏳ Espera {seconds}s antes de volver a usar AirFlex.',
    'random.pick': '🎲 **El elegido al azar es…** {user}',
    'random.none': '😶 No encontré a nadie para elegir. Hablen un poco en el chat y vuelvan a intentar.',

    // Card labels
    'card.username': 'Username',
    'card.account': 'Cuenta',
    'card.badges': 'Badges',
    'card.extras': 'Extras',
    'card.years': '{n} años',
    'card.year': '1 año',
    'card.months': '{n} meses',
    'card.none': 'Ninguno',
    'card.noBadges': 'Sin badges',
    'card.letters': 'solo letras',
    'card.animated': 'GIF',
    'card.banner': 'Banner',
    'card.deco': 'Deco',
    'card.tag': 'Tag',
    'perk.nitro': 'Nitro',
    'perk.owner': 'Dueño del server',
    'perk.booster': 'Booster',
    'perk.nameplate': 'Nameplate',

    'ping.reply': '🏓 Pong! `{ms}ms`',
    'version.reply': '⚡ **AirFlex** `{version}`',
    'error.generic': '😵 Algo salió mal. Intenta de nuevo.',
  },

  en: {
    'setup.onlyAdmins': '🔒 Only admins (**Manage Server** permission) can set up AirFlex.',
    'setup.channel.title': '📍 Where can AirFlex be used?',
    'setup.channel.desc': 'Step **2 of 2**\nPick the channel where the commands will work.',
    'setup.channel.placeholder': 'Select a channel…',
    'setup.done.title': '✅ All set!',
    'setup.done.desc': 'AirFlex is live in {channel}.\nTry `/flex` or `/random` 🔥',
    'setup.noPerms':
      '⚠️ I can\'t post in {channel}. Give me **View Channel**, **Send Messages**, **Embed Links** and **Attach Files** there, or pick another channel.',

    'verify.off': '🔒 Verification is not enabled on this bot yet.',
    'verify.title': '✅ Verify your account',
    'verify.desc':
      'Log in with Discord so AirFlex can show your **real Nitro** (Nitro, Basic or Classic) and your **public connections** (Spotify, Steam, Xbox…) on your card, with the **VERIFIED** badge.\n\n' +
      '🔐 We never see your password or messages. We only store your Nitro type and the types of your public connections. Delete it anytime with `/unverify`.\n' +
      '⏱️ The link is valid for 15 minutes.',
    'verify.button': 'Login with Discord',
    'verify.already': 'ℹ️ You are already verified. Do it again if your Nitro or connections changed.',
    'unverify.done': '🗑️ Your verification data was deleted.',
    'unverify.none': 'ℹ️ You had no verification data saved.',

    'help.button': 'Help',
    'help.title': '❓ AirFlex commands',
    'help.desc':
      '`/flex` — Analyzes **your** profile and gives you a 0–10 rating with a preview.\n' +
      '`/flex @user` — Analyzes **another** user\'s profile.\n' +
      '`/random` — 🎲 Picks someone random from the server and rates them.\n' +
      '`/verify` — ✅ Verify your account: real Nitro and connections on your card.\n' +
      '`/unverify` — Deletes your verification data.\n' +
      '`/ping` — 🏓 Shows the bot\'s latency.\n' +
      '`/version` — Shows the bot version.\n' +
      '`/help` or `!AirHelp` — Shows this list.\n' +
      '`/setup` — (Admins) Choose language and channel.\n' +
      '`/debug @user` — (Admins) See the raw data of a profile.',
    'help.channel': '📍 AirFlex channel: {channel}',
    'help.noChannel': '📍 No channel set yet. An admin can run `/setup`.',

    'flex.wrongChannel': '📍 AirFlex only works in {channel}. Head over there!',
    'flex.bot': '🤖 Bots don\'t flex, humans only.',
    'flex.error': '😵 I couldn\'t analyze that profile. Try again in a moment.',
    'flex.title': '{name} — {score}/10',
    'flex.cooldown': '⏳ Wait {seconds}s before using AirFlex again.',
    'random.pick': '🎲 **The random pick is…** {user}',
    'random.none': '😶 I couldn\'t find anyone to pick. Chat a bit and try again.',

    'card.username': 'Username',
    'card.account': 'Account',
    'card.badges': 'Badges',
    'card.extras': 'Extras',
    'card.years': '{n} years',
    'card.year': '1 year',
    'card.months': '{n} months',
    'card.none': 'None',
    'card.noBadges': 'No badges',
    'card.letters': 'letters only',
    'card.animated': 'GIF',
    'card.banner': 'Banner',
    'card.deco': 'Deco',
    'card.tag': 'Tag',
    'perk.nitro': 'Nitro',
    'perk.owner': 'Server Owner',
    'perk.booster': 'Booster',
    'perk.nameplate': 'Nameplate',

    'ping.reply': '🏓 Pong! `{ms}ms`',
    'version.reply': '⚡ **AirFlex** `{version}`',
    'error.generic': '😵 Something went wrong. Try again.',
  },
};

function t(lang, key, vars = {}) {
  const table = STRINGS[lang] || STRINGS.es;
  let str = table[key] ?? STRINGS.es[key] ?? key;
  for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(String(v));
  return str;
}

module.exports = { t };
