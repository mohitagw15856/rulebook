# Hive

Chess with no board. Twenty-two tiles, and the playing area is whatever shape
the tiles happen to make.

## Setup

Each player takes eleven tiles: one queen bee, two spiders, two beetles, three
grasshoppers and three ants.

The first player places any tile on the table. The second places any tile
touching it. From then on, every new tile you place must touch at least one of
your own tiles and must not touch any of your opponent's.

## The queen rule

Your queen bee must be placed by your fourth turn at the latest. Until your
queen is on the table you may not move any of your tiles — only place new ones.

## Moving

Instead of placing, you may move a tile already in the hive. Three restrictions
govern every move:

**The hive must stay connected.** If removing a tile would split the hive into
two separate groups, that tile cannot move at all. It is pinned.

**Tiles must slide.** A tile must be able to physically slide into its
destination without being lifted over anything. If the gap between two tiles is
too narrow to slide through, the move is illegal.

**The hive must remain one piece after the move too.**

## How each creature moves

- **Queen bee** — one space.
- **Spider** — exactly three spaces, no more, no less, never backtracking.
- **Beetle** — one space, and may climb on top of the hive. A tile underneath a
  beetle cannot move, and the beetle takes the colour of the stack for placement
  purposes.
- **Grasshopper** — jumps in a straight line over one or more tiles, landing on
  the first empty space beyond. It does not slide, so it ignores the narrow-gap
  rule entirely.
- **Soldier ant** — any number of spaces around the outside of the hive. The
  strongest piece in the game by a distance.

## Winning

Surround the opposing queen on all six sides. Any tiles count, including that
player's own and including your own. If both queens become surrounded on the
same move, the game is drawn.
