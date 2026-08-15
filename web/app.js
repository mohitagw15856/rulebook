// rulebook — the web front end.
//
// Zero dependencies here too. The registry is inlined into the page at build
// time, and the scoring engines are the *same* modules the CLI runs — imported
// straight from lib/ and games/, no bundler, no rewrite. If a scorer is wrong
// here it is wrong at the table, which is exactly the property we want.

import { search } from './lib/search.mjs';

const DATA = window.RULEBOOK;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fmt = (d) => {
  const m = String(d).match(/^(\d+(?:\.\d+)?)(s|m|h)$/);
  if (!m) return String(d);
  return { s: `${m[1]}s`, m: `${m[1]} min`, h: `${m[1]} hr` }[m[2]];
};
const mins = (d) => {
  const m = String(d).match(/^(\d+(?:\.\d+)?)(s|m|h)$/);
  if (!m) return Infinity;
  return { s: +m[1] / 60, m: +m[1], h: +m[1] * 60 }[m[2]];
};
// "2–2 · best 2" is nonsense. A fixed-count game is just its count.
const players = (p) => {
  if (p.min === p.max) return String(p.min);
  return `${p.min}–${p.max}${p.best ? ` · best ${p.best}` : ''}`;
};

const dots = (w) =>
  `<span class="dots">${Array.from({ length: 5 }, (_, i) => `<i class="${i < Math.round(w) ? 'f' : ''}"></i>`).join('')}</span>`;

const PREVALENCE = {
  'near-universal': 'played almost everywhere',
  common: 'widespread, not universal',
  regional: 'standard in some places only',
  rare: 'occasional',
};

const ALL = DATA.games.flatMap((g) => g.rulings.map((r) => ({ ...r, _game: g })));
const HOUSE = ALL.filter((r) => !r.official);
const UNIVERSAL = HOUSE.filter((r) => r.prevalence === 'near-universal');

// ---------------------------------------------------------------------------
// Chrome: scroll progress, sticky nav, spotlight, reveals
// ---------------------------------------------------------------------------
function chrome() {
  const bar = $('#progress');
  const nav = $('#nav');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    nav.classList.toggle('stuck', scrollY > 12);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!REDUCED) {
    const spot = $('#spot');
    addEventListener('pointermove', (e) => {
      spot.style.opacity = 1;
      spot.style.left = `${e.clientX}px`;
      spot.style.top = `${e.clientY}px`;
    }, { passive: true });
  }

  const io = new IntersectionObserver(
    (es) => es.forEach((en) => en.isIntersecting && en.target.classList.add('in')),
    { threshold: 0.06, rootMargin: '0px 0px -6% 0px' }
  );
  $$('.reveal').forEach((el) => io.observe(el));
}

// Cards that light up and tilt slightly towards the pointer.
function interactive(el, tilt = true) {
  if (REDUCED) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (tilt) {
      const rx = ((y / r.height) - 0.5) * -5;
      const ry = ((x / r.width) - 0.5) * 5;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
    }
  });
  el.addEventListener('pointerleave', () => {
    if (tilt) el.style.transform = '';
  });
}

// Count up when scrolled into view.
function countUp(el, to) {
  if (REDUCED) {
    el.textContent = to;
    return;
  }
  const io = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(el);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1300);
        el.textContent = Math.round(to * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.2 });
  io.observe(el);
}

// ---------------------------------------------------------------------------
function eyebrow() {
  $('#eyebrow').innerHTML =
    `<span class="dot"></span> <b>${ALL.length}</b> rulings across <b>${DATA.games.length}</b> games · works offline`;
}

function stats() {
  const overrun = DATA.games.reduce((a, g) => a + (mins(g.playtime_actual) - mins(g.playtime_box)), 0);
  const rows = [
    [DATA.games.length, 'games', false],
    [ALL.length, 'rulings', false],
    [UNIVERSAL.length, 'played by all, real by none', true],
    [Math.round(overrun), 'minutes the boxes lie by', true],
  ];
  $('#stats').innerHTML = rows
    .map(([n, l, hl]) => `<div class="stat${hl ? ' hl' : ''}"><b data-to="${n}">0</b><span>${l}</span></div>`)
    .join('');
  $$('.stat b').forEach((el) => countUp(el, +el.dataset.to));

  $('#foot-stats').textContent =
    `${DATA.games.length} games · ${ALL.length} rulings · ${UNIVERSAL.length} of them house rules almost everyone plays`;
}

// ---------------------------------------------------------------------------
// Settle it
// ---------------------------------------------------------------------------
function verdictCard(r, i) {
  const accent = r.official ? 'var(--mint)' : 'var(--gold)';
  return `
  <article class="verdict" style="--accent:${accent};animation-delay:${i * 55}ms">
    <div class="game">${esc(r._game.name)}</div>
    <h3>${esc(r.question)}</h3>
    <span class="badge">${r.official ? 'OFFICIAL RULE' : 'NOT AN OFFICIAL RULE'}</span>
    <span class="prev">${PREVALENCE[r.prevalence] || r.prevalence}</span>
    <p>${esc(r.verdict)}</p>
    ${r.house_rule ? `<div class="lbl">The house version</div><p>${esc(r.house_rule)}</p>` : ''}
    ${r.effect ? `<div class="lbl">What it changes</div><p>${esc(r.effect)}</p>` : ''}
    ${r.regions && !r.regions.includes('global') ? `<p class="src">Played mostly in: ${esc(r.regions.join(', '))}</p>` : ''}
    ${r.source ? `<p class="src">Source: <a href="${esc(r.source)}" rel="noopener">${esc(r.source)}</a></p>` : ''}
    <button class="share" data-share="${esc(r._game.slug)}/${esc(r.id)}">share this ruling</button>
  </article>`;
}

function settle() {
  const input = $('#q');
  const out = $('#verdicts');

  const render = () => {
    const q = input.value.trim();
    if (!q) {
      out.innerHTML = '';
      return;
    }
    // The same matcher the CLI uses, run over every game's rulings at once —
    // which is the one thing the terminal cannot do.
    const hits = search(ALL, q).slice(0, 5);
    out.innerHTML = hits.length
      ? hits.map((x, i) => verdictCard(x.r, i)).join('')
      : `<div class="miss">
           <b>Nothing on file matches that.</b>
           If it's a real dispute, that's a gap worth filing —
           <a href="https://github.com/mohitagw15856/rulebook/issues/new" rel="noopener">open an issue</a>
           and it becomes part of the registry.
         </div>`;
  };

  const rerender = () => {
    render();
    $$('#verdicts .share').forEach((b) =>
      b.addEventListener('click', () => {
        const [gs, rid] = b.dataset.share.split('/');
        copyShare(b, shareLink(gs, rid));
      })
    );
  };
  input.addEventListener('input', rerender);
  $$('#examples button').forEach((b) =>
    b.addEventListener('click', () => {
      input.value = b.dataset.q;
      rerender();
      input.focus();
      out.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    })
  );

  // "/" focuses the search from anywhere, the way every good search does.
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

// ---------------------------------------------------------------------------
function fakes() {
  $('#ticker').innerHTML = [...UNIVERSAL, ...UNIVERSAL, ...UNIVERSAL]
    .map((r) => `<span>${esc(r._game.name)} — ${esc(r.question)}</span>`)
    .join('');

  $('#fakes').innerHTML = UNIVERSAL.map(
    (r) => `
    <article class="fake">
      <div class="stamp">NOT REAL</div>
      <div class="game">${esc(r._game.name)}</div>
      <h4>${esc(r.question)}</h4>
      <p>${esc(r.verdict.slice(0, 190))}${r.verdict.length > 190 ? '…' : ''}</p>
    </article>`
  ).join('');
  $$('.fake').forEach((el) => interactive(el, false));
}

// ---------------------------------------------------------------------------
// The box is lying
// ---------------------------------------------------------------------------
function lying() {
  const rows = DATA.games
    .map((g) => ({ g, box: mins(g.playtime_box), real: mins(g.playtime_actual) }))
    .sort((a, b) => b.real - b.box - (a.real - a.box));
  const max = Math.max(...rows.map((r) => r.real));

  $('#bars').innerHTML =
    rows
      .map(({ g, box, real }) => {
        const over = Math.round(real - box);
        return `
      <div class="bar">
        <div class="n">${esc(g.name)}</div>
        <div class="track2">
          <div class="real" data-w="${(real / max) * 100}"></div>
          <div class="box"  data-w="${(box / max) * 100}"></div>
        </div>
        <div class="over ${over > 0 ? '' : 'none'}">${over > 0 ? `+${over} min` : 'honest'}</div>
      </div>`;
      })
      .join('') +
    `<div class="barkey">
       <span><i style="background:rgba(255,255,255,.13)"></i>what the box claims</span>
       <span><i style="background:var(--gold)"></i>what it actually takes</span>
     </div>`;

  // Grow the bars once the section is on screen.
  const io = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      $$('#bars .real, #bars .box').forEach((el, i) => {
        setTimeout(() => (el.style.width = `${el.dataset.w}%`), REDUCED ? 0 : i * 22);
      });
    });
  }, { threshold: 0.15 });
  io.observe($('#bars'));
}

// ---------------------------------------------------------------------------
// What should we play?
// ---------------------------------------------------------------------------
function games() {
  const grid = $('#grid-games');
  const none = $('#nogames');
  const state = { players: '', minutes: '', weight: '', type: '' };

  const draw = () => {
    const list = DATA.games
      .filter(
        (g) =>
          (!state.players || (+state.players >= g.players.min && +state.players <= g.players.max)) &&
          (!state.minutes || mins(g.playtime_actual) <= +state.minutes) &&
          (!state.weight || g.weight <= +state.weight) &&
          (!state.type || g.type === state.type)
      )
      .sort((a, b) => mins(a.playtime_actual) - mins(b.playtime_actual));

    none.hidden = list.length > 0;
    grid.innerHTML = list
      .map((g, i) => {
        const over = Math.round(mins(g.playtime_actual) - mins(g.playtime_box));
        return `
      <article class="gcard" data-slug="${g.slug}" style="animation-delay:${i * 40}ms" tabindex="0" role="button">
        <div class="top">
          <span class="fam">${esc(g.type)} · ${esc(g.family)}</span>
          <span class="cnt">${g.rulings.length}</span>
        </div>
        <h3>${esc(g.name)}</h3>
        <dl class="meta">
          <dt>players</dt><dd>${players(g.players)}</dd>
          <dt>box</dt><dd>${fmt(g.playtime_box)}</dd>
          <dt>really</dt><dd class="${over > 0 ? 'lie' : ''}">${fmt(g.playtime_actual)}${over > 0 ? ` (+${over})` : ''}</dd>
          <dt>teach</dt><dd>${fmt(g.teach_time)}</dd>
          <dt>brain</dt><dd>${dots(g.weight)}</dd>
        </dl>
        ${g.hasScore ? '<div class="scorer">↓ has a scorer</div>' : ''}
      </article>`;
      })
      .join('');

    $$('.gcard').forEach((c) => {
      interactive(c);
      c.addEventListener('click', () => openGame(c.dataset.slug));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openGame(c.dataset.slug);
        }
      });
    });
  };

  $$('.fgroup').forEach((group) => {
    const key = group.dataset.filter;
    $$('.pill', group).forEach((p) =>
      p.addEventListener('click', () => {
        $$('.pill', group).forEach((x) => x.classList.remove('on'));
        p.classList.add('on');
        state[key] = p.dataset.v;
        draw();
      })
    );
  });
  draw();
}

// ---------------------------------------------------------------------------
function openGame(slug, focusRuling = null) {
  const g = DATA.games.find((x) => x.slug === slug);
  if (!g) return;
  const over = Math.round(mins(g.playtime_actual) - mins(g.playtime_box));

  $('#m-body').innerHTML = `
    <h2 id="m-title">${esc(g.name)}</h2>
    <p>${esc(g.objective)}</p>

    <table>
      <tr><td>players</td><td>${players(g.players)}</td></tr>
      <tr><td>box says</td><td>${fmt(g.playtime_box)}</td></tr>
      <tr><td>really takes</td><td>${fmt(g.playtime_actual)}${over > 0 ? ` <b style="color:var(--gold)">— over by ${over} min</b>` : ''}</td></tr>
      <tr><td>teach time</td><td>${fmt(g.teach_time)}</td></tr>
      <tr><td>between turns</td><td>${fmt(g.downtime)}${mins(g.downtime) >= 3 ? ' <b style="color:var(--gold)">— long enough to lose people</b>' : ''}</td></tr>
      <tr><td>works at age</td><td>${g.min_age}+</td></tr>
      <tr><td>brain</td><td>${dots(g.weight)} ${g.weight} / 5</td></tr>
      <tr><td>luck</td><td>${g.luck}% chance, ${100 - g.luck}% skill</td></tr>
    </table>

    <h3>How many players changes what</h3>
    <table>${g.setup_by_players
      .map(
        (s) =>
          `<tr><td>${esc(s.players)}</td><td>${esc(s.setup)}${s.note ? `<br><span style="color:var(--dimmer);font-size:.88em">${esc(s.note)}</span>` : ''}</td></tr>`
      )
      .join('')}</table>

    <h3>A turn</h3>
    <ol>${g.turn_structure.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

    <h3>Winning</h3>
    <p>${esc(g.win_condition)}</p>

    ${g.rulings.length
      ? `<h3>Settle the argument</h3>${g.rulings
          .map(
            (r) => `<div class="rul ${r.official ? 'off' : ''}" id="r-${esc(r.id)}">
              <b>${esc(r.question)}</b>
              <span class="k">${r.official ? 'official' : 'not official'} · ${PREVALENCE[r.prevalence] || ''}</span>
              <p>${esc(r.verdict)}</p>
              ${r.house_rule ? `<p><b style="color:var(--pink);display:inline">The house version:</b> ${esc(r.house_rule)}</p>` : ''}
              <button class="share" data-share="${esc(g.slug)}/${esc(r.id)}">share this ruling</button>
            </div>`
          )
          .join('')}`
      : ''}

    ${g.variants?.length
      ? `<h3>Variants worth knowing</h3>${g.variants
          .map((v) => `<p><b style="color:var(--ink)">${esc(v.name)}</b> — ${esc(v.changed)}</p>`)
          .join('')}`
      : ''}

    <h3>When it is fair to stop</h3>
    <p>${esc(g.concession)}</p>

    <h3>When a piece goes missing</h3>
    <p>${esc(g.substitutions)}</p>

    <h3>Accessibility</h3>
    <p>${esc(g.accessibility)}</p>

    ${g.sources?.length
      ? `<h3>Sources</h3><ul>${g.sources.map((s) => `<li><a href="${esc(s)}" rel="noopener">${esc(s)}</a></li>`).join('')}</ul>`
      : ''}

    <h3>At the table</h3>
    <p style="font-family:var(--mono);font-size:.86rem;color:var(--mint)">
      $ rulebook ruling ${esc(g.slug)} "…"${g.hasScore ? `<br>$ rulebook score ${esc(g.slug)} "…"` : ''}
    </p>`;

  const m = $('#modal');
  m.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#m-close').focus();

  $$('#m-body .share').forEach((b) =>
    b.addEventListener('click', () => {
      const [gs, rid] = b.dataset.share.split('/');
      copyShare(b, shareLink(gs, rid));
    })
  );

  if (focusRuling) {
    const el = $(`#r-${CSS.escape(focusRuling)}`, $('#m-body'));
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
      el.classList.add('lit');
    }
  }
  // Keep the address bar honest so the link is copyable from there too.
  if (location.hash !== `#${slug}${focusRuling ? '/' + focusRuling : ''}`) {
    history.replaceState(null, '', `#${slug}${focusRuling ? '/' + focusRuling : ''}`);
  }
}

// A link straight to one ruling, so an argument can be settled in a group chat
// rather than in person. This is how most of them actually happen.
function shareLink(gameSlug, rulingId) {
  return `${location.origin}${location.pathname}#${gameSlug}${rulingId ? '/' + rulingId : ''}`;
}

async function copyShare(btn, url) {
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ url, title: 'rulebook' });
      return;
    }
    await navigator.clipboard.writeText(url);
    const was = btn.textContent;
    btn.textContent = 'link copied';
    setTimeout(() => (btn.textContent = was), 1500);
  } catch {
    /* the user dismissed the share sheet; nothing to report */
  }
}

// #catan or #catan/robber-seven-discard
function routeFromHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!raw || raw.includes('=')) return;
  const [slug, rulingId] = raw.split('/');
  const game = DATA.games.find((g) => g.slug === slug);
  if (!game) return;
  openGame(slug, rulingId);
}

function modal() {
  const m = $('#modal');
  const close = () => {
    m.hidden = true;
    document.body.style.overflow = '';
  };
  $('#m-close').addEventListener('click', close);
  m.addEventListener('click', (e) => e.target === m && close());
  addEventListener('keydown', (e) => e.key === 'Escape' && !m.hidden && close());
  addEventListener('hashchange', routeFromHash);
  routeFromHash();
}

// ---------------------------------------------------------------------------
// Scoring — the real modules, loaded on demand
// ---------------------------------------------------------------------------
async function scorers() {
  const withScore = DATA.games.filter((g) => g.hasScore);
  let mod = null;

  $('#score-tabs').innerHTML = withScore
    .map((g, i) => `<button data-slug="${g.slug}" aria-selected="${i === 0}">${esc(g.name)}</button>`)
    .join('');

  const load = async (g) => {
    mod = await import(`./games/${g.slug}/score.mjs`);
    $('#score-label').textContent = mod.usage;
    const first = (mod.examples?.[0] || '').replace(/^rulebook score \S+ /, '');
    $('#score-in').placeholder = first.replace(/^"|"$/g, '');
    $('#score-in').value = '';
    $('#score-out').textContent = '';
    $('#score-out').classList.remove('err');
    $('#score-egs').innerHTML = (mod.examples || [])
      .map((e) => {
        const arg = e.replace(/^rulebook score \S+ /, '');
        return `<button data-args="${esc(arg)}">${esc(arg)}</button>`;
      })
      .join('');
    $$('#score-egs button').forEach((b) =>
      b.addEventListener('click', () => {
        $('#score-in').value = b.dataset.args.replace(/^"|"$/g, '');
        run();
      })
    );
  };

  // Split on spaces but keep quoted groups together — the modules expect argv,
  // so we hand them argv exactly as a shell would.
  const argv = (s) => (s.match(/"[^"]*"|\S+/g) || []).map((a) => a.replace(/^"|"$/g, ''));

  const run = () => {
    const out = $('#score-out');
    const raw = $('#score-in').value.trim();
    if (!raw) return;
    try {
      out.classList.remove('err');
      out.textContent = mod.run(argv(raw)).join('\n');
    } catch (e) {
      out.classList.add('err');
      out.textContent = `${e.message}\n\n${mod.usage}`;
    }
  };

  $$('#score-tabs button').forEach((b) =>
    b.addEventListener('click', async () => {
      $$('#score-tabs button').forEach((x) => x.setAttribute('aria-selected', x === b));
      await load(withScore.find((g) => g.slug === b.dataset.slug));
    })
  );
  $('#score-go').addEventListener('click', run);
  $('#score-in').addEventListener('keydown', (e) => e.key === 'Enter' && run());

  await load(withScore[0]);
}

// ---------------------------------------------------------------------------
function terminal() {
  const el = $('#term');
  const script = [
    ['p', '$ '], ['c', 'npx @mohitagw15856/rulebook uno "can I stack a draw 2"\n'],
    ['o', '\nCan you stack a Draw Two on a Draw Two, or a Draw Four on a Draw Four?\n'],
    ['g', '● NOT AN OFFICIAL RULE   played by almost everyone, almost everywhere\n\n'],
    ['o', '  No. Under the published rules there is no stacking. A player hit\n  with a Draw Two draws two cards and loses their turn.\n\n'],
    ['p', '$ '], ['c', 'rulebook score poker "Ah Ad Kc Kh 2s" vs "Qs Qh Qd 7c 3d"\n'],
    ['o', '\nHand 1: Two pair — aces and kings\nHand 2: Three of a kind — queens\n\n'],
    ['g', 'Hand 2 wins.\n\n'],
    ['p', '$ '], ['c', 'rulebook find --players 6 --minutes 30\n'],
    ['o', '\n  Go Fish       20 min   2-6p   weight 1\n  Codenames     25 min   2-8p   weight 1.3\n  Crazy Eights  25 min   2-7p   weight 1\n  Blackjack     30 min   1-7p   weight 1.8\n'],
  ];

  if (REDUCED) {
    el.innerHTML = script.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('');
    return;
  }

  let started = false;
  const io = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (!en.isIntersecting || started) return;
      started = true;
      let si = 0, ci = 0;
      el.innerHTML = '';
      const tick = () => {
        if (si >= script.length) return;
        const [cls, text] = script[si];
        if (ci === 0) el.insertAdjacentHTML('beforeend', `<span class="${cls}"></span>`);
        const span = el.lastElementChild;
        // Commands type out; output lands in one go, the way real output does.
        if (cls === 'c') {
          span.textContent = text.slice(0, ++ci);
          if (ci >= text.length) { si++; ci = 0; }
          setTimeout(tick, 24);
        } else {
          span.textContent = text;
          si++; ci = 0;
          setTimeout(tick, cls === 'p' ? 80 : 500);
        }
      };
      tick();
    });
  }, { threshold: 0.25 });
  io.observe(el);
}

function copyBtns() {
  $$('.copy').forEach((b) =>
    b.addEventListener('click', async () => {
      await navigator.clipboard.writeText($(`#${b.dataset.t}`).textContent);
      b.textContent = 'copied';
      setTimeout(() => (b.textContent = 'copy'), 1400);
    })
  );
}


// ---------------------------------------------------------------------------
// Around the world — rules that are standard somewhere and unknown elsewhere
// ---------------------------------------------------------------------------
function regions() {
  const byRegion = new Map();
  for (const r of ALL) {
    const list = (r.regions || []).filter((x) => x && x !== 'global');
    for (const region of list) {
      if (!byRegion.has(region)) byRegion.set(region, []);
      byRegion.get(region).push(r);
    }
  }
  const el = $('#regions');
  if (!byRegion.size) {
    el.innerHTML = '<p class="empty">No region-specific rulings on file yet.</p>';
    return;
  }
  el.innerHTML = [...byRegion.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(
      ([region, rulings]) => `
      <article class="region">
        <h4>${esc(region)}</h4>
        <span class="count">${rulings.length} ruling${rulings.length === 1 ? '' : 's'}</span>
        <ul>${rulings
          .map(
            (r) =>
              `<li><a href="#${esc(r._game.slug)}/${esc(r.id)}"><b>${esc(r._game.name)}</b> — ${esc(r.question)}</a></li>`
          )
          .join('')}</ul>
      </article>`
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Scorepad — the back of an envelope, saved
// ---------------------------------------------------------------------------
function scorepad() {
  const KEY = 'rulebook.scorepad.v1';
  const table = $('#pad');
  const empty = $('#pad-empty');

  const load2 = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { players: [], rounds: [] };
    } catch {
      return { players: [], rounds: [] };
    }
  };
  const save = (s2) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s2));
    } catch {
      /* private browsing; the pad still works for this session */
    }
  };

  let state = load2();

  const totals = () =>
    state.players.map((_, i) => state.rounds.reduce((a, r) => a + (Number(r[i]) || 0), 0));

  const draw = () => {
    empty.hidden = state.players.length > 0;
    if (!state.players.length) {
      table.innerHTML = '';
      return;
    }
    const t = totals();
    const lead = Math.max(...t);
    table.innerHTML =
      `<thead><tr><th></th>${state.players
        .map((p, i) => `<th>${esc(p)}<button class="rm" data-rm="${i}" aria-label="Remove ${esc(p)}">×</button></th>`)
        .join('')}</tr></thead>` +
      `<tbody>${state.rounds
        .map(
          (r, ri) =>
            `<tr><td class="rn">${ri + 1}</td>${state.players
              .map(
                (_, pi) =>
                  `<td><input inputmode="numeric" value="${r[pi] ?? ''}" data-r="${ri}" data-p="${pi}" aria-label="Round ${ri + 1}"></td>`
              )
              .join('')}</tr>`
        )
        .join('')}</tbody>` +
      `<tfoot><tr><td class="rn">Σ</td>${t
        .map((v, i) => `<td class="tot ${v === lead && lead !== 0 ? 'lead' : ''}">${v}</td>`)
        .join('')}</tr></tfoot>`;

    $$('#pad input').forEach((inp) =>
      inp.addEventListener('input', () => {
        state.rounds[+inp.dataset.r][+inp.dataset.p] = inp.value === '' ? '' : Number(inp.value);
        save(state);
        // Only the totals change, so redraw those rather than the whole table —
        // rebuilding would steal focus mid-typing.
        const t2 = totals();
        const lead2 = Math.max(...t2);
        $$('#pad .tot').forEach((cell, i) => {
          cell.textContent = t2[i];
          cell.classList.toggle('lead', t2[i] === lead2 && lead2 !== 0);
        });
      })
    );
    $$('#pad .rm').forEach((b) =>
      b.addEventListener('click', () => {
        const i = +b.dataset.rm;
        state.players.splice(i, 1);
        state.rounds.forEach((r) => r.splice(i, 1));
        save(state);
        draw();
      })
    );
  };

  const addPlayer = () => {
    const name = $('#pad-name').value.trim();
    if (!name) return;
    state.players.push(name);
    state.rounds.forEach((r) => r.push(''));
    if (!state.rounds.length) state.rounds.push(state.players.map(() => ''));
    $('#pad-name').value = '';
    save(state);
    draw();
  };

  $('#pad-add').addEventListener('click', addPlayer);
  $('#pad-name').addEventListener('keydown', (e) => e.key === 'Enter' && addPlayer());
  $('#pad-round').addEventListener('click', () => {
    if (!state.players.length) return;
    state.rounds.push(state.players.map(() => ''));
    save(state);
    draw();
  });
  $('#pad-clear').addEventListener('click', () => {
    state = { players: [], rounds: [] };
    save(state);
    draw();
  });

  draw();
}

// ---------------------------------------------------------------------------
// Offline. Game night is exactly where the wifi fails.
// ---------------------------------------------------------------------------
function offline() {
  const el = $('#offline-state');
  if (!('serviceWorker' in navigator)) {
    el.textContent = 'This browser cannot cache the site for offline use.';
    return;
  }
  navigator.serviceWorker
    .register(new URL('sw.js', location.href).pathname)
    .then(() => {
      el.innerHTML = '<b>Saved for offline.</b> Every ruling works with no signal.';
      el.classList.add('ok');
    })
    .catch(() => {
      el.textContent = 'Offline caching unavailable here.';
    });
}

// ---------------------------------------------------------------------------
chrome();
eyebrow();
stats();
settle();
fakes();
lying();
games();
regions();
scorepad();
offline();
modal();
terminal();
copyBtns();
scorers();
