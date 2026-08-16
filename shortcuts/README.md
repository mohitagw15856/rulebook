# Ask Siri

> **What this is, honestly:** Apple's Shortcuts files are a signed binary plist
> that only Shortcuts itself can produce, so this directory cannot ship a
> double-clickable `.shortcut`. What it can do is give you a four-step recipe
> that takes two minutes to build once and then works forever, and a URL scheme
> that already works today with nothing installed.

## The thing that works right now

Ask any device with a browser:

```
https://mohitagw15856.github.io/rulebook/#uno/stacking-draw-cards
```

Or hit the JSON API directly, which is what the shortcut below does:

```
https://mohitagw15856.github.io/rulebook/api/games/uno.json
```

## Build the shortcut (two minutes, once)

1. **Shortcuts → new shortcut → Add Action → Ask for Input.**
   Prompt: `Which game?` — Input type: Text.
2. **Add Action → Get Contents of URL.**
   URL: `https://mohitagw15856.github.io/rulebook/api/games/` then insert the
   *Provided Input* variable, then `.json`
3. **Add Action → Get Dictionary Value.**
   Get `Value` for key `rulings` in *Contents of URL*.
4. **Add Action → Show Result.** Pass the dictionary value straight in.

Rename it **Rulebook**, and Siri will answer "Hey Siri, Rulebook".

### Going further

Add a **Repeat with Each** over `rulings` and a **Get Dictionary Value** for
`question` and `verdict` to read the answers out loud. Add a second **Ask for
Input** and a **Filter** to search within a game.

The key fields on every ruling are `question`, `official` (true or false),
`prevalence`, `verdict`, `house_rule` and `url`. `official` is the one worth
surfacing first — it is the answer to the argument.

## Why the API is shaped the way it is

Every endpoint is a plain static file with no key, no rate limit and no
versioning dance, precisely so that a four-step shortcut can consume it without
anybody writing a client. See [the JSON API](../README.md#the-json-api).
