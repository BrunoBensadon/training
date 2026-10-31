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

### The four preferences are stages of the cycle, at its compass points
**What** Active (experiencing; concrete experience) north, Reflective
(reflecting; reflective observation) east, Theorist (conceptualising;
abstract conceptualisation) south, Pragmatist (experimenting; active
experimentation) west, with the cycle running clockwise. The first
version drew them as the four *quadrants* between two axes (Activist NE,
Reflector NW, Theorist SW, Pragmatist SE) and named the first two
"Activist" and "Reflector".
**Why** Honey & Mumford built their four preferences on the four stages of
Kolb's cycle, not on Kolb's combined styles, which are what the quadrants
are. Kolb's own figure puts concrete experience at the top and reflective
observation on the right. The names follow the CHAEA usage (*Ativo,
Reflexivo, Teórico, Pragmático*), which also removes the political sense of
`Ativista` in Portuguese. Full reasoning in
`docs/reviews/elc-placement-1-evaluation.md`.
**Reconsider** Nothing — this is the model, not a design choice.

### Twelve sets of four, ranked
**What** Forced ranking of four statements, one per preference, in twelve
sets: 48 original statements written to a role × phase blueprint. The
first version had six sets.
**Why** The independent content review
(`docs/reviews/elc-placement-2-content-guide.md`) estimated retest r of
.52–.67 per score at six sets and .68–.80 at twelve — the KLSI's length.
Ranking stays because the question is within-person ("where did *I*
lean"), which ipsative scores answer legitimately; a Likert format would
need norms this tool does not have, and Thurstonian IRT would need
calibration on hundreds of people per language. Expected time is 7–10
minutes on a phone.
**Reconsider** If the pilot's retest r is below .70 for any score, ship
sixteen (the four reserve sets are in `ITEMS.md`).

### Where you stand needs a clear lead
**What** With n sets, τ = ⌈2√n⌉ (7 at twelve) and τ2 = ⌈√n⌉ (4). A single
point only when the top score leads the next by τ. Otherwise, if the top
two lead the third by τ2: on the circle between them when they are
neighbours, in the centre when they are opposites. Otherwise the centre.
The lowest is named, as a question, when it trails the third by τ.
**Why** The first version placed by the signs of two axes built from
*pairs*, which put 22.7% of clear-top random patterns somewhere other than
their top score; ranking Activist first in every set came out "on the line
between Activist and Reflector". A plain highest-score rule (the first
fix) was honest about direction but not about precision: the 3-point band
it used was smaller than the ~4-point standard error of a difference
between two scores. τ is about 1.2 of those errors. In simulation a clear
result moves to a *different* point on retest 2.7–3.9% of the time
(against 30–39% before), and 97–98% land in the same or a neighbouring
position. About a third to two-fifths of people get a single point; the
facilitator card tells trainers to expect that. Under uniform random
answering, exactly 12.6% get a point (the test enumerates all 24^12
patterns), so a point is not something the arithmetic hands out.
**Reconsider** After the pilot: choose the smallest τ with at most 5% of
clear results moving to a different point on retest, per language.

### No tie ever decides a placement
**What** Every placement branch needs a strictly positive gap, so the
preference or pair it names is unique. Equal scores are listed in
canonical order in the table, for display only.
**Why** The same answers must always read the same way, and a hidden
tie-break would be a claim the instrument cannot support.
**Reconsider** Nothing.

### Kolb's two tensions are reported, collapsed, and never place anyone
**What** Active − Theorist and Pragmatist − Reflective, read with the same
margin τ, in a collapsed section under the scores.
**Why** They are part of Kolb's model and worth saying, but independent
factor analyses do not support them as robust bipolar dimensions, and a
balance point placed people less consistently on retest (2.5–4× more
gross disagreements in the review's simulation).
**Reconsider** Nothing.

### A link from an earlier edition is not re-scored
**What** The items version's major number is the edition. A saved link
from an earlier edition shows "made with an earlier version" and the way
back to the start; one from the same edition with different wording is
scored, with a note; one from a later edition is treated as unreadable.
**Why** A 1.x link holds six rankings of statements and a model that no
longer exist. Scoring it under the new model would produce a confident,
wrong result.
**Reconsider** Nothing.

### A saved link encodes ranks per preference, not which statement was picked
**What** One character per set (twelve), one permutation index each, plus
the items version.
**Why** It is short enough to read off a screen, and rewording a statement
cannot invalidate an existing link, because the link never referred to the
statement. Only a change of meaning does — hence the version, which
produces a notice rather than a wrong number (see the entry above on
earlier editions).
**Reconsider** Nothing.

### Answers live in memory only, until you finish
**What** No localStorage, no sessionStorage, and nothing written to the
fragment until the result screen.
**Why** Writing progress to the fragment would be free privacy-wise and
would survive a reload — but it would put partial answers into the browser
history of what is often a shared training-room laptop. Ten minutes of
work is the price.
**Reconsider** If trainees report losing answers in practice, an explicit
"keep my progress on this device" with a clear warning would be the
smallest change that helps.

### Statement order is shuffled per respondent
**What** Fixed for a sitting, random between sittings.
**Why** With a fixed order the first statement is read most carefully and
the last least. Scoring reads the rank given to each preference, so the
shuffle cannot affect a result or a saved link.
**Reconsider** Nothing.

### The three discussion prompts were written here
**What** The brief refers to "the three discussion prompts the session
uses". They were not available to this session, so three were written.
**Why** A facilitator card without prompts is not a facilitator card.
**Reconsider** Replace them with the real ones before this is used. They
are in `locales/<locale>/facilitator.json` and need no code change. (The
first and third were reworded for the cycle's four points by the content
review; the second is unchanged.)

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

### Page loads are network-first; build files are cache-first
**What** The worker fetches the page itself from the network, falling back
to the cached copy when offline or after 3 seconds. The build's files,
whose names carry content hashes, are served from the cache.
**Why** Serving the cached page first meant that after every deploy,
anyone who had opened the tool before got the old version on their next
visit — the new worker installs in the background during that visit —
and the new one only on the visit after. That is how the second edition
of the items looked undeployed on the day it shipped. Network-first shows
the new version on the first load and costs one small request online.
**Reconsider** If the 3-second fallback proves too short on real training
-room connections, raise it; offline behaviour does not depend on it.

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
