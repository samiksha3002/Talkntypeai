// Provider finals are discrete utterances, never cumulative document text.
let sequence = 0;
export function speechEvent(input) {
  const event = typeof input === 'string' ? { text: input } : input;
  if (!event || event.isFinal === false || typeof event.text !== 'string' || !event.text.trim()) return null;
  return { ...event, id: event.id || 'speech-' + (++sequence), isFinal: true };
}
export function createSpeechSession(provider, emit) {
  const session = provider + '-' + (++sequence);
  const finalIds = new Set();
  let active = true;
  const deliver = (text, identity) => {
    if (!active || !text?.trim()) return;
    const id = session + ':' + (identity ?? ++sequence);
    if (finalIds.has(id)) return;
    finalIds.add(id);
    emit(speechEvent({ id, text, isFinal: true, provider }));
  };
  return {
    deepgram(data) {
      if (data?.is_final !== true && !(data?.is_final === undefined && data?.speech_final === true)) return;
      const text = data.channel?.alternatives?.[0]?.transcript;
      const identity = Number.isFinite(data.start)
        ? JSON.stringify([data.channel_index || [], data.start, data.duration ?? null]) : undefined;
      deliver(text, identity);
    },
    web(event) {
      for (let i = event.resultIndex || 0; i < (event.results?.length || 0); i++) {
        if (event.results[i]?.isFinal === true) deliver(event.results[i][0]?.transcript, i);
      }
    },
    stop() { active = false; },
  };
}
const commandPairs = [
  ['new paragraph', '\n\n'], ['naya paragraph', '\n\n'], ['navin pariched', '\n\n'],
  ['new line', '\n'], ['nai line', '\n'], ['navin line', '\n'],
  ['question mark', '?'], ['prashnchin', '?'], ['prashnvachak', '?'],
  ['full stop', '.'], ['purna viram', '.'], ['purnaviram', '.'],
  ['exclamation', '!'], ['vismayadibodhak', '!'], ['aashcharyavachak', '!'],
  ['at the rate', '@'], ['et da ret', '@'],
  ['comma', ','], ['alpviram', ','], ['swalpviram', ','],
  ['colon', ':'], ['apurna viram', ':'], ['apurnaviram', ':'],
];
const commands = new Map(commandPairs);
const phrasePattern = [...commands.keys()].sort((a,b)=>b.length-a.length)
  .map(phrase => phrase.split(' ').join('[ \\t]+')).join('|');
const commandPattern = new RegExp('(^|[^\\p{L}\\p{N}\\p{M}_])(' + phrasePattern + ')(?=$|[^\\p{L}\\p{N}\\p{M}_])', 'giu');
export function processSpeech(text) {
  let output = '', cursor = 0, trimNext = false;
  const append = value => { output += trimNext ? value.replace(/^[ \t]+/g, '') : value; trimNext = false; };
  text.replace(commandPattern, (match, boundary, phrase, offset) => {
    append(text.slice(cursor, offset) + boundary);
    const symbol = commands.get(phrase.toLowerCase().replace(/[ \t]+/g, ' '));
    if (/^[\n,.?!:@]/.test(symbol)) output = output.replace(/[ \t]+$/g, '');
    // Providers may punctuate the command itself ("full stop."). Keep that mark once.
    if (!(symbol.length === 1 && /[,.?!:@]/.test(symbol) && text[offset + match.length] === symbol)) output += symbol;
    trimNext = symbol.startsWith('\n');
    cursor = offset + match.length;
    return match;
  });
  append(text.slice(cursor));
  return output.replace(/^[ \t]+|[ \t]+$/g, '');
}
export function insertSpeech(editor, event, fallbackRange) {
  if (!event || event.isFinal === false) return null;
  let text = processSpeech(event.text);
  if (!text) return null;
  const range = editor.getSelection() || fallbackRange || { index: editor.getLength() - 1, length: 0 };
  const index = Math.max(0, Math.min(range.index, editor.getLength() - 1));
  const before = index > 0 ? editor.getText(index - 1, 1) : '';
  const after = editor.getText(index, 1);
  if (before && !/\s/u.test(before) && !/[([{\/"'\u201c\u2018-]$/u.test(before) && !/^[\s.,!?;:)\]}%]/u.test(text)) text = ' ' + text;
  if (after && !/^[\s.,!?;:)\]}%]/u.test(after) && !/\s$/u.test(text)) text += ' ';
  editor.insertText(index, text, editor.getFormat(index, 0), 'user');
  const next = { index: index + text.length, length: 0 };
  editor.setSelection(next.index, 0, 'silent');
  return next;
}
