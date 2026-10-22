# फैसला ढाँचा — filsdynamic

A browser-local formatting tool for Nepali court full-judgment drafts. Open a `.docx`, `.doc`, `.rtf` or `.txt` file, choose required formatting, review the result, and download an editable `.docx`.

## Operator workflow

1. **मस्यौदा खोल्नुहोस्** — click or drop one document, up to 25 MB.
2. **कस्तो ढाँचा आवश्यक छ?** — choose original formatting, the adjustable court preset, or custom settings.
3. Review paragraph roles. Select individual paragraphs when changes should apply to only part of the draft. Choose main-paragraph and subparagraph levels.
4. Apply formatting, review the preview, and download the DOCX. Changing settings disables the previous download until the new settings are applied.

The sample button provides fictional text without actual case facts or legal conclusions.

## Formatting controls

- Keep the original DOCX byte-for-byte, or apply selected changes.
- Font, size, bold, alignment, line spacing, paragraph spacing and first-line indentation.
- Paragraph roles: court/main title, section heading, metadata/parties, body, signature and keep-original.
- Bold centered headings and right-aligned signatures. Signature paragraphs stay with preceding text.
- Editable Word multilevel numbering: `१.`, `१.१.`, `१.१.१.` or English digits; up to nine levels, starting number, optional restart by section, and optional removal of typed number prefixes.
- Original numbering remains the default. Typed numbers are removed only with the explicit option. Headings and table paragraphs are excluded from automatic body numbering.
- A4, Letter and Legal paper with adjustable margins.
- Save and reuse formatting settings in this browser. Document contents are never saved to localStorage.

The court preset uses A4, left margin 27 mm, other margins 20 mm, Mangal 14 pt, 1.5 line spacing, 6 pt after paragraphs, justified body and 16 pt bold centered headings. These are configurable working defaults, not a claim about mandatory official court rules.

## Input support and preservation

| Input | Behavior |
| --- | --- |
| DOCX | Changes the original OOXML package. Unrelated images, headers, footers, tables, footnotes and relationships remain in the package. Table paragraphs default to keep-original. Original mode returns identical source bytes. |
| DOC | Extracts available Unicode text locally and creates a DOCX. Original styling, tables as tables, images and complex layout are not preserved. Headers/footers are rebuilt from extracted text. Available footnotes, endnotes, comments and text-box text are appended in labeled sections. An import notice is displayed. |
| RTF | Imports supported bold, italic, underline, strike, fonts, sizes, colors, indentation and paragraph alignment. Complex tables, images, lists, stylesheets and original pagination are not fully preserved. |
| TXT | UTF-8 and UTF-16 with BOM detection. Each source newline becomes a paragraph; empty lines remain. |

Names, dates, amounts, facts, findings and legal language are not rewritten. Explicit typed-number removal removes recognized number prefixes only.

Preeti/Kantipur fonts are not converted to Unicode; keep the original font or convert the source separately. Fonts must be available on the computer opening the DOCX. Browser pagination is approximate. Office readers may render language-specific numbering and pagination differently. Review the downloaded file in the intended Word application.

## Privacy

All processing happens in the visitor's browser. Drafts are not uploaded to GitHub, GitHub Actions or another server. This repository contains application source and a synthetic test fixture only. There are no runtime CDN scripts, external font requests, analytics or document API calls. Preview copies remove external relationships and disable altChunk rendering; downloads retain original source relationships.

Reloading or closing clears the open document. Download output before leaving. Saved presets contain settings only.

## GitHub Pages deployment

1. Commit the project to `main`.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. The included workflow runs `npm ci`, builds the app, runs preservation/import tests and deploys `_site` with the official Pages Actions.

Every push to `main` redeploys the app. The workflow also supports manual runs. No server, processing secret or API key is required. Do not place actual judgment inputs in the repository.

## Development

Requires Node 22 and npm:

```sh
npm ci --ignore-scripts
npm run build
npm test
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000`. Rebuild after editing `public/` or `src/`. Run `npm run portable` after building for a single-file version at `release/filsdynamic_preview.html` that opens without a server.

`public/` contains the UI, `src/engine.js` handles import/formatting, and `src/vendor.cjs` bundles local dependencies. The build includes a narrow compatibility fix for an odd-byte UTF-16 directory-name read in the pinned Word extractor. The shipped-browser-bundle tests exercise that fix with a synthetic binary DOC fixture.

Tests cover exact original preservation, unchanged wording, tables and unrelated package parts, selected-paragraph isolation, native numbering, explicit prefix replacement, Unicode TXT/RTF, binary DOC, browser Buffer compatibility and preview isolation. Third-party notices are included in the deployed build. The fixture contains no actual case data.
