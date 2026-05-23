// ============================================================
//  TOURNAMENT ENGINE — tournament_engine.js
//  Auto-calculates standings from MATCH_RESULTS
//  Read-only public display, no editing on frontend
// ============================================================

'use strict';

// ─── STANDINGS CALCULATION ──────────────────────────────────

function buildStandings() {
  const table = {};
  TEAMS.forEach(name => {
    table[name] = { name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, PTS: 0 };
  });

  MATCH_RESULTS.forEach(m => {
    if (m.hg === null || m.ag === null) return;
    const h = table[m.home];
    const a = table[m.away];
    if (!h || !a) { console.warn('Unknown team:', m.home, m.away); return; }
    h.P++; a.P++;
    h.GF += m.hg; h.GA += m.ag; h.GD = h.GF - h.GA;
    a.GF += m.ag; a.GA += m.hg; a.GD = a.GF - a.GA;
    if (m.hg > m.ag) { h.W++; h.PTS += 3; a.L++; }
    else if (m.hg < m.ag) { a.W++; a.PTS += 3; h.L++; }
    else { h.D++; h.PTS++; a.D++; a.PTS++; }
  });

  return Object.values(table).sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS;
    if (b.GD  !== a.GD)  return b.GD  - a.GD;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    return a.name.localeCompare(b.name);
  });
}

// ─── RENDER STANDINGS ───────────────────────────────────────

function renderStandings() {
  const standings = buildStandings();
  const tbody = document.getElementById('standingsTbody');
  tbody.innerHTML = '';

  standings.forEach((row, idx) => {
    const pos = idx + 1;
    const gdStr = row.GD > 0 ? `+${row.GD}` : `${row.GD}`;
    const gdClass = row.GD > 0 ? 'pos' : row.GD < 0 ? 'neg' : '';
    const posClass = pos === 1 ? 'pos-gold' : pos === 2 ? 'pos-silver' : pos === 3 ? 'pos-bronze' : '';
    const formBadges = getForm(row.name);

    tbody.innerHTML += `
      <tr class="standings-row ${pos <= 8 ? 'highlight-zone' : ''}">
        <td class="pos-cell ${posClass}">${pos}</td>
        <td class="team-name-cell">${escHTML(row.name)}</td>
        <td>${row.P}</td>
        <td class="w-col">${row.W}</td>
        <td class="d-col">${row.D}</td>
        <td class="l-col">${row.L}</td>
        <td>${row.GF}</td>
        <td>${row.GA}</td>
        <td class="gd-cell ${gdClass}">${row.P > 0 ? gdStr : '—'}</td>
        <td class="pts-cell">${row.PTS}</td>
        <td class="form-cell">${formBadges}</td>
      </tr>`;
  });

  // Update summary stats
  const total = MATCH_RESULTS.filter(m => m.hg !== null).length;
  const totalPossible = (TEAMS.length * (TEAMS.length - 1)) / 2;
  document.getElementById('matchesPlayed').textContent = total;
  document.getElementById('matchesTotal').textContent = totalPossible;
  document.getElementById('progressPct').textContent = Math.round(100 * total / totalPossible) + '%';

  const prog = document.getElementById('progressBar');
  if (prog) prog.style.width = Math.round(100 * total / totalPossible) + '%';
}

function getForm(teamName) {
  // Get last 5 played results for this team
  const results = MATCH_RESULTS.filter(m =>
    m.hg !== null && (m.home === teamName || m.away === teamName)
  ).slice(-5);

  return results.map(m => {
    const isHome = m.home === teamName;
    const scored = isHome ? m.hg : m.ag;
    const conceded = isHome ? m.ag : m.hg;
    let cls, letter;
    if (scored > conceded) { cls = 'w'; letter = 'W'; }
    else if (scored < conceded) { cls = 'l'; letter = 'L'; }
    else { cls = 'd'; letter = 'D'; }
    return `<span class="form-badge ${cls}">${letter}</span>`;
  }).join('');
}

function escHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── RENDER FIXTURES ────────────────────────────────────────

function renderFixtures(filter) {
  const grid = document.getElementById('fixturesGrid');
  grid.innerHTML = '';

  // Group matches by round-like groupings (every 16 matches = 1 "matchday")
  let matches = [...MATCH_RESULTS];

  if (filter === 'played') matches = matches.filter(m => m.hg !== null);
  else if (filter === 'upcoming') matches = matches.filter(m => m.hg === null);

  if (matches.length === 0) {
    grid.innerHTML = `<div class="empty-state">No matches to display.</div>`;
    return;
  }

  // Build round index
  const roundSize = TEAMS.length / 2; // 16 matches per round
  matches.forEach((m, absIdx) => {
    const origIdx = MATCH_RESULTS.indexOf(m);
    const round = Math.floor(origIdx / roundSize) + 1;
    const played = m.hg !== null;
    const hWin = played && m.hg > m.ag;
    const aWin = played && m.ag > m.hg;
    const draw = played && m.hg === m.ag;

    const card = document.createElement('div');
    card.className = `fixture-card ${played ? 'played' : 'upcoming'}`;
    card.innerHTML = `
      <div class="fixture-round">Round ${round}</div>
      <div class="fixture-body">
        <div class="fx-team ${hWin ? 'winner' : aWin ? 'loser' : ''}">
          <span class="fx-name">${escHTML(m.home)}</span>
        </div>
        <div class="fx-score ${played ? 'has-score' : ''}">
          ${played
            ? `<span class="score-num ${hWin ? 'score-win' : ''}">${m.hg}</span>
               <span class="score-sep">—</span>
               <span class="score-num ${aWin ? 'score-win' : ''}">${m.ag}</span>`
            : `<span class="vs-text">VS</span>`
          }
        </div>
        <div class="fx-team right ${aWin ? 'winner' : hWin ? 'loser' : ''}">
          <span class="fx-name">${escHTML(m.away)}</span>
        </div>
      </div>
      ${played ? `<div class="fixture-status">${draw ? 'DRAW' : (hWin ? escHTML(m.home) : escHTML(m.away)) + ' WIN'}</div>` : '<div class="fixture-status upcoming-tag">UPCOMING</div>'}
    `;
    grid.appendChild(card);
  });
}

// ─── FILTER BUTTONS ─────────────────────────────────────────

let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderFixtures(currentFilter);
  });
});

// ─── STANDINGS SEARCH ───────────────────────────────────────

const searchInput = document.getElementById('teamSearch');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    document.querySelectorAll('.standings-row').forEach(row => {
      const name = row.querySelector('.team-name-cell')?.textContent.toLowerCase() || '';
      row.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

// ─── TAB NAVIGATION ─────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// ─── INIT ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Set tournament meta
  document.title = TOURNAMENT.name;
  const el = document.getElementById('tournamentSeason');
  if (el) el.textContent = TOURNAMENT.season;
  const st = document.getElementById('tournamentStatus');
  if (st) st.textContent = TOURNAMENT.status;
  const fmt = document.getElementById('tournamentFormat');
  if (fmt) fmt.textContent = `${TOURNAMENT.format} · ${TEAMS.length} Teams`;

  renderStandings();
  renderFixtures('all');
});