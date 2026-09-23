# Adding a tool

Written for someone — probably a future session — who has never seen this
repository. Read it end to end before starting; it is short.

## What this repository is

A monorepo of small online tools that support training delivery, mostly
for CISV International. Everything is deployed as **one GitHub Pages site**
with each tool under its own path:

```
https://brunobensadon.github.io/training/                  the index
https://brunobensadon.github.io/training/elc-placement/    tool #1
https://brunobensadon.github.io/training/<your-tool>/      yours
```

There is no server anywhere. Every tool is a static build that does all its
work in the browser.

## Layout

```
apps/
  home/                 the index page at /training/
  elc-placement/        tool #1 — read this one as the worked example
packages/
  ui/                   design tokens, primitives, chrome, language toggle
  i18n/                 locale loading, lookup, parity validation
scripts/
  workspace.mjs         base paths and aliases — the single source of truth
  build-site.mjs        assembles dist-site/ from every app
  serve-site.mjs        serves dist-site/ locally, at the real base path
  service-worker-plugin.mjs   generates an offline precache for an app
tools.config.json       what exists and where it deploys
e2e/                    browser checks
docs/
```

## What `packages/` gives you

**`@training/ui`**

- `styles/index.css` — tokens, reset, typography, layout, components. One
  import and your tool looks like the rest of the body of work.
- `fonts` — self-hosted Spectral and IBM Plex Mono. Import it once from
  your entry point. Never load a font from a CDN; see the privacy rules.
- `el`, `svg`, `clear`, `richText` — a small DOM helper. `richText` renders
  the `**bold**`, `*italic*` and `[label](url)` that locale strings may
  contain, without `innerHTML`.
- `createAnnouncer()` — one polite live region per page, for changes the
  browser will not announce on its own.
- `langToggle`, `siteHeader`, `siteFooter`, `skipLink` — the shared chrome.
- A light and a **derived dark** theme, with every pairing asserted in
  `packages/ui/test/contrast.test.ts`. If you add a colour, add it to the
  tokens and add it to that test.

**`@training/i18n`**

- `createTranslator(locale, messages)` → `t('some.key', { n: 2 })` for
  strings and `raw<T>('some.key')` for structured data.
- `resolveLocale(...)` — URL, then `bb-lang`, then browser, then default.
- `buildBundles(files)` — turns `locales/<locale>/<namespace>.json` into
  bundles.
- `localeParity` (the `@training/i18n/vite` export) — **a Vite plugin that
  fails your build if locale files drift.** Use it. It is what makes
  "adding a locale is one file and a pull request" true.

## The steps

### 1. Add an entry to `tools.config.json`

```jsonc
{
  "id": "my-tool",                    // the URL path segment
  "workspace": "@training/my-tool",
  "dir": "apps/my-tool",
  "status": "live",
  "name":    { "en": "…", "pt-BR": "…" },
  "summary": { "en": "…", "pt-BR": "…" },
  "meta":    { "en": "…", "pt-BR": "…" }
}
```

This is all the index page and the build script need. Neither knows any
tool by name.

### 2. Create the workspace

```
apps/my-tool/
  package.json          name "@training/my-tool", deps on @training/ui and @training/i18n
  index.html            entry, <script type="module" src="/src/main.ts">
  vite.config.ts        copy apps/elc-placement/vite.config.ts and change TOOL_ID
  src/main.ts
  locales/en/ui.json
  locales/pt-BR/ui.json
  test/
```

Then `npm install` from the repository root to link the workspace.

### 3. The base path — do not hardcode it

```ts
import { aliasEntries, viteBase } from '../../scripts/workspace.mjs';

export default defineConfig(({ command }) => ({
  base: viteBase('my-tool', command),   // '/' in dev, '/training/my-tool/' in a build
  resolve: { alias: aliasEntries() },
  // …
}));
```

`viteBase` reads `tools.config.json`. `SITE_BASE` changes the site root
(for a fork served from a differently named repository) and `BASE_PATH`
overrides the whole thing (for a one-off preview). Inside the app, use
`import.meta.env.BASE_URL` rather than writing the path again.

### 4. Offline support, if the tool needs it

```ts
import { serviceWorker } from '../../scripts/service-worker-plugin.mjs';
// plugins: [ serviceWorker({ template: path.join(here, 'src/sw/service-worker.js') }) ]
```

Copy `apps/elc-placement/src/sw/service-worker.js`. The plugin substitutes
the real asset list and a cache name derived from it.

### 5. Add to CI

Nothing to do. `npm run build` walks `tools.config.json`, and typecheck,
lint and tests are repository-wide. If your tool needs browser checks, add
a spec under `e2e/` — it is served from the same assembled site.

### 6. Check it

```bash
npm run dev -w @training/my-tool   # just your tool, at http://localhost:5173/
npm run build                      # the whole site into dist-site/
node scripts/serve-site.mjs        # serve it at the real base path
npm run check                      # typecheck, lint, test, build, browser checks
```

## Rules that are not negotiable

These come from the kind of organisation this serves, not from taste.

1. **No network at runtime.** No backend, no accounts, no analytics, no
   cookies, no third-party requests, no CDN fonts. Everything computes in
   the browser. `e2e/no-network.spec.ts` enforces it and lint restricts
   `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource` and `sendBeacon`.
   If a tool needs to keep something, put it in the **URL fragment** —
   fragments are never sent to a server — on an explicit user action.
2. **Every string in a locale file.** No copy in the source. English and
   Brazilian Portuguese at minimum. The build fails on drift.
3. **WCAG 2.1 AA.** Keyboard operable, visible focus, announced changes,
   colour never the only carrier of meaning, 44px touch targets.
4. **Mobile first.** Most trainees are on phones, some on poor
   connections. Keep the bundle small and test at 360px — `e2e/flow.spec.ts`
   asserts no page scrolls sideways.
5. **If it makes a claim about a person, say what it cannot support.**
   See `apps/elc-placement/ITEMS.md` and the app's "about" screen.

## Candidates for promotion

These live in `apps/elc-placement` and were deliberately **not** extracted,
because extracting on a sample size of one produces abstractions shaped
like one tool. If your tool needs one, move it to `packages/ui` then —
with both callers in front of you.

| In the app | Where | Promote when |
| --- | --- | --- |
| Hash router (`src/router.ts`) | `#/path?key=value`, renders synchronously on navigation | A second tool needs more than one screen. Note the reason it does not use `location.hash =` — see the comment in `src/app.ts`. |
| Step progress pips | `.progress` in `src/app.css` | A second tool has steps. |
| Rank control | `.statement`, `.ranks`, `.rank-option` | A second tool ranks anything. The swap-and-announce behaviour is the valuable part, not the CSS. |
| Result circle | `src/circle.ts` | Probably never — it is specific to this model. The *pattern* worth copying is the text alternative plus a data table beside the figure. |
| Printable card layout | `.card*` in `src/app.css` and the `@media print` block | A second tool has facilitator materials. This one is close to generic already. |
| `richParagraph` / `scoped` | `src/screens/context.ts` | Immediately, if a second tool renders locale prose. |

## Things that will bite you

- **Alias order.** `@training/ui` is a prefix of `@training/ui/fonts`.
  `aliasEntries()` sorts longest-first for exactly this reason; add new
  subpaths to `workspaceAliases` rather than relying on the prefix.
- **`String.replace` takes the first match.** The service worker template
  mentioned its own placeholders in a comment, and the comment got
  substituted instead of the code. The plugin now uses `replaceAll` and
  throws if a placeholder survives.
- **Absolutely positioned children of a centring grid need `inset: 0`.**
  Without offsets they lay out from their static, centred position, so
  `width: 100%` overflows the parent onto whatever is below.
- **Locale namespaces.** `buildBundles` keys by directory and filename, so
  `ui.json` is reachable as `ui.*`. Both apps lift `ui` to the top level;
  copy that if you want `t('intro.title')` rather than `t('ui.intro.title')`.
