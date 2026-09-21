# Decisions

One entry per non-obvious choice: what was decided, why, and what would
make it worth revisiting. Newest section last. Where the brief was silent,
a default was chosen and recorded here rather than left implicit.

---

## Repository and build

### No runtime framework
**What** Plain TypeScript and a small `el()` DOM helper; no React, no Vue.
**Why** The tool is five screens of static content with one stateful
control. A framework would be most of the bundle. 22kB gzipped total
matters when trainees are on hotel wifi in a country with expensive data.
**Reconsider** If tool #3 needs genuinely dynamic state, or if the DOM
helper starts growing conditional rendering. Adding a framework later is
cheap; removing one is not.

### Workspace packages are consumed as TypeScript source
**What** `packages/*` export `.ts` directly; apps resolve them through
Vite/Vitest aliases derived from `scripts/workspace.mjs`.
**Why** No build-order dependency between `packages/` and `apps/`, no stale
`dist`, no watch-mode confusion, one typecheck over everything.
**Reconsider** If a package is ever published to npm.

### `tools.config.json` is the only place a deploy path is written
**What** Site base and per-tool paths come from one file; `SITE_BASE` and
`BASE_PATH` override it.
**Why** The brief asked for the base not to be hardcoded in three places.
It is read by the Vite configs, the site assembler, the local server and
the index page, so a fork or a rename is one edit.
**Reconsider** Nothing yet.

### The site index is an app, not a static HTML file
**What** `apps/home` is a Vite app like any tool.
**Why** It gets the tokens, the fonts, the language toggle and the
base-path convention for free, and it proves the multi-app assembly works
with more than one app before tool #2 exists.
**Reconsider** If it never grows past a list, a hand-written page with a
copied stylesheet would be smaller — but it would also be the first place
the design drifts.

### Vite 8 and Vitest 5
**What** Upgraded from the versions first installed.
**Why** The initial install reported five advisories, one critical, all in
the dev toolchain. None of it ships to a browser, but leaving known-bad
dev dependencies in a fresh repository sets the wrong baseline. The
upgrade was clean; `npm audit` reports zero.
**Reconsider** Nothing. CI does not gate on `npm audit` — that turns an
unrelated advisory into a broken build on an unrelated PR.

### `main` was bootstrapped with a minimal commit
**What** The repository was empty, with no branches at all. `main` holds
the licence, readme and ignore rules; everything else arrives on the
feature branch.
**Why** A pull request needs a base. The alternative — making the scaffold
the repository's initial state — would mean none of this was reviewed.
**Reconsider** Nothing.

---

## Internationalisation

### Locale files are split by namespace
**What** `locales/<locale>/{ui,items,facilitator}.json`.
**Why** The brief asks for the items to be reviewable and revisable as a
unit. Separate files make that a file, not a diff hunk. At runtime the
`ui` namespace is lifted to the top so lookups read `intro.title` rather
than `ui.intro.title`; the parity check still runs against the files as
written.
**Reconsider** If a namespace ever collides with a top-level `ui` key the
lift throws, which is the point.

### Parity validation fails the build, and checks more than key sets
**What** Missing keys, keys nothing will render, empty strings, dropped
`{placeholders}`, and type drift.
**Why** "Adding a locale is one file and a pull request" only holds if a
half-finished locale cannot reach production. Empty strings are the
failure mode that looks like success.
**Reconsider** Nothing.

### Language resolution is URL → `bb-lang` → browser → default
**What** The URL wins.
**Why** A trainer sending the Portuguese link to a delegation should not
have it flip to English because of what is in that phone's storage.
**Reconsider** Nothing.

### `bb-lang` is the only thing written to storage, and only on an explicit toggle
**What** Pressing the toggle writes the bare language (`pt`) to the key
the main site uses. Nothing else is ever stored.
**Why** Someone arriving from brunobensadon.github.io in Portuguese should
stay in Portuguese, and going back should keep their choice. A language
preference is not sensitive; an answer is.
**Reconsider** If the tools are ever hosted somewhere unrelated to that
site, this is dead weight.

---

## The instrument

### The scoring band is three points
**What** Quadrants within three points of the top are reported as level.
**Why** Three points is one statement moving one place in three of the six
sets. Below that the ordering says more about which set someone read
carefully than about them. The brief asked for a band and did not set one.
**Reconsider** The first thing to revisit with real data. If a pilot shows
a tighter distribution, the band should widen, not narrow.

### Ties break by canonical quadrant order, and the screen says they are ties
**What** A deterministic secondary sort, plus an explicit "it was close".
**Why** The same answers must always read the same way. A hidden
tie-break would be a claim the instrument cannot support.
**Reconsider** Nothing.

### An axis at zero is a placement, not a rounding problem
**What** Zero on one axis puts you on the line between two quadrants; zero
on both puts you at the centre; all four equal is reported as an even
spread and explicitly not as a failure to answer.
**Why** These happen, and a facilitator has to put the person somewhere on
a taped floor. With six sets the axes move in steps of two, so landing on
zero is common rather than freakish: enumerating the exact joint
distribution over all 24^6 ways of answering puts **23.2% on a line and
1.5% dead centre** under uniform random responding (an upper bound — real
respondents are not random — but in a room of twenty it is several
people). The test in `apps/elc-placement/test/scoring.test.ts` computes
it. The result screen tells each of them where to stand. Note that both
axes can be zero without the quadrants being equal — an activist/theorist
diagonal — and that is a different sentence.
**Reconsider** A seventh set would not remove the problem, only shift it;
an odd number of sets makes exact zeros rarer on both axes. Worth
modelling if a pilot ever shows facilitators struggling with it.

### A saved link encodes ranks per quadrant, not which statement was picked
**What** Six characters, one permutation index per set, plus the items
version.
**Why** It is short enough to read off a screen, and rewording a statement
cannot invalidate an existing link, because the link never referred to the
statement. Only a change of meaning does — hence the version, which
produces a notice rather than a wrong number.
**Reconsider** Nothing.

### Answers live in memory only, until you finish
**What** No localStorage, no sessionStorage, and nothing written to the
fragment until the result screen.
**Why** Writing progress to the fragment would be free privacy-wise and
would survive a reload — but it would put partial answers into the browser
history of what is often a shared training-room laptop. Eight minutes of
work is the price.
**Reconsider** If trainees report losing answers in practice, an explicit
"keep my progress on this device" with a clear warning would be the
smallest change that helps.

### Statement order is shuffled per respondent
**What** Fixed for a sitting, random between sittings.
**Why** With a fixed order the first statement is read most carefully and
the last least. Scoring reads the rank given to each quadrant, so the
shuffle cannot affect a result or a saved link.
**Reconsider** Nothing.

### The three discussion prompts were written here
**What** The brief refers to "the three discussion prompts the session
uses". They were not available to this session, so three were written.
**Why** A facilitator card without prompts is not a facilitator card.
**Reconsider** Replace them with the real ones before this is used. They
are in `locales/<locale>/facilitator.json` and need no code change.

---

## Interface and accessibility

### Ranking is native radio groups, not a fieldset and not drag
**What** One `role="radiogroup"` per statement, labelled by the statement,
containing four native radios. Taking a rank from another statement swaps
rather than blocks, and the swap is announced.
**Why** The brief rules out drag, correctly. Native radios give arrow
keys, tab order, focus rings and screen-reader output without
reimplementation. `role="radiogroup"` rather than `<fieldset>` because a
`<legend>` inside a CSS grid is unreliable across browsers, and the layout
matters more here than the element name.
**Reconsider** Nothing.

### The dark theme is derived, and its contrast is asserted in tests
**What** Built from the source site's warm lightbox dark (`#181511`), with
34 contrast assertions parsed out of `tokens.css`.
**Why** The source has no dark palette, so this is new work and the numbers
in the README would otherwise rot. Each dark token holds roughly the same
contrast rank as its light twin, so a layout that passes in one passes in
the other.
**Reconsider** Nothing.

### There is no theme toggle
**What** The theme follows `prefers-color-scheme`. `[data-theme]` is
supported in CSS but nothing sets it.
**Why** A toggle would need to remember a choice, and the only thing this
app persists is a language. Print forces a light palette regardless, so a
result printed from a dark-mode phone is not a black rectangle.
**Reconsider** If a tool with longer reading ever wants one, the tokens are
already there — it just needs somewhere to keep the preference.

### Fonts are self-hosted, woff2 only
**What** `@font-face` written out by hand against the `@fontsource` files.
**Why** No third-party requests, and `@fontsource`'s own stylesheets also
reference a `.woff` fallback that was being deployed and precached without
any capable browser ever fetching it — about 100kB of a phone's offline
download.
**Reconsider** Nothing.

---

## Offline and the network check

### There is a service worker
**What** A generated worker precaches exactly what the build produced and
refuses cross-origin requests outright.
**Why** The brief asks for the tool to work offline after first load, and a
service worker is the only way to do that. It is also the one place a
third-party request could be added without appearing in the page source,
so the refusal is written into the worker itself.
**Reconsider** Nothing.

### The no-network check was split in two
**What** (1) No cross-origin request, ever. (2) After load, nothing outside
the app's own precache, read from the generated worker rather than
hardcoded.
**Why** The brief asked for "no network requests after load", which the
service worker makes literally false and materially truer: it fetches the
app's own files once so the app never needs the network again. Rather than
quietly relaxing the check, the exception is enumerated. Assertion (1) is
the promise the first screen makes to trainees and has no exceptions.
**Reconsider** If the service worker is dropped, (2) becomes the literal
check the brief asked for and should be tightened to zero requests.

### One browser, two viewports
**What** Chromium, desktop and Pixel 7.
**Why** The brief says not to build a browser grid. The mobile viewport
paid for itself immediately: it found a radio overflowing its label onto
the Next button, a header overflowing a 360px screen, and navigation
rendering a tick late so a fast tap after Next changed the set just left.
**Reconsider** Add WebKit if iOS-specific bugs are ever reported; Safari
is what most CISV trainees will actually use.

---

## Licensing

### Code MIT, content CC BY-SA 4.0
**What** `LICENSE` covers the software. `LICENSE-CONTENT` covers the items
in every language, the interface copy, the facilitator materials and the
prose in `docs/`.
**Why** The code is generic and worth making frictionless to reuse — MIT.
The items are the part that might be handed to CISV International, and
ShareAlike is the term that stops what happened last time: a translated or
revised version stays as free as the original, which is also how volunteer
translation in a federated organisation works in practice. Attribution
keeps provenance attached, which matters for an instrument that must not
be mistaken for a validated one.
**Reconsider** **This needs a human decision before any public
announcement.** CISV may want copyright assigned rather than licensed, or
may prefer a non-commercial term. ShareAlike is also incompatible with
some downstream uses — an organisation wanting to fold the items into a
proprietary training manual could not. That may be exactly the intent, or
it may be a problem; it is not this session's call.
