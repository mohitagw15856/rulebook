# Cluedo

> Work out which suspect, weapon and room are hidden in the case envelope, and say so before anybody else does.

|  |  |
|---|---|
| **Players** | 3–6, best at 4 |
| **Box says** | 45 min |
| **Actually takes** | 50 min |
| **Teach time** | 7 min |
| **Between your turns** | 50 sec |
| **Works at age** | 8+ |
| **Weight** | ●●○○○ 1.9 / 5 |
| **Luck** | 55% chance, 45% skill |
| **Family** | deduction |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **3** | Eighteen cards split six each after the envelope is filled. | Deduction is much slower with three, since each suggestion reveals less. Consider dealing four cards face up to speed it along. |
| **4** | Four or five cards each. The standard, comfortable game. | The count where the maths of elimination works best. |
| **5-6** | Three cards each. Information moves quickly and games are short. | With six, a careless suggestion can hand somebody the solution outright. |

## Rules

Somebody has been murdered. One suspect card, one weapon card and one room card
are sealed in an envelope before anybody looks at anything, and the whole game
is a race to work out which three.

## Setup

Separate the twenty-one cards into three piles by type. Shuffle each pile
separately and, without looking, take the top card of each into the case
envelope. Shuffle the remaining eighteen together and deal them out as evenly as
possible, face down, to the players.

The cards in your hand are, by definition, not in the envelope. That is your
starting information, and it is different for everybody.

## Your turn

Roll and move that many spaces along the corridors. You may not move diagonally,
and you cannot pass through another player. Four rooms sit at the corners and
are joined in pairs by secret passages, which move you across the board for free.

Once you are in a room, you may make a suggestion: name a suspect, a weapon, and
the room you are standing in. Move that suspect's token and that weapon into the
room with you — which is not decoration, since it drags other players around the
board against their will.

## Disproving

Beginning with the player on your left, each player in turn checks whether they
hold any of the three cards you named. If they hold one, they must show you
exactly one of them, privately. If they hold several, they choose which. As soon
as one player shows you a card, the process stops — everybody else is skipped.

If nobody can disprove your suggestion, that is enormous. It does not prove you
are right, because you may be holding one of the cards yourself, but everybody
at the table now knows something.

## Accusing

At any point on your turn, you may make an accusation instead. Name all three
cards, then look inside the envelope privately.

If you are right, show the cards and win.

If you are wrong, you are out. You take no further turns and can never win — but
you keep your cards and must continue to disprove other players' suggestions.
This is not optional and it is the reason a wrong accusation is so expensive.

You may only make one accusation in the whole game.

## Settle the argument

### Does everyone show you a card, or only the first player who can?

**Official rule.** Played by almost everyone, almost everywhere.

Only the first player, going clockwise, who holds any of the three named cards. They show one card and the process stops immediately — the remaining players are not asked at all, and reveal nothing.

*What it changes:* Playing it wrong, with everybody showing a card, collapses the game to about four turns and removes almost all of the deduction.

```console
$ rulebook ruling cluedo "how many people disprove"
```

### What happens if your accusation is wrong?

**Official rule.** Played by almost everyone, almost everywhere.

You are out of contention permanently and take no further turns, but you stay at the table, keep your cards and must continue disproving other players' suggestions. Returning the envelope unchanged is essential.

```console
$ rulebook ruling cluedo "wrong accusation cluedo"
```

### Can you name a card that is in your own hand?

**Official rule.** Widespread but far from universal.

Yes, and it is a genuine tactic rather than a loophole. Naming a card you hold guarantees that any player who disproves you must be showing you one of the other two, which narrows things down sharply.

```console
$ rulebook ruling cluedo "suggest a card I hold"
```

### Do you have to be in a room to make a suggestion?

**Official rule.** Played by almost everyone, almost everywhere.

You must be standing in a room, and the room you name must be the one you are in. Corridors allow no suggestions. An accusation, by contrast, may name any room in most editions.

```console
$ rulebook ruling cluedo "suggest from corridor"
```

### If your character is moved into a room by someone else, can you suggest from there?

**Official rule.** Widespread but far from universal.

Yes. On your next turn you may make a suggestion from the room you were pulled into without rolling at all, or you may roll and leave as normal. Being dragged across the board is an opportunity as often as a nuisance.

```console
$ rulebook ruling cluedo "moved by another player"
```

### Can you use a secret passage and still make a suggestion?

**Official rule.** Widespread but far from universal.

Yes. Taking a passage counts as your entire move, and you may suggest immediately on arrival. Passages are strong precisely because they get you into a room without any dice at all.

```console
$ rulebook ruling cluedo "secret passage rules"
```

## Teaching it

Seven minutes. Nearly everybody has played it as a child and nearly everybody
half-remembers it wrong, so teach it as if they have not.

**Start with the envelope, physically.** Do the setup in front of them: three
piles, one card from each into the envelope, sight unseen. Say: "Nobody has seen
those three. Not even me. That's what we're all looking for." Watching it
happen is worth more than describing it.

**Then the single most important sentence in the game:** "The cards in your hand
are cards that are *not* in the envelope." Some adults have played this game for
thirty years without ever hearing that stated directly.

**Explain suggestions as questions, not guesses.** New players think a suggestion
is an attempt to win. Reframe it: "You're not guessing. You're asking the table
a question, and you're going to learn something from whoever answers — and from
everybody who *can't*."

**Point out that only one person shows a card.** This is the rule people most
often get wrong, and it changes everything about what a non-answer means.

**Warn them about the accusation, clearly and early.** "If you accuse and you're
wrong, you're out for good. You still have to show cards to everyone else, but
you can't win. So don't accuse until you're certain." Say this before turn one,
not after somebody has done it.

**Show them how to keep notes properly.** The printed pad only has room to tick
cards you have been shown. Draw a grid with a column per player instead, and
demonstrate marking that a player *did not* have any of three cards — which is
usually the more valuable information and which the supplied sheet has nowhere
to record.

**A detail worth mentioning once:** naming a suspect drags their token into your
room, and that player then has to make their next suggestion from there. It is a
legitimate way to be annoying, and telling people that up front makes the game
more fun rather than less.

## Editions

| Edition | Year | What changed |
|---|---|---|
| Clue (North America) | 1949 | The same game under a different name, with Reverend Green becoming Mr Green and the rooms renamed slightly. Rules are identical. |
| 2016 refresh | 2016 | Replaced some characters and added optional intrigue cards. The core deduction is untouched and mixed-edition play is fine if you agree which character list you are using. |

## Variants worth knowing

**Face-up leftovers** — With three players, deal any cards that will not divide evenly face up in the middle rather than reshuffling. Everybody eliminates them at once.

**Accusation from anywhere** — Allow an accusation to be made from any square rather than requiring the accused room. Speeds up endgames considerably.

## When it is fair to stop

Never concede Cluedo. A player who has been eliminated by a wrong accusation still holds cards and must keep answering suggestions, so leaving the table breaks the game for everyone else.

## When a piece goes missing

Weapon tokens are decoration and can be anything, including scraps of paper with names on. Losing a card from the deck ruins the game outright — the twenty-one cards are the puzzle. The notepads are trivially replaced.

## Accessibility

Tracking shown cards on a small printed grid is the main barrier; larger hand-ruled grids on plain paper work far better than the supplied pads. The weapon miniatures are small and easily lost, and the character colours include a green and a red that are difficult to tell apart.

## Sources

- <https://www.hasbro.com/common/instruct/clue.pdf>

---

*Generated from [`games/cluedo/`](../../games/cluedo/). Fix it there, not here.*
