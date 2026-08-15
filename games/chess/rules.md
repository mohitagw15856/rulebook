# Chess

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
