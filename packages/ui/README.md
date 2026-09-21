# @training/ui

Design tokens, type and layout primitives, and the shared page chrome for
the tools in this repository.

The visual language is lifted from
[brunobensadon.github.io](https://brunobensadon.github.io) so the tools read
as part of the same body of work. Only the token layer and the primitives
the tools actually use were taken — the source stylesheet's page-specific
motifs (photo gallery, lightbox, frontispiece, the marginal spine) were
left behind.

## Using it

```ts
import '@training/ui/styles/index.css'; // tokens + base + layout + components
import '@training/ui/fonts';            // self-hosted Spectral and IBM Plex Mono
import { el, langToggle, siteHeader, createAnnouncer } from '@training/ui';
```

`styles/index.css` pulls in, in order: `tokens.css`, `base.css`,
`layout.css`, `components.css`. Import a single file if you want less.

## Fonts

The main site loads Spectral and IBM Plex Mono from Google Fonts. These
tools must not make third-party requests at runtime, so `src/fonts.ts`
imports the Latin subsets from `@fontsource/*` and Vite bundles the `.woff2`
files into each app's own assets. The Latin subset covers both English and
Portuguese.

## The dark theme is new work

The source stylesheet has **no dark palette**. It has one warm dark value,
`--dark: #181511`, used for the photo lightbox. The dark theme here is
derived from that rather than inverted to black, so the paper metaphor
survives the switch: this is meant to read as unlit paper, not as a black
screen. `--paper` stays warm (red channel above blue) and never reaches
pure black.

Each dark token is placed to hold roughly the same contrast rank as its
light twin, so a layout that passes in one theme passes in the other. The
accent is the clearest case: 7.8:1 in light, 7.9:1 in dark.

| token | light | on `--paper` | dark | on `--paper` |
| --- | --- | --- | --- | --- |
| `--ink` | `#211e18` | 15.5:1 | `#ece4d3` | 14.4:1 |
| `--ink-soft` | `#4c463b` | 8.7:1 | `#c9bfa9` | 10.0:1 |
| `--muted` | `#6e6650` | 5.3:1 | `#9c927c` | 5.9:1 |
| `--accent` | `#8a2f22` | 7.8:1 | `#e09a7c` | 7.9:1 |
| `--accent-2` | `#a8462f` | 5.5:1 | `#e6a98d` | 9.0:1 |

Surfaces: light `--paper` `#faf7ef`, `--paper-2` `#f4efe3`, `--paper-3`
`#ece4d3`; dark `#181511`, `#211d17`, `#2b261e`. The worst pairing
introduced anywhere is `--muted` on `--paper-3` at 4.87:1, which still
clears AA for body text.

These numbers are not maintained by hand. `test/contrast.test.ts` parses
`tokens.css`, resolves the cascade, and asserts every pairing — 34
assertions across both themes. Nudge a token and the suite tells you.

### New tokens not present in the source

| token | why it exists |
| --- | --- |
| `--control-edge` | The border that says "you can operate this". WCAG 1.4.11 wants 3:1 for that, and `--rule-strong` (a decorative hairline, ~1.6:1) does not clear it. Resolves to `--muted`: 5.3:1 light, 5.9:1 dark. |
| `--control-fill` / `--control-on-fill` | The selected state of a control, as one pair, so the two themes can swap them together. 15.5:1 light, 14.4:1 dark. |
| `--tap` | Minimum touch target, 44px. Most trainees are on phones. |
| `--paper-2` / `--paper-3` in dark | Raised and recessed surfaces, derived warm. |
| print palette | `@media print` forces a light palette whatever the screen theme is, so a result printed from a dark-mode phone does not arrive as a black rectangle. |

The source's `--margin-w`, `--margin-gap` and the `.spread` grid were not
carried over: none of the tools has marginalia to put in a spine. If a
future tool wants it, take it from the source stylesheet rather than
reinventing it.

## What is deliberately not here

`packages/ui` holds what the first tool needed plus what was asked for by
name. Things that currently live in `apps/elc-placement` and are candidates
for promotion once a second tool wants them are listed in
[docs/ADDING-A-TOOL.md](../../docs/ADDING-A-TOOL.md#candidates-for-promotion).
Extracting on a sample size of one produces abstractions shaped like one
tool.
