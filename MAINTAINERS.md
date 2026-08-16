# Adopt a game

Thirty-six games is more than one person can keep honest. Right now **4 of 36**
have been verified against a source in the last year, and that number is the
most useful measure of this project's health.

Adopting a game means: you are the person who checks it. Not that you wrote it,
not that you own it, and not that you have to answer every issue about it.

## What a maintainer actually does

Roughly an hour, once a year:

1. **Re-read the source** listed in `games/<slug>/game.yml` and check the facts
   still match. Rules do change between printings.
2. **Update the `verified` block** with today's date and what you checked.
3. **Add one ruling** you have personally argued about. This is the valuable part.

That is the whole job. If a source has gone dead, replace it and say so —
`data/archive.yml` has an archived copy of nearly every one.

## Adopting

Open an issue titled `[adopt] <game>` and say which game and, ideally, roughly
how much you play it. Somebody who plays Catan monthly is a better maintainer
for Catan than somebody who has read the rulebook twice.

You can adopt more than one. You can hand one back at any time, with no
explanation — an unmaintained game is honest; a game listed as maintained by
somebody who has drifted away is not.

## Who has adopted what

| Game | Maintainer | Last verified |
|---|---|---|
| Uno | [@mohitagw15856](https://github.com/mohitagw15856) | 2026-08-16 |
| Ludo | [@mohitagw15856](https://github.com/mohitagw15856) | 2026-08-16 |
| Skull | [@mohitagw15856](https://github.com/mohitagw15856) | 2026-08-16 |
| Pablo | [@mohitagw15856](https://github.com/mohitagw15856) | 2026-08-16 |
| *the other 32* | **unadopted** | never |

Run `rulebook verify` or `npm run coverage` for the current state — this table
is written by hand and the commands are not.

## Games most worth adopting

The ones people argue about hardest, and which nobody has checked:

**Monopoly**, **Catan**, **Scrabble**, **Chess**, **Texas Hold'em**,
**Cribbage**, **Werewolf**, **Codenames**.

Between them they account for most of the traffic and most of the arguments.
