export const templateTitleKey = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase() : '';
// Never substitute a legally different template, such as regular bail for anticipatory bail.
export function findCatalogTemplate(templates, title) {
  const matches = templates.filter(template => /^[a-f0-9]{24}$/i.test(template._id || '') && templateTitleKey(template.title) === templateTitleKey(title));
  return matches.length === 1 ? matches[0] : null;
}
