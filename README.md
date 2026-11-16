# ⚡ AirFlex v1.08

Bot de Discord que califica perfiles del **0 al 10** con una tarjeta de preview. Sin IA de pago: todo funciona con reglas.

## Comandos
| Comando | Qué hace |
|---|---|
| `/setup` | (Admins) Elegir idioma (Español / English) y el canal de AirFlex |
| `/flex` | Analiza **tu** perfil |
| `/flex @user` | Analiza el perfil de **otro** usuario |
| `/random` | Elige a alguien al azar (de los que hablaron hace poco) y lo califica |
| `/debug @user` | (Admins) Datos crudos que Discord le da al bot sobre ese perfil |
| `/help` o `!AirHelp` | Lista de comandos (también el botón **Help**) |
| `/ping` | 🏓 Pong! `44ms` |
| `/version` | Muestra la versión (`v1.08`) |

## Novedades v1.08
- **Setup rediseñado** con **Components V2** de Discord (contenedor + separadores nativos, no `---`).
- Fuera el emoji del cohete y el pie **Made by: k940**.
- **Embed de `/flex`** en Components V2: título, tarjeta, nota y stats rápidos.
- **Tarjeta rediseñada**: anillo del avatar del color del rango, chip del tier en el banner, barra de desglose (Username / Cuenta / Badges / Extras), medidor más grande con la etiqueta SCORE y pie con `airflex.fun`.
- Se quitaron los comandos `/verify`, `/unverify` y `/credits`.
- Las badges que **no** están en `public_flags` (Nitro, Booster) se **deducen** del perfil público (banner propio, avatar/banner animado, estilo del display name, boost en un servidor en común). Sin selfbots, sin API privada.

## Instalación (Windows / PowerShell)
1. Instala **Node.js 18 o superior** (nodejs.org).
2. Abre PowerShell en `C:\AirFlex-bot` y ejecuta:
   ```powershell
   npm install
   copy .env.example .env
   ```
3. Abre `.env` y pon tu `DISCORD_TOKEN` y `CLIENT_ID` (y `GUILD_ID` de tu server de pruebas si quieres que los comandos salgan al instante).
4. Enciende el bot (los comandos se registran solos al arrancar):
   ```powershell
   npm start
   ```
5. En tu servidor usa `/setup`.

**Probar la tarjeta sin Discord:** `npm run test-card` (o `npm run test-card -- en`) genera `test-card.png`.

## Developer Portal (resumen)
- **Bot → Privileged Gateway Intents:** activa solo **Message Content** (para `!AirHelp`).
- **Installation:** Guild Install · Discord Provided Link · scopes `bot` + `applications.commands`.
- **Permisos:** View Channels, Send Messages, Send Messages in Threads, Embed Links, Attach Files, Read Message History, Use External Emojis.

## Cómo se calcula la nota
Base 1 punto, máximo 10:
- **Username:** 2c +4 · 3c +3 · 4c +2 · 5c +1 · solo letras +1 · palabra real +1 · números o símbolos restan
- **Antigüedad:** ≤2015 +3 · 2016 +2.5 · 2017 +2 · 2018 +1.5 · 2019 +1 · 2020-21 +0.5
- **Badges públicos:** Staff +3 · Partner / Bug Hunter 2 / Early Supporter +2.5 · Bug Hunter / Mod Alumni / Early Bot Dev +1.5 · HypeSquad +1 · Active Dev +0.5 · casas HypeSquad +0.25
- **Extras:** avatar animado +1 · banner +0.75 (animado +0.5) · decoración +0.5 · tag de servidor +0.5 · nameplate +0.5 · booster +0.5 (2+ boosts +0.25) · owner +0.25 · Nitro deducido +0.5

Puedes cambiar los puntos en `src/lib/analyzer.js` y las frases de la nota en `src/lib/notes.js`.

> La descripción / "About me" **no** la da la API de Discord a los bots, por eso no se analiza.

## Estructura
```
src/
  index.js            arranque del bot, botón Help y !AirHelp
  deploy-commands.js  registra los slash commands (opcional, el bot lo hace solo al arrancar)
  config.js           versión y ajustes
  commands/           setup, flex, random, help, ping, version, debug
  lib/
    analyzer.js       reglas y puntuación
    notes.js          frases de la nota (es/en)
    card.js           dibuja la tarjeta PNG
    profile.js        junta todo lo que Discord deja ver sobre un usuario
    flexRunner.js     lógica compartida de /flex y /random (Components V2)
    setupFlow.js      flujo de /setup con Components V2
    ui.js             helpers de Components V2 (contenedor, separador, pie)
    i18n.js           textos en español e inglés
    storage.js        guarda idioma y canal por servidor (data/guilds.json o MongoDB)
    help.js           /help como contenedor V2
assets/fonts/         fuente Poppins (para que la tarjeta se vea igual en cualquier PC/servidor)
```

## Hosting gratis 24/7 (Render + cron-job.org + MongoDB Atlas)
1. **MongoDB Atlas** (mongodb.com/atlas): crea un cluster **M0 Free** → *Database Access*: crea usuario y clave → *Network Access*: añade `0.0.0.0/0` → *Connect → Drivers*: copia el link `mongodb+srv://...` (cambia `<password>` por tu clave).
2. **GitHub**: sube la carpeta a un repo (el `.gitignore` ya evita subir `.env` y `node_modules`).
3. **Render** (render.com): *New → Web Service* → conecta el repo → plan **Free**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `DISCORD_TOKEN`, `CLIENT_ID`, `MONGODB_URI`
4. **cron-job.org**: crea un cronjob que visite tu URL de Render (`https://tu-bot.onrender.com`) **cada 10 minutos**. Así Render nunca lo duerme.

Render Free da 750 horas al mes, suficiente para tener 1 servicio prendido todo el mes.

## Depurar badges
- `/debug @user` (admins) muestra los `public_flags` crudos y qué detectó el bot.
- `AIRFLEX_DEBUG=1` en Render imprime en los logs los datos de cada `/flex`.
- Cuando sacan al bot de un servidor, su configuración se borra sola.
