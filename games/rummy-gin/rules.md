# Gin Rummy

A two-player game of collecting and discarding, where the interesting decision
is not what to keep but when to stop.

## Melds

Your goal is to arrange cards into **melds**:

- **Set** — three or four cards of the same rank (7♠ 7♥ 7♦).
- **Run** — three or more consecutive cards in one suit (4♣ 5♣ 6♣).

A card can only be in one meld at a time. Anything not in a meld is
**deadwood**.

Deadwood values: face cards 10, Aces 1, all others face value.

## Setup

Deal ten cards each. Turn the next card face up to begin the discard pile; the
remainder is the stock.

## Playing a turn

1. **Draw** either the face-up discard or the top of the stock.
2. **Discard** one card face up.

That is the whole turn. The hand builds slowly and the tension is entirely in
the timing.

## Knocking

Instead of a normal discard, you may **knock** when your deadwood totals ten or
less. Lay your hand down, melds separated from deadwood.

Your opponent then lays down their melds, and may **lay off** — adding their
unmatched cards to *your* melds to reduce their own deadwood.

- **Knocker has less deadwood** — they score the difference.
- **Defender has equal or less** — that is an **undercut**. The defender scores
  the difference plus a bonus, and the knocker scores nothing.

## Gin

If you have no deadwood at all, you have **gin**. Announce it, score the
opponent's full deadwood plus a bonus of 25, and note that no laying off is
allowed against gin.

## Ending

Play hands until one player reaches 100 points. If the stock runs down to two
cards without a knock, the hand is dead and nobody scores.
