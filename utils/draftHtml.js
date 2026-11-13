// Canonical, deliberately restricted legal-document HTML. No active content or URLs.
const tags = new Set('p br div span strong b em i u s strike h1 h2 h3 h4 h5 h6 ol ul li blockquote pre code hr table thead tbody tfoot tr th td sup sub'.split(' '));
const voidTags = new Set(['br', 'hr']);
function safeStyle(value) {
  // Decode only quote entities before CSS validation. Keep delimiters/URLs encoded
  // and rejected. The outer style attribute is always double-quoted on output.
  value = value.replace(/&(?:quot|#0*34|#x0*22);/gi, '"')
    .replace(/&(?:apos|#0*39|#x0*27);/gi, "'");
  return value.split(';').map(part => {
    const pos = part.indexOf(':');
    const name = part.slice(0, pos).trim().toLowerCase();
    const v = part.slice(pos + 1).trim();
    if (pos < 0 || !/^[a-zA-Z0-9 #.,%()'"-]+$/.test(v)) return '';
    const rules = {
      'text-align': /^(left|right|center|justify)$/,
      'font-weight': /^(normal|bold|[1-9]00)$/,
      'font-style': /^(normal|italic)$/,
      'text-decoration': /^(none|underline|line-through)$/,
      'font-size': /^([1-9][0-9]?)(px|pt)$/,
      'font-family': /^(?:"[a-zA-Z0-9 -]+"|'[a-zA-Z0-9 -]+'|[a-zA-Z][a-zA-Z0-9 -]*)(?:,\s*(?:"[a-zA-Z0-9 -]+"|'[a-zA-Z0-9 -]+'|[a-zA-Z][a-zA-Z0-9 -]*))*$/,
      'line-height': /^([0-3](\.[0-9]+)?|[1-9][0-9]?(px|pt))$/,
      'color': /^(#[a-fA-F0-9]{3,8}|[a-zA-Z]{1,20}|rgb\([0-9 ,]+\))$/,
      'background-color': /^(#[a-fA-F0-9]{3,8}|[a-zA-Z]{1,20}|rgb\([0-9 ,]+\))$/,
      'margin-left': /^[0-9]{1,3}(px|pt|mm)$/,
      'text-indent': /^[0-9]{1,3}(px|pt|mm)$/,
      'margin-top': /^[0-9]{1,3}(px|pt|mm)$/,
      'margin-bottom': /^[0-9]{1,3}(px|pt|mm)$/,
      'padding-left': /^[0-9]{1,3}(px|pt|mm)$/,
      'width': /^[0-9]{1,3}(px|pt|mm|%)$/,
      'border-collapse': /^(collapse|separate)$/,
      'border': /^[0-9]{1,2}px solid (#[a-fA-F0-9]{3,8}|[a-zA-Z]{1,20})$/,
      'vertical-align': /^(top|middle|bottom|baseline)$/,

    };
    return Object.hasOwn(rules, name) && v.length <= 100 && rules[name].test(v) ? name + ':' + v.replaceAll('"', '&quot;') : '';
  }).filter(Boolean).join(';');
}
export function sanitizeDraftHtml(html) {
  let output = '';
  for (const token of html.match(/<[^>]*>|[^<]+|</g) || []) {
    if (!token.startsWith('<')) { output += token; continue; }
    const match = /^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)\/?\s*>$/.exec(token);
    if (!match || !tags.has(match[2].toLowerCase())) continue;
    const tag = match[2].toLowerCase();
    if (match[1]) { if (!voidTags.has(tag)) output += '</' + tag + '>'; continue; }
    const styleMatch = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(match[3]);
    const style = styleMatch ? safeStyle(styleMatch[1] ?? styleMatch[2]) : '';
    let attributes = '';
    if (['td', 'th'].includes(tag)) {
      for (const name of ['colspan', 'rowspan']) {
        const m = new RegExp('\\s' + name + '\\s*=\\s*[\"\']?([0-9]{1,2})(?=[\"\'\\s/]|$)', 'i').exec(match[3]);
        if (m && Number(m[1]) > 0) attributes += ' ' + name + '="' + Number(m[1]) + '"';
      }
    }
    output += '<' + tag + attributes + (style ? ' style="' + style + '"' : '') + '>';
  }
  return output;
}
