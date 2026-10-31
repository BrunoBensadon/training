# The items

Twenty-four statements, six sets of four, one per preference in each set.
The four preferences are the four stages of the learning cycle, at the
compass points of the circle: Active (concrete experience, north),
Reflective (reflective observation, east), Theorist (abstract
conceptualisation, south), Pragmatist (active experimentation, west).
Earlier versions of this file called the first two "Activist" and
"Reflector" and treated all four as quadrants; see
`docs/reviews/elc-placement-1-evaluation.md`.
They live in `locales/<locale>/items.json` and are revised by editing that
file — no code change, no deploy pipeline knowledge required.

This document exists because nobody could approve the items while they were
being written. It says what each one is for, why it was phrased that way,
and which ones I do not trust. **Read the flagged list at the bottom before
using this with a real group.**

## Provenance

Every statement here was written from the behavioural descriptions in the
brief. Nothing was reproduced, adapted, paraphrased or reverse-engineered
from Honey & Mumford's LSQ, from Kolb's LSI/KLSI/KELP, or from the
Felder–Soloman ILS. No item text from any of those instruments was fetched,
read or consulted during this work.

What *is* borrowed is the underlying model — the four stages of Kolb's
experiential learning cycle, and the two bipolar axes that join opposite
stages — which is a published theoretical construct
rather than an instrument. Using the construct does not entitle anyone to
the items somebody else wrote to measure it, which is exactly the mistake
this replaces.

## The test every item had to pass

An item earns its place only if a person could plausibly rank it **last**
without feeling they had admitted to something shameful. "I am a practical
person" fails: everyone agrees, so it measures nothing but willingness to
agree. "I would rather try it and adjust than plan it out first" passes:
ranking it last says you are a planner, which is not a confession.

Concretely, each statement had to be:

1. **Behavioural** — describes what you do in a named situation, not what
   sort of person you are.
2. **Costly in some reading** — every option gives something up. Waiting to
   speak means the moment passes. Improvising means you did not plan.
3. **Situated** — the set names a situation first, so all four statements
   are answers to the same question and ranking them is meaningful.
4. **Translatable** — no idiom, no metaphor, nothing that assumes an
   office, a school system, or a particular culture's meeting manners.

## The sets

Rank labels are 1 = most like me, 4 = least like me. Display order is
shuffled per respondent, so position carries no weight.

### Set 1 — `new-activity`
> A session opens with an activity I have never done before.

| Preference | Statement | Why it passes |
| --- | --- | --- |
| Active | I join in straight away and work out what is going on while doing it. | Behavioural, and the cost is visible: you are acting without knowing. Distinguishes the appetite for action from the appetite for preparation. |
| Reflective | I wait and watch how the first people handle it. | Names the actual behaviour — hanging back — rather than "I am observant". Ranking it first means admitting you let others go first. |
| Theorist | I want to be told what the activity is for before it starts. | Reads as either rigour or as obstructing the start, which is the balance we want. Directly on the "uncomfortable with activities lacking a stated purpose" anchor. |
| Pragmatist | I want to know what I will be able to do with it afterwards. | Separates cleanly from the Theorist item: purpose-before versus use-after. Not flattering; it can read as refusing to play. |

### Set 2 — `group-discussion`
> The group is discussing an idea and I have something to say.

| Preference | Statement | Why it passes |
| --- | --- | --- |
| Active | I start talking before the thought is finished and shape it as I go. | An honest description of thinking out loud, including that it is unfinished. Nobody ranks this first to look good. |
| Reflective | I wait until I have worked out what I think, even if the moment passes. | The clause after the comma is the cost, and it is what makes this an item rather than a compliment. |
| Theorist | I try to connect what people are saying into one explanation before adding to it. | Integration into a system, in the one situation where it visibly slows you down. |
| Pragmatist | I ask for an example of the idea being used with a real group. | Testing ideas against practice, phrased as the thing you say rather than the trait you have. |

### Set 3 — `reading-beforehand`
> I am sent something to read before a session.

| Preference | Statement | Why it passes |
| --- | --- | --- |
| Active | I read it quickly and rely on the session itself. | Behavioural and plainly costly. See the flag below — this set is the weakest of the six on desirability balance. |
| Reflective | I read all of it and write notes, even when there is more than I need. | "Even when there is more than I need" was added specifically to put a cost on an otherwise purely virtuous item. |
| Theorist | I look for the reasoning behind what the text claims. | Reading for the argument rather than the instructions. |
| Pragmatist | I look for the parts I can use and leave the rest. | Selective and unapologetic about it. |

### Set 4 — `after-a-session`
> A session I took part in has just ended.

| Preference | Statement | Why it passes |
| --- | --- | --- |
| Active | I am already thinking about the next thing to do. | Forward momentum with the implication that you have not processed what just happened. |
| Reflective | I go back over what happened before I decide what I think of it. | Suspending judgement, which costs time and can read as indecision. |
| Theorist | I try to fit what happened into what I already thought about the subject. | Deliberately phrased to expose assimilation — fitting the new into the old — rather than flattering "I reflect deeply". |
| Pragmatist | I choose one thing to do differently the next time I run a session. | The Monday-morning appetite, without the workplace metaphor. |

### Set 5 — `plan-changes`
> The plan has to change with very little warning.

| Preference | Statement | Why it passes |
| --- | --- | --- |
| Active | I improvise and find out what works while it is happening. | Energised by novelty, in the situation where that is genuinely useful — this set is where the Active items are least penalised. |
| Reflective | I want a few minutes to think before I say anything. | Wanting time, in the one situation where time is what you do not have. |
| Theorist | I want to understand why the change is needed before I agree to it. | "Before I agree to it" makes the cost explicit: this is the item that can read as obstruction. |
| Pragmatist | I look for the option that works with the people and the time we have now. | Constraint-driven and immediate. |

### Set 6 — `new-method`
> Someone shows me a method I might use in my own sessions.

| Preference | Statement | Why it passes |
| --- | --- | --- |
| Active | I would rather try it and adjust it than plan it out first. | The brief's own example of a working item. |
| Reflective | I would rather watch someone else use it a few times first. | Distance before commitment; the cost is that you have not started. |
| Theorist | I would rather understand the thinking it comes from first. | Wanting the model before the technique. |
| Pragmatist | I would rather be given the steps so that I can use it at once. | Usable form over rationale — the direct opposite of the Theorist item in the same set. |

## What I do not trust

Flagged items are cheaper than bad items, so here is everything I am
unsure about.

### 1. Set 3 is unbalanced on social desirability

`reading-beforehand` is the weakest set. "I read all of it and write notes"
is conscientious in a way that "I read it quickly" is not, and the cost
clause I added to the Reflective item does not fully fix that. Forced
ranking suppresses this — you cannot pick both — but it does not remove it.
If one set has to be replaced first, replace this one.

### 2. Active items may be systematically under-ranked

Across all six sets, the Active statements carry more visible cost than
the Theorist ones: acting before understanding reads as careless, wanting
to understand reads as careful. Set 5 is the only set where the Active
item is the socially attractive one. If live data shows Active
consistently lowest across a whole group, suspect the items before
concluding anything about CISV trainers. This is a testable prediction and
the first thing a pilot should look at.

### 3. `theorist` / `pragmatist` in Set 1 may not separate

"What is the activity for" and "what will I be able to do with it
afterwards" are close enough that some respondents will read them as the
same question. If item-level data ever exists, this pair is the first place
to look for a failure to discriminate.

### 4. Translation flags

| Item | Concern |
| --- | --- |
| Set 2, Active — "shape it as I go" | The English is near-idiomatic. `vou ajustando enquanto falo` is natural Portuguese but is a rephrasing, not a translation; it makes the adjusting verbal, where the English leaves it ambiguous between the thought and the speech. Watch this one in back-translation. |
| Set 4, Theorist — "what I already thought about the subject" | `no que eu já pensava sobre o assunto` is fine, but "thought" carries a past-continuous sense in English that `pensava` renders well and a simple past would destroy. A future translator working from a different English phrasing could easily get this wrong. |
| ~~Axis label — "Reflective" / "remoendo"~~ | **Resolved.** The axis descriptions were rewritten when the preferences moved to the compass points of the cycle; the processing axis now reads `observando e revendo`, and the flagged `remoendo` is gone. |
| ~~Preference names~~ | **Resolved.** `Ativista` (with its political sense) is replaced by `Ativo`. The names are now Ativo, Reflexivo, Teórico, Pragmático — the usage of the Honey–Alonso CHAEA in Spanish and Portuguese — and Active, Reflective, Theorist, Pragmatist in English. |
| Set 5, Reflective — "before I say anything" | `antes de dizer qualquer coisa` is literal and correct, but in Brazilian Portuguese it can sound more absolute than the English. Low risk. |

### 5. The items have never been seen by a respondent

Nothing here has been piloted. No reliability, no discrimination, no factor
structure — see the "about" screen in the app, which says this to users in
their own language rather than hiding it here. Six items per scale is at
the floor of what could ever produce a stable α, and four of the twenty-four
were written to fill a preference in a set rather than because they were the
best statement available. Those four are Set 1 Pragmatist, Set 3 Theorist,
Set 4 Theorist and Set 6 Reflective.

## Revising an item

1. Edit `locales/en/items.json` and every other locale in the same commit —
   the build fails on key drift, which is deliberate.
2. Update the relevant row above, including the reasoning.
3. If the meaning changed rather than the wording, bump `version` in **all**
   locale item files. Saved result links carry that version, and a link made
   before the change will then say it was made with an earlier version
   instead of quietly reporting the wrong numbers.
4. Follow `docs/CONTRIBUTING-TRANSLATIONS.md` for the translation itself.
