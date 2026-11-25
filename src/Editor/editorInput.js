// Legacy glyph fonts encode Latin bytes as Devanagari. Keep them on document
// runs, never on the editor root or an implicitly inherited typing format.
export function restoreKrutiRootFont(editor, fontFamily) {
  if (!/^['"]?KrutiDev['"]?,\s*sans-serif$/i.test(fontFamily || '')) return false;
  const original = editor.getContents();
  const ops = original.ops.flatMap(op => {
    if (typeof op.insert !== 'string' || op.attributes?.font) return [op];
    return op.insert.split(/(\n)/).filter(Boolean).map(insert => ({
      insert,
      ...(insert === '\n' ? (op.attributes ? { attributes: op.attributes } : {})
        : { attributes: { ...op.attributes, font: 'krutidev' } }),
    }));
  });
  const range = editor.getSelection();
  editor.root.style.fontFamily = '';
  // API source preserves the existing history and does not add a user undo step.
  editor.updateContents(original.diff(new original.constructor(ops)), 'api');
  if (range) editor.setSelection(range, 'silent');
  return true;
}

export function defaultTypingFont(editor, range, source) {
  if (source === 'user' && range?.length === 0 && editor.getFormat(range).font === 'krutidev') {
    // Collapsed formatting changes only the cursor, retaining bold, size, etc.
    // An explicit toolbar font choice can still opt into legacy keyboard input.
    editor.format('font', false, 'silent');
  }
}
