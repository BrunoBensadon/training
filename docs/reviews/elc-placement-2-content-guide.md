# ELC placement quiz: content review and fix guide

> **Provenance.** Written by an independent reviewer agent, started fresh for
> this task with no access to the owner's earlier sessions, memory or
> preferences, and told to judge the quiz against the published literature
> only. It reviewed commit `1cd74f5` (the tool as first shipped). It was given
> one fixed design input — the cardinal orientation below — and asked to say so
> if the literature disagreed. It did not.
>
> The guide is kept as the reviewer wrote it, apart from file paths, which now
> point at `elc-placement-2-simulations/` (the reviewer's scripts and outputs,
> run with plain `node`). How each recommendation was implemented, and the two
> places the implementation deliberately differs, are recorded in
> [`elc-placement-3-implementation.md`](elc-placement-3-implementation.md).

Reviewed: `apps/elc-placement` at commit `1cd74f5` (items, UI copy, facilitator card, ITEMS.md, model, scoring, circle, result screen, tests, DECISIONS.md "The instrument").
Design input taken as given: the four preferences sit at the cardinal points of the cycle, clockwise: **Active** North (CE), **Reflective** East (RO), **Theorist** South (AC), **Pragmatist** West (AE). pt-BR: Ativo, Reflexivo, Teórico, Pragmático.

**How the evidence was gathered.** I checked the literature with web searches in this session. "Verified" in the reference list means the bibliographic details, and the specific point I rely on, appeared in publisher, repository or index records returned by those searches. The network policy blocked direct downloads (learningfromexperience.com, fhwaapps.fhwa.dot.gov, doi.org, api.crossref.org, ncbi.nlm.nih.gov, api.openalex.org), so I read no full texts. Where only an abstract or a secondary source supported a figure, the reference list says so. All precision figures come from Monte Carlo simulations whose scripts and outputs are in `elc-placement-2-simulations/` (Appendix A).

---

## 1. Executive summary

1. **The headline result can contradict the scores.** The 1cd74f5 code derives the quadrant from the signs of two pair-sum axes. In about 30% of quadrant placements, the quadrant named and the one the person is told to stand in is not the highest-scoring one. I confirmed this with the commit's own `scoring.ts` (F1).
2. **The model's geometry is wrong, and the new cardinal orientation is right.** Honey & Mumford tie each preference to a *stage* of Kolb's cycle. Kolb's own diagram puts CE at the top, RO on the right, AC at the bottom and AE on the left. The 1cd74f5 quadrant model instead treats the four as Kolb's *blended* LSI types, and that mapping has weak empirical support (F2).
3. **The imprecision is mostly structural, not only length.** Six sets give an estimated retest r of .52–.67 per score. The 3-point "close call" band is smaller than one standard error of a difference (about 4 points). Among people told a quadrant with no close-call warning, 30–39% would be told a different quadrant on retest. Even random answering yields a confident quadrant 21% of the time (F3).
4. **Most "Activist" items measure the wrong stage under the cardinal model.** Four of six describe trying, improvising or planning next steps, which is AE (Pragmatist). One Pragmatist item asks for a concrete example, which is CE, and one Theorist item asks about purpose, which is AE (F4).
5. **The about page sets validation criteria that cannot be used on ranked data.** Cronbach's alpha and factor analysis do not apply to ipsative scores. Its claim that "the axes are the better-supported unit" is also unsupported (F5).
6. **Recommended format:** keep forced ranking of four, with **12 sets of 4** (48 new statements, original, in EN and pt-BR), one statement per stage. The sets follow a role (participant/trainer) × phase (before/during/after) blueprint. Write 4 reserve sets for the pilot. Expected completion time is about 8–10 minutes on a phone.
7. **Recommended scoring:** points = 5 − rank. Name a single point only if it leads the next by **τ = ⌈2√n⌉ = 7 points**. Otherwise place the person *between* two neighbouring points, or at the *centre*. In simulation, a clear result moves to a different point on retest only 2.7–3.9% of the time, against 30–39% now. About a third to two-fifths of people get a single point, and the rest are between or centre. That is the honest ceiling for a 10-minute ipsative quiz.
8. **What to change elsewhere:** show the four scores as a kite on the cardinal circle, not a balance-point dot. Rewrite the result, about-page and facilitator copy (full EN and pt-BR text in §3). Pilot with item-sort and desirability ratings, then a field test with 150 people per language and a two-week retest, against the targets in §3H.

---

## 2. Findings (severity-ranked)

### F1. CRITICAL: the result headline and the "stand here" instruction can contradict the person's own scores

*Evidence.* The 1cd74f5 code computes `perceiving = (activist + reflector) − (theorist + pragmatist)` and `processing = (activist + pragmatist) − (reflector + theorist)` (`src/scoring.ts`). It then names the quadrant from the signs of those two sums (`placementFor`). The two sums ignore which single quadrant is highest. I ran the commit's own `scoring.ts` (`elc-placement-2-simulations/app1cd74f5/check.ts`) on these rankings:

```
[[1,3,4,2],[3,1,4,2],[3,2,4,1],[1,3,4,2],[2,3,4,1],[4,2,3,1]]   (activist, reflector, theorist, pragmatist)
→ scores {activist:16, reflector:16, theorist:7, pragmatist:21}
→ placement {kind:"quadrant", quadrant:"activist"}, order[0] = "pragmatist", closeCall = ["pragmatist"]
```

The screen therefore says "Today you leaned towards **Activist**" and "stand in Activist". The table directly below it lists Pragmatist first with a clear 5-point lead, and no close-call panel appears. In simulation, the named quadrant was not the top-scoring quadrant in **29–30%** of quadrant placements, at every signal level (`current-app.txt`).

*Fix.* §3D replaces axis-sign placement with a dominant-preference rule that has an error margin. Under the new rule the headline can never disagree with the scores.

### F2. CRITICAL: the 1cd74f5 geometry maps the preferences onto quadrants; the literature puts them at the stages, which supports the new cardinal orientation

*Evidence.*

- **Honey & Mumford tie each preference to a stage.** In their own cycle, Activist = *having an experience*, Reflector = *reviewing the experience*, Theorist = *concluding from the experience*, Pragmatist = *planning the next steps*. That is a one-to-one mapping to CE, RO, AC and AE. (Confirmed only through secondary descriptions of the LSQ cycle, e.g. the HSCNI and Westminster handouts; marked accordingly in §4.)
- **Kolb's diagram puts those stages at the compass points.** CE is at the top, RO on the right, AC at the bottom and AE on the left. The cycle runs clockwise, with the vertical "grasping" axis CE↔AC and the horizontal "transforming" axis AE↔RO (Kolb 1984/2015; orientation confirmed via secondary reproductions).
- **The owner's cardinal orientation matches this exactly.** The 1cd74f5 diagram mirrors it: active on the right, reflective on the left.
- **Kolb's KLSI 4.0 nine-style grid points the same way** (Kolb & Kolb 2013). It adds "pure" styles (Experiencing, Reflecting, Thinking, Acting) to the old four blends, plus a central Balancing style. The grid splits each dimension into thirds; the cardinal positions of the pure styles follow from that construction rather than from a figure I could inspect. On this reading the cardinal points are the pure stage preferences and the diagonals are the blends.
- **The 1cd74f5 model reads the four preferences as Kolb's blended LSI types** (Activist = CE+AE "Accommodating", Reflector = CE+RO "Diverging", and so on). That correspondence is a secondary-literature convention with weak support. LSQ and LSI II dimensions correlated only **.01–.22** (Sims, Veres & Shake 1989). Goldstein & Bokoros (1992) argued that the axes are not conceptually aligned and compared the two instruments' classifications instead. A 2025 study of LSI, LSQ and a revised LSI found low agreement and concluded the instruments "might be measuring different constructs" (*Journal of Workplace Learning* 37(7/8)).

*What the literature does not support.* Treating the axes as robust bipolar dimensions. Independent factor analyses of the LSQ supported neither Kolb's two bipolar dimensions nor four separate styles (Duff & Duffy 2002). Another analysis suggested three stages: Action, Reflection, Planning (Swailes & Senior 1999; contested by Sadler-Smith 2001). This does not contradict the cardinal orientation. It means placement should rest on the four scores, with the two differences reported only as secondary information.

*Dimensions under the cardinal model.* Kolb's combination scores are **AC−CE** (vertical, positive = South/Theorist) and **AE−RO** (horizontal, positive = West/Pragmatist). With this tool's four scores:

- `y_north = S_active − S_theorist` (= −(AC−CE); positive = towards Active)
- `x_west = S_pragmatist − S_reflective` (= AE−RO; positive = towards Pragmatist)

The 1cd74f5 axes are pair sums, `(A+R)−(T+P)` and `(A+P)−(R+T)`. Those are correct only for the quadrant model, and they must go.

*How to compute and display the result* (details in §3D–F). A simulation compared three summaries:

- the **four-score profile**, drawn as a kite on the cardinal circle;
- the **dominant preference with an error margin**, used for where to stand;
- a Kolb-style **balance point** `(x_west, y_north)`.

The balance point produced **2.5–4×** more gross retest disagreements than the dominant-preference rule: 6.1% vs 1.6–2.3% at 12 sets, moderate signal (`placement-rules.txt`). It also discards one of the three degrees of freedom in four ipsative scores, and it relies on the bipolarity that factor analyses do not support. Use it for neither placement nor the marker.

### F3. HIGH: the result is imprecise, mostly for structural reasons

*Simulation setup* (Appendix A). Each respondent ranks four statements by latent utility = person's preference + statement desirability + noise (a Thurstonian response model). "Moderate" signal (σ = 0.5) and "optimistic" signal (σ = 0.7) bracket plausible values. At 12 sets they give retest r ≈ .68 and .80. Kolb reports average alphas of about .80 for KLSI 3.1 and .81 for KLSI 4.0 (vendor figures), while independent studies report lower and unstable retest and classification stability for the LSI (Sims et al. 1986; Henson & Hwang 2002). The simulation reproduces the author's exact enumeration: 23.4% of random responders land "on a line", against the 23.2% enumerated in DECISIONS.md.

**Current vs recommended design** (moderate / optimistic signal):

| Metric | Current: 6 sets, quadrants, BAND 3 | Recommended: 12 sets, cardinal, τ = 7 |
|---|---|---|
| Retest r of one preference score | .52 / .67 | .68 / .80 |
| Standard error of one score | 2.5 / 2.3 pts (range 6–24) | 3.5 / 3.3 pts (range 12–48) |
| Standard error of a difference between two scores | 4.1 / 3.8 pts | 5.7 / 5.4 pts |
| Margin used to call a lead | 3 pts (≈0.75 SE of a difference) | 7 pts (≈1.25 SE of a difference) |
| Exact tie at the top | 10.9% / 9.9% | 6.3% / 5.1% |
| Headline ≠ highest score | ~30% of quadrant placements | 0% (by construction) |
| Confident placement → a *different* confident placement on retest¹ | 39% / 30% | 3.9% / 2.7% |
| Random responder given a confident placement | 21% | 12% |
| Share given one confident placement | 33% / 39% | 33% / 43% |
| Same floor position on retest | 37% / 46% | 42% / 48% |
| Same or neighbouring position on retest | not defined | 97.7% / 98.2% |

¹ Current: told a quadrant with no close-call warning, then any different quadrant on retest. Recommended: told a `point`, then a `point` at a different preference on retest. Counting any non-neighbouring position on retest under the recommended rule gives 2.3% / 1.8% of all respondents.

What the table shows:

- The 3-point band is smaller than the measurement error it claims to cover.
- The quadrant comes from two signs with no margin at all: an axis of +2 counts as a lean.
- Doubling the length helps (retest r rises about .15), but most of the gain in honesty comes from the margin rule.
- No 10-minute ipsative quiz can place everyone confidently. With four categories, even retest r ≈ .80 gives only about 66% agreement on the single top preference.

### F4. HIGH: the items target the old blended quadrants; under the cardinal model several cross-load

Targets under the cardinal model:

- **Active = CE:** learning through direct, felt involvement, attending to people and the moment.
- **Reflective = RO:** observing, listening, reviewing from several viewpoints before concluding.
- **Theorist = AC:** explanations, principles, models.
- **Pragmatist = AE:** testing and applying, planning concrete changes.

| Set · statement (abridged) | Fits target? | Problem |
|---|---|---|
| 1 Activist "join in straight away and work out… while doing it" | mostly CE | "work out while doing" adds an AE flavour |
| 1 Reflector "wait and watch how the first people handle it" | yes (RO) | — |
| 1 Theorist "want to be told what the activity is for" | **no** | Purpose or goal is AE/Pragmatist content, and passive; the author already flags that it may not separate from the Pragmatist statement |
| 1 Pragmatist "know what I will be able to do with it afterwards" | yes (AE) | Near-duplicate of the Theorist statement |
| 2 Activist "start talking before the thought is finished… shape it as I go" | **no** | Measures extraversion and impulsivity; near-idiom (author flag) |
| 2 Reflector "wait until I have worked out what I think, even if the moment passes" | partly | Introversion; the cost clause makes it less attractive than its neighbours |
| 2 Theorist "connect what people are saying into one explanation" | yes (AC) | "before adding to it" leaks RO |
| 2 Pragmatist "ask for an example of the idea being used with a real group" | **no** | Asking for a concrete example is grasping through the concrete (CE), so it cross-loads onto Active |
| 3 Activist "read it quickly and rely on the session" | **no** | Measures low preparation (conscientiousness); clearly less desirable |
| 3 Reflector "read all of it and write notes" | partly | Measures conscientiousness; highly desirable |
| 3 Theorist "look for the reasoning behind what the text claims" | yes (AC) | Desirable |
| 3 Pragmatist "look for the parts I can use" | yes (AE) | Whole set is confounded by conscientiousness (author's flag 1) |
| 4 Activist "already thinking about the next thing to do" | **no** | Planning the next step is Honey & Mumford's *Pragmatist* stage |
| 4 Reflector "go back over what happened before I decide" | yes (RO) | — |
| 4 Theorist "fit what happened into what I already thought" | weak | Reads as confirming prior views, so it is undesirable; AC is building general explanations, not defending old ones |
| 4 Pragmatist "one thing to do differently the next time I run a session" | yes (AE) | Switches role: the prompt is "a session I *took part* in", the statement is about *running* one |
| 5 Activist "improvise and find out what works" | **no** | Trial and error is AE |
| 5 Reflector "want a few minutes to think" | partly | Penalised by the time-pressure framing |
| 5 Theorist "understand why the change is needed before I agree" | weak | Reads as resistance to change; "before I agree" makes it oppositional |
| 5 Pragmatist "option that works with the people and time we have" | yes (AE) | Most desirable in the set. The whole set measures coping under pressure more than learning |
| 6 Activist "try it and adjust it than plan it out first" | **no** | Experimentation = AE |
| 6 Reflector "watch someone else use it a few times" | yes (RO) | — |
| 6 Theorist "understand the thinking it comes from" | yes (AC) | — |
| 6 Pragmatist "be given the steps so that I can use it at once" | partly | "Be given the steps" is passive and procedural |

Tally: 11 on target, 5 partly, 8 off. Four of six Active statements (sets 2, 4, 5, 6) carry AE or extraversion content. Under cardinal scoring (`y = A − T`, `x = P − R`), Active and Pragmatist would therefore compete on the same content, and the Active score would not represent CE. This matches Swailes & Senior's (1999) "Action" factor, which suggests that LSQ Activist content is itself action-loaded. The items cannot be repaired by re-tagging; they need rewriting to a stage blueprint (§3B–C).

### F5. HIGH: the about page sets the wrong validation criteria and makes an unsupported claim

*Evidence.*

- The about page asks for "α ≥ .70 for each of the four scales" and "the four-factor structure recovered in a factor analysis". With ranked (ipsative) data, every person's scores sum to a constant. Scale intercorrelations are then forced towards −1/(k−1) = −1/3. Alpha and factor analysis are distorted or meaningless, and between-person comparisons are compromised (Hicks 1970; Baron 1996; Meade 2004; Brown & Maydeu-Olivares 2013).
- "The axes are the better-supported unit" has no support for this instrument (F2). Independent analyses do not support Kolb's bipolar dimensions in the LSQ (Duff & Duffy 2002), and Coffield et al. (2004) wrote of Kolb's model that "problems about reliability, validity and the learning cycle continue to dog this model" (quoted via a secondary source).

*Fix.* Use the criteria in §3G and §3H: retest of the four within-person scores, classification stability, statement balance, item-sort agreement, and language equivalence.

### F6. MEDIUM: social desirability and construct-irrelevant content

*Evidence.*

- Set 3 taps conscientiousness, set 5 taps coping under time pressure, and set 2 taps extraversion. These are not learning modes.
- Set 4 mixes roles within a single set.
- The cost clauses are uneven: "even if the moment passes" and "before I agree to it" are costly, while "the option that works" costs nothing. Matching the desirability of statements within a block substantially reduces faking in forced choice; blocks that are not matched behave more like rating scales (Wetzel, Frick & Brown 2021). Forced choice cuts score inflation but does not remove it (Cao & Drasgow 2019).
- Size of the effect (`bias.txt`): if Active statements are only slightly less attractive (utility −0.3, i.e. a mean rank of 2.73 instead of 2.50), the share of people whose top preference is Active falls from 25% to **14–16%**. A shift of −0.1 (mean rank 2.58) already costs 2.6–4.4 percentage points of share. This is the author's own suspicion, flag 2 in ITEMS.md, and it is large enough to matter.

### F7. MEDIUM: naming

- **"Active" at North (CE) collides with Kolb's "Active Experimentation" at West.** Anyone who knows Kolb's terms will read "Active" as AE. Mitigation, without renaming:
  - give each point a stage subtitle in plain words (Active · experiencing; Reflective · reflecting; Theorist · conceptualising; Pragmatist · experimenting);
  - show Kolb's technical terms only on the about page, with the explicit mapping;
  - keep the word "active" out of Pragmatist copy.
- **Parts of speech in EN.** Active and Reflective are adjectives; Theorist and Pragmatist are nouns. In copy, always use the names as labels: "the **Active** point", "you ranked the **Theorist** statements…". The optional alternative "Theoretical/Pragmatic" sounds dismissive and is not recommended.
- **Gender agreement in pt-BR.** Ativo, Reflexivo, Teórico and Pragmático are masculine. Do not attach them to *preferência* or *tendência*, which would force Ativa/Reflexiva. Use **"modo"** (Kolb's own term for the four poles is *learning modes*) or "ponto": "o modo Ativo", "o ponto Ativo".
- **The pt-BR names coincide with the CHAEA's** four styles (Activo/Reflexivo/Teórico/Pragmático in Spanish; ativo/reflexivo/teórico/pragmático in Brazilian studies that use it). That is fine and familiar, but the about page must say the tool is not the CHAEA.
- **Retire "remoendo"** (rumination), which the author already flagged, together with the old axis labels.

### F8. MEDIUM: the evidence copy needs updating and slight correction

- **Pashler et al. (2008)** is described correctly. Keep it.
- **Coffield et al. (2004)** identified 71 models and evaluated **13** influential ones in depth, Kolb's LSI among those with persistent reliability and validity problems. "Reviewed 71… found most had not been properly validated" overstates what was evaluated in depth.
- **Add Clinton-Lisell & Litzinger (2024).** Their meta-analysis found a small pooled benefit of matching, g = 0.31, 95% CI [0.05, 0.57]. Only 26% of outcome measures showed the crossover pattern the hypothesis requires, and the authors judge the benefit too small and infrequent to justify adoption.
- Optionally add Rogowsky, Calhoun & Tallal (2015; 2020), Husmann & O'Loughlin (2019) and Kirschner (2017).
- **Positive rationale.** Kolb & Kolb (2017) present the cycle as a guide for designing learning that moves through all four modes. That is a design heuristic, not a tested effect, and copy should not imply more. Critiques of the cycle model itself (Bergsteiner, Avery & Neumann 2010; Morris 2020; Seaman, Brown & Quay 2017) support presenting it as a heuristic.

### F9. LOW (confirmation): forced ranking is the right format here; Likert and Thurstonian IRT are not, for now

- **The question is within-person.** The use-case asks "which part of the cycle do I lean towards?", and ipsative scores answer within-person comparisons legitimately (Baron 1996).
- **A rating (Likert) format needs norms to mean anything.** The LSQ publisher's own material says the highest raw score "does not necessarily indicate the predominant style" without norms (Talentlens LSQ document). A Likert format also brings acquiescence and extreme responding that vary across cultures (Johnson et al. 2005), which matters for EN vs pt-BR. It shows more desirability inflation (Cao & Drasgow 2019) and produces more ties.
- **Thurstonian IRT** (Brown & Maydeu-Olivares 2011, 2013) would need calibration on several hundred people per language. Even then, with only equally keyed items, measuring up to five traits gives scores that stay partly ipsative (Bürkner, Schulte & Holling 2019); at four traits it would not buy between-person comparability.
- **Most-least picking** (two taps per set) loses a little reliability (r .66 vs .68 at 12 sets) and raises top ties from 6.4% to 10.6% (`format.txt`). Keep full ranking.

### F10. LOW: facilitator card, intro and version notice

- The card's floor layout ("reflective on the left, active on the right"; quadrants) is mirrored relative to Kolb and follows the old model.
- Intro says "6 sets · under 8 minutes".
- The `staleVersion` copy claims old links remain readable "because a saved link records how you ranked the four quadrants". After the model and the items change, version-1 links must not be re-scored (§3E).
- The three discussion prompts were written by the author and use quadrant language (DECISIONS.md says to replace them with the session's real ones).

### F11. LOW: framing that should be kept

Several framings are well supported and should stay:

- "Today you leaned…";
- "a preference, not a diagnosis";
- the refusal to recommend matched teaching;
- the "if someone says it is wrong about them, they are right" caution;
- showing the whole profile.

Kolb now describes learning styles as dynamic states that can flex to the situation (Kolb & Kolb 2013). This is consistent with a same-day, reflective reading of the result.

---

## 3. Recommendations: implementable specification

### A. Model and naming

**A1. Preferences, in canonical order clockwise from North.** Use this order for encoding, display and tie order; never for placement.

| key | EN name | pt-BR name | Stage subtitle EN / pt-BR | Kolb mode (about page only) | Compass | Angle (screen, 0° = East, CCW) |
|---|---|---|---|---|---|---|
| `active` | Active | Ativo | experiencing / vivenciar | Concrete Experience / Experiência Concreta | N | 90° |
| `reflective` | Reflective | Reflexivo | reflecting / refletir | Reflective Observation / Observação Reflexiva | E | 0° |
| `theorist` | Theorist | Teórico | conceptualising / conceituar | Abstract Conceptualisation / Conceituação Abstrata | S | 270° |
| `pragmatist` | Pragmatist | Pragmático | experimenting / experimentar | Active Experimentation / Experimentação Ativa | W | 180° |

**A2. Cycle adjacency** (clockwise): active→reflective→theorist→pragmatist→active. The two **opposite** pairs are active–theorist and reflective–pragmatist.

**A3. Kolb's two dimensions** are reported secondarily, never used for placement: `y_north = S_active − S_theorist` and `x_west = S_pragmatist − S_reflective`.

**A4. Carrier nouns.** EN uses "the **Active** point / statements / part of the cycle". pt-BR uses "o modo **Ativo**" or "o ponto **Ativo**", never "a preferência Ativo".

**A5. Preference descriptions** (`items.json → preferences.<key>`):

| key | EN `description` | pt-BR `description` | EN `where` / pt-BR `where` |
|---|---|---|---|
| active | Learns by being inside the experience: taking part, noticing what it is like, and paying attention to the people and the moment. Can move on before making sense of what happened. | Aprende estando dentro da experiência: participando, percebendo como ela é e prestando atenção às pessoas e ao momento. Pode seguir em frente antes de entender o que aconteceu. | at the top of the circle / no alto do círculo |
| reflective | Learns by watching, listening and going back over what happened from more than one point of view. Can hold back a conclusion or a decision for longer than the group needs. | Aprende observando, escutando e revendo o que aconteceu a partir de mais de um ponto de vista. Pode adiar uma conclusão ou uma decisão por mais tempo do que o grupo precisa. | on the right of the circle / à direita do círculo |
| theorist | Learns by building an explanation: principles, models and how things connect. Can lose sight of the person or the moment that does not fit the model. | Aprende construindo uma explicação: princípios, modelos e como as coisas se conectam. Pode perder de vista a pessoa ou o momento que não se encaixa no modelo. | at the bottom of the circle / embaixo do círculo |
| pragmatist | Learns by putting ideas into practice and planning what to do differently. Can adopt what works quickly without asking whether it is the right thing to do. | Aprende colocando as ideias em prática e planejando o que fazer de outro jeito. Pode adotar rápido o que funciona sem perguntar se é a coisa certa a fazer. | on the left of the circle / à esquerda do círculo |

Each description has one gain and one blind spot of similar weight, so none reads as the "good" answer.

### B. Response format, length and blueprint

**B1. Format.** Forced ranking of four statements per set: 1 = most like me, 4 = least like me, each number once. Keep the per-respondent shuffle of statements within a set. Show the sets in the fixed order of §3C.

**B2. Instruction** (`items.json → instruction`):

- EN: "Rank the four statements from 1 to 4: 1 for the one most like you, 4 for the one least like you. Every number is used once. Think of what you usually do, not what a good trainer should do. There are no better or worse answers."
- pt-BR: "Ordene as quatro afirmações de 1 a 4: 1 para a que mais se parece com você, 4 para a que menos se parece. Cada número é usado uma vez. Pense no que você costuma fazer, e não no que você acha que deveria fazer. Não há respostas melhores ou piores."

The "usually do, not should" sentence is a standard way to reduce desirability responding.

**B3. Length.** Ship **12 sets** (48 statements). Write 4 reserve sets (§3C, R1–R4) for the pilot only.

- **Compared with established instruments:**

  | Instrument | Format | Length |
  |---|---|---|
  | KLSI 3.1 | 12 items × 4 endings, ranked | 12 items |
  | KLSI 4.0 | Adds learning-flexibility items scored with Kendall's W | more than 12 |
  | LSQ | Tick/cross | 80 items, or 40 in the short form |
  | CHAEA | 80 yes/no items, 20 per style | 80 items |

  Twelve ranked sets give 12 forced comparisons per preference. That matches the KLSI's length, in a format that resists desirability better than the yes/no checklists.
- **Expected precision:** see the F3 table. Going to 16 sets raises retest r to .74/.84 and the clear-placement share to 38%/47%. Only adopt 16 if the pilot's 12-set retest r is below .70.
- **Time:** about 60 words per set. Adult silent reading of English non-fiction averages about 238 words per minute (Brysbaert 2019); phone and second-language readers are slower. Allowing 15–25 s for the ranking taps gives about 30–45 s per set, so **7–10 minutes** for 12 sets, and 9–12 minutes for 16.

**B4. Blueprint.**

Role × phase, with 2 shipped sets per cell:

| | Before | During | After |
|---|---|---|---|
| As a participant/learner | S01 new-activity, S07 new-idea | S03 sensitive-discussion, S09 role-play | S05 end-of-event, S11 what-did-you-learn |
| As a trainer/facilitator | S02 new-topic, S08 co-trainer-disagrees | S04 unexpected-reaction, S10 own-mistake | S06 session-ended, S12 written-feedback |
| Reserve (pilot only) | R1 learn-a-method, R2 choose-a-workshop (participant); R3 plan-the-programme (trainer) | R4 watch-a-trainer (participant) | — |

Within each set there is exactly one statement per preference, written to these stage definitions and exclusion rules:

| Tag | Must express | Must NOT contain |
|---|---|---|
| active (CE) | taking part, being in it, noticing what it is like, feelings, people, the moment | trying out, testing, improvising, deciding, planning, next steps (AE) |
| reflective (RO) | watching, listening, reviewing, taking time, several viewpoints before concluding | explanations, principles, models (AC) |
| theorist (AC) | explanation, principle, model, coherence, general cause | purpose or use (AE); watching or waiting (RO) |
| pragmatist (AE) | applying, testing whether it works, concrete change, planning use | asking for examples or stories, feelings (CE) |

Writing rules applied to every statement:

- first person, present tense;
- 9–16 words, within ±4 words of the others in the set;
- the same grammatical frame across the set;
- no evaluative adverbs (*carefully, quickly, clearly*);
- no cost clauses;
- no shared key verb across statements in a set;
- one role per set;
- no idiom; gender-neutral pt-BR.

### C. Draft items (original; EN + pt-BR; tagged)

All statements below were written for this review from the stage definitions above. None is reproduced, paraphrased or adapted from the LSQ, KLSI, KELP, CHAEA, ILS or any other instrument; I did not consult their item texts. Set `version` to `"2.0.0"` in every locale.

**S01 `new-activity`** (participant, before)
EN prompt: A workshop begins with an activity I have never done before. | pt-BR: Uma oficina começa com uma atividade que eu nunca fiz.

| tag | EN | pt-BR |
|---|---|---|
| active | I take part straight away and notice what the experience is like. | Participo desde o início e presto atenção em como é a experiência. |
| reflective | I watch how the first people do it before I join. | Observo como as primeiras pessoas fazem antes de entrar. |
| theorist | I want to understand the idea behind the activity first. | Quero entender primeiro a ideia por trás da atividade. |
| pragmatist | I want to know how I could use this activity with my own groups. | Quero saber como eu poderia usar essa atividade com os meus grupos. |

**S02 `new-topic`** (trainer, before)
EN: I have to prepare a session on a topic that is new to me. | pt-BR: Preciso preparar uma sessão sobre um tema que é novo para mim.

| tag | EN | pt-BR |
|---|---|---|
| active | I start from a personal experience of the topic, or find a way to have one. | Começo por uma experiência pessoal com o tema, ou procuro um jeito de ter uma. |
| reflective | I start by listening to people who see the topic in different ways. | Começo ouvindo pessoas que veem o tema de maneiras diferentes. |
| theorist | I start from the key concepts and how they connect to each other. | Começo pelos conceitos principais e por como eles se ligam entre si. |
| pragmatist | I start from activities on this topic that have worked with other groups. | Começo por atividades sobre o tema que já funcionaram com outros grupos. |

**S03 `sensitive-discussion`** (participant, during)
EN: During a training, my small group starts discussing a sensitive topic. | pt-BR: Durante um treinamento, meu pequeno grupo começa a discutir um tema delicado.

| tag | EN | pt-BR |
|---|---|---|
| active | I say what I feel and respond directly to what others share. | Digo o que sinto e reajo diretamente ao que os outros compartilham. |
| reflective | I listen to everyone first and speak after I have heard the different views. | Escuto todo mundo primeiro e falo depois de ouvir os diferentes pontos de vista. |
| theorist | I try to identify the general principle behind what people are saying. | Tento identificar o princípio geral por trás do que as pessoas estão dizendo. |
| pragmatist | I suggest that the group focuses on what we could do about it. | Proponho que o grupo se concentre no que podemos fazer a respeito. |

**S04 `unexpected-reaction`** (trainer, during)
EN: During a session I am running, the group reacts in a way I did not expect. | pt-BR: Durante uma sessão que estou conduzindo, o grupo reage de um jeito que eu não esperava.

| tag | EN | pt-BR |
|---|---|---|
| active | I stop following the plan and respond to how people are feeling right now. | Paro de seguir o plano e respondo ao que as pessoas estão sentindo agora. |
| reflective | I pause for a moment and observe what is happening before I act. | Faço uma pausa e observo o que está acontecendo antes de agir. |
| theorist | I try to understand what explains the reaction before I change anything. | Tento entender o que explica essa reação antes de mudar qualquer coisa. |
| pragmatist | I switch to a different activity and check whether it works better. | Mudo para outra atividade e verifico se ela funciona melhor. |

**S05 `end-of-event`** (participant, after)
EN: A training event is ending, and I think about what mattered most to me. | pt-BR: Um evento de formação está terminando, e eu penso no que foi mais importante para mim.

| tag | EN | pt-BR |
|---|---|---|
| active | What mattered most were the moments I experienced together with other people. | O mais importante foram os momentos que vivi junto com outras pessoas. |
| reflective | What mattered most was what I noticed by watching and listening to others. | O mais importante foi o que percebi observando e escutando os outros. |
| theorist | What mattered most was understanding why some approaches to learning work. | O mais importante foi entender por que algumas abordagens de aprendizagem funcionam. |
| pragmatist | What mattered most were the tools and plans for my next session. | O mais importante foram as ferramentas e os planos para a minha próxima sessão. |

**S06 `session-ended`** (trainer, after)
EN: A session I ran has just ended. | pt-BR: Uma sessão que eu conduzi acabou de terminar.

| tag | EN | pt-BR |
|---|---|---|
| active | I think most about how the session felt, for me and for the group. | Penso principalmente em como foi viver a sessão, para mim e para o grupo. |
| reflective | I go through the session step by step to see what happened. | Repasso a sessão passo a passo para ver o que aconteceu. |
| theorist | I look for ideas about learning that explain why it went that way. | Procuro ideias sobre aprendizagem que expliquem por que ela foi assim. |
| pragmatist | I decide on one concrete change for the next time I run it. | Decido uma mudança concreta para a próxima vez que eu conduzir essa sessão. |

**S07 `new-idea`** (participant, before)
EN: Someone presents a new idea about how people learn. | pt-BR: Alguém apresenta uma ideia nova sobre como as pessoas aprendem.

| tag | EN | pt-BR |
|---|---|---|
| active | I want to experience the idea in an activity, not only hear it described. | Quero vivenciar a ideia em uma atividade, e não só ouvir alguém descrevê-la. |
| reflective | I want some time to consider it before I form an opinion. | Quero um tempo para pensar antes de formar uma opinião. |
| theorist | I check whether the idea is consistent and well argued. | Verifico se a ideia é coerente e bem fundamentada. |
| pragmatist | I think about whether it would change anything in my next training. | Penso se ela mudaria alguma coisa no meu próximo treinamento. |

**S08 `co-trainer-disagrees`** (trainer, before)
EN: My co-trainer and I disagree about how to run an activity. | pt-BR: Eu e minha dupla de facilitação discordamos sobre como conduzir uma atividade.

| tag | EN | pt-BR |
|---|---|---|
| active | I say how I feel about each option and ask how my co-trainer feels. | Digo como me sinto em relação a cada opção e pergunto como minha dupla se sente. |
| reflective | I ask my co-trainer to explain their view fully and listen before I answer. | Peço que minha dupla explique bem o ponto de vista dela e escuto antes de responder. |
| theorist | I compare both options with what we know about how people learn. | Comparo as duas opções com o que sabemos sobre como as pessoas aprendem. |
| pragmatist | I propose that we try each version once and compare the results. | Proponho testarmos cada versão uma vez e compararmos os resultados. |

**S09 `role-play`** (participant, during)
EN: A training includes a role-play, and I am one of the players. | pt-BR: Um treinamento inclui uma dramatização, e eu sou uma das pessoas que participam.

| tag | EN | pt-BR |
|---|---|---|
| active | I let myself get absorbed in my role and in the situation. | Eu me deixo envolver pelo meu papel e pela situação. |
| reflective | I keep part of my attention on observing how the group behaves. | Mantenho parte da atenção em observar como o grupo se comporta. |
| theorist | I try to identify the general principles the role-play is based on. | Tento identificar os princípios gerais em que a dramatização se baseia. |
| pragmatist | I think about how I would adapt this role-play for my own groups. | Penso em como eu adaptaria essa dramatização para os meus grupos. |

**S10 `own-mistake`** (trainer, during)
EN: I realise that I have made a mistake while facilitating. | pt-BR: Percebo que cometi um erro enquanto facilitava.

| tag | EN | pt-BR |
|---|---|---|
| active | I pay attention to how the mistake affected the people in the room. | Presto atenção em como o erro afetou as pessoas na sala. |
| reflective | Afterwards, I review that moment in my mind before I draw any conclusion. | Depois, volto a pensar naquele momento antes de tirar qualquer conclusão. |
| theorist | I try to understand the general cause behind the mistake. | Tento entender a causa geral por trás do erro. |
| pragmatist | I plan exactly what I will do if the same situation happens again. | Planejo exatamente o que vou fazer se a mesma situação acontecer de novo. |

**S11 `what-did-you-learn`** (participant, after)
EN: Someone close to me asks what I learned at a training weekend. | pt-BR: Uma pessoa próxima me pergunta o que aprendi em um fim de semana de formação.

| tag | EN | pt-BR |
|---|---|---|
| active | I tell them about the moments I experienced and what they were like. | Conto os momentos que vivi e como eles foram. |
| reflective | I describe what I noticed about the group and about myself. | Descrevo o que percebi sobre o grupo e sobre mim. |
| theorist | I explain the main ideas and how they connect. | Explico as ideias principais e como elas se conectam. |
| pragmatist | I show them something I am going to do differently from now on. | Mostro algo que vou fazer de outro jeito a partir de agora. |

**S12 `written-feedback`** (trainer, after)
EN: I receive written feedback from participants about a session I ran. | pt-BR: Recebo comentários escritos dos participantes sobre uma sessão que conduzi.

| tag | EN | pt-BR |
|---|---|---|
| active | I pay most attention to the comments about how people felt. | Presto mais atenção aos comentários sobre como as pessoas se sentiram. |
| reflective | I read all the comments and compare the different points of view in them. | Leio todos os comentários e comparo os diferentes pontos de vista que eles trazem. |
| theorist | I look for a pattern that explains the comments as a whole. | Procuro um padrão que explique os comentários como um todo. |
| pragmatist | I select the comments that point to changes I can make. | Separo os comentários que indicam mudanças que eu posso fazer. |

**Reserve sets (pilot builds only; do not ship before the pilot)**

**R1 `learn-a-method`** (participant, before)
EN: A more experienced trainer offers to teach me a new facilitation method. | pt-BR: Uma pessoa com mais experiência em facilitação se oferece para me ensinar um método novo.

| tag | EN | pt-BR |
|---|---|---|
| active | I ask to experience the method myself as a participant first. | Peço para vivenciar o método primeiro como participante. |
| reflective | I ask to observe them while they use it with a group. | Peço para observar enquanto ela usa o método com um grupo. |
| theorist | I ask them to explain the principles that make the method work. | Peço que ela me explique os princípios que fazem o método funcionar. |
| pragmatist | I ask for the steps so that I can test it in my next session. | Peço os passos para poder testar o método na minha próxima sessão. |

**R2 `choose-a-workshop`** (participant, before)
EN: At a training event, I can join one of four optional workshops. | pt-BR: Em um evento de formação, posso participar de uma entre quatro oficinas opcionais.

| tag | EN | pt-BR |
|---|---|---|
| active | I choose the one where we live through a group experience, such as a simulation game. | Escolho aquela em que vivemos juntos uma experiência em grupo, como um jogo de simulação. |
| reflective | I choose the one where we watch recordings of real sessions and discuss what we noticed. | Escolho aquela em que assistimos a gravações de sessões reais e discutimos o que percebemos. |
| theorist | I choose the one where a speaker presents a learning model and the research behind it. | Escolho aquela em que alguém apresenta um modelo de aprendizagem e a pesquisa por trás dele. |
| pragmatist | I choose the one where we practise a technique and plan how to use it. | Escolho aquela em que praticamos uma técnica e planejamos como usá-la. |

**R3 `plan-the-programme`** (trainer, before)
EN: Our team is planning next year's training programme. | pt-BR: Nossa equipe está planejando o programa de formação do próximo ano.

| tag | EN | pt-BR |
|---|---|---|
| active | I share what participants and trainers experienced in last year's sessions. | Compartilho o que participantes e facilitadores viveram nas sessões do ano passado. |
| reflective | I listen to everyone's views before I give my own. | Escuto a opinião de todo mundo antes de dar a minha. |
| theorist | I propose an overall framework that links all the sessions together. | Proponho uma estrutura geral que conecte todas as sessões entre si. |
| pragmatist | I focus on what we can deliver with the volunteers we have. | Foco no que conseguimos realizar com as pessoas voluntárias que temos. |

**R4 `watch-a-trainer`** (participant, during)
EN: I watch another trainer run a session that is going very well. | pt-BR: Assisto a outra pessoa conduzindo uma sessão que está indo muito bem.

| tag | EN | pt-BR |
|---|---|---|
| active | I let myself take part in the session as if I were in the group. | Entro na sessão como se eu fizesse parte do grupo. |
| reflective | I note what the trainer does at each moment and how the group responds. | Anoto o que a pessoa faz em cada momento e como o grupo responde. |
| theorist | I try to identify the principles that make the session work. | Tento identificar os princípios que fazem a sessão funcionar. |
| pragmatist | I choose techniques that I want to use in my own sessions. | Escolho técnicas que quero usar nas minhas próprias sessões. |

**Translation notes for the pt-BR reviewer** (to confirm in cognitive interviews):

- "dupla de facilitação" is used for co-trainer, to avoid a gendered noun.
- "dramatização" is used for role-play; "jogo de papéis" is an alternative.
- "formação" is used for training *events*, "treinamento" for a single training.
- S09 uses "Eu me deixo envolver" (standard proclisis with the pronoun subject).
- All prompts are gender-neutral; "participantes" works for both genders.

### D. Scoring algorithm

**D1. Input.** `n` sets (n = 12). For each set `b` and preference `p`, a rank `r[b][p]` in {1, 2, 3, 4}, each used once. Keep `assertValidResponses` as it is.

**D2. Scores.**

```
points(rank)  = 5 − rank                        // 1st → 4 … 4th → 1
S[p]          = Σ_b points(r[b][p])             // range n … 4n   (12 … 48)
Σ_p S[p]      = 10n                             // 120, always
mid           = 2.5n                            // 30 = the middle
share u[p]    = (S[p] − n) / (3n)               // 0 … 1, for drawing
```

**D3. Order.** Sort preferences by `S` descending. For display only, break ties by the canonical order (active, reflective, theorist, pragmatist). Write the sorted scores as `s1 ≥ s2 ≥ s3 ≥ s4` and the preferences as `p1…p4`. A tie never decides placement (D5).

**D4. Thresholds** (scale with length; use these exact formulas):

```
τ  = ceil(2 · sqrt(n))     // clear-lead threshold      n=12 → 7   (n=16 → 8, n=6 → 5)
τ2 = ceil(sqrt(n))         // pair-ahead threshold      n=12 → 4   (n=16 → 4, n=6 → 3)
```

Rationale: the standard error of a difference between two preference scores is about 1.65–1.8·√n points (Appendix A). τ is therefore about 1.2 of those errors. At τ, under both signal assumptions, a clear result is a different clear point on retest in at most about 4% of cases. A random responder is given a clear point about 12% of the time. Trade-offs at n = 12:

| τ | Clear share (mod / opt) | Clear → different clear point on retest | Clear point = true top preference |
|---|---|---|---|
| 5 | 50% / 58% | 9.9% / 7.1% | 82% / 89% |
| 6 | 42% / 50% | 6.8% / 4.4% | 85% / 91% |
| **7** | **34% / 43%** | **4.4% / 2.6%** | **87% / 93%** |
| 8 | 27% / 36% | 2.6% / 1.6% | 89% / 94% |

**D5. Placement** (exhaustive and deterministic):

```
L1 = s1 − s2 ;  L2 = s2 − s3 ;  L4 = s3 − s4
if L1 ≥ τ:                         placement = { kind: 'point',    pref: p1 }
else if L2 ≥ τ2 and adjacent(p1,p2): placement = { kind: 'between',  pair: [p1,p2] in cycle order }
else if L2 ≥ τ2:                   placement = { kind: 'opposite', pair: [p1,p2] in canonical order }   // stand at centre
else:                              placement = { kind: 'spread' }                                        // stand at centre
lowest   = (L4 ≥ τ) ? p4 : null
```

`adjacent(a, b)` is true for active–reflective, reflective–theorist, theorist–pragmatist and pragmatist–active.

Why no tie can decide placement:

- `point` needs L1 ≥ 7 > 0, so `p1` is unique.
- `between` and `opposite` need L2 ≥ 4 > 0, so the pair `{p1, p2}` is unique as a set, even when s1 = s2.
- `lowest` needs L4 ≥ 7, so `p4` is unique.

Expected distribution at n = 12 (`recommended-rule.txt`):

| Signal | point | between | opposite | spread | same position on retest | same or neighbouring | gross disagreement |
|---|---|---|---|---|---|---|---|
| Moderate | 33% | 25% | 13% | 29% | 42% | 97.7% | 2.3% |
| Optimistic | 43% | 25% | 13% | 20% | 48% | 98.2% | 1.8% |
| Random | 12% | 18% | 9% | 61% | — | — | 4.1% |

**D6. Kolb's tensions** (secondary text only):

```
y_north = S.active − S.theorist      → "towards Active" if y ≥ τ, "towards Theorist" if y ≤ −τ, else "about even"
x_west  = S.pragmatist − S.reflective → "towards Pragmatist" if x ≥ τ, "towards Reflective" if x ≤ −τ, else "about even"
```

**D7. Remove** from `scoring.ts` and `model.ts`: `QUADRANT_POLES`, the pair constants, `placementFor`, `BAND`, `closeCall`, `axisRange`, and the old quadrant and edge placement kinds. Keep `totalPoints(n) = 10n`.

**D8. Test vectors** (n = 12). Write rankings in the order (active, reflective, theorist, pragmatist).

All nine vectors were checked against a reference implementation of this section (`elc-placement-2-simulations/spec-check.mjs`).

| # | Input | Scores (A, R, T, P) | Expected placement | lowest | tensions (y, x) |
|---|---|---|---|---|---|
| 1 | 12 × (1,2,3,4) | 48, 36, 24, 12 | point active (L1 = 12) | pragmatist | towards Active (+24); towards Reflective (−24) |
| 2 | 3 × each of (1,2,3,4), (2,3,4,1), (3,4,1,2), (4,1,2,3) | 30, 30, 30, 30 | spread | null | even; even |
| 3 | 6 × (1,2,4,3) + 6 × (2,1,3,4) | 42, 42, 18, 18 | between [active, reflective] (L1 = 0, L2 = 24) | null | towards Active; towards Reflective |
| 4 | 6 × (1,3,2,4) + 6 × (2,4,1,3) | 42, 18, 42, 18 | opposite [active, theorist] → stand at centre | null | even; even |
| 5 | `classify` on scores (37, 30, 27, 26) | — | point active (L1 = 7, exactly τ) | null | towards Active; even |
| 6 | `classify` on scores (36, 30, 28, 26) | — | spread (L1 = 6 < 7; L2 = 2 < 4) | null | towards Active; even |
| 7 | `classify` on scores (36, 31, 26, 27) | sorted 36, 31, 27, 26 | between [active, reflective] (L1 = 5; L2 = 4, exactly τ2; adjacent) | null | towards Active; even |
| 8 | `classify` on scores (34, 26, 34, 26) | — | opposite [active, theorist] (L1 = 0; L2 = 8; not adjacent) | null | even; even |
| 9 | the F1 counter-example, scaled to 12 sets: `classify` on (32, 32, 14, 42) | — | point pragmatist (L1 = 10). The headline must name Pragmatist | theorist | towards Active (+18); towards Pragmatist (+10) |

Expose `classify(scores, n)` separately from `scoreResponses` so that vectors 5–9 can be tested on scores directly. Also test that for every one of the 24 single-set permutations repeated 12 times, the placement is `point` at the preference ranked first, and `lowest` is the one ranked last.

### E. Result-screen content

**E1. Order of the screen:**

1. kicker, title
2. disclaimer (keep the current text)
3. **lead sentence** (by placement kind)
4. **where to stand**
5. **lowest** sentence, if any
6. **margin note**
7. diagram (§F)
8. four-score table
9. Kolb's two tensions (collapsible, secondary)
10. save section

Never show a single preference in the lead unless `kind = point`.

**E2. Strings** (`ui.json → result.*`; replace `leanedQuadrant`, `leanedEdge`, `leanedCentre`, `leanedBalanced`, `closeCall*`, `standEdge`, `axes*`).

| key | EN | pt-BR |
|---|---|---|
| leanPoint | Across the twelve sets you ranked the **{name}** statements above the others by a clear margin: {lead} points ahead of the next. | Nos doze conjuntos, você colocou as afirmações do modo **{name}** acima das outras com uma margem clara: {lead} pontos à frente do seguinte. |
| leanBetween | Two neighbouring parts of the cycle came out ahead of the other two, close to each other: **{first}** and **{second}**. | Duas partes vizinhas do ciclo ficaram à frente das outras duas, próximas entre si: **{first}** e **{second}**. |
| leanOpposite | Two opposite parts of the cycle came out ahead of the other two, close to each other: **{first}** and **{second}**. | Duas partes opostas do ciclo ficaram à frente das outras duas, próximas entre si: **{first}** e **{second}**. |
| leanSpread | No part of the cycle came out clearly ahead today. Your first choices changed from situation to situation. That is a result, not a failure to answer. | Hoje nenhuma parte do ciclo ficou claramente à frente. Suas primeiras escolhas mudaram de uma situação para outra. Isso é um resultado, não uma falha em responder. |
| describe | {name} — {stage}: {description} | {name} — {stage}: {description} |
| standPoint | When the session starts, stand at the **{name}** point, {where}. | Quando a sessão começar, fique no ponto **{name}**, {where}. |
| standBetween | When the session starts, stand on the circle halfway between **{first}** and **{second}**. The trainer may ask you to join one of those two groups. | Quando a sessão começar, fique no círculo, no meio do caminho entre **{first}** e **{second}**. Quem facilita pode pedir que você se junte a um desses dois grupos. |
| standOpposite | When the session starts, stand in the centre of the circle, on the line between **{first}** and **{second}**. The trainer may ask you to join one of those two groups. | Quando a sessão começar, fique no centro do círculo, na linha entre **{first}** e **{second}**. Quem facilita pode pedir que você se junte a um desses dois grupos. |
| standSpread | When the session starts, stand in the centre of the circle. The trainer may ask you to join a group that is short of people. | Quando a sessão começar, fique no centro do círculo. Quem facilita pode pedir que você se junte a um grupo com poucas pessoas. |
| lowest | You ranked the **{name}** statements lowest, {gap} points below the next. Is that the part of the cycle you are most likely to skip when you plan a session? | Você colocou as afirmações do modo **{name}** por último, {gap} pontos abaixo da seguinte. Será que essa é a parte do ciclo que você mais tende a pular quando planeja uma sessão? |
| margin | Differences of less than {tau} points are inside this quiz's margin: answering on another day could easily reverse them. A clear result rarely moves to a different part of the cycle on another day, but it often moves to a neighbouring position. | Diferenças menores que {tau} pontos estão dentro da margem deste questionário: respondendo em outro dia, elas poderiam se inverter facilmente. Um resultado claro raramente vai para outra parte do ciclo em outro dia, mas muitas vezes vai para uma posição vizinha. |
| shapeTitle | Your four scores | As suas quatro pontuações |
| shapeLead | Each score runs from {min} (always ranked last) to {max} (always ranked first); {mid} is the middle. The four always add up to {total}, so a high score in one place means lower scores elsewhere. | Cada pontuação vai de {min} (sempre em último) a {max} (sempre em primeiro); {mid} é o meio. As quatro sempre somam {total}, então uma pontuação alta em um lugar significa pontuações mais baixas em outros. |
| colPreference / colStage / colScore | Part of the cycle / Stage / Points | Parte do ciclo / Etapa / Pontos |
| tensionsTitle | Kolb's two tensions | As duas tensões de Kolb |
| tensionsLead | Kolb describes the cycle as two pulls: between experiencing and conceptualising (top and bottom of the circle), and between reflecting and experimenting (right and left). These compare only the two opposite parts, so they can differ from your overall lean. | Kolb descreve o ciclo como duas forças: entre vivenciar e conceituar (alto e baixo do círculo), e entre refletir e experimentar (direita e esquerda). Elas comparam só as duas partes opostas, então podem ser diferentes da sua tendência geral. |
| tensionLean | {a} ↔ {b}: towards **{name}**, by {d} points. | {a} ↔ {b}: na direção de **{name}**, por {d} pontos. |
| tensionEven | {a} ↔ {b}: about even (less than {tau} points apart). | {a} ↔ {b}: praticamente equilibrado (menos de {tau} pontos de diferença). |
| circleTitle | The learning cycle, with your scores and where to stand | O ciclo de aprendizagem, com as suas pontuações e onde ficar |
| circleDesc | The learning cycle drawn as a circle, running clockwise: Active at the top, Reflective on the right, Theorist at the bottom, Pragmatist on the left. The shape inside shows your four scores; the marker shows where to stand. | O ciclo de aprendizagem desenhado como um círculo, no sentido horário: Ativo no alto, Reflexivo à direita, Teórico embaixo, Pragmático à esquerda. A forma interna mostra as suas quatro pontuações; o marcador mostra onde ficar. |
| youAreHere | Stand here | Fique aqui |
| staleVersion | This link was made with version {saved} of the quiz, which used a different model and different statements. Its result cannot be shown in the new form. Answer the twelve sets again to get a result. | Este link foi criado com a versão {saved} do questionário, que usava outro modelo e outras afirmações. O resultado dele não pode ser mostrado no formato novo. Responda os doze conjuntos de novo para ter um resultado. |

**E3. Usage.**

- In `leanPoint`, show `describe` for p1.
- In `between` and `opposite`, show `describe` for both preferences.
- In `spread`, show no `describe`; the table carries the information.
- Use `{tau}` = τ and `{lead}` = L1 in copy, and `{min}`, `{max}`, `{mid}`, `{total}` = n, 4n, 2.5n, 10n.
- In the table, bold the rows of the placement preference(s). In `spread`, bold none.
- Version-1 links show `staleVersion` instead of a result. Do not re-score them.

**E4. Intro copy changes** (`ui.json → intro`):

- lead
  - EN: "Twelve sets of four statements. Rank each set. At the end you will see which part of the experiential learning cycle you leaned towards today — or that you leaned towards two, or none clearly — and where to stand in the circle when the session starts."
  - pt-BR: "Doze conjuntos de quatro afirmações. Ordene cada conjunto. No final você verá para qual parte do ciclo de aprendizagem vivencial você pendeu hoje — ou se pendeu para duas, ou para nenhuma com clareza — e onde ficar no círculo quando a sessão começar."
- timeNote
  - EN: "12 sets · about 10 minutes · works offline"
  - pt-BR: "12 conjuntos · cerca de 10 minutos · funciona offline"
- startOver
  - EN: "Answer the twelve sets"
  - pt-BR: "Responder os doze conjuntos"

### F. Result diagram specification (cardinal orientation)

**F1. Frame.** Square viewBox; centre `(c, c)`; ring radius `R`. Screen angle θ is measured from East, counter-clockwise, with the y axis down: `x = c + d·cos θ`, `y = c − d·sin θ`. The angles are Active 90°, Reflective 0°, Theorist 270° and Pragmatist 180°.

**F2. Ring and direction.**

- One circle at radius R.
- Four small clockwise arrowheads on the ring at 45°, 315°, 225° and 135°. Each points from one stage to the next: Active→Reflective, Reflective→Theorist, Theorist→Pragmatist, Pragmatist→Active.
- No quadrant wedges.
- Optionally, four very faint sectors centred on the cardinal points (θ ± 45°), meaning "this group's area on the floor". The diagonals are the sector boundaries, which is where `between` people stand.

**F3. Labels.** At each cardinal point, just outside the ring, show the **name** (bold), with the **stage subtitle** beneath ("experiencing", "reflecting", "conceptualising", "experimenting"; pt-BR "vivenciar", "refletir", "conceituar", "experimentar"). Do not draw axis pole labels such as "Concrete/Abstract". The two tensions are explained in text (E2).

**F4. Kite** (the four-score profile).

- Vertex for preference p at distance `d_p = R · u[p]` along its angle, with `u[p] = (S[p] − n)/(3n)`. Connect the vertices in cycle order and close the polygon. Use a translucent fill and a solid stroke.
- Draw a dashed reference ring at `d = R/2`, the middle score 2.5n, and label it once ("middle" / "meio").
- Write the numeric score next to each vertex.

**F5. Marker ("Stand here").**

| Placement | Marker position |
|---|---|
| `point` | On the ring at the preference's angle (d = R) |
| `between` | On the ring at the midpoint angle of the pair (45°, 315°, 225°, 135°) |
| `opposite`, `spread` | At the centre (d = 0) |

Use a halo plus a dot (as now) and the label from `youAreHere`. Do not place the marker at the balance point.

**F6. Highlighting.**

| Placement | What to highlight |
|---|---|
| `point` | The point's label |
| `between` / `opposite` | Both labels |
| `spread` | No label |

Colour never carries meaning alone.

**F7. Text alternative** (figcaption). For example: "Active 37, Reflective 30, Theorist 27, Pragmatist 26 (each from 12 to 48; 30 is the middle). Where to stand: at the Active point, at the top of the circle." The text names the placement in the same words as the lead.

### G. About-page and facilitator-card content

**G1. About page** (`ui.json → about`). Delete `what`, `whatWouldItTake`, `evidence`, `citations` and `ip` as they are, and replace them with the following.

- `whatTitle`
  - EN: "What it scores"
  - pt-BR: "O que ele pontua"
- `what`
  - EN: "Twelve sets of four statements, each ranked from 1 (most like you) to 4 (least like you). A first place is worth 4 points and a fourth place 1, added up for each part of the cycle, so each scores between 12 and 48 and the four always total 120. Because you rank rather than rate, the scores compare your own preferences with each other; they say nothing about how strong a preference is compared with other people. The result names one part of the cycle only when it is at least 7 points ahead of the next. Smaller differences are within the margin a quiz of this length can see, and the result then puts you between two parts or in the centre."
  - pt-BR: "Doze conjuntos de quatro afirmações, cada um ordenado de 1 (mais parecida com você) a 4 (menos parecida). Um primeiro lugar vale 4 pontos e um quarto lugar vale 1, somados para cada parte do ciclo, de modo que cada uma fica entre 12 e 48 e as quatro sempre somam 120. Como você ordena em vez de dar notas, as pontuações comparam as suas próprias preferências entre si; não dizem nada sobre a força de uma preferência em comparação com outras pessoas. O resultado só nomeia uma parte do ciclo quando ela está pelo menos 7 pontos à frente da seguinte. Diferenças menores estão dentro da margem que um questionário deste tamanho consegue enxergar, e então o resultado coloca você entre duas partes ou no centro."
- `modelTitle` (new)
  - EN: "The model"
  - pt-BR: "O modelo"
- `model` (new)
  - EN: "Kolb's experiential learning cycle has four stages, which he calls learning modes: concrete experience, reflective observation, abstract conceptualisation and active experimentation. Honey and Mumford later linked one learning preference to each stage. This quiz uses that stage-by-stage reading: Active (experiencing) at the top of the circle, Reflective (reflecting) on the right, Theorist (conceptualising) at the bottom and Pragmatist (experimenting) on the left, in the order the cycle runs. Note that Kolb's 'active experimentation' is the Pragmatist point, not the Active one."
  - pt-BR: "O ciclo de aprendizagem vivencial de Kolb tem quatro etapas, que ele chama de modos de aprendizagem: experiência concreta, observação reflexiva, conceituação abstrata e experimentação ativa. Honey e Mumford depois associaram uma preferência de aprendizagem a cada etapa. Este questionário usa essa leitura etapa por etapa: Ativo (vivenciar) no alto do círculo, Reflexivo (refletir) à direita, Teórico (conceituar) embaixo e Pragmático (experimentar) à esquerda, na ordem em que o ciclo gira. Atenção: a 'experimentação ativa' de Kolb corresponde ao ponto Pragmático, e não ao Ativo."
- `notValidated`: keep.
- `whatWouldItTake` (replace the list)
  - EN:
    1. "Every statement understood as intended in both languages, checked in think-aloud interviews and by trainers who sort the statements into the four parts of the cycle without seeing the names."
    2. "The four statements in each set about equally attractive, so that no part of the cycle wins or loses because its statements sound better."
    3. "Scores that hold up when the same people answer again two to three weeks later: a correlation of at least .70 for each of the four scores, and fewer than 1 in 20 clear results moving to a different part of the cycle."
    4. "All of this checked separately in English and in Portuguese, because a translated questionnaire is a new questionnaire."
  - pt-BR:
    1. "Cada afirmação entendida como pretendido nas duas línguas, verificada em entrevistas em que a pessoa pensa em voz alta e por facilitadores que classificam as afirmações nas quatro partes do ciclo sem ver os nomes."
    2. "As quatro afirmações de cada conjunto igualmente atraentes, para que nenhuma parte do ciclo ganhe ou perca porque as suas afirmações soam melhor."
    3. "Pontuações que se mantêm quando as mesmas pessoas respondem de novo duas a três semanas depois: correlação de pelo menos 0,70 para cada uma das quatro pontuações, e menos de 1 em cada 20 resultados claros mudando para outra parte do ciclo."
    4. "Tudo isso verificado separadamente em inglês e em português, porque um questionário traduzido é um questionário novo."
- `whyNotAlpha` (new, one line)
  - EN: "Two checks often quoted for questionnaires, Cronbach's alpha and factor analysis, do not work on ranked answers like these, because everyone's four scores add up to the same total."
  - pt-BR: "Duas verificações muito citadas para questionários, o alfa de Cronbach e a análise fatorial, não funcionam com respostas ordenadas como estas, porque as quatro pontuações de todo mundo somam o mesmo total."
- `evidence`
  - EN: "Learning-styles research is clear on one point: there is little evidence that teaching people in the style they prefer helps them learn more. A 2024 meta-analysis found a small average advantage for matched teaching, but the pattern the idea depends on appeared in only about a quarter of the outcomes, and its authors conclude that the benefit does not justify the effort. The session uses the cycle differently: as a reminder to plan learning that moves through all four parts, rather than only through the part a trainer enjoys. That is a planning idea, not a measured effect, and this tool claims no more than that."
  - pt-BR: "A pesquisa sobre estilos de aprendizagem é clara num ponto: há pouca evidência de que ensinar as pessoas no estilo que elas preferem as faça aprender mais. Uma meta-análise de 2024 encontrou uma pequena vantagem média para o ensino ajustado ao estilo, mas o padrão de que a ideia depende apareceu em só cerca de um quarto dos resultados, e os autores concluem que o benefício não justifica o esforço. A sessão usa o ciclo de outro jeito: como um lembrete para planejar uma aprendizagem que passe pelas quatro partes, e não só pela parte de que quem facilita gosta. É uma ideia de planejamento, não um efeito medido, e esta ferramenta não afirma mais do que isso."
- `citations` (same in both languages; pt-BR annotations translated)
  - "Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: Concepts and evidence. *Psychological Science in the Public Interest, 9*(3), 105–119. doi:10.1111/j.1539-6053.2009.01038.x — set out what a fair test of matching would have to show and found almost no studies that passed it."
  - "Coffield, F., Moseley, D., Hall, E., & Ecclestone, K. (2004). *Learning styles and pedagogy in post-16 learning: A systematic and critical review.* Learning and Skills Research Centre. — identified 71 models and evaluated 13 influential ones in depth, finding persistent problems with reliability and validity, including in Kolb's inventory."
  - "Clinton-Lisell, V., & Litzinger, C. (2024). Is it really a neuromyth? A meta-analysis of the learning styles matching hypothesis. *Frontiers in Psychology, 15*, 1428732. doi:10.3389/fpsyg.2024.1428732 — small average effect; the required crossover in about a quarter of outcomes."
  - "Kolb, A. Y., & Kolb, D. A. (2017). Experiential learning theory as a guide for experiential educators in higher education. *Experiential Learning & Teaching in Higher Education, 1*(1), article 7. — the cycle as a guide for designing learning."
- `ip`
  - EN: "The statements were written for this tool from descriptions of the four stages of the cycle. None is taken or adapted from Honey and Mumford's Learning Styles Questionnaire, Kolb's Learning Style Inventory or KELP, the Honey–Alonso CHAEA or the Felder–Soloman ILS. The Portuguese names match those used for the CHAEA in Brazil, but this is not the CHAEA, and its scores cannot be compared with any of those instruments."
  - pt-BR: "As afirmações foram escritas para esta ferramenta a partir de descrições das quatro etapas do ciclo. Nenhuma foi tirada ou adaptada do Learning Styles Questionnaire de Honey e Mumford, do Learning Style Inventory ou do KELP de Kolb, do CHAEA de Honey–Alonso ou do ILS de Felder–Soloman. Os nomes em português coincidem com os usados para o CHAEA no Brasil, mas isto não é o CHAEA, e as pontuações não podem ser comparadas com as de nenhum desses instrumentos."
- Delete every mention of "axes", "quadrant" and "the better-supported unit".

**G2. Facilitator card** (`facilitator.json`; EN then pt-BR).

- `quadrantsTitle` → rename the key to `pointsTitle`
  - EN: "The four points of the cycle"
  - pt-BR: "Os quatro pontos do ciclo"
- `pointsLead`
  - EN: "Tape a circle on the floor and mark four points on it. Choose one wall as the top. Put **Active** at the top, **Reflective** on the right, **Theorist** at the bottom and **Pragmatist** on the left: standing in the centre and facing Active, Reflective is on your right. Draw arrows round the circle in that order (Active → Reflective → Theorist → Pragmatist → Active). That is the direction the cycle runs, and it matches the picture on everyone's phone."
  - pt-BR: "Marque um círculo no chão com fita e quatro pontos nele. Escolha uma parede como o alto. Coloque **Ativo** no alto, **Reflexivo** à direita, **Teórico** embaixo e **Pragmático** à esquerda: de pé no centro, olhando para o Ativo, o Reflexivo fica à sua direita. Desenhe setas em volta do círculo nessa ordem (Ativo → Reflexivo → Teórico → Pragmático → Ativo). Esse é o sentido em que o ciclo gira, e é igual à figura no celular de todo mundo."
- `positions` (new)
  - EN: "Each result says where to stand: at one of the four points, on the circle halfway between two neighbouring points, or in the centre. Expect around half the room to be between two points or in the centre. That is deliberate: the quiz names a single point only when the lead is clear."
  - pt-BR: "Cada resultado diz onde ficar: em um dos quatro pontos, no círculo no meio do caminho entre dois pontos vizinhos, ou no centro. Espere que cerca de metade da sala fique entre dois pontos ou no centro. Isso é proposital: o questionário só nomeia um ponto quando a vantagem é clara."
- `prompts`: replace "quadrant" with "point" or "part of the cycle"
  - EN 1: "What does a session feel like when it is run entirely from your point of the cycle? Name what a participant gets from it, and name what they miss."
  - EN 3: "Which part of the cycle do you skip when you plan a session? What would you have to do differently, concretely, to run that part properly?"
  - pt-BR 1: "Como é uma sessão conduzida inteiramente a partir do seu ponto do ciclo? Diga o que um participante ganha com ela, e diga o que ele perde."
  - pt-BR 3: "Qual parte do ciclo você pula quando planeja uma sessão? O que você teria de fazer de diferente, concretamente, para conduzir bem essa parte?"
  - Keep prompt 2. Per DECISIONS.md, replace all three with the session's real prompts when available.
- `lopsidedLead`
  - EN: "Eleven Reflectives and one Active happens…"
  - pt-BR: "Onze Reflexivos e um Ativo acontece…"
  - The rest of the sentence is unchanged.
- `lopsided`: replace the third bullet
  - EN: "**Use the people between points and in the centre.** People halfway between two points join the smaller of their two groups; people in the centre go to the smallest group. Tell them why: they are covering a gap, not being corrected."
  - pt-BR: "**Use as pessoas que ficaram entre pontos e no centro.** Quem está entre dois pontos entra no menor dos seus dois grupos; quem está no centro vai para o menor grupo. Diga por quê: essas pessoas estão cobrindo uma lacuna, não sendo corrigidas."
  - In every other bullet, replace "quadrant" with "point" (pt-BR "quadrante" → "ponto").
- `lopsided`: add a bullet
  - EN: "**Walk the cycle.** If time allows, have each group pass one of its answers clockwise to the next point and ask that group what it would add. It shows the cycle as a sequence, not four camps."
  - pt-BR: "**Percorra o ciclo.** Se houver tempo, peça que cada grupo passe uma das suas respostas no sentido horário para o ponto seguinte e pergunte o que esse grupo acrescentaria. Isso mostra o ciclo como uma sequência, e não como quatro grupos separados."
- `running` (first two lines)
  - EN:
    - "0–10 min — people arrive with a result. Read out the four descriptions; ask people to stand where their result says."
    - "10–15 min — name the shape of the room. Move the people between points and in the centre into groups."
  - pt-BR:
    - "0–10 min — as pessoas chegam com um resultado. Leia em voz alta as quatro descrições; peça que cada pessoa fique onde o resultado indica."
    - "10–15 min — diga em voz alta o formato da sala. Distribua nos grupos as pessoas que estão entre pontos e no centro."
- `sayThis` and `caution`: keep as they are.

### H. Pilot and validation plan

**H0. Data collection without a backend.** The saved result link already encodes every rank: one permutation index per set. In a pilot, participants paste their result link and a self-chosen anonymous code into a separate consented form. That recovers full statement-level data with no change to the app's privacy model. The retest uses the same code. For pilot builds, add the 4 reserve sets (16 sets in total) behind a build flag.

**H1. Stage 1: content checks, before any field data.**

- **Translation** following the ITC Guidelines (2nd ed.): two independent forward translations of any revised statement, reconciliation, a back-translation, and review by two bilingual trainers.
- **Item sort.** At least 20 judges per language (trainers who did not write the items) sort all 64 shuffled statements into the four stage definitions. The definitions are shown without names. Compute the proportion of substantive agreement `p_sa = n_intended / N` and `c_sv = (n_intended − n_highest_other) / N` (Anderson & Gerbing 1991). **Targets:** p_sa ≥ .75 and c_sv ≥ .50 for every statement. Rewrite any statement that fails and re-sort it.
- **Desirability rating.** At least 20 raters per language rate each statement from 1 to 5: "How good would a trainer look who picked this as most like them?" **Targets:** the range of mean ratings within a set ≤ 0.5. Each preference's mean across sets within ±0.25 of the grand mean.
- **Cognitive interviews.** 5–8 per language, thinking aloud through all 16 sets. Log every misreading. In pt-BR, check specifically "dupla de facilitação", "dramatização", "modo Ativo" and the S09 reflexive.

**H2. Stage 2: field pilot** (all 16 sets).

- N ≥ 150 per language (minimum 100); retest after 14–21 days with N ≥ 60 per language.
- Precision of these sample sizes:
  - a retest r of .70 with N = 60 has a 95% CI of about .54–.81;
  - with N = 150, a statement's mean rank has SE ≈ 1.12/√150 ≈ 0.09, enough to detect the 0.3 flags below.

Statistics and targets:

| # | Statistic | Target / decision |
|---|---|---|
| a | Mean rank of each statement within its set | 2.20–2.80. Flag if it differs by more than 0.30 from the mean rank of the same preference across the other sets. A bias of about 0.23 cuts that preference's top share from 25% to about 15% (F6). |
| b | Corrected item–rest correlation: statement points vs the same preference's points in all other sets | ≥ .20, and ≥ .10 higher than its correlation with each other preference's rest score (a cross-loading check) |
| c | Retest Pearson r of each of the four scores (12 selected sets) | ≥ .70. If any is below .70, ship 16 sets (re-check the time target) |
| d | Cohen's κ for the top preference (4 categories, everyone) | ≥ .40. The simulation expects .43–.55 |
| e | Clear (`point`) results that are `point` at a different preference on retest | ≤ 5%. The simulation expects 2.7–3.9% |
| f | Same-or-neighbouring position on retest | ≥ 95% |
| g | Share of `point` results | ≥ 25%. Below 20% means the statements do not discriminate; revise |
| h | EN vs pt-BR: per-statement mean-rank difference | ≤ 0.30. Flag larger, then review the translation before concluding anything about the groups |
| i | Completion time | Median ≤ 10 min; 90th percentile ≤ 15 min; no set with drop-off above 5% |
| j | Optional convergent check (pilot build only): at the end, rate 1–5 how well each of the four plain stage descriptions fits you | The forced-choice top equals a unique rating top for ≥ 50% of respondents (chance = 25%) |

**H3. Decisions after the pilot.**

1. Select the 12 sets that maximise (b) and (c), subject to (a) and to the blueprint (two per role × phase cell). Keep the others as reserve.
2. Re-estimate τ from the retest data: choose the smallest τ with (e) ≤ 5%. If it differs from ⌈2√n⌉, store it as a constant per language version.
3. Bump `version` (e.g. 2.1.0), and update ITEMS.md with the per-statement statistics.
4. Only if every target in H1–H2 is met in both languages, change the about page from "has not been validated" to "piloted with N people; results in ITEMS.md". Do not describe it as a validated psychometric test.

**H4. After launch.** Ask facilitators to record the room's distribution of placements (counts only). If Active, or any preference, falls below 15% of the top placements across several unrelated groups, suspect the statements before concluding anything about trainers. This is the author's own flag 2.

---

## 4. References

Status key:

- **V**: verified in this session. Bibliographic details and the point relied on appeared in publisher, repository or index records returned by web search. Full texts were not opened.
- **P**: partly verified. Existence confirmed; the specific figure or detail came only from a secondary source or a snippet, or was not confirmed.
- **N**: not verified.

| # | Reference | Status |
|---|---|---|
| 1 | Kolb, D. A. (1984). *Experiential learning: Experience as the source of learning and development.* Prentice Hall. | P (confirmed only as cited by later sources; the orientation CE N, RO E, AC S, AE W was confirmed via secondary reproductions) |
| 2 | Kolb, D. A. (2015). *Experiential learning* (2nd ed.). Pearson FT Press. ISBN 978-0-13-389240-6. | V |
| 3 | Kolb, A. Y., & Kolb, D. A. (2005). Learning styles and learning spaces: Enhancing experiential learning in higher education. *Academy of Management Learning & Education, 4*(2), 193–212. https://doi.org/10.5465/amle.2005.17268566 | V |
| 4 | Kolb, A. Y., & Kolb, D. A. (2005). *The Kolb Learning Style Inventory—Version 3.1: 2005 technical specifications.* Hay Resources Direct. (2013 revision for versions 3.1/3.2: norms on 6,977 users.) https://www.researchgate.net/publication/241157771 | P (average alpha .80 for 3.1 and .81 for 4.0 confirmed via a snippet; per-scale values not) |
| 5 | Kolb, A. Y., & Kolb, D. A. (2013). *The Kolb Learning Style Inventory 4.0: Guide to theory, psychometrics, research & applications.* Experience Based Learning Systems. https://www.researchgate.net/publication/303446688 | P (nine styles, thirds-based grid, LFI computed with Kendall's W, styles as "dynamic states" confirmed; exact cut points not; the balancing formulas AC−(CE+9) and AE−(RO+6) seen only in a snippet) |
| 6 | Kolb, A. Y., & Kolb, D. A. (2009). The learning way: Meta-cognitive aspects of experiential learning. *Simulation & Gaming, 40*(3), 297–327. https://doi.org/10.1177/1046878108325713 | V |
| 7 | Kolb, A. Y., & Kolb, D. A. (2017). Experiential learning theory as a guide for experiential educators in higher education. *Experiential Learning & Teaching in Higher Education, 1*(1), article 7. https://nsuworks.nova.edu/elthe/vol1/iss1/7/ | V |
| 8 | Kolb, A., & Kolb, D. (2018). Eight important things to know about the experiential learning cycle. *Australian Educational Leader, 40*(3). | V (listing only) |
| 9 | Honey, P., & Mumford, A. (1982; 40-item version 2000). *Learning Styles Questionnaire* and *Manual of Learning Styles.* Peter Honey Publications. Publisher norms and reliability: Talentlens, "LSQ norm group reliability" PDF. | P (80/40 items, tick/cross scoring, norm bands, "highest score does not necessarily indicate the predominant style", and vendor reliability .81–.95 confirmed; stage mapping confirmed only via secondary handouts; edition details N) |
| 10 | Allinson, C. W., & Hayes, J. (1988). The Learning Styles Questionnaire: An alternative to Kolb's inventory? *Journal of Management Studies, 25*(3), 269–281. https://doi.org/10.1111/j.1467-6486.1988.tb00036.x | V |
| 11 | Sims, R. R., Veres, J. G., & Shake, L. G. (1989). An exploratory examination of the convergence between the Learning Styles Questionnaire and the Learning Style Inventory II. *Educational and Psychological Measurement, 49*(1), 227–233. https://doi.org/10.1177/0013164489491025 | V (r = .01–.22) |
| 12 | Goldstein, M. B., & Bokoros, M. A. (1992). Tilting at windmills: Comparing the Learning Style Inventory and the Learning Style Questionnaire. *Educational and Psychological Measurement, 52*(3), 701–708. https://doi.org/10.1177/0013164492052003020 | P (abstract only; agreement figures N) |
| 13 | Swailes, S., & Senior, B. (1999). The dimensionality of Honey and Mumford's Learning Styles Questionnaire. *International Journal of Selection and Assessment, 7*(1), 1–11. https://pure.hud.ac.uk/en/publications/the-dimensionality-of-honey-and-mumfords-learning-styles-question/ | V (DOI N) |
| 14 | Sadler-Smith, E. (2001). Does the Learning Styles Questionnaire measure style or process? A reply to Swailes and Senior (1999). *International Journal of Selection and Assessment.* | P (volume and pages N) |
| 15 | Duff, A., & Duffy, T. (2002). Psychometric properties of Honey & Mumford's Learning Styles Questionnaire (LSQ). *Personality and Individual Differences, 33*(1), 147–163. https://research-portal.uws.ac.uk/en/publications/psychometric-properties-of-honey-amp-mumfords-learning-styles-que/ | V |
| 16 | Sims, R. R., Veres, J. G., Watson, P., & Buckner, K. E. (1986). The reliability and classification stability of the Learning Style Inventory. *Educational and Psychological Measurement, 46*(3), 753–760. https://doi.org/10.1177/0013164486463033 | V (abstract: low retest and classification stability; percentages N) |
| 17 | Ruble, T. L., & Stout, D. E. (1991). Reliability, classification stability, and response-set bias of alternate forms of the Learning-Style Inventory (LSI-1985). *Educational and Psychological Measurement, 51*(2), 481–489. | P (findings N) |
| 18 | Henson, R. K., & Hwang, D.-Y. (2002). Variability and prediction of measurement error in Kolb's Learning Style Inventory scores: A reliability generalization study. *Educational and Psychological Measurement, 62*(4). | V (page range conflicts across records: 685–711 vs 712–727) |
| 19 | Geiger, M. A., Boyle, E. J., & Pinto, J. K. (1993). An examination of ipsative and normative versions of Kolb's revised Learning Style Inventory. *Educational and Psychological Measurement, 53*(3), 717–726. | P (existence only) |
| 20 | Manolis, C., Burns, D. J., Assudani, R., & Chinta, R. (2013). Assessing experiential learning styles: A methodological reconstruction and validation of the Kolb Learning Style Inventory. *Learning and Individual Differences, 23*, 44–52. https://doi.org/10.1016/j.lindif.2012.10.009 | V |
| 21 | (Authors not captured) (2025). An analysis of three different measures of learning styles [LSI, LSQ, RLSI; n = 225]. *Journal of Workplace Learning, 37*(7/8), 538–. https://www.emerald.com/jwl/article/37/7-8/538/1303017 | P (authors and DOI N) |
| 22 | Coffield, F., Moseley, D., Hall, E., & Ecclestone, K. (2004). *Learning styles and pedagogy in post-16 learning: A systematic and critical review.* Learning and Skills Research Centre. ISBN 1 85338 918 8. | V (71 models, 13 in depth); P (the quote on Kolb is from a secondary source) |
| 23 | Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: Concepts and evidence. *Psychological Science in the Public Interest, 9*(3), 105–119. https://doi.org/10.1111/j.1539-6053.2009.01038.x | V |
| 24 | Clinton-Lisell, V., & Litzinger, C. (2024). Is it really a neuromyth? A meta-analysis of the learning styles matching hypothesis. *Frontiers in Psychology, 15*, 1428732. https://doi.org/10.3389/fpsyg.2024.1428732 | V |
| 25 | Kirschner, P. A. (2017). Stop propagating the learning styles myth. *Computers & Education, 106*, 166–171. https://doi.org/10.1016/j.compedu.2016.12.006 | V |
| 26 | Newton, P. M., & Miah, M. (2017). Evidence-based higher education – Is the learning styles 'myth' important? *Frontiers in Psychology, 8*, 444. https://doi.org/10.3389/fpsyg.2017.00444 | V |
| 27 | Rogowsky, B. A., Calhoun, B. M., & Tallal, P. (2015). Matching learning style to instructional method: Effects on comprehension. *Journal of Educational Psychology, 107*(1), 64–78. | V (DOI N) |
| 28 | Rogowsky, B. A., Calhoun, B. M., & Tallal, P. (2020). Providing instruction based on students' learning style preferences does not improve learning. *Frontiers in Psychology, 11*, 164. https://doi.org/10.3389/fpsyg.2020.00164 | V |
| 29 | Husmann, P. R., & O'Loughlin, V. D. (2019). Another nail in the coffin for learning styles? *Anatomical Sciences Education, 12*(1), 6–19. https://doi.org/10.1002/ase.1777 | V |
| 30 | Hicks, L. E. (1970). Some properties of ipsative, normative, and forced-choice normative measures. *Psychological Bulletin, 74*(3), 167–184. | V (title corrected; DOI N) |
| 31 | Baron, H. (1996). Strengths and limitations of ipsative measurement. *Journal of Occupational and Organizational Psychology, 69*(1), 49–56. | V |
| 32 | Meade, A. W. (2004). Psychometric problems and issues involved with creating and using ipsative measures for selection. *Journal of Occupational and Organizational Psychology, 77*(4), 531–552. | V |
| 33 | Brown, A., & Maydeu-Olivares, A. (2011). Item response modeling of forced-choice questionnaires. *Educational and Psychological Measurement, 71*(3), 460–502. https://doi.org/10.1177/0013164410375112 | V |
| 34 | Brown, A., & Maydeu-Olivares, A. (2013). How IRT can solve problems of ipsative data in forced-choice questionnaires. *Psychological Methods, 18*(1), 36–52. https://doi.org/10.1037/a0030641 | V |
| 35 | Bürkner, P.-C., Schulte, N., & Holling, H. (2019). On the statistical and practical limitations of Thurstonian IRT models. *Educational and Psychological Measurement* (Oct 2019). https://www.uni-muenster.de/imperia/md/content/psychologie_institut_4/ae_holling/buerknerschulteholling_2019_limitations_of_tirt.pdf | V (volume and pages N) |
| 36 | Schulte, N., Holling, H., & Bürkner, P.-C. (2021). Can high-dimensional questionnaires resolve the ipsativity issue of forced-choice response formats? *Educational and Psychological Measurement.* | P (finding confirmed; volume N) |
| 37 | Cao, M., & Drasgow, F. (2019). Does forcing reduce faking? A meta-analytic review of forced-choice personality measures in high-stakes situations. *Journal of Applied Psychology, 104*(11), 1347–1368. https://doi.org/10.1037/apl0000414 | V |
| 38 | Wetzel, E., Frick, S., & Brown, A. (2021). Does multidimensional forced-choice prevent faking? *Psychological Assessment, 33*(2), 156–170. https://doi.org/10.1037/pas0000971 | V |
| 39 | Johnson, T., Kulesa, P., Cho, Y. I., & Shavitt, S. (2005). The relation between culture and response styles: Evidence from 19 countries. *Journal of Cross-Cultural Psychology, 36*(2), 264–277. | V |
| 40 | Bergsteiner, H., Avery, G. C., & Neumann, R. (2010). Kolb's experiential learning model: Critique from a modelling perspective. *Studies in Continuing Education, 32*(1), 29–46. https://doi.org/10.1080/01580370903534355 | V |
| 41 | Morris, T. H. (2020). Experiential learning – a systematic review and revision of Kolb's model. *Interactive Learning Environments, 28*(8), 1064–1077. https://doi.org/10.1080/10494820.2019.1570279 | V |
| 42 | Seaman, J., Brown, M., & Quay, J. (2017). The evolution of experiential learning theory: Tracing lines of research in the JEE. *Journal of Experiential Education, 40*(4). https://doi.org/10.1177/1053825916689268 | V |
| 43 | Alonso, C. M., Gallego, D. J., & Honey, P. (1994). *Los estilos de aprendizaje: Procedimientos de diagnóstico y mejora* (CHAEA). Mensajero. | P (80 yes/no items, 20 per style, Activo alpha ≈ .63 confirmed via citing studies; dates vary across sources 1992–1999) |
| 44 | Miranda, L., & Morais, C. (2008). Estilos de aprendizagem: o questionário CHAEA adaptado para língua portuguesa. *Revista Estilos de Aprendizaje, 1*(1), 66–. (Portugal, European Portuguese.) | V (table-of-contents listing) |
| 45 | Silva Falchetti, E. (2009). *Estilos de aprendizagem em universitários brasileiros… Tradução, adaptação e análise do CHAEA* (doctoral thesis). Universidad de León. https://buleria.unileon.es/handle/10612/999 | V (existence; psychometrics N) |
| 46 | Wosniak (2017). Cross-cultural adaptation of CHAEA-Junior for Brazilian adolescents (master's dissertation). | P (via search summary only) |
| 47 | Portilho, E. — Brazilian CHAEA work and the Portilho/Banas and Portilho–Beltrami instruments. | N (no Portilho CHAEA adaptation could be confirmed; only her related instruments) |
| 48 | Martínez, Delgado & Hernández (2021). CFA of the CHAEA in 940 Mexican university students. *Revista ConCiencia EPG, 6*(1). | P (summary: shortened forms fitted better) |
| 49 | Bartram, D., Berberoglu, G., Grégoire, J., Hambleton, R., Muñiz, J., & van de Vijver, F. (2018). ITC guidelines for translating and adapting tests (2nd ed.). *International Journal of Testing, 18*(2), 101–134. https://doi.org/10.1080/15305058.2017.1398166 | V |
| 50 | Anderson, J. C., & Gerbing, D. W. (1991). Predicting the performance of measures in a confirmatory factor analysis with a pretest assessment of their substantive validities. *Journal of Applied Psychology, 76*(5), 732–740. https://doi.org/10.1037/0021-9010.76.5.732 | V |
| 51 | Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate. *Journal of Memory and Language, 109*, 104047. https://doi.org/10.1016/j.jml.2019.104047 | V |

---

## Appendix A. Simulation method and outputs

All scripts and outputs are in `elc-placement-2-simulations/` (Node 22; seeded PRNG, so reruns reproduce the numbers).

**Model.** Person i has latent preferences θ_i ∈ ℝ⁴.

- **Independent model:** θ_ip ~ N(0, σ²).
- **Bipolar sensitivity model:** CE–AC and RO–AE correlate −.5.

Statement utility = θ_ip + δ_bp + ε, where:

- δ_bp ~ N(0, 0.2²) is a fixed statement-desirability effect;
- ε ~ N(0, 1) is drawn afresh per statement per occasion;
- σ ∈ {0, 0.35, 0.5, 0.7, 1.0}.

The respondent ranks the four statements by utility. A retest uses the same statements with fresh ε. Results use N = 20,000–40,000 simulated persons per cell. σ = 0.5 and 0.7 are called "moderate" and "optimistic". At 12 sets they give retest r .68 and .80, the range that vendor-reported KLSI reliabilities (about .80) and the weaker independent LSI retest evidence bracket.

**Checks.** The current-design simulation reproduces the 23.4% "on a line" under random responding (DECISIONS.md enumerates 23.2% exactly). The headline/score contradiction (F1) was reproduced on the commit's own `scoring.ts`.

**Standard errors** (points, independent model). Under random responding:

| Sets | One score | A difference between two scores |
|---|---|---|
| 6 | 2.69 | 4.42 |
| 12 | 3.81 | 6.23 |
| 16 | 4.46 | 7.29 |

The SE of a difference ≈ 1.8·√n under random responding, and about 1.65·√n at moderate signal. This is the basis of τ = ⌈2√n⌉.

**Files.**

| File | Contents |
|---|---|
| `sim.mjs`, `calibration.txt` | Signal calibration: retest r, SEM, ties, top agreement, current-quadrant agreement for 6/12/16 sets |
| `sweep.mjs`, `sweep.txt` | Clear-lead threshold sweep τ = 1…16 for 6/12/16 sets |
| `sweep.mjs format`, `format.txt` | Rank vs most/least; independent vs bipolar traits |
| `bias.mjs`, `bias.txt` | Effect of a systematic desirability shift on Active statements |
| `place.mjs`, `placement-rules.txt` | Dominant-preference rule vs Kolb-style balance-point rule: retest agreement and gross disagreement |
| `current.mjs`, `current-app.txt` | The 1cd74f5 app's behaviour (headline ≠ top score, confident quadrant flips) |
| `final.mjs`, `recommended-rule.txt` | The exact §3D rule at 12 and 16 sets |
| `app1cd74f5/check.ts` | The F1 counter-example run on the commit's own `scoring.ts` / `model.ts` |
| `spec-check.mjs` | Reference implementation of §3D; verifies the nine test vectors in §3D8 and the 24-permutation property |

**Limitations.**

- The simulations assume a simple Thurstonian response process with independent noise.
- Real data will include stable person-by-statement effects, which raise retest agreement without improving validity, and carelessness, which lowers it.
- The absolute numbers are estimates to be replaced by the pilot (§3H). The *comparisons* between designs are the robust part.
