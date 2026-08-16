# Translations

The schema separates *facts* from *prose*, which means a translation is a
parallel file rather than a fork.

## What needs translating, and what does not

| Stays as it is | Needs translating |
|---|---|
| `game.yml` — numbers, durations, slugs, ages | `objective`, `concession`, `tiebreak`, `substitutions`, `accessibility` |
| ruling `id`, `kind`, `official`, `prevalence` | `question`, `asked_as`, `verdict`, `house_rule`, `effect` |
| — | `rules.md`, `teach.md` |

Everything a program reasons about is language-independent. Everything a person
reads is not.

## How to add one

Prose files take a language suffix:

```
games/uno/rules.md          → games/uno/rules.fr.md
games/uno/teach.md          → games/uno/teach.fr.md
games/uno/rulings.yml       → games/uno/rulings.fr.yml
games/uno/game.fr.yml       (only the prose fields; the rest is inherited)
```

Then:

```console
$ rulebook --lang fr ruling uno "empiler"
$ npm run build -- --lang fr
```

Anything missing falls back to English rather than failing, so a partial
translation is genuinely useful and there is no need to finish a language
before opening a pull request.

## Please translate rather than re-derive

Two rules of the road, both for the same reason as the English text:

1. **Do not paste a publisher's translated rulebook.** Their French wording is
   as copyrighted as their English wording. `npm run check` runs against
   translations too.
2. **Translate the meaning, not the sentence.** `asked_as` in particular should
   be what somebody would actually shout in that language, not a literal
   rendering of the English phrase. It is the field search depends on.

## Wanted

French, German, Spanish, Hindi and Mandarin would each reach a large number of
tables. Indian Rummy and Ludo in Hindi would be especially welcome — both games
are played far more widely there than in the language this registry was written
in, and the house rules that dominate there are under-represented here.
