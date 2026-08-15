# Contributing

Two things are worth adding here: **a game**, and **an argument**.

The second one is more valuable. Rules are everywhere. A clear answer to "no,
that's not a real rule, and here's how many people play it anyway" is not.

---

## Add an argument to a game that already exists

This is a one-entry change. Open `games/<game>/rulings.yml` and add to the list:

```yaml
  - id: free-parking-jackpot
    question: Does landing on Free Parking pay you the money in the middle?
    asked_as:
      - free parking money
      - do you get the tax money on free parking
      - free parking jackpot
    kind: house-rule          # house-rule | clarification
    official: false
    prevalence: near-universal  # near-universal | common | regional | rare
    regions: [global]
    verdict: >
      No, and it never has been. Free Parking is a free resting place and
      nothing more, in every edition of the rules.
    house_rule: >
      Fines, taxes and sometimes a fixed seed go into a pot in the middle,
      collected in full by whoever lands on Free Parking.
    effect: >
      It puts money back into a game whose whole design is money leaving the
      board, which is the single biggest reason Monopoly runs long.
    source: https://example.com/where-you-checked
```

### The fields that matter

**`asked_as`** — the phrasings people actually use. This is how search finds
your ruling. Write what someone would shout across the table, not the tidy
version. `"free parking money"` beats `"Free Parking payout clarification"`.

**`kind`** — two values, and the difference is the point of this repo:

| | |
|---|---|
| `house-rule` | Not in the published rules. Requires `house_rule` describing the version people play. |
| `clarification` | Genuinely official, and routinely played wrong. |

**`prevalence`** — how widely it is *actually played*, which is a separate fact
from whether it is official. `near-universal` means almost everyone, almost
everywhere. Be honest; `rare` is a fine and useful answer.

**`regions`** — where it is played, if it is not everywhere. Use place names:
`[India]`, `[North America]`, `[United Kingdom]`. `global` means no regional
pattern. These build the "played differently around the world" section, and
they are how two people who have both always been right discover why.

There is no field for how much an argument a ruling causes — that is derived.
A house rule almost everybody plays is automatically the hottest thing in the
registry, because both sides are certain and the person who sounds wrong is
right. See `rulebook hottest`.

**`official`** — true or false, no hedging. If you cannot establish it, say so
in the verdict rather than guessing.

**`verdict`** — this gets read out loud at a table where people are waiting.
Lead with the answer. Give the reasoning after.

---

## Add a whole game

One game is one folder with four files:

```
games/<slug>/
  game.yml      the facts
  rules.md      how to play, in your own words
  rulings.yml   the arguments
  teach.md      how to explain it to someone who has never played
  score.mjs     optional — a scorer
```

Copy the closest existing game and work from it. `npm run validate` names every
missing field, so you do not need to memorise the schema.

A few fields people skip, and shouldn't:

- **`setup_by_players`** — "how many cards for five people?" is the question
  people arrive with. Cover every supported count, including the ones the game
  handles badly, and say so in `note`.
- **`playtime_box` and `playtime_actual`** — the box time is marketing. Record
  both. `rulebook find` filters on the real one.
- **`teach_time`** — how long to explain it before anyone plays a turn.
- **`weight`** 1–5 and **`luck`** 0–100 — your honest judgement.
- **`downtime`** — how long between *your* turns. This is the honest measure of
  whether a game is tolerable to sit through, and nobody publishes it. It is
  why Monopoly is hated and Codenames is not.
- **`min_age`** — the age it genuinely works at, which is usually not the age
  printed on the box. `rulebook find --kids 7` depends on you being honest here.
- **`concession`** — when it is fair to stop. Every game has an answer and none
  of them print it.
- **`variants`** — official variants and well-known regional versions, each with
  a `name` and what it `changed`.
- **`substitutions`** — what to do when a piece is lost, which is the most
  common reason a game does not get played.
- **`accessibility`** — colour pairs, print size, dexterity. Say which colours
  clash; nearly every set has a red/green problem.

### teach.md

Not a summary of the rules — an **order of explanation**. What to say first,
what to leave until it comes up, and the one sentence that pre-empts the
question every new player asks. Lines to say out loud are welcome.

### score.mjs

Optional. Export `usage`, `examples`, and `run(args)` returning an array of
lines. Look at `games/scrabble/score.mjs` for the shape. Anything you add here
needs a test in `scripts/test.mjs` — scoring is one of the two parts of this
repo that can be objectively wrong.

These modules are loaded unchanged by the website as plain ESM, so they must
have no Node imports. If you need to parse cards, import `lib/cards.mjs`.

### odds.mjs

Also optional. Export `title`, `rows()` returning `{label, pct, note}`, and a
`notes` array. Compute the numbers where you reasonably can — `games/catan/odds.mjs`
derives the dice table rather than hard-coding it, which means it cannot drift.
Where you cite published figures instead, say so in the note.

---

## Write it yourself

**How a game is played is not copyrightable.** That is the idea/expression
split — settled in the US since *Baker v. Selden* (1879), and stated directly in
37 CFR 202.1(b), which excludes "the idea for a game" from copyright.

**A publisher's wording is copyrightable.** Their rulebook prose, their
diagrams, their card text.

So: read the official rules, understand them, close the tab, and write them in
your own words. Never paste.

`npm run check` enforces the parts of that which are machine-checkable:

- every game cites its sources
- no copyright notices, no ® or ™ carried across with a paste
- no long quotation attributed to a publisher
- no sentence appearing in two different games
- no blocks of shouting caps, which is what scanned rulebooks look like

A clean run is not a legal opinion. It means nothing obvious is wrong. The
judgement is still yours.

---

## Before you open a PR

```console
$ npm run ci
```

That validates the schema, checks originality, runs the scoring tests, and
rebuilds `README.md` and the pages under `docs/games/`. **Commit the rebuilt
files** — CI fails if the generated output does not match the data, because a
README that disagrees with the registry is worse than no README.

No dependencies. `npm run ci` works on a clean clone with nothing installed.
