# Werewolf

> The villagers must identify and eliminate every werewolf. The werewolves must reduce the villagers to their own number without being caught.

|  |  |
|---|---|
| **Players** | 7–20, best at 12 |
| **Box says** | 30 min |
| **Actually takes** | 40 min |
| **Teach time** | 5 min |
| **Between your turns** | 0 sec |
| **Works at age** | 10+ |
| **Weight** | ●●○○○ 1.6 / 5 |
| **Luck** | 30% chance, 70% skill |
| **Family** | social-deduction |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **7-9** | Two werewolves, one seer, one doctor, the rest villagers. | Below seven the werewolves win too easily, because a single wrong vote is a quarter of the village. |
| **10-14** | Three werewolves, plus seer, doctor and one more special role such as the hunter. | The sweet spot. Enough people for real argument, few enough that everyone gets to speak. |
| **15-20** | Four or five werewolves and several special roles. A second moderator helps. | Discussion becomes unmanageable above about sixteen unless somebody enforces speaking order. |

## Rules

A village is hiding werewolves. The werewolves know each other. Nobody else
knows anything. That asymmetry is the entire game, and it needs no equipment at
all.

## Roles

One person moderates and does not play. They deal a secret role to everyone
else:

- **Werewolves**, who know one another's identity.
- **Villagers**, who know nothing.
- **The seer**, a villager who may learn one player's true role each night.
- **The doctor**, a villager who may protect one player from death each night.

Roughly one werewolf per four players is the standard ratio.

## Night

Everybody closes their eyes. The moderator says "werewolves, wake up." The
werewolves open their eyes, see each other, and silently agree on a victim by
pointing. They close their eyes again.

The moderator then wakes the seer, who points at one player; the moderator
silently indicates whether that player is a werewolf. Then the doctor, who
points at one player to protect — possibly themselves.

## Day

Everybody opens their eyes. The moderator announces who died, and that player's
role is revealed. They take no further part and must not speak.

The village then discusses. Anyone may accuse anyone. When the discussion has
run its course, the village votes, and whoever receives the most votes is
eliminated and their role revealed.

Then night falls again.

## Winning

Villagers win the moment the last werewolf is eliminated.

Werewolves win as soon as their number equals the number of surviving
villagers, because from that point they can never be outvoted. The game does
not need to continue to the last villager, and stopping at parity saves a
pointless final round.

## The moderator's job

Keep the night quiet, keep the day moving, and never reveal anything you were
not asked to. A good moderator is the difference between a tense forty minutes
and a shapeless argument, and it is a genuine role rather than a chore.

## Settle the argument

### Can eliminated players talk?

**Official rule.** Played by almost everyone, almost everywhere.

No. A player who has been eliminated says nothing for the rest of the game — no hints, no reactions, no knowing looks. They hold information that would resolve the entire puzzle, so their silence is a rule rather than an etiquette point.

*What it changes:* Groups that let the dead comment find the game collapses within two rounds, because the eliminated players collectively know almost everything.

```console
$ rulebook ruling werewolf "can dead players speak"
```

### Can the moderator also have a role?

**Official rule.** Widespread but far from universal.

No. The moderator sees every role and every night action, so they cannot take part. Apps that narrate the night exist precisely so that nobody has to sit out.

```console
$ rulebook ruling werewolf "can the narrator play"
```

### Do werewolves have to kill everyone to win?

**Official rule.** Played by almost everyone, almost everywhere.

No. They win as soon as their number equals the number of remaining villagers, because at parity they can no longer be voted out. Playing on past that point is a formality with a guaranteed result.

```console
$ rulebook ruling werewolf "werewolf win condition"
```

### Should the seer announce what they know?

**Official rule.** Widespread but far from universal.

It is entirely legal at any time and is a strategic decision rather than a rules question. Claiming early gives the village real information and paints an immediate target; claiming late risks dying with it unspoken. There is no rule either way, and any group insisting otherwise has invented one.

```console
$ rulebook ruling werewolf "should the seer claim"
```

### Can the village choose not to eliminate anyone?

**Not an official rule.** Widespread but far from universal.

In most rule sets the day must end with somebody eliminated, and a tie is broken by a runoff or by the moderator.

*The house version:* Many groups allow a no-elimination day, either by majority abstention or by leaving a tie unresolved.

*What it changes:* It strongly favours the werewolves, who lose nobody that round while still killing at night. Groups that allow it usually add a rule that it can only happen once.

```console
$ rulebook ruling werewolf "can we skip the vote"
```

### Can werewolves eliminate one of their own?

**Official rule.** Widespread but far from universal.

Yes, and it is occasionally a strong play — sacrificing a wolf who is about to be caught buys enormous credibility for the others. Nothing in the rules restricts the night kill to villagers.

```console
$ rulebook ruling werewolf "can wolves kill wolves"
```

## Teaching it

Five minutes, but the teach happens in front of the whole group at once, which
makes it different from every other game here.

**State the asymmetry first, because it is the game:** "A few of you will be
werewolves and you'll know who each other are. Everyone else knows nothing.
That's the whole thing."

**Explain the two phases by name and keep them separate.** "At night everyone
closes their eyes and the werewolves quietly pick somebody to kill. During the
day we all argue about who did it, and we vote somebody out." Nobody needs more
structure than that to begin.

**Be extremely clear that lying is the point.** Say it explicitly: "If you're a
werewolf, you are supposed to lie to us. That's not cheating, that's the game."
Groups new to social deduction contain at least one person who will otherwise
feel genuinely uncomfortable, and naming it up front fixes that.

**Explain the death rule bluntly:** "If you're out, you don't talk. Not a hint,
not a face, nothing." Dead players leaking information is the single most common
way a game of Werewolf falls apart.

**For a first game, use only the seer and skip the doctor.** One special role is
enough to learn the rhythm. Adding four roles to a group that has never played
produces a night phase that takes longer than the day.

**Say the win condition out loud before the first night,** because it surprises
people: "Werewolves win when there are as many of them as there are of you —
they don't have to get everybody."

**A warning worth giving the moderator:** call the night in the same order every
time, and never react to anything you see. Groups read a moderator's hesitation
faster than they read each other.

## Variants worth knowing

**Mafia** — The same game with a crime theme instead of a folklore one. Mafia rather than werewolves, detective rather than seer. Mechanically identical.

**One Night** — A single night and day, with roles that swap during the night. No player elimination, so nobody sits out. A different and much shorter game.

**No moderator** — App-driven versions narrate the night automatically so nobody has to sit out. Widely used and generally an improvement for small groups.

## When it is fair to stop

Nobody may leave mid-game. A player who walks out takes hidden information with them and breaks the deduction for everyone still playing. Eliminated players may leave the circle but should stay silent rather than commentate.

## When a piece goes missing

There is nothing to lose. Roles can be dealt with playing cards, written on torn paper, or assigned by the moderator tapping shoulders in the dark. The game genuinely requires no equipment whatsoever.

## Accessibility

The game depends on closing your eyes and on hearing quiet instructions, which makes it difficult for players with hearing loss and unworkable for anyone who cannot see the moderator's gestures. A written-card variant, where the moderator passes notes rather than speaking, solves most of this. It is also intensely verbal and fast, which some players find genuinely stressful rather than fun.

## Sources

- <https://en.wikipedia.org/wiki/Mafia_(party_game)>

---

*Generated from [`games/werewolf/`](../../games/werewolf/). Fix it there, not here.*
