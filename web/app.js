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
  return { s: `${m[1]} sec`, m: `${m[1]} min`, h: `${m[1]} hr` }[m[2]];
};
const mins = (d) => {
  const m = String(d).match(/^(\d+(?:\.\d+)?)(s|m|h)$/);
  if (!m) return Infinity;
  return { s: +m[1] / 60, m: +m[1], h: +m[1] * 60 }[m[2]];
};
const pips = (w) => '●'.repeat(Math.round(w)) + '○'.repeat(5 - Math.round(w));

const PREVALENCE = {
  'near-universal': 'played by almost everyone, almost everywhere',
  common: 'widespread but far from universal',
  regional: 'standard in some places, unheard of in others',
  rare: 'occasional, or specific to one group',
};

// Every ruling, with its game attached, so search can run across the lot.
const ALL = DATA.games.flatMap((g) => g.rulings.map((r) => ({ ...r, _game: g })));

// ---------------------------------------------------------------------------
// The synthwave horizon
// ---------------------------------------------------------------------------
function horizon() {
  const cv = $('#grid');
  if (!cv || REDUCED) return;
  const ctx = cv.getContext('2d');
  let w, h, t = 0;

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr;
    h = cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener('resize', size, { passive: true });

  const draw = () => {
    const W = innerWidth, H = innerHeight;
    const hz = H * 0.62; // horizon line
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;

    // Receding horizontal lines, spaced so they bunch towards the horizon.
    for (let i = 0; i < 26; i++) {
      const p = ((i + (t % 1)) / 26) ** 2.6;
      const y = hz + p * (H - hz);
      ctx.strokeStyle = `rgba(53,245,208,${0.32 * (1 - p) + 0.03})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // Verticals converging on the vanishing point.
    for (let i = -18; i <= 18; i++) {
      ctx.strokeStyle = `rgba(53,245,208,${0.13 - Math.abs(i) * 0.004})`;
      ctx.beginPath();
      ctx.moveTo(W / 2, hz);
      ctx.lineTo(W / 2 + i * W * 0.14, H);
      ctx.stroke();
    }
    // The glow sitting on the horizon.
    const g = ctx.createLinearGradient(0, hz - 90, 0, hz);
    g.addColorStop(0, 'rgba(232,185,63,0)');
    g.addColorStop(1, 'rgba(232,185,63,0.14)');
    ctx.fillStyle = g;
    ctx.fillRect(0, hz - 90, W, 90);

    t += 0.006;
    requestAnimationFrame(draw);
  };
  draw();
}

// ---------------------------------------------------------------------------
// Small flourishes
// ---------------------------------------------------------------------------
function typeOut() {
  const el = $('#type-out');
  const lines = ['settle the argument.', 'no, that is not a real rule.', 'the box is lying about the playtime.'];
  if (REDUCED) {
    el.textContent = lines[0];
    return;
  }
  let li = 0, ci = 0, back = false;
  const tick = () => {
    const line = lines[li];
    ci += back ? -1 : 1;
    el.textContent = line.slice(0, ci);
    let wait = back ? 34 : 58;
    if (!back && ci === line.length) {
      back = true;
      wait = 2600;
    } else if (back && ci === 0) {
      back = false;
      li = (li + 1) % lines.length;
      wait = 420;
    }
    setTimeout(tick, wait);
  };
  tick();
}

function cursorGlow() {
  const el = $('#glow');
  if (REDUCED) return;
  addEventListener('pointermove', (e) => {
    el.style.opacity = 1;
    el.style.left = e.clientX + 'px';
    el.style.top = e.clientY + 'px';
  }, { passive: true });
}

function reveals() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add('in')),
    { threshold: 0.08 }
  );
  $$('.reveal').forEach((el) => io.observe(el));
}

// Counters that run up to their value the first time they scroll into view.
function stats() {
  const houseRules = ALL.filter((r) => !r.official);
  const universal = houseRules.filter((r) => r.prevalence === 'near-universal');
  const overrun = DATA.games.reduce((a, g) => a + (mins(g.playtime_actual) - mins(g.playtime_box)), 0);

  const rows = [
    [DATA.games.length, 'games'],
    [ALL.length, 'rulings'],
    [universal.length, 'fake rules everyone plays'],
    [Math.round(overrun), 'minutes the boxes lie by'],
  ];
  $('#stats').innerHTML = rows
    .map(([n, l]) => `<div class="stat"><b data-to="${n}">0</b><span>${l}</span></div>`)
    .join('');

  $('#foot-stats').textContent =
    `${DATA.games.length} games · ${ALL.length} rulings · ${universal.length} of them house rules almost everyone plays`;

  const io = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const to = +en.target.dataset.to;
      if (REDUCED) {
        en.target.textContent = to;
        return;
      }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 1200);
        // ease-out so it lands rather than stops
        en.target.textContent = Math.round(to * (1 - (1 - p) ** 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  $$('.stat b').forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
// Settle it
// ---------------------------------------------------------------------------
function verdictCard(r, i) {
  const cls = r.official ? 'yes' : 'no';
  const label = r.official ? 'OFFICIAL RULE' : 'NOT AN OFFICIAL RULE';
  const colour = r.official ? 'var(--cyan)' : 'var(--gold)';
  return `
  <article class="verdict" style="--official:${colour};animation-delay:${i * 60}ms">
    <div class="game">${esc(r._game.name)}</div>
    <h3>${esc(r.question)}</h3>
    <span class="badge ${cls}">${label}</span>
    <span class="prev">${PREVALENCE[r.prevalence] || r.prevalence}</span>
    <p>${esc(r.verdict)}</p>
    ${r.house_rule ? `<div class="lbl">The house version</div><p>${esc(r.house_rule)}</p>` : ''}
    ${r.effect ? `<div class="lbl">What it changes</div><p>${esc(r.effect)}</p>` : ''}
    ${r.regions && !r.regions.includes('global') ? `<p class="src">Played mostly in: ${esc(r.regions.join(', '))}</p>` : ''}
    ${r.source ? `<p class="src">Source: <a href="${esc(r.source)}" rel="noopener">${esc(r.source)}</a></p>` : ''}
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
    // Same matcher the CLI uses, run over every game's rulings at once.
    const hits = search(ALL, q).slice(0, 6);
    out.innerHTML = hits.length
      ? hits.map((x, i) => verdictCard(x.r, i)).join('')
      : `<div class="miss">
           <b>Nothing on file matches that.</b>
           <p>If it is a real dispute, that is a gap worth filing —
           <a href="https://github.com/mohitagw15856/rulebook/issues/new" rel="noopener">open an issue</a>
           and it becomes part of the registry.</p>
         </div>`;
  };

  input.addEventListener('input', render);
  $$('#examples button').forEach((b) =>
    b.addEventListener('click', () => {
      input.value = b.dataset.q;
      render();
      input.focus();
    })
  );
}

// ---------------------------------------------------------------------------
// The wall of rules that are not rules
// ---------------------------------------------------------------------------
function fakes() {
  const universal = ALL.filter((r) => !r.official && r.prevalence === 'near-universal');
  $('#fakes').innerHTML = universal
    .map(
      (r) => `
    <article class="fake">
      <div class="stamp">NOT REAL</div>
      <div class="game">${esc(r._game.name)}</div>
      <h4>${esc(r.question)}</h4>
      <p>${esc(r.verdict.slice(0, 210))}${r.verdict.length > 210 ? '…' : ''}</p>
    </article>`
    )
    .join('');
}

// ---------------------------------------------------------------------------
// What should we play?
// ---------------------------------------------------------------------------
function games() {
  const grid = $('#grid-games');
  const none = $('#nogames');

  const draw = () => {
    const p = +$('#f-players').value || null;
    const m = +$('#f-minutes').value || null;
    const w = +$('#f-weight').value || null;
    const ty = $('#f-type').value;

    let list = DATA.games.filter(
      (g) =>
        (!p || (p >= g.players.min && p <= g.players.max)) &&
        (!m || mins(g.playtime_actual) <= m) &&
        (!w || g.weight <= w) &&
        (!ty || g.type === ty)
    );
    list.sort((a, b) => mins(a.playtime_actual) - mins(b.playtime_actual));

    none.hidden = list.length > 0;
    grid.innerHTML = list
      .map((g, i) => {
        const over = Math.round(mins(g.playtime_actual) - mins(g.playtime_box));
        return `
      <article class="gcard" data-slug="${g.slug}" style="animation-delay:${i * 45}ms" tabindex="0">
        <div class="cnt">${g.rulings.length} rulings</div>
        <div class="fam">${esc(g.type)} · ${esc(g.family)}</div>
        <h3>${esc(g.name)}</h3>
        <dl>
          <dt>players</dt><dd>${g.players.min}–${g.players.max}${g.players.best ? ` (best ${g.players.best})` : ''}</dd>
          <dt>box says</dt><dd>${fmt(g.playtime_box)}</dd>
          <dt>really</dt><dd class="${over > 0 ? 'over' : ''}">${fmt(g.playtime_actual)}${over > 0 ? ` — over by ${over}` : ''}</dd>
          <dt>teach</dt><dd>${fmt(g.teach_time)}</dd>
          <dt>weight</dt><dd class="pips">${pips(g.weight)}</dd>
          <dt>luck</dt><dd>${g.luck}%</dd>
        </dl>
      </article>`;
      })
      .join('');

    // Pointer-tracked glow, so the cards feel lit rather than flat.
    $$('.gcard').forEach((c) => {
      if (!REDUCED) {
        c.addEventListener('pointermove', (e) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--mx', `${e.clientX - r.left}px`);
          c.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
      }
      c.addEventListener('click', () => openGame(c.dataset.slug));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openGame(c.dataset.slug);
        }
      });
    });
  };

  $$('.filters select').forEach((s) => s.addEventListener('change', draw));
  $('#f-reset').addEventListener('click', () => {
    $$('.filters select').forEach((s) => (s.value = ''));
    draw();
  });
  draw();
}

// ---------------------------------------------------------------------------
// Game detail
// ---------------------------------------------------------------------------
function openGame(slug) {
  const g = DATA.games.find((x) => x.slug === slug);
  if (!g) return;
  const over = Math.round(mins(g.playtime_actual) - mins(g.playtime_box));

  $('#m-body').innerHTML = `
    <h2 id="m-title">${esc(g.name)}</h2>
    <p style="color:var(--dim);margin-top:0">${esc(g.objective)}</p>

    <table>
      <tr><td>players</td><td>${g.players.min}–${g.players.max}${g.players.best ? `, best at ${g.players.best}` : ''}</td></tr>
      <tr><td>box says</td><td>${fmt(g.playtime_box)}</td></tr>
      <tr><td>actually takes</td><td>${fmt(g.playtime_actual)}${over > 0 ? ` <span style="color:var(--gold)">— over by ${over} min</span>` : ''}</td></tr>
      <tr><td>teach time</td><td>${fmt(g.teach_time)}</td></tr>
      <tr><td>weight</td><td><span class="pips">${pips(g.weight)}</span> ${g.weight} / 5</td></tr>
      <tr><td>luck</td><td>${g.luck}% chance, ${100 - g.luck}% skill</td></tr>
    </table>

    <h3>How many players changes what</h3>
    <table>${g.setup_by_players
      .map((s) => `<tr><td>${esc(s.players)}</td><td>${esc(s.setup)}${s.note ? `<br><span style="color:var(--dim);font-size:.86em">${esc(s.note)}</span>` : ''}</td></tr>`)
      .join('')}</table>

    <h3>A turn</h3>
    <ol>${g.turn_structure.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

    <h3>Winning</h3>
    <p>${esc(g.win_condition)}</p>

    ${g.rulings.length
      ? `<h3>Settle the argument</h3>${g.rulings
          .map(
            (r) => `<div class="rul ${r.official ? 'off' : ''}">
              <b>${esc(r.question)}</b>
              <span>${r.official ? 'official rule' : 'not an official rule'} · ${PREVALENCE[r.prevalence] || ''}</span>
              <p>${esc(r.verdict)}</p>
              ${r.house_rule ? `<p><em style="color:var(--magenta)">The house version:</em> ${esc(r.house_rule)}</p>` : ''}
            </div>`
          )
          .join('')}`
      : ''}

    <h3>When a piece goes missing</h3>
    <p>${esc(g.substitutions)}</p>

    <h3>Accessibility</h3>
    <p>${esc(g.accessibility)}</p>

    ${g.sources?.length
      ? `<h3>Sources</h3><ul>${g.sources.map((s) => `<li><a href="${esc(s)}" rel="noopener">${esc(s)}</a></li>`).join('')}</ul>`
      : ''}

    <h3>At the table</h3>
    <p style="font-family:var(--mono);font-size:.88rem;color:var(--gold-l)">
      $ rulebook ruling ${esc(g.slug)} "…"${g.hasScore ? `<br>$ rulebook score ${esc(g.slug)} "…"` : ''}
    </p>`;

  const m = $('#modal');
  m.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#m-close').focus();
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
}

// ---------------------------------------------------------------------------
// Scoring — the real modules, loaded on demand
// ---------------------------------------------------------------------------
async function scorers() {
  const withScore = DATA.games.filter((g) => g.hasScore);
  let current = withScore[0];
  let mod = null;

  $('#score-tabs').innerHTML = withScore
    .map((g, i) => `<button data-slug="${g.slug}" aria-selected="${i === 0}">${esc(g.name)}</button>`)
    .join('');

  const load = async (g) => {
    current = g;
    mod = await import(`./games/${g.slug}/score.mjs`);
    $('#score-label').textContent = mod.usage;
    $('#score-in').placeholder = (mod.examples?.[0] || '').replace(/^rulebook score \S+ /, '').replace(/^"|"$/g, '');
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

  // Split on spaces but keep quoted groups together, which is what a shell
  // would hand the CLI — the modules expect argv, so we give them argv.
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

  await load(current);
}

// ---------------------------------------------------------------------------
// The terminal, typing itself out
// ---------------------------------------------------------------------------
function terminal() {
  const el = $('#term');
  const script = [
    ['p', '$ '], ['c', 'npx @mohitagw15856/rulebook ruling uno "can I stack a draw 2"\n'],
    ['o', '\nCan you stack a Draw Two on a Draw Two, or a Draw Four on a Draw Four?\n'],
    ['g', '● NOT AN OFFICIAL RULE   played by almost everyone, almost everywhere\n\n'],
    ['o', '  No. Under the published rules there is no stacking. A player hit with\n  a Draw Two draws two cards and loses their turn.\n\n'],
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
        // Commands type character by character; output lands in one go, the
        // way real output does.
        if (cls === 'c') {
          span.textContent = text.slice(0, ++ci);
          if (ci >= text.length) { si++; ci = 0; }
          setTimeout(tick, 26);
        } else {
          span.textContent = text;
          si++; ci = 0;
          setTimeout(tick, cls === 'p' ? 90 : 520);
        }
      };
      tick();
    });
  }, { threshold: 0.25 });
  io.observe(el);
}

function copyBtn() {
  $('#copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText($('#install-cmd').textContent);
    const b = $('#copy');
    b.textContent = 'copied';
    setTimeout(() => (b.textContent = 'copy'), 1400);
  });
}

// ---------------------------------------------------------------------------
horizon();
typeOut();
cursorGlow();
reveals();
stats();
settle();
fakes();
games();
modal();
terminal();
copyBtn();
scorers();
