# Contributing a translation

Adding a language is one directory and a pull request. Making that
language *usable* is the rest of this document.

## Read this first: a translated instrument is a new instrument

Translating the twenty-four statements does not produce a Portuguese
version of an English instrument. It produces a **different instrument**
that happens to have been derived from the English one. Nothing measured
in one language transfers to the other. If English ever gets reliability
data, Portuguese still has none.

This is not a formality. Items are behavioural descriptions, and the
behaviours they describe are read through the conventions of a place: what
counts as interrupting, how long a silence is comfortable, whether asking
for the purpose of an activity reads as rigour or as obstruction. An item
can be translated perfectly and still mean something different.

So: never present a translated version as equivalent to the English, and
never pool results across languages.

## The mechanical part

```
apps/elc-placement/locales/
  en/       ui.json  items.json  facilitator.json
  pt-BR/    ui.json  items.json  facilitator.json
  <yours>/  ui.json  items.json  facilitator.json
```

1. Copy the `en` directory to a BCP 47 code — `es`, `fr`, `pt-PT`, `ar`.
2. Translate the values. Leave every key exactly as it is.
3. Keep `{placeholders}` — `{n}`, `{total}`, `{quadrant}` — intact and
   spelled the same. Move them around the sentence freely; word order
   differs between languages and that is the point of having them.
4. Keep the `version` field in `items.json` identical to the other
   locales. It is not a translation version; it records which edition of
   the items a saved result link was made against.
5. Set `meta.langLabel` (two letters for the toggle, e.g. `ES`) and
   `meta.langName` (the language's name in its own language).
6. `npm run build`. The build **fails** on a missing key, an extra key, an
   empty string, a dropped placeholder or a changed type, and prints
   exactly which key in which file.

Inline markup allowed in values: `**bold**`, `*italic*`, and
`[label](https://example.org)`. Nothing else, and no HTML.

Adding a locale needs no code change. If you find yourself editing
TypeScript, something is wrong — say so in the pull request.

## The part that makes it trustworthy

This is the standard procedure for cross-cultural instrument adaptation,
compressed. Do not skip steps 3 and 5; they are the ones that catch real
errors.

### 1. Two independent forward translations

Two translators, working separately, neither seeing the other's work.
Both should be fluent in the target language *and* familiar with CISV
training — someone who has run a session knows what "the plan has to
change with very little warning" actually looks like.

One translator alone produces one translator's reading. The value is
entirely in the disagreement.

### 2. Synthesis

A third person reconciles the two into one version, with the translators
present if possible. Record where they differed and why one reading was
chosen. Those notes belong in the pull request — they are the most useful
thing a future reviewer of that locale can read.

### 3. Review for four kinds of equivalence

Go item by item. For each statement ask:

- **Semantic** — does it mean the same thing?
- **Idiomatic** — does it sound like something a person would say, or like
  a translation? An item that sounds foreign gets ranked lower for reasons
  that have nothing to do with the respondent.
- **Experiential** — does the situation exist for this audience? A set
  about reading material sent before a session assumes material gets sent.
- **Conceptual** — does the underlying idea carry? This is where
  "reflective" and "active" get into trouble: in some languages the nearest
  words carry a judgement the English does not.

Keep the four social-desirability constraints from `ITEMS.md`: each
statement must stay rankable *last* without it feeling like a confession,
and the four statements in a set must stay roughly equally attractive. A
translation can quietly break this by making one option more flattering
than its English original.

### 4. Blind back-translation

A translator who has **not seen the English original** translates your
version back into English. Compare with the source. Differences show you
where meaning moved.

A back-translation that matches the English perfectly is not necessarily
good news — it can mean the forward translation was literal rather than
idiomatic. You are looking for the same *meaning*, not the same words.

### 5. Pilot with about thirty respondents

Thirty is not enough for psychometrics. It is enough to find items that
are confusing, ambiguous, or read as insulting — which is what it is for.
Run it with people like the eventual audience, then ask them:

- Which statements did you have to read twice?
- Were any two statements in the same set saying the same thing to you?
- Did any statement feel like it was criticising you?
- Was any of it hard to rank because none of them, or all of them, fitted?

Fix what comes back, and say in the pull request what you changed.

### 6. Write down what you are unsure about

Add a section to `ITEMS.md` for your locale listing every item you are not
confident in, as the English and Portuguese entries do. Flagged items are
cheaper than bad items. Nobody has ever been criticised for saying which
of their own translations they distrust.

## What a good pull request looks like

- The locale directory, with all three files.
- The two forward translations and the back-translation, as an attachment
  or in the description.
- Notes on where the translators disagreed and how it was resolved.
- What the pilot said, and what you changed as a result.
- Your flagged items, added to `ITEMS.md`.
- A statement of who did the work and what their connection to the
  language and to CISV training is.

If you have done the mechanical part but not the rest, open the pull
request anyway and say so. A translation marked "not yet reviewed, not
piloted" is more useful than no translation, as long as it is marked.
