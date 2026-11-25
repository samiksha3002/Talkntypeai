# Preeti / Shivaji readiness and editor autosave

Inspected locally on 15 November 2026, branch `hotfix/legal-ai-d518052`, base `ac3af845f47673a69d38427e2f28b3d4728f37ac`. Earlier uncommitted KrutiDev, speech and export work is retained. No deployment, database access, font download, dependency installation or customer-document migration was performed.

## Actual font and encoding

The main editor CSS specifies **Times New Roman, Times, serif, 14pt**. A focused browser check confirms that computed default. Installed/browser fallback fonts supply unsupported Devanagari glyphs. Existing autosaves can explicitly restore a different root font. The application does not default to Mangal.

[Microsoft's Mangal documentation](https://learn.microsoft.com/en-us/typography/font-list/mangal) identifies Mangal as a Unicode Devanagari typeface. Unicode/Mangal therefore share a source encoding; changing the Unicode display font is not a legacy conversion.

## Exact Shivaji asset

Read directly from the existing `public/Shivaji01.ttf` name table:

- Family/full/PostScript name: `Shivaji01`; subfamily: `Normal`.
- Version: `Shivaji01 - Shusha - Version 1.5 Sunday 25 May 1997`.
- Copyright string: `Shivaji-Shusha Version 1.5 based Fonts`.
- SHA-256: `b5bfbdebdbf9bebb0a59c9720c0fa823a8847a7280b068aa2cf605aacdb3c7a2`.
- No name-table license or license-URL entry was found. No accompanying redistribution/web/export license was found in the repository.
- OS/2 `fsType = 0x0001`. This is **not** evidence of an unrestricted license: [OpenType's OS/2 specification](https://learn.microsoft.com/en-us/typography/opentype/spec/os2#fstype) reserves bit 0 and discusses early non-interoperable uses of value 1.

No assertion of compatibility with Shivaji02, Shivaji05 or another Shusha version is made. The existing file and stored customer text are unchanged. Existing CSS is retained for compatibility with old saved documents; that retention does not establish web-distribution rights. Obtain the asset owner's permission/evidence before a future release includes or enables it.

## Mapping references inspected

| Reference | Evidence | Why not activated |
| --- | --- | --- |
| [Padma Shivaji](https://raw.githubusercontent.com/pankaj28843/ckeditor-padma/master/padmajs/encodings/Devanagari/Shivaji.js) and [Shusha](https://raw.githubusercontent.com/pankaj28843/ckeditor-padma/master/padmajs/encodings/Devanagari/Shusha.js) | Published source with GPL-2.0-or-later notice; Shivaji01 uses the Shusha processing machinery plus Shivaji mappings. | A source reference, not proof of complete forward/reverse compatibility with the exact local binary. Integration needs reviewed licensing compliance, pinned source, glyph verification and independent Marathi/Hindi fixtures. Code was not copied. |
| [dpr4dhan Preeti implementation](https://raw.githubusercontent.com/dpr4dhan/preeti-to-unicode/main/preeti-to-unicode.js) and its [MIT license](https://raw.githubusercontent.com/dpr4dhan/preeti-to-unicode/main/LICENSE) | Reverse converter naming its upstream mapping sources. | This reverse implementation alone does not establish accurate forward Marathi/Hindi conversion or font-use rights. |
| [Global Policy UnicodeToPreeti](https://github.com/globalpolicy/UnicodeToPreeti), referenced by [preeti-encoder's provenance](https://raw.githubusercontent.com/AarambhaGG/preeti-encoder/main/backend/app/services/preeti_converter.py) | Candidate forward reference; the latter documents cross-checking against npttf2utf. | Claimed Nepali coverage is insufficient evidence for full Marathi/Hindi coverage, particularly ळ and other extended letters. No compatible licensed Preeti asset is present. Do not treat a round trip using two related tables as independent validation. |
| [npttf2utf](https://github.com/casualsnek/npttf2utf) and [license](https://raw.githubusercontent.com/casualsnek/npttf2utf/main/LICENSE) | Separate mapping/processing reference, GPL-3.0. | License obligations must be evaluated before copying; code license does not license a font binary. No code was copied. |

Existing application mappings have no source provenance sufficient to establish accuracy. The Shivaji reverse function delegates to the KrutiDev decoder after substitutions. The Preeti table includes colliding conjunct outputs. Those implementations are not independent known-good references and cannot validate themselves.

## Local behavior

- Both Preeti and Shivaji01 options remain visible but disabled, labelled as Mangal/Unicode source options.
- Frontend conversion, API dispatch (including Mangal aliases and existing reverse paths), capability advertising, PDF/Word export and print fail closed for these unverified fonts. Clear messages retain the existing text; no automatic conversion or rewrite is attempted.
- Earlier KrutiDev selected-run conversion, placeholder protection, formatting, undo/redo, rendering, PDF/Word output and Hindi/Marathi command handling remain enabled.
- Historical Preeti/Shivaji autosaves retain their HTML and font metadata. No migration, reset or deletion is performed. Correct rendering on a device without the necessary licensed font cannot be promised.

## Required before enabling either conversion

1. Obtain the exact font binary and a license permitting the intended commercial web serving, redistribution, rendering and document-output uses. Confirm any embedding rights separately; DOCX font references do not embed a font. Preeti has no binary here; Shivaji needs license evidence for the fingerprint above or a separately identified approved asset.
2. Pin a compatible mapping/algorithm source and satisfy its notices/source-license obligations, or obtain an independently supplied permitted reference. Validate against the exact asset; do not alias KrutiDev, Preeti and Shivaji.
3. Establish independent expected outputs for Hindi/Marathi matras, ि positioning, reph/rakar, half letters, conjuncts, ळ/ऱ/ॲ/ऑ, nukta forms, digits, punctuation, whitespace and line breaks. For characters absent from a font, explicitly reject conversion rather than approximate it.
4. Validate forward/reference outputs and canonical reverse results, then test selected runs, mixed English, fonts, undo/redo, reopen and PDF/Word/print glyphs. Plain Latin text cannot reliably be auto-classified as English versus legacy bytes; explicit font/range identification is required.

No Preeti/Shivaji accuracy or round-trip PASS is claimed in this candidate. Tests verify safe refusal and preservation until these prerequisites are met.

## Autosave implementation and limits

The latest snapshot is staged synchronously in the editor change callback. Debounced writes are flushed on route clicks, unmount, `beforeunload`, `pagehide` and hidden visibility. HTML/font writes are verified; failed writes attempt rollback, retain owner-scoped RAM/session recovery and show NOT SAVED with retry/download. Unread existing storage pauses writes. No initial blank snapshot is automatically persisted. A changed account cannot receive the prior owner's work.

Browser storage is not a server backup or a multi-tab merge protocol. Rollback/session persistence are best effort when storage itself fails. If both local and session storage are unavailable, the download option is the durable recovery path; a hard process/device failure can still lose unflushed RAM work. Browsers may suppress exit prompts or lifecycle callbacks, particularly on mobile/process termination. No unconditional crash-proof guarantee is made. Recovery JSON contains the original HTML and root font metadata for manual recovery; it is not a new automatic import feature.

## Final focused verification

- `node --test tests/h3-autosave.test.mjs tests/h3-font.test.mjs tests/h2-speech.test.mjs tests/m8-exports.test.mjs tests/legacy-font-readiness.test.mjs`: **74 PASS, 0 FAIL**.
- `node --test --test-name-pattern='create, reopen|SPA recovery|recovery retains|quoted fonts|Unicode fixtures' tests/h1-drafts.test.mjs`: **5 PASS, 0 FAIL**. Repositories are in memory; no Mongo connection.
- `node tests/h2h3-browser.verify.mjs --autosave`: **17 PASS, 0 FAIL**. Real route navigation and reload, quota/read failures, retry, recovery JSON, formatting and saved-state honesty.
- `node tests/h2h3-browser.verify.mjs --kruti`: **34 browser PASS, 0 FAIL**, plus **2 export artifact PASS** (DOCX content/font XML and PDF extraction/raster). Includes actual bundled KrutiDev load, mixed Hindi/Marathi, reopen, placeholder/selection/undo and simulated native speech using the production fallback configuration. Preeti/Shivaji refusal is explicit, including print.
- **Total: 132 PASS, 0 FAIL** in final runs. Earlier intermediate failures are excluded: stale expectation messages were updated, Node's synthetic beforeunload event was given the browser's writable returnValue property, and the historical-draft fixture was corrected to flush/unmount before seeding another synthetic draft. The new unmount flush correctly prevented the old seed-before-unmount test arrangement.
- Tests use synthetic documents, isolated Chrome profiles and loopback services; external browser traffic is blocked. No actual microphone or live provider acceptance, desktop Word rendering, hosted integration or hard process-kill acceptance is claimed.

## Exact files changed in this task

Earlier local KrutiDev/speech/export changes and pre-existing Python caches remain separate and retained.

Production source:

- `src/components/Dashboard.jsx`
- `src/Editor/editorAutosave.js`
- `src/Editor/EditorActions.jsx`
- `src/Editor/fontConversion.js`
- `src/Editor/exportModel.js`
- `src/components/Sidebar/FontConvertCard.jsx`
- `routes/fontConvert.js`
- `utils/fontConverterUtils.js`
- `utils/legacyFontSupport.js` (new)

Tests and documentation:

- `tests/h3-autosave.test.mjs`
- `tests/h3-font.test.mjs`
- `tests/m8-exports.test.mjs`
- `tests/h2h3-browser.verify.mjs`
- `tests/fixtures/kruti-editor-browser.jsx`
- `tests/fixtures/editor-autosave-browser.jsx` (new)
- `tests/legacy-font-readiness.test.mjs` (new)
- `docs/legacy-font-readiness.md` (new)
