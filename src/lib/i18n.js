// Todos los textos del bot en español e inglés.
// Uso: t(lang, 'clave', { variable: valor })
// La bienvenida del setup siempre sale en inglés (todavía no se eligió idioma).
const STRINGS = {
  es: {
    // Setup (pasos después de elegir idioma)
    'setup.onlyAdmins': '🔒 Solo los admins (permiso **Gestionar servidor**) pueden configurar AirFlex.',
    'setup.step': 'Paso {n} de 2',
    'setup.channel.title': '¿Dónde se podrá usar AirFlex?',
    'setup.channel.desc': 'Elige el canal donde funcionarán `/flex` y `/random`. En el resto del servidor el bot no responderá.',
    'setup.channel.placeholder': 'Selecciona un canal…',
    'setup.done.title': 'Todo listo',
    'setup.done.desc': 'AirFlex está activo en {channel}.',
    'setup.done.hint': 'Prueba con `/flex` para calificar tu perfil o `/random` para elegir a alguien al azar.',
    'setup.noPerms':
      '⚠️ No puedo escribir en {channel}. Dame permisos de **Ver canal**, **Enviar mensajes**, **Insertar enlaces** y **Adjuntar archivos** ahí, o elige otro canal.',

    // Help
    'help.button': 'Help',
    'help.title': 'Comandos de AirFlex',
    'help.flex':
      '`/flex` — Analiza **tu** perfil y te da una nota del 0 al 10 con un preview.\n' +
      '`/flex @user` — Analiza el perfil de **otro** usuario.\n' +
      '`/random` — Elige a alguien al azar del servidor y lo califica.',
    'help.misc':
      '`/ping` — Mide la latencia del bot.\n' +
      '`/version` — Muestra la versión del bot.\n' +
      '`/help` o `!AirHelp` — Muestra esta lista.',
    'help.admin':
      '`/setup` — Elegir idioma y canal.\n' +
      '`/debug @user` — Ver los datos crudos de un perfil.',
    'help.adminTitle': 'Solo admins',
    'help.channel': 'Canal de AirFlex: {channel}',
    'help.noChannel': 'Aún no hay canal configurado. Un admin puede usar `/setup`.',

    // Flex / Random
    'flex.wrongChannel': '📍 AirFlex solo funciona en {channel}. ¡Ve para allá!',
    'flex.bot': '🤖 Los bots no flexean, solo humanos.',
    'flex.error': '😵 No pude analizar ese perfil. Intenta de nuevo en un momento.',
    'flex.title': '{name}',
    'flex.score': '{score}/10',
    'flex.cooldown': '⏳ Espera {seconds}s antes de volver a usar AirFlex.',
    'flex.statUsername': 'Username',
    'flex.statAccount': 'Cuenta',
    'flex.statBadges': 'Badges',
    'random.pick': '**El elegido al azar es…** {user}',
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
    'setup.step': 'Step {n} of 2',
    'setup.channel.title': 'Where can AirFlex be used?',
    'setup.channel.desc': 'Pick the channel where `/flex` and `/random` will work. The bot will stay quiet everywhere else.',
    'setup.channel.placeholder': 'Select a channel…',
    'setup.done.title': 'All set',
    'setup.done.desc': 'AirFlex is live in {channel}.',
    'setup.done.hint': 'Try `/flex` to rate your profile or `/random` to pick someone at random.',
    'setup.noPerms':
      '⚠️ I can\'t post in {channel}. Give me **View Channel**, **Send Messages**, **Embed Links** and **Attach Files** there, or pick another channel.',

    'help.button': 'Help',
    'help.title': 'AirFlex commands',
    'help.flex':
      '`/flex` — Analyzes **your** profile and gives you a 0–10 rating with a preview.\n' +
      '`/flex @user` — Analyzes **another** user\'s profile.\n' +
      '`/random` — Picks someone random from the server and rates them.',
    'help.misc':
      '`/ping` — Shows the bot\'s latency.\n' +
      '`/version` — Shows the bot version.\n' +
      '`/help` or `!AirHelp` — Shows this list.',
    'help.admin':
      '`/setup` — Choose language and channel.\n' +
      '`/debug @user` — See the raw data of a profile.',
    'help.adminTitle': 'Admins only',
    'help.channel': 'AirFlex channel: {channel}',
    'help.noChannel': 'No channel set yet. An admin can run `/setup`.',

    'flex.wrongChannel': '📍 AirFlex only works in {channel}. Head over there!',
    'flex.bot': '🤖 Bots don\'t flex, humans only.',
    'flex.error': '😵 I couldn\'t analyze that profile. Try again in a moment.',
    'flex.title': '{name}',
    'flex.score': '{score}/10',
    'flex.cooldown': '⏳ Wait {seconds}s before using AirFlex again.',
    'flex.statUsername': 'Username',
    'flex.statAccount': 'Account',
    'flex.statBadges': 'Badges',
    'random.pick': '**The random pick is…** {user}',
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
