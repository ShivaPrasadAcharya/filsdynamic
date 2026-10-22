# filsdynamic

A browser-local editor for formatting Nepali court judgment drafts. Open DOCX, DOC, RTF or TXT, select words or paragraphs directly in the live preview, apply formatting, and download an editable DOCX.

## Use

1. Open or drop one draft (up to 25 MB). Its document preview appears immediately.
2. Drag to select a word, a line, or several paragraphs. A floating formatting toolbar appears. Click a paragraph to target the entire paragraph. Right-click opens the full menu, with alignment, numbering, hierarchy and indent submenus.
3. Use the toolbar for fonts, size, bold, italic, underline, strike, text colour, highlight and alignment. Ctrl+B/I/U work on the selection. Ctrl+F finds text and selects a match for formatting.
4. Use **Number**, **Main**, **Sub**, or **Promote** for linked paragraph numbering. **Auto-number judgment paragraphs** targets detected body paragraphs and existing numbered paragraphs, excluding tables and headings. Review the selected paragraphs. Recognized typed prefixes are removed automatically when numbering is applied.
5. Adjust paragraph indents, number gap, line spacing and before/after spacing in the right panel. First-line and hanging indents are mutually exclusive. Keep-with-next, keep-lines-together and page-break-before are supported.
6. Copy formatting from one selection and paste it onto another (Ctrl+Alt+C / Ctrl+Alt+V). This copies text and paragraph formatting, while numbering membership is controlled separately. Undo/redo are available.
7. Page setup controls paper size and margins. Defaults are A4, **left 1.5 cm and top/right/bottom 0.5 cm**. Letter, Legal and custom dimensions are available. These are user-requested working defaults, not official court formatting rules.
8. Changes refresh the preview automatically. Download becomes available when the latest version is ready. Download before closing the page; documents are not persisted.

The sample contains fictional formatting text, without actual case facts or legal conclusions.

## Nepali numbering and Fontasy Himali

Numbers form one native Word multilevel list with up to nine levels. Assigning a parent as a subparagraph moves its descendants with it, and later numbers update. Removing a numbered paragraph adjusts following numbers. A subparagraph needs a preceding parent.

Fontasy Himali is the default number font. Its legacy encoding uses ASCII digits for Nepali numeral glyphs and `=` for a full stop. The app therefore writes decimal Word counters and encoded separators when a Himali font is selected. Other number fonts use Unicode Devanagari counters. The mapping is consistent with the `FONTASY_HIMALI_TT` character map in `npttf2utf` 0.3.7; no conversion package is used at runtime.

Install the selected font on the computer opening the Word file. Fonts are not bundled or embedded. The preview uses Unicode Nepali digits unless the operator loads a local Fontasy Himali font through **Load Fontasy Himali font for preview**. That font file stays in the browser. The number font name is customizable to match the installed font's family name.

The number-to-text gap changes the list text tab stop and hanging distance together, keeping the number position stable. The preview uses a measured label width. Word uses its native tab and font metrics, so exact gaps and page breaks may differ slightly between applications.

## Import and preservation

| Input | Behavior |
| --- | --- |
| DOCX | Edits paragraph/run properties in the original OOXML package. Tables, images, headers, footers, footnotes and unrelated package parts are retained. Partial formatting splits text runs while preserving their parent containers and relationships. |
| DOC | Extracts available text locally and creates a DOCX. Original fonts, tables as tables, images and complex layout are not retained. Headers/footers are rebuilt; available notes, comments and text-box text are appended in labeled sections. |
| RTF | Imports supported inline styles, fonts, sizes, colours, alignment and indents. Complex tables, images, lists, stylesheets and pagination may change. |
| TXT | Supports UTF-8 and UTF-16 BOM detection. Each newline becomes a paragraph; empty lines are retained. |

The app formats source wording; it does not rewrite facts, findings, names, dates or amounts. Numbering removes recognized numeric prefixes at paragraph starts. Preeti/Kantipur text is not converted to Unicode. Keep the correct font for legacy text.

Browser pagination is approximate. Complex fields or embedded content can prevent exact word-to-source matching; those paragraphs can still be formatted as a whole. Unsupported nested paragraph structures report an error. Review final pagination and fonts in the intended Word application.

## Privacy

Processing is local to the visitor's browser. Drafts and locally loaded fonts are not uploaded to GitHub, Actions or another server. The source repository contains application code and synthetic fixtures only. There are no runtime CDN scripts, remote font requests, analytics or document API calls. Preview copies strip external relationships and disable altChunk rendering; downloads preserve original source relationships.

## GitHub Pages

The included workflow builds, tests and deploys `_site` on every push to `main`. In repository **Settings → Pages**, choose **GitHub Actions** as the source. The workflow can also be run manually. No processing server or API key is required. Do not commit actual judgment drafts.

## Development

Requires Node 22 and npm:

```sh
npm ci --ignore-scripts
npm run build
npm test
python3 -m http.server 8000 --directory _site
```

Open localhost:8000. Rebuild after source edits. `npm run portable` creates a single-file offline version at `release/filsdynamic_preview.html` after building.

`public/` contains the UI. `src/engine.js` handles import and OOXML helpers; `src/editor.js` handles selections, run splitting, paragraph formatting, numbering, history snapshots and export. `src/vendor.cjs` bundles local dependencies. The build retains a narrow UTF-16 directory-name compatibility fix for the pinned legacy DOC extractor, verified against the actual browser Buffer implementation.

Tests cover import regressions, Unicode preservation, partial formatting, hyperlinks/drawings/tables and unrelated package parts, linked numbering and hierarchy changes, Fontasy encoding, number gaps, special indents, page margins, undo snapshots and preview isolation. Third-party notices are included in the build.
