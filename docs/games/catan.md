# Catan

> Be first to ten victory points, earned from settlements, cities, the longest road, the largest army and some development cards.

|  |  |
|---|---|
| **Players** | 3–4, best at 4 |
| **Box says** | 60 min |
| **Actually takes** | 90 min |
| **Teach time** | 15 min |
| **Weight** | ●●○○○ 2.3 / 5 |
| **Luck** | 50% chance, 50% skill |
| **Family** | trading-and-building |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **2** | Not supported by the base box. The official two-player option is the Catan card game or a variant with a neutral third builder. | Straight two-player Catan collapses because trading is the engine of the game and there is nobody to trade against. |
| **3-4** | Standard board. Each player places two settlements and two roads in a snake order, then collects resources from their second settlement. | Four players is the designed count; three plays noticeably looser with more open board space. |
| **5-6** | Requires the 5-6 player extension, which adds hexes, pieces and a special build phase. | The base box physically cannot support five without the extension. |

## Rules

Build settlements on a board that pays out on dice rolls, and trade for the
resources you are short of. The trading is the game; the building is the
scoreboard.

## The board

Nineteen hexes, each a terrain type producing one resource, each with a number
token from 2 to 12 (the desert has none and starts with the robber).

| Terrain | Produces |
| --- | --- |
| Forest | Lumber |
| Hills | Brick |
| Fields | Grain |
| Pasture | Wool |
| Mountains | Ore |
| Desert | Nothing |

## Setup

In turn order, each player places a settlement and a road. Then, in **reverse**
order, each places a second settlement and road.

Collect starting resources from your **second** settlement only — one card for
each adjacent terrain hex.

## A turn

1. **Roll** two dice. Every player with a settlement touching a hex showing that
   number collects one resource from it; a city collects two.
2. **Trade** — with other players, or with the bank at 4:1, or at a port you
   have built on.
3. **Build** — spend resources:

| Build | Cost |
| --- | --- |
| Road | Lumber + Brick |
| Settlement | Lumber + Brick + Grain + Wool |
| City (upgrades a settlement) | 3 Ore + 2 Grain |
| Development card | Ore + Grain + Wool |

## Rolling a 7

No resources are produced. Instead:

- Every player holding **more than seven** resource cards discards half, rounded
  down.
- The roller moves the robber to any other hex, blocking its production, and
  steals one random card from a player with a settlement touching it.

## Victory points

| Source | Points |
| --- | --- |
| Settlement | 1 |
| City | 2 |
| Longest Road (5+ segments, most) | 2 |
| Largest Army (3+ knights, most) | 2 |
| Victory point development card | 1 each |

First to **ten** wins. You announce it on your own turn — development card
points stay hidden until then, which is why games often end a turn before
everyone expects.

## Placement restrictions

Settlements must be at least two intersections apart, and roads must connect to
your own network.

## Settle the argument

### Who discards when a 7 is rolled?

**Official rule.** Played by almost everyone, almost everywhere.

Every player holding more than seven resource cards discards half, rounded down — not just the player who rolled, and not only the player being robbed. The roller then moves the robber and steals one card from a player adjacent to its new hex.

```console
$ rulebook ruling catan "who discards on a seven"
```

### Can players trade when it is not their turn?

**Official rule.** Played by almost everyone, almost everywhere.

Trades between players may only happen during the active player's trade phase, and every trade must involve the active player. Two other players cannot trade with each other. This single rule is what stops the board from being solved by coalition.

```console
$ rulebook ruling catan "can you trade on other players turns"
```

### What happens to Longest Road when someone ties it?

**Official rule.** Widespread but far from universal.

The holder keeps it on a tie — you must exceed the current holder, not match them. If a settlement is built that breaks the holder's road and drops them below five, the card goes to whoever now has the longest, or is set aside if nobody has five.

```console
$ rulebook ruling catan "longest road tie"
```

### Can you build on someone else's turn?

**Official rule.** Widespread but far from universal.

No, only on your own turn. The exception is the 5-6 player extension, which adds an explicit special build phase precisely because the wait would otherwise be too long.

```console
$ rulebook ruling catan "can you build any time"
```

### Do you collect resources on the first roll of the game for everyone?

**Official rule.** Widespread but far from universal.

At setup you collect resources only from your **second** settlement, the one placed on the way back round. Collecting from both is a common error that meaningfully advantages the first player.

```console
$ rulebook ruling catan "starting resources catan"
```

### Is the robber allowed to sit on the desert forever?

**Not an official rule.** Widespread but far from universal.

The published rules require the robber to move to a different hex, and the desert is a legal destination — effectively a pass.

*The house version:* Many groups ban parking the robber on the desert, or ban returning it to the hex it just left, to stop a player neutralising the mechanic.

*What it changes:* Banning the desert makes 7s meaner and the game more aggressive. It also removes the polite option, which changes the social temperature of the table.

```console
$ rulebook ruling catan "can you put the robber on the desert"
```

## Teaching it

## Set the board up before anyone arrives

Fifteen minutes is the honest teach time, and a third of it is setup. Do the
setup first, alone, so the explanation starts with a finished board in front of
people.

## Explain in this order

1. **"You want ten points. Settlements are one, cities are two."** Point at the
   pieces. Give them the goal before any mechanism.
2. **"Roll the dice, and everyone touching that number gets stuff."** Roll once
   and hand out the resources so they see it happen.
3. **"You need these cards to build these things."** Put the build-cost card in
   the middle of the table and leave it there.
4. **"On your turn you can trade with anyone."**

## Then do initial placement together

This is where new players lose the game before it starts. Say out loud:

- "Look at the dots under each number, not the number itself. More dots means
  it comes up more."
- "Try to touch three different resources."
- "Brick and wood early, ore and wheat later."

Talking through the first placement is not spoon-feeding; it is the difference
between a new player having a game and having ninety minutes of nothing.

## Mention on the first 7, not before

"Anyone with more than seven cards, discard half." Let it happen once.

## Do not mention

Ports, development card details, or Largest Army until the first one is bought.
Longest Road only when somebody has four segments.

## Say plainly if it is a three-player game

Three plays looser and more open than four. It is a fine game, just not the one
the box was balanced for.

## Editions

| Edition | Year | What changed |
|---|---|---|
| 4th and 5th edition | 2015 | The 5th edition changed the art and box, made the sea frame standard, and adjusted some component counts. The rules of play are essentially the same, so mixed-edition games work fine. |

## When a piece goes missing

Lost number tokens can be replaced by writing numbers on card. A missing robber can be any distinctive object. Resource cards are the one component that genuinely cannot be improvised at reasonable effort.

## Accessibility

Player colours are the main barrier, and red versus green appears in every set — use shape markers or distinct piece sets. The number tokens are small; the dots beneath each number indicate probability and are frequently too small to read, so a printed probability reference helps.

## Sources

- <https://www.catan.com/>

---

*Generated from [`games/catan/`](../../games/catan/). Fix it there, not here.*
