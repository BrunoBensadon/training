# training

Online tools supporting training delivery, mostly for
[CISV International](https://cisv.org) — a peace-education NGO running
volunteer-led leadership training across 60+ countries.

One GitHub Pages site, each tool under its own path.

| | |
| --- | --- |
| Site index | https://brunobensadon.github.io/training/ |
| Tool #1 | https://brunobensadon.github.io/training/elc-placement/ |

## The tools

### `elc-placement` — experiential learning cycle placement

A short reflection tool used before CISV's *Facilitating Learning* session.
Six sets of four statements, ranked 1–4; it reports where you leaned on
two axes of Kolb's experiential learning cycle, so a room of trainers can
see that it contains four different appetites and that a facilitator has
to run all four.

It is **not** a psychometric instrument, has never been validated, and
says so to its users in their own language. See
[`apps/elc-placement/ITEMS.md`](apps/elc-placement/ITEMS.md) for the items
and, more usefully, for which of them I do not trust.

## How it works

- **npm workspaces, TypeScript, Vite.** No runtime framework.
- **No network at runtime.** No backend, accounts, analytics, cookies or
  third-party requests. Fonts are self-hosted. Everything computes in the
  browser; a result is kept, if you ask for it, in the URL fragment, which
  browsers never send to a server. CI asserts this.
- **English and Brazilian Portuguese**, with every string — including
  every assessment item — in a locale file. The build fails if locale
  files drift apart.
- **WCAG 2.1 AA**, mobile first, works offline after the first load.

## Running it

```bash
nvm use                              # Node version from .nvmrc
npm install

npm run dev                          # elc-placement at http://localhost:5173/
npm run dev -w @training/home        # the site index

npm run build                        # the whole site into dist-site/
node scripts/serve-site.mjs          # serve it at the real base path

npm run typecheck
npm run lint
npm test                             # unit tests
npm run test:e2e                     # browser checks (needs: npx playwright install chromium)
npm run check                        # all of the above
```

## Documentation

- [`docs/ADDING-A-TOOL.md`](docs/ADDING-A-TOOL.md) — how to add tool #2.
  Written for someone who has never seen this repository.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — every non-obvious choice, why,
  and what would make it worth revisiting.
- [`docs/CONTRIBUTING-TRANSLATIONS.md`](docs/CONTRIBUTING-TRANSLATIONS.md) —
  adding a language, and why a translated instrument is a new instrument.
- [`packages/ui/README.md`](packages/ui/README.md) — the design tokens and
  the derived dark theme.

## Licence

Split, because the code and the content have different needs:

- **Code** — [MIT](LICENSE).
- **Content** — the assessment items in every language, the interface and
  explanatory copy, the facilitator materials and the prose in `docs/` —
  [CC BY-SA 4.0](LICENSE-CONTENT).

The reasoning is in [`docs/DECISIONS.md`](docs/DECISIONS.md#licensing).
**This split has not been agreed with CISV International and needs a human
decision before any public announcement.**

Nothing here is an official CISV International publication.
