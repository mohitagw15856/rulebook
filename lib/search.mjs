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

export function scoreMatch(ruling, query) {
  const q = query
    .toLowerCase()
    .replace(/[^a-z0-9+ ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  if (!q.length) return 0;
  const haystacks = [
    [ruling.question, 3],
    [(ruling.asked_as || []).join(' | '), 4],
    [ruling.id.replace(/-/g, ' '), 3],
    [ruling.verdict, 1],
    [ruling.house_rule || '', 1],
  ];
  let total = 0;
  for (const [text, weight] of haystacks) {
    const t = String(text).toLowerCase();
    for (const word of q) if (t.includes(word)) total += weight;
    // An exact phrase match in the asked-as list is worth a lot.
    if (weight === 4 && t.includes(query.toLowerCase())) total += 25;
  }
  // One stray word buried in a verdict is not a match. Three points is the
  // cost of a single hit in the question, the phrasings, or the id.
  return total >= 3 ? total : 0;
}


// Rulings that match, best first.
export function search(rulings, query) {
  return rulings
    .map((r) => ({ r, s: scoreMatch(r, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
}
