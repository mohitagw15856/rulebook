# Backgammon

> Move all fifteen of your checkers around the board into your home quarter, then bear them off before your opponent does.

|  |  |
|---|---|
| **Players** | 2–2, best at 2 |
| **Box says** | 30 min |
| **Actually takes** | 25 min |
| **Teach time** | 10 min |
| **Between your turns** | 20 sec |
| **Works at age** | 8+ |
| **Weight** | ●●●○○ 2.6 / 5 |
| **Luck** | 45% chance, 55% skill |
| **Family** | race-and-block |

## How many players changes what

| Players | Setup | Notes |
|---|---|---|
| **2** | The standard opening arrangement — two checkers on your twenty-four point, five on your thirteen, three on your eight and five on your six, mirrored for your opponent. | Backgammon is a two-player game and every attempt to extend it changes what it is. Chouette is the exception and is played as one player against a team. |

## Rules

A race in which both players run in opposite directions around the same
twenty-four points, and can knock each other back to the start on the way.

## The board

Twenty-four narrow triangles, called points, in two alternating colours. Each
player moves their fifteen checkers in the opposite direction to their opponent,
towards their own home board — the final quarter.

The standard start places two checkers on your twenty-four point, five on your
thirteen, three on your eight and five on your six.

## Moving

Roll two dice. You may move one checker by the first die and another by the
second, or move a single checker by both numbers in sequence — in which case
the intermediate point must also be legal to land on.

Rolling a double gives you four moves of that number rather than two.

You may only land on a point that is empty, holds your own checkers, or holds
exactly one enemy checker. A point occupied by two or more enemy checkers is
closed to you completely.

You must use both dice if any legal way exists to do so. If only one can be
played, play the higher.

## Hitting and the bar

Landing on a point with exactly one enemy checker sends that checker to the bar.
Its owner must bring it back into their opponent's home board — starting the
whole lap again — before making any other move at all. A player with a checker
on the bar can be completely stuck.

## Bearing off

Once all fifteen of your checkers are inside your home board, you may begin
bearing off — removing them with exact rolls. If you roll a number higher than
any occupied point, you may bear off from the highest point you still hold.

Get hit at this stage and that checker returns to the bar and must travel the
entire way round again, which is how apparently won games are lost.

## The doubling cube

At the start of any turn, before rolling, you may offer to double the stake.
Your opponent either declines and loses immediately at the current value, or
accepts and takes ownership of the cube — after which only they may double next.

The cube is what makes backgammon a game of judgement rather than a dice race,
and it is the part most casual players never use.

## Scoring

A normal win scores the cube value. Winning before your opponent has borne off
any checker is a gammon and scores double. Winning while they still have a
checker on the bar or in your home board is a backgammon and scores triple.

## Settle the argument

### Do you have to play both dice if the move is bad for you?

**Official rule.** Played by almost everyone, almost everywhere.

Yes. If any legal sequence uses both numbers, you must play one of them. Where only one number can be played, you are required to play the higher. Preferring not to move is never a reason to leave a die unused.

*What it changes:* Being forced to break a strong position is a genuine part of the game and one of the main sources of pressure in the bear-in.

```console
$ rulebook ruling backgammon "do I have to use both numbers"
```

### Who can double after a double has been accepted?

**Official rule.** Widespread but far from universal.

Only the player who accepted. Taking a double gives you sole ownership of the cube, and your opponent cannot double again until you have used it. This is what stops a stronger player simply doubling every turn.

```console
$ rulebook ruling backgammon "doubling cube rules"
```

### Can you move other checkers while one is on the bar?

**Official rule.** Played by almost everyone, almost everywhere.

No. Every checker on the bar must re-enter your opponent's home board before you may move anything else. If you cannot enter, your entire turn is forfeited, and against a well-made board that can happen many turns running.

```console
$ rulebook ruling backgammon "checker on the bar"
```

### Can you immediately redouble when offered a double?

**Not an official rule.** Widespread but far from universal.

Not in the standard rules. Accepting a double gives you the cube, but you cannot use it until your own turn.

*The house version:* Under the beaver rule, a player who believes the double was a mistake may accept and immediately redouble while keeping ownership of the cube. Money play uses it often; match play essentially never does.

*What it changes:* It punishes bad doubles severely and makes players considerably more cautious about offering the cube at all.

```console
$ rulebook ruling backgammon "beaver rule"
```

### What happens if you roll higher than any checker you have left?

**Official rule.** Widespread but far from universal.

You bear off a checker from your highest occupied point. This only applies when no point higher than the number rolled is occupied — otherwise you must make a legal move within the home board instead.

```console
$ rulebook ruling backgammon "bearing off high roll"
```

### When does a win count double or triple?

**Official rule.** Widespread but far from universal.

A gammon doubles the stake and happens when the loser has borne off no checkers at all. A backgammon triples it, and requires the loser to still have a checker on the bar or inside the winner's home board. Both are multiplied by whatever the doubling cube stands at.

```console
$ rulebook ruling backgammon "gammon meaning"
```

## Teaching it

Ten minutes, and you must resist teaching the doubling cube. Leave it in the
box for the first game entirely.

**Establish the directions first, physically.** Put your finger on their
twenty-four point and trace their whole route to their home board, then do
yours. Two people running opposite ways around the same track is the single
thing that confuses beginners, and thirty seconds of tracing prevents an hour
of it.

**Then the only restriction that matters:** "You can land anywhere except a
point where I've got two or more." Say it once, point at an example on the
board, and move on.

**Then hitting.** "If there's exactly one of mine sitting there, I go back to the
start." Their face will tell you when it lands.

**Then the bar, immediately after,** because it is the consequence of hitting
and it is severe: "And while I'm on the bar, I can't do anything else at all
until I get back in." That severity is the game's engine.

**Play the first game without the cube.** It adds a whole second layer of
decision-making, and a beginner who is still working out which way they are
going cannot evaluate a double sensibly. Say: "There's one more piece of
equipment and we'll use it next game."

**Teach the cube as a question, not a mechanism.** Once they have played once,
say: "Any time before you roll, you can ask me if I want to play for double. I
either quit now and pay one, or I accept — and then only I can double next."
Framing it as a decision about *when to quit* makes it intuitive immediately.

**The sentence that stops the most arguments:** "You have to play both numbers
if there's any way to do it, even if you'd rather not." Beginners routinely try
to play one and skip the other because the second move is bad for them.

## Variants worth knowing

**Chouette** — One player takes on several opponents at once, each with their own doubling cube. The standard way to play backgammon with more than two people.

**Nackgammon** — A different starting arrangement that puts more checkers deep in enemy territory, producing longer and more tactical games.

**Hypergammon** — Three checkers each instead of fifteen. Very short, very sharp, and solved by computers.

## When it is fair to stop

Resigning is built into the game rather than being an act of grace. Declining a double is a formal resignation of that game at its current stake, and doing it early in a hopeless race is correct play rather than poor sportsmanship.

## When a piece goes missing

Checkers can be coins or draughts pieces without any loss. The doubling cube can be a scrap of paper with a number written on it and a note of who owns it. A missing die genuinely stops play.

## Accessibility

The two checker colours are frequently dark brown and black, which is a poor contrast pairing in low light; sets with a strong light-dark contrast are much easier. Counting pip totals is the main cognitive demand, and there is no shame in doing it aloud. Boards with recessed points make lifting checkers harder for anyone with limited dexterity.

## Sources

- <https://www.bkgm.com/rules.html>

---

*Generated from [`games/backgammon/`](../../games/backgammon/). Fix it there, not here.*
