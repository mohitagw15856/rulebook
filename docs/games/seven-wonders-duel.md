# 7 Wonders Duel

> Win outright by military or scientific supremacy, or accumulate the most victory points across three ages.

|  |  |
|---|---|
| **Players** | 2–2, best at 2 |
| **Box says** | 30 min |
| **Actually takes** | 40 min |
| **Teach time** | 12 min |
| **Between your turns** | 20 sec |
| **Works at age** | 10+ |
| **Weight** | ●●●○○ 2.8 / 5 |
| **Luck** | 30% chance, 70% skill |
| **Family** | drafting-and-engine-building |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **2** | Four wonders drafted each, the age one pyramid laid out with the specified face-down rows, military marker centred. | Built exclusively for two. It is the two-player refinement of 7 Wonders rather than a cut-down version. |

## Rules

Two civilisations, three ages, and a pyramid of cards where taking one reveals
the next. There are three ways to win and two of them end the game instantly.

## Setup

Each player drafts four wonders. Lay out the age one cards in the prescribed
pattern, some face up and some face down. Place the military marker in the
centre of its track. Each player starts with seven coins.

## Taking a card

On your turn, take any card that is not partially covered by another card. Then
choose one of three things:

**Build it.** Pay the cost in coins and resources. If a previously built card
grants you a free chain to this one, it costs nothing.

**Discard it for coins.** You gain two coins plus one for every yellow card you
already own. This is always available and is the reason no card is ever dead.

**Use it to build a wonder.** Discard it face down and pay the wonder's cost
instead. The card itself does nothing; it is simply the fuel.

After you take a card, any cards it was covering are revealed.

## Resources and trading

You never trade with your opponent directly. If you lack a resource, you buy it
from the bank at a cost of two coins plus one for each of that resource your
opponent produces. Their production makes your purchases more expensive, which
is the only indirect interaction in the economy.

## The three ways to win

**Military.** Red cards push the marker towards your opponent. Reach their
capital and you win immediately, whatever the points say.

**Science.** Collect six different scientific symbols and you win immediately.
There are only so many in the deck, so denying your opponent a symbol they need
is often more valuable than taking a card you want.

**Civilian.** If neither instant win happens, add up victory points after age
three. Highest wins; a tie goes to the player with more blue card points.

## Progress tokens

Five tokens are available from the start, granting powerful permanent abilities.
Matching a pair of identical scientific symbols earns you one immediately.

## Why it is tense

Because two of the three win conditions can end the game without warning, you
cannot simply build the best engine. You must watch what your opponent is
collecting on every single turn, and the card you most want to take is often the
card you most need to deny.

## Settle the argument

### Do military and science wins end the game immediately?

**Official rule.** Played by almost everyone, almost everywhere.

Yes. Pushing the military marker into your opponent's capital, or collecting six different scientific symbols, ends the game the moment it happens. The age is abandoned, points are not counted, and it does not matter how far ahead your opponent was on victory points.

```console
$ rulebook ruling seven-wonders-duel "instant win duel"
```

### Can you buy resources from your opponent?

**Official rule.** Widespread but far from universal.

No. All purchases are from the bank. The cost is two coins plus one for each copy of that resource your opponent produces, so their production raises your prices without ever giving them income.

*What it changes:* Building a resource your opponent depends on is a purely defensive play that costs them coins every turn without benefiting you directly.

```console
$ rulebook ruling seven-wonders-duel "trading with opponent"
```

### How many coins do you get for discarding a card?

**Official rule.** Widespread but far from universal.

Two coins, plus one for each yellow commercial card you have already built. A player with three yellow cards therefore collects five, which makes discarding a genuine strategy rather than a last resort.

```console
$ rulebook ruling seven-wonders-duel "selling a card duel"
```

### Can both players build all four of their wonders?

**Official rule.** Widespread but far from universal.

No. Only seven wonders may be constructed in total across both players, so as soon as the seventh is built the eighth becomes permanently unbuildable. Racing to finish your fourth wonder can strand your opponent's.

```console
$ rulebook ruling seven-wonders-duel "how many wonders get built"
```

### Can you take a card that is partly covered?

**Official rule.** Played by almost everyone, almost everywhere.

No. A card must have nothing overlapping it at all to be taken. Removing a card reveals whatever it was covering, and face-down cards are turned up at that moment.

```console
$ rulebook ruling seven-wonders-duel "which cards are available"
```

### When do you get a progress token?

**Official rule.** Widespread but far from universal.

Immediately upon acquiring your second copy of the same scientific symbol. You then choose any available token from the five laid out. Note that duplicate symbols do not count towards the six needed for a scientific victory, which requires six different ones.

```console
$ rulebook ruling seven-wonders-duel "progress token rules"
```

## Teaching it

Twelve minutes, the longest teach here, and the reason is the iconography.
Budget accordingly and keep the reference sheet visible throughout.

**Lead with the three win conditions, because they shape every decision:** "There
are three ways to win. Two of them end the game on the spot." Then name them:
military, science, points. That framing means every card they see afterwards has
a category to fall into.

**Then the physical rule, which is refreshingly simple:** "Take any card nothing
is sitting on top of. That's it." Point at the pyramid.

**Then the three things you can do with it,** and emphasise the second: "Build
it, sell it for coins, or use it to build a wonder. You can always sell — so
you're never stuck."

**Walk the card colours once, slowly:** brown and grey make resources, blue is
points, green is science, red is military, yellow is money and trade, purple
scores at the end. Six colours, one sentence each. Then stop.

**Explain trading properly, because it is nobody's expectation:** "You never
trade with me. You buy from the bank — but the more of a resource I make, the
more it costs you." That asymmetry is the economic heart of the game.

**Point at the science track and say the dangerous thing:** "If you get six
different science symbols, you win instantly. So watch what I'm collecting." A
first game where somebody wins on science while their opponent was not looking
is a bad first game.

**Do not explain progress tokens in detail.** Say: "Match two identical science
symbols and you get one of these. Read it when you get there." Explaining five
special powers up front is what makes people bounce off this game.

**Set the expectation clearly:** "The symbols are a lot. You'll be checking the
reference sheet all game and that's completely normal." Saying that removes the
embarrassment that otherwise makes people guess instead of asking.

## When it is fair to stop

Two of the three victory conditions end the game instantly, so a losing position can evaporate in one turn. Conceding a civilian defeat on points is reasonable in the third age; conceding while your opponent is two steps from a military victory is simply accepting what is about to happen anyway.

## When a piece goes missing

Nothing here is improvisable — the card costs and the pyramid structure are the game. Coins can be replaced with any counters.

## Accessibility

The iconography is dense and entirely symbolic, with no text on most cards. The reference sheet is essential and should stay on the table permanently. The pyramid layouts are specific and fiddly to build correctly each age.

## Sources

- <https://en.wikipedia.org/wiki/7_Wonders_Duel>

---

*Generated from [`games/seven-wonders-duel/`](../../games/seven-wonders-duel/). Fix it there, not here.*
