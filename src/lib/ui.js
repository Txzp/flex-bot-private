// Helpers para Components V2 (contenedores, textos y separadores nativos de Discord).
const { TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

const text = (s) => new TextDisplayBuilder().setContent(s);
const separator = (divider = true, size = SeparatorSpacingSize.Small) => new SeparatorBuilder().setDivider(divider).setSpacing(size);
const footer = (s) => text(`-# ${s}`);

/** Envuelve un contenedor (y filas extra) en un payload listo para reply / update / send / editReply. */
function payload(container, { ephemeral = false, components = [], files = [] } = {}) {
  return {
    components: [container, ...components],
    files,
    flags: ephemeral ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral : MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  };
}

module.exports = { text, separator, footer, payload };
