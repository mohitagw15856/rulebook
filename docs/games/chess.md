# Chess

> Attack the opposing king so that no legal move escapes the attack.

|  |  |
|---|---|
| **Players** | 2–2, best at 2 |
| **Box says** | 30 min |
| **Actually takes** | 45 min |
| **Teach time** | 10 min |
| **Weight** | ●●●●○ 3.6 / 5 |
| **Luck** | 0% chance, 100% skill |
| **Family** | abstract-strategy |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **2** | White on ranks 1 and 2, Black on 7 and 8. Queen goes on her own colour; the right-hand corner square is light for both players. | Queen on her own colour is the setup error people make most often. |

## Rules

No hidden information and no dice. Everything either player needs to know is on
the board.

## Setup

Rooks in the corners, then knights, then bishops, then queen and king. Pawns
fill the second rank.

Two checks that catch people out: the **queen goes on her own colour** (white
queen on a light square), and the **near-right corner square is light** for both
players.

White moves first.

## How the pieces move

| Piece | Movement |
| --- | --- |
| **King** | One square in any direction |
| **Queen** | Any distance, straight or diagonal |
| **Rook** | Any distance, straight |
| **Bishop** | Any distance, diagonal |
| **Knight** | An L: two squares one way, one the other. The only piece that jumps over others |
| **Pawn** | One square forward, or two on its first move. Captures **diagonally** only |

Every piece except the knight is blocked by pieces in the way. You capture by
moving onto an occupied square; you may never capture your own pieces.

## The three special moves

**Castling** — the king moves two squares toward a rook, and that rook jumps to
the far side of the king. Requires: neither piece has moved, the squares between
are empty, the king is not in check, and the king does not cross or land on an
attacked square. The rook may be attacked; that does not matter.

**En passant** — if an enemy pawn advances two squares and lands directly beside
your pawn, you may capture it as if it had moved only one. Only on the very next
move.

**Promotion** — a pawn reaching the far rank becomes a queen, rook, bishop or
knight. Your choice, and you may have more than one queen.

## Check and checkmate

Your king is in **check** when it is attacked. You must respond immediately by
moving the king, blocking, or capturing the attacker. You may never make a move
that leaves your own king in check.

**Checkmate** is check with no legal escape. That ends the game.

## Draws

- **Stalemate** — the player to move has no legal move and is *not* in check.
- **Agreement** — both players accept a draw.
- **Threefold repetition** — the same position occurs three times.
- **Fifty-move rule** — fifty moves each with no capture and no pawn move.
- **Insufficient material** — neither side can possibly checkmate.

## Settle the argument

### What is en passant and when can you do it?

**Official rule.** Played by almost everyone, almost everywhere.

If a pawn advances two squares from its starting position and lands beside an enemy pawn, that pawn may capture it as though it had only moved one square — but **only on the immediately following move**. Miss the chance and it is gone. It is a genuine rule that a great many casual players have never been taught.

```console
$ rulebook ruling chess "en passant rule"
```

### When exactly are you allowed to castle?

**Official rule.** Played by almost everyone, almost everywhere.

Four conditions, all required: neither the king nor that rook has moved; the squares between them are empty; the king is not currently in check; and the king does not pass through or land on an attacked square. Note what is **not** on the list — the rook may be attacked, and the rook may pass through an attacked square. Both are legal.

```console
$ rulebook ruling chess "castling rules"
```

### If a player cannot move, do they lose?

**Official rule.** Played by almost everyone, almost everywhere.

No — it is a draw. If the player to move has no legal move and is **not** in check, the game is drawn regardless of material. This rule is why a player with a queen and king can still fail to win, and why beginners throw away won positions.

```console
$ rulebook ruling chess "stalemate rules"
```

### Must a promoted pawn become a queen?

**Official rule.** Widespread but far from universal.

No. A pawn reaching the far rank must promote, but to any piece except a king — queen, rook, bishop or knight. Promoting to a knight is occasionally the only winning move, because a knight attacks squares a queen cannot. You may have several queens on the board at once.

```console
$ rulebook ruling chess "pawn promotion rules"
```

### If you touch a piece, must you move it?

**Official rule.** Widespread but far from universal.

In formal play, yes — touch a piece and you must move it if it has a legal move; touch an opponent's piece and you must capture it if you legally can. Say "j'adoube" or "I adjust" first if you only want to straighten a piece. Casual games usually ignore this, which is fine as long as both players agree before the first move rather than during an argument.

```console
$ rulebook ruling chess "touch move rule"
```

### How does a game end in a draw when neither side can win?

**Official rule.** Widespread but far from universal.

Several ways. Threefold repetition — the same position with the same player to move occurs three times — may be claimed as a draw. The fifty-move rule allows a claim after fifty moves by each side with no capture and no pawn move. Insufficient material, such as king against king, is an immediate draw.

```console
$ rulebook ruling chess "fifty move rule"
```

## Teaching it

## Do not teach all six pieces at once

The standard mistake is a ten-minute lecture on movement followed by a game the
learner cannot follow. Teach the pieces in ascending complexity and play as you
go.

## Order that works

1. **Pawns only.** Set up just the pawns and play a race to the far side. Two
   minutes. This teaches the strangest movement rule in the game — forward to
   move, diagonal to capture — in the only way it ever really lands.
2. **Add rooks, then bishops, then queen.** Straight, diagonal, both. Each is one
   sentence and needs no more.
3. **Knights last.** Demonstrate the L a few times and let them be wrong for a
   while. Everyone is.
4. **Kings and check.** "Your king can never be left attacked. If it is attacked
   and you can't fix it, you've lost."

## Mention the special moves as they arise

Castling on their first opportunity. En passant only when the position actually
allows it — explaining it in the abstract almost never sticks.

## Say once, early

"Stalemate is a draw, not a win." New players lose won games to this and feel
cheated. Knowing it up front turns it into a rule rather than a betrayal.

## Do not mention

Openings, notation, or any advice of the form "control the centre" until they
have finished a whole game. The first game is about legality, not quality.

## Editions

| Edition | Year | What changed |
|---|---|---|
| FIDE laws | — | The competitive rules are maintained by FIDE and are periodically revised, mostly on clock handling, illegal-move penalties and tournament conduct. The movement of the pieces has been stable since the fifteenth century. |

## When a piece goes missing

A missing piece can be stood in for by a coin or an upturned pawn, agreed before the game. A missing queen is traditionally represented by an upturned rook.

## Accessibility

Piece shape carries the information, not colour, so colour vision is rarely a barrier — but light-versus-dark squares can be. Tactile sets with pegged pieces and raised dark squares exist and are the standard accommodation for blind players, who typically use algebraic notation spoken aloud.

## Sources

- <https://handbook.fide.com/chapter/E012023>

---

*Generated from [`games/chess/`](../../games/chess/). Fix it there, not here.*
