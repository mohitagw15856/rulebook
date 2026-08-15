# Texas Hold'em

> Win chips, either by holding the best five-card hand at showdown or by making everyone else fold.

|  |  |
|---|---|
| **Players** | 2–10, best at 6 |
| **Box says** | 60 min |
| **Actually takes** | 2 hr |
| **Teach time** | 8 min |
| **Weight** | ●●●○○ 2.8 / 5 |
| **Luck** | 45% chance, 55% skill |
| **Family** | vying |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **2** | Heads-up. The button posts the small blind and acts first before the flop, last afterwards — the reverse of every other table size. | Blind structure is genuinely inverted heads-up, and it catches people out constantly. |
| **3-6** | Button, small blind and big blind rotate clockwise each hand. Deal two cards to each player. | Six-handed is the sweet spot — enough players for action, short enough waits. |
| **7-10** | Standard full ring. Same structure; hands play tighter because more players see each flop. | — |

## Rules

Two private cards each, five shared in the middle, four rounds of betting. The
rules take five minutes; the game takes considerably longer than that.

## Setup

Give everyone the same number of chips. Place the dealer button in front of one
player; it moves one seat clockwise after every hand.

The two players left of the button post forced bets: the **small blind** and the
**big blind**, the big blind usually being twice the small.

## The shape of a hand

1. **Pre-flop** — everyone gets two private cards. Betting starts left of the
   big blind.
2. **The flop** — three community cards are dealt face up. Betting starts left
   of the button.
3. **The turn** — a fourth community card. Betting.
4. **The river** — a fifth community card. Final betting.
5. **Showdown** — remaining players make their best five cards from any
   combination of their two and the five shared.

If at any point everyone folds to one player, that player wins the pot and does
not have to show their cards.

## Your options when the action reaches you

- **Fold** — give up the hand.
- **Check** — pass, only if nobody has bet this round.
- **Call** — match the current bet.
- **Raise** — increase it, by at least the size of the previous bet or raise.
- **All-in** — commit every chip you have. You can only win the portion of the
  pot you matched; the rest forms a side pot.

## Hand rankings, best first

| Hand | Description |
| --- | --- |
| Straight flush | Five in sequence, all one suit |
| Four of a kind | Four cards of the same rank |
| Full house | Three of one rank, two of another |
| Flush | Five of one suit, not in sequence |
| Straight | Five in sequence, mixed suits |
| Three of a kind | Three cards of the same rank |
| Two pair | Two pairs |
| One pair | Two cards of the same rank |
| High card | None of the above |

A hand is always exactly five cards. When two hands share a rank, the remaining
cards — the **kickers** — decide it. Identical five-card hands split the pot;
suits never break the tie.

The Ace plays high or low, so A-2-3-4-5 is a valid straight (the lowest one).
It cannot wrap: Q-K-A-2-3 is nothing.

## Betting round ends when

Every player still in the hand has either folded or matched the largest bet.
</br>

## Playing at home

Set the blinds low enough that the evening lasts. A common mistake is blinds so
large relative to stacks that the game becomes a coin-flipping contest within
half an hour.

## Settle the argument

### What if the best hand is the five community cards themselves?

**Official rule.** Widespread but far from universal.

You may play the board. In Texas Hold'em you make the best five cards from any combination of your two and the five shared — including using neither of yours. If the board plays for everyone still in, the pot is split. (This differs from Omaha, where you must use exactly two of your own.)

```console
$ rulebook ruling poker-texas-holdem "play the board"
```

### Can you say "I call, and raise"?

**Official rule.** Widespread but far from universal.

No. That is a string bet and it is not allowed. State your full action in one declaration, or push all the chips out in a single motion. The rule exists to stop players fishing for a reaction mid-bet.

```console
$ rulebook ruling poker-texas-holdem "string bet"
```

### We both have a pair of kings — who wins?

**Official rule.** Played by almost everyone, almost everywhere.

The hand is always exactly five cards, so the remaining cards — the kickers — decide it. King-king with an Ace kicker beats king-king with a Queen kicker. If all five cards are equal in rank, the pot is split; suits never break ties in Hold'em.

```console
$ rulebook ruling poker-texas-holdem "what is a kicker"
```

### Does one suit beat another?

**Official rule.** Widespread but far from universal.

Not in Hold'em. Identical hands split the pot. Suit order is used only for administrative decisions in some tournaments, such as awarding an odd chip or deciding seating, never for ranking hands.

```console
$ rulebook ruling poker-texas-holdem "do suits rank in poker"
```

### Is Ace-2-3-4-5 a straight?

**Official rule.** Widespread but far from universal.

Yes. The Ace plays low to make the five-high straight known as the wheel. It is the lowest straight, so it loses to six-high. The Ace cannot wrap around — Q-K-A-2-3 is not a straight.

```console
$ rulebook ruling poker-texas-holdem "is ace low a straight"
```

### How small can a raise be?

**Official rule.** Widespread but far from universal.

A raise must be at least the size of the previous bet or raise in that round. If someone bets 10, the smallest raise is to 20. The exception is going all-in for less, which is always allowed but may not reopen the betting.

```console
$ rulebook ruling poker-texas-holdem "minimum raise poker"
```

## Teaching it

## Deal a hand face up first

Do not explain the betting. Deal everyone two cards **face up**, put five cards
in the middle one stage at a time, and ask each round: "who has the best five
cards?" Work it out together.

People learn hand rankings by seeing three or four boards, not by reading a
list. Ten minutes of this and the rankings stick permanently.

## Then add betting, in this order

1. Fold, check, call. Play a hand with only these.
2. Raise, with the minimum-raise rule.
3. All-in and side pots — last, and only when it comes up.

## Print the hand rankings and leave them on the table

Nobody remembers whether a flush beats a straight in their first session. A
printed list removes the single biggest source of hesitation, and does not
reduce the game at all.

## Say once, early

"Your hand is always exactly five cards." That sentence pre-empts almost every
showdown argument a new table will have — kickers, playing the board, and why
two pair plus a big card is not three pair.

## Do not mention

Pot odds, position, ranges. All are more important than the rules and all are
useless to somebody still checking whether they have a flush.

## Scoring

This game has a scorer. `rulebook score poker-texas-holdem "..."` works out the total for you.

## Editions

| Edition | Year | What changed |
|---|---|---|
| Tournament versus cash | — | Tournaments raise the blinds on a timer and you cannot rebuy after the late stage; cash games have fixed blinds and you can leave whenever. The rules of a hand are identical, the correct strategy is not. |

## When a piece goes missing

Any chips will do — coins, sweets, buttons — provided everyone agrees the denominations before starting. The dealer button can be any distinctive object.

## Accessibility

Suits matter for flushes, and the standard suit colours are two black and two red, which is difficult for some colour vision. Four-colour decks solve this completely and are worth using by default. Chip denominations should differ in size or texture, not only colour.

## Sources

- <https://www.pagat.com/poker/variants/texasholdem.html>

---

*Generated from [`games/poker-texas-holdem/`](../../games/poker-texas-holdem/). Fix it there, not here.*
