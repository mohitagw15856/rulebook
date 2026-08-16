// Matching a question typed at a table against the rulings on file.
//
// Lives here rather than in the CLI so it can be tested. It got its own file
// the day CI caught "how do I fold a paper crane" matching a Uno ruling on the
// strength of the word "do".

// Questions at a table are mostly function words — "can you", "do I have to",
// "what happens if". Matching on those makes every ruling match everything, so
// they carry no weight on their own.
const STOPWORDS = new Set(
  ('a an and are as at be but by can cant do does doing dont for from get got had has have how i if in into is'
    + ' it its me my no not of on or our out say says should so than that the their them then there they this to'
    + ' up us was we were what when where which who why will with would you your yours')
    .split(' ')
);

// A word, matched from a word boundary onwards, with regex characters escaped
// so a query like "+2" cannot blow up. Cached because search runs this across
// every ruling on every keystroke.
const WORDISH = new Map();
function wordish(word) {
  let re = WORDISH.get(word);
  if (!re) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // \b only marks a word/non-word transition, so it can never match before a
    // token like "+2" — the space before it is a non-word character too. Anchor
    // only when the token actually starts with a word character.
    re = new RegExp(/^\w/.test(word) ? `\\b${escaped}` : escaped);
    WORDISH.set(word, re);
  }
  return re;
}

export function scoreMatch(ruling, query) {
  const q = query
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  // Distinct terms only: "+2 on +2" asks about one thing, not two.
  const seen = new Set(q);
  q.length = 0;
  q.push(...seen);
  if (!q.length) return 0;
  const haystacks = [
    [ruling.question, 3],
    [(ruling.asked_as || []).join(' | '), 4],
    [ruling.id.replace(/-/g, ' '), 3],
    [ruling.verdict, 1],
    [ruling.house_rule || '', 1],
  ];
  let total = 0;
  const matched = new Set();
  for (const [text, weight] of haystacks) {
    const t = String(text).toLowerCase();
    // Match on a word boundary, not anywhere in the string. Plain substring
    // matching means "fold" hits "threefold repetition", which is how a
    // question about paper cranes once came back with a chess ruling.
    // A prefix still counts, so "stack" finds "stacking".
    for (const word of q) {
      if (wordish(word).test(t)) {
        total += weight;
        matched.add(word);
      }
    }
    // An exact phrase match in the asked-as list is worth a lot.
    if (weight === 4 && t.includes(query.toLowerCase())) total += 25;
  }

  // One stray word buried in a verdict is not a match. Three points is the
  // cost of a single hit in the question, the phrasings, or the id.
  if (total < 3) return 0;

  // The match also has to cover the question. Searching every game at once —
  // which the website and the bots do — means a long question will always
  // brush against *some* ruling on one incidental word. Requiring half the
  // content words keeps "free parking" working and stops "fold a paper crane"
  // confidently returning something about Fishbowl slips.
  if (matched.size < Math.ceil(q.length / 2)) return 0;

  return total;
}


// Rulings that match, best first.
export function search(rulings, query) {
  return rulings
    .map((r) => ({ r, s: scoreMatch(r, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
}
