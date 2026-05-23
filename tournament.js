/* ======================================================
   WORLD CUP TOURNAMENT ENGINE — tournament.js
   Full FIFA-style simulation: groups → knockouts → champion
   ====================================================== */

'use strict';

// ─── DATA ──────────────────────────────────────────────

const DEFAULT_TEAMS = [
  { name: 'Brazil',       flag: '🇧🇷' },
  { name: 'France',       flag: '🇫🇷' },
  { name: 'Argentina',    flag: '🇦🇷' },
  { name: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Spain',        flag: '🇪🇸' },
  { name: 'Germany',      flag: '🇩🇪' },
  { name: 'Italy',        flag: '🇮🇹' },
  { name: 'Netherlands',  flag: '🇳🇱' },
  { name: 'Portugal',     flag: '🇵🇹' },
  { name: 'Belgium',      flag: '🇧🇪' },
  { name: 'Croatia',      flag: '🇭🇷' },
  { name: 'Uruguay',      flag: '🇺🇾' },
  { name: 'Colombia',     flag: '🇨🇴' },
  { name: 'Mexico',       flag: '🇲🇽' },
  { name: 'Senegal',      flag: '🇸🇳' },
  { name: 'Morocco',      flag: '🇲🇦' },
  { name: 'Denmark',      flag: '🇩🇰' },
  { name: 'Switzerland',  flag: '🇨🇭' },
  { name: 'USA',          flag: '🇺🇸' },
  { name: 'Japan',        flag: '🇯🇵' },
  { name: 'South Korea',  flag: '🇰🇷' },
  { name: 'Australia',    flag: '🇦🇺' },
  { name: 'Serbia',       flag: '🇷🇸' },
  { name: 'Poland',       flag: '🇵🇱' },
  { name: 'Ecuador',      flag: '🇪🇨' },
  { name: 'Cameroon',     flag: '🇨🇲' },
  { name: 'Ghana',        flag: '🇬🇭' },
  { name: 'Tunisia',      flag: '🇹🇳' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Iran',         flag: '🇮🇷' },
  { name: 'Wales',        flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'Canada',       flag: '🇨🇦' },
];

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H'];

// ─── STATE ─────────────────────────────────────────────

let state = {
  teams: [],
  groups: {},           // { A: [team,team,team,team], … }
  standings: {},        // { A: [row,…], … }
  groupMatches: {},     // { A: [{home,away,…},…], … }
  matchday: 0,          // 0-indexed (3 matchdays → 0,1,2)
  allMatchdays: [],     // [ [{matches of matchday 1}], … ]
  matchResults: [],     // flattened list for display
  qualified: [],        // 16 teams [{team, group, rank}, …]
  knockoutRounds: [],   // [ [{home,away,result,…}, …], … ]
  koRoundIndex: 0,
  simMode: 'auto',
  champion: null,
};

// ─── HELPERS ───────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Simulate a realistic score: weighted toward low scoring */
function simulateGoals() {
  // Distribution inspired by real World Cup stats
  const maxGoals = [0,1,1,2,2,2,3,3,4,4,5];
  return rand(0, maxGoals[rand(0, maxGoals.length - 1)]);
}

function simulateMatch(home, away, knockout = false) {
  let hg = simulateGoals();
  let ag = simulateGoals();
  let extra = null;
  let pen = null;

  if (knockout && hg === ag) {
    // Extra time: small chance of a goal
    const et = Math.random();
    if (et < 0.3) {
      if (Math.random() < 0.5) hg++; else ag++;
      extra = true;
    }
    // If still level → penalties
    if (hg === ag) {
      extra = true;
      const winner = Math.random() < 0.5 ? 'home' : 'away';
      pen = winner;
    }
  }

  return { homeGoals: hg, awayGoals: ag, extra, pen };
}

function createStandingRow(team) {
  return { team, P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, PTS:0 };
}

function sortStandings(rows, matches) {
  return [...rows].sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS;
    if (b.GD  !== a.GD)  return b.GD  - a.GD;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    // Head-to-head
    const h2h = getH2H(a.team.name, b.team.name, matches);
    if (h2h !== 0) return h2h;
    // Fair play / random
    return Math.random() < 0.5 ? -1 : 1;
  });
}

function getH2H(teamA, teamB, matches) {
  for (const m of matches) {
    if (!m.played) continue;
    if (m.home.name === teamA && m.away.name === teamB) {
      if (m.homeGoals > m.awayGoals) return -1; // A wins → A ranks higher
      if (m.homeGoals < m.awayGoals) return  1;
    }
    if (m.home.name === teamB && m.away.name === teamA) {
      if (m.homeGoals > m.awayGoals) return  1;
      if (m.homeGoals < m.awayGoals) return -1;
    }
  }
  return 0;
}

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast'; }, 2800);
}

// ─── SETUP ─────────────────────────────────────────────

function initTeamsGrid() {
  const grid = document.getElementById('teamsGrid');
  grid.innerHTML = '';
  DEFAULT_TEAMS.forEach(t => {
    const div = document.createElement('div');
    div.className = 'team-chip';
    div.innerHTML = `<span class="flag">${t.flag}</span><span>${t.name}</span>`;
    grid.appendChild(div);
  });
}

document.getElementById('btnRandomTeams').addEventListener('click', () => {
  const chips = document.querySelectorAll('.team-chip');
  const arr = [...chips];
  shuffle(arr).forEach((chip, i) => {
    chip.style.order = i;
  });
  toast('Teams randomised!');
});

document.getElementById('btnResetTeams').addEventListener('click', () => {
  const chips = document.querySelectorAll('.team-chip');
  chips.forEach(c => { c.style.order = ''; });
  toast('Reset to default.');
});

document.getElementById('btnLaunch').addEventListener('click', launchTournament);

function launchTournament() {
  const mode = document.querySelector('input[name="groupMode"]:checked').value;
  state.simMode = document.querySelector('input[name="simMode"]:checked').value;

  // Copy teams
  state.teams = [...DEFAULT_TEAMS];

  // Assign groups
  const teamsCopy = state.simMode === 'auto' || mode === 'random'
    ? shuffle(state.teams)
    : [...state.teams]; // seeded: keep order

  GROUP_LETTERS.forEach((letter, i) => {
    state.groups[letter] = teamsCopy.slice(i * 4, i * 4 + 4);
    state.standings[letter] = state.groups[letter].map(createStandingRow);
    // Generate all matches for this group (6 per group)
    state.groupMatches[letter] = [];
    const g = state.groups[letter];
    for (let x = 0; x < g.length; x++) {
      for (let y = x + 1; y < g.length; y++) {
        state.groupMatches[letter].push({
          home: g[x], away: g[y],
          homeGoals: null, awayGoals: null,
          played: false, group: letter,
        });
      }
    }
  });

  // Organise into 3 matchdays (2 matches per group per matchday)
  // Each group: matches [0,1,2,3,4,5]
  // Matchday 1: 0,3  Matchday 2: 1,4  Matchday 3: 2,5
  state.allMatchdays = [[], [], []];
  GROUP_LETTERS.forEach(letter => {
    const gm = state.groupMatches[letter];
    [[0,3],[1,4],[2,5]].forEach((pair, md) => {
      pair.forEach(idx => state.allMatchdays[md].push(gm[idx]));
    });
  });

  state.matchday = 0;
  state.matchResults = [];
  state.qualified = [];
  state.knockoutRounds = [];
  state.koRoundIndex = 0;

  switchPanel('groups');
  document.getElementById('btnGroups').disabled = false;
  renderGroups();
  toast('Tournament launched! 🚀', 'gold');

  if (state.simMode === 'auto') {
    setTimeout(autoCompleteGroups, 400);
  }
}

// ─── GROUP STAGE ───────────────────────────────────────

function renderGroups() {
  const grid = document.getElementById('groupsGrid');
  grid.innerHTML = '';
  GROUP_LETTERS.forEach(letter => {
    const rows = state.standings[letter];
    grid.appendChild(buildGroupCard(letter, rows));
  });
  updateMatchdayUI();
}

function buildGroupCard(letter, rows) {
  const sorted = sortStandings(rows, state.groupMatches[letter]);
  const card = document.createElement('div');
  card.className = 'group-card';
  card.id = `group-${letter}`;

  card.innerHTML = `
    <div class="group-card-header">
      <span class="group-name">GROUP ${letter}</span>
      <span class="group-badge">${rows[0].P > 0 ? rows[0].P + ' PLAYED' : 'NOT STARTED'}</span>
    </div>
    <table class="standings-table">
      <thead>
        <tr>
          <th colspan="2">TEAM</th>
          <th>P</th><th>W</th><th>D</th><th>L</th>
          <th>GF</th><th>GA</th><th>GD</th><th>PTS</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((row, idx) => buildStandingRow(row, idx, sorted.length)).join('')}
      </tbody>
    </table>`;
  return card;
}

function buildStandingRow(row, idx, total) {
  const qualClass = idx === 0 ? 'qualify-1' : idx === 1 ? 'qualify-2' : '';
  const gdClass = row.GD > 0 ? 'gd-pos' : row.GD < 0 ? 'gd-neg' : '';
  const gdStr = row.GD > 0 ? `+${row.GD}` : `${row.GD}`;
  return `<tr class="${qualClass}">
    <td class="team-cell">
      <span class="pos-num">${idx + 1}</span>
      <span>${row.team.flag}</span>
      <span>${row.team.name}</span>
    </td>
    <td></td>
    <td>${row.P}</td><td>${row.W}</td><td>${row.D}</td><td>${row.L}</td>
    <td>${row.GF}</td><td>${row.GA}</td>
    <td class="${gdClass}">${row.P > 0 ? gdStr : '-'}</td>
    <td class="pts-cell">${row.PTS}</td>
  </tr>`;
}

function updateMatchdayUI() {
  document.getElementById('matchdayNum').textContent = state.matchday + 1;
  const simBtn = document.getElementById('btnSimMatchday');
  simBtn.disabled = state.matchday >= 3;
}

document.getElementById('btnSimMatchday').addEventListener('click', () => {
  if (state.matchday >= 3) return;
  simulateMatchday(state.matchday);
  state.matchday++;
  if (state.matchday >= 3) {
    finaliseGroups();
  } else {
    renderGroups();
    renderMatchResults();
    toast(`Matchday ${state.matchday} complete!`);
  }
});

document.getElementById('btnAutoAll').addEventListener('click', autoCompleteGroups);

function autoCompleteGroups() {
  while (state.matchday < 3) {
    simulateMatchday(state.matchday);
    state.matchday++;
  }
  renderGroups();
  renderMatchResults();
  finaliseGroups();
}

function simulateMatchday(md) {
  const matches = state.allMatchdays[md];
  matches.forEach(match => {
    if (match.played) return;
    const { homeGoals, awayGoals } = simulateMatch(match.home, match.away);
    match.homeGoals = homeGoals;
    match.awayGoals = awayGoals;
    match.played = true;
    applyResultToStandings(match);
    state.matchResults.push({ ...match, matchday: md + 1 });
  });
}

function applyResultToStandings(match) {
  const letter = match.group;
  const rows = state.standings[letter];
  const homeRow = rows.find(r => r.team.name === match.home.name);
  const awayRow = rows.find(r => r.team.name === match.away.name);
  const hg = match.homeGoals, ag = match.awayGoals;

  homeRow.P++; awayRow.P++;
  homeRow.GF += hg; homeRow.GA += ag;
  awayRow.GF += ag; awayRow.GA += hg;
  homeRow.GD = homeRow.GF - homeRow.GA;
  awayRow.GD = awayRow.GF - awayRow.GA;

  if (hg > ag) {
    homeRow.W++; homeRow.PTS += 3;
    awayRow.L++;
  } else if (hg < ag) {
    awayRow.W++; awayRow.PTS += 3;
    homeRow.L++;
  } else {
    homeRow.D++; homeRow.PTS++;
    awayRow.D++; awayRow.PTS++;
  }
}

function renderMatchResults() {
  const grid = document.getElementById('resultsGrid');
  grid.innerHTML = '';
  // Show last matchday results
  const lastMD = state.matchday;
  const toShow = state.matchResults.filter(m => m.matchday === lastMD);
  toShow.forEach(m => {
    grid.appendChild(buildMatchCard(m));
  });
  document.getElementById('matchResults').style.display = toShow.length ? 'block' : 'none';
}

function buildMatchCard(m) {
  const hg = m.homeGoals, ag = m.awayGoals;
  const hWin = hg > ag, aWin = ag > hg;
  const card = document.createElement('div');
  card.className = 'match-card';
  card.innerHTML = `
    <div class="match-meta">
      <span>GROUP ${m.group}</span>
      <span>MATCHDAY ${m.matchday}</span>
    </div>
    <div class="match-row">
      <div class="match-team ${hWin ? 'match-winner' : aWin ? 'match-loser' : ''}">
        <span>${m.home.flag}</span><span>${m.home.name}</span>
      </div>
      <div class="match-score">${hg} – ${ag}</div>
      <div class="match-team right ${aWin ? 'match-winner' : hWin ? 'match-loser' : ''}">
        <span>${m.away.name}</span><span>${m.away.flag}</span>
      </div>
    </div>`;
  return card;
}

function finaliseGroups() {
  // Determine top 2 from each group
  state.qualified = [];
  GROUP_LETTERS.forEach(letter => {
    const sorted = sortStandings(state.standings[letter], state.groupMatches[letter]);
    state.qualified.push({ team: sorted[0].team, group: letter, rank: 1 });
    state.qualified.push({ team: sorted[1].team, group: letter, rank: 2 });
  });

  renderGroups();
  renderMatchResults();

  document.getElementById('qualifySection').classList.remove('hidden');
  document.getElementById('btnSimMatchday').disabled = true;
  document.getElementById('btnAutoAll').disabled = true;
  toast('Group stage complete! 16 teams qualified ✅', 'green');
}

document.getElementById('btnToKnockout').addEventListener('click', () => {
  buildKnockoutBracket();
  switchPanel('knockout');
  document.getElementById('btnKnockout').disabled = false;
});

// ─── KNOCKOUT ──────────────────────────────────────────

function getQualified(group, rank) {
  return state.qualified.find(q => q.group === group && q.rank === rank).team;
}

function buildKnockoutBracket() {
  // R16 matchups: Aw vs Br, Bw vs Ar, Cw vs Dr, Dw vs Cr, Ew vs Fr, Fw vs Er, Gw vs Hr, Hw vs Gr
  const r16 = [
    ['A',1,'B',2], ['B',1,'A',2],
    ['C',1,'D',2], ['D',1,'C',2],
    ['E',1,'F',2], ['F',1,'E',2],
    ['G',1,'H',2], ['H',1,'G',2],
  ].map(([gH,rH,gA,rA]) => ({
    home: getQualified(gH,rH),
    away: getQualified(gA,rA),
    homeGoals: null, awayGoals: null,
    extra: null, pen: null,
    played: false, round: 'Round of 16',
  }));

  state.knockoutRounds = [r16, [], [], []]; // R16, QF, SF, Final
  state.koRoundIndex = 0;
  renderKnockout();
}

document.getElementById('btnSimRound').addEventListener('click', () => {
  simKnockoutRound(state.koRoundIndex);
});

document.getElementById('btnAutoKO').addEventListener('click', () => {
  while (state.koRoundIndex < 4) {
    simKnockoutRound(state.koRoundIndex);
    if (state.champion) break;
  }
});

function simKnockoutRound(roundIdx) {
  const matches = state.knockoutRounds[roundIdx];
  const winners = [];

  matches.forEach(m => {
    if (m.played) { winners.push(koWinner(m)); return; }
    const res = simulateMatch(m.home, m.away, true);
    m.homeGoals = res.homeGoals;
    m.awayGoals = res.awayGoals;
    m.extra = res.extra;
    m.pen = res.pen;
    m.played = true;
    winners.push(koWinner(m));
  });

  // Advance
  state.koRoundIndex++;
  const roundNames = ['Quarterfinals','Semifinals','Final'];

  if (state.koRoundIndex === 4) {
    // Champion determined
    state.champion = winners[0];
    renderKnockout();
    showChampion();
    return;
  }

  // Build next round
  const nextRound = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextRound.push({
      home: winners[i],
      away: winners[i + 1],
      homeGoals: null, awayGoals: null,
      extra: null, pen: null,
      played: false,
      round: roundNames[state.koRoundIndex - 1],
    });
  }
  state.knockoutRounds[state.koRoundIndex] = nextRound;
  renderKnockout();

  const roundLabel = ['Round of 16','Quarterfinals','Semifinals','Final'][roundIdx];
  toast(`${roundLabel} complete!`, 'gold');

  if (state.koRoundIndex === 3) {
    toast('🏟 THE FINAL IS SET!', 'gold');
  }
}

function koWinner(m) {
  if (m.pen) return m.pen === 'home' ? m.home : m.away;
  return m.homeGoals > m.awayGoals ? m.home : m.away;
}

const ROUND_NAMES = ['ROUND OF 16','QUARTERFINALS','SEMIFINALS','FINAL'];

function renderKnockout() {
  const container = document.getElementById('knockoutRounds');
  container.innerHTML = '';

  state.knockoutRounds.forEach((matches, roundIdx) => {
    if (!matches || matches.length === 0) return;
    const roundDiv = document.createElement('div');
    roundDiv.className = 'ko-round';

    const title = document.createElement('div');
    title.className = 'ko-round-title';
    title.textContent = ROUND_NAMES[roundIdx] || `ROUND ${roundIdx + 1}`;
    roundDiv.appendChild(title);

    const matchesDiv = document.createElement('div');
    matchesDiv.className = 'ko-matches';

    matches.forEach(m => {
      matchesDiv.appendChild(buildKOMatchCard(m));
    });

    roundDiv.appendChild(matchesDiv);
    container.appendChild(roundDiv);
  });

  // Update button state
  const btn = document.getElementById('btnSimRound');
  const allPlayed = state.knockoutRounds[state.koRoundIndex]?.every(m => m.played);
  btn.disabled = !!state.champion;
  document.getElementById('btnAutoKO').disabled = !!state.champion;
}

function buildKOMatchCard(m) {
  const card = document.createElement('div');
  card.className = 'ko-match';

  const winner = m.played ? koWinner(m) : null;
  const loser  = m.played ? (winner === m.home ? m.away : m.home) : null;

  const homeScore = m.played ? m.homeGoals : '';
  const awayScore = m.played ? m.awayGoals : '';
  const homeClass = !m.played ? '' : winner === m.home ? 'winner' : '';
  const awayClass = !m.played ? '' : winner === m.away ? 'winner' : '';

  card.innerHTML = `
    <div class="ko-team-row ${homeClass}">
      <span>${m.home.flag} ${m.home.name}</span>
      <span class="ko-team-score">${homeScore}</span>
    </div>
    <div class="ko-team-row ${awayClass}">
      <span>${m.away.flag} ${m.away.name}</span>
      <span class="ko-team-score">${awayScore}</span>
    </div>
    ${m.played && (m.extra || m.pen) ? `<div class="ko-extra-info">${m.pen ? 'PENALTIES' : 'EXTRA TIME'}</div>` : ''}`;
  return card;
}

// ─── CHAMPION ──────────────────────────────────────────

function showChampion() {
  const champ = state.champion;

  // Gather stats across all rounds
  let wins = 0, goalsFor = 0, goalsAgainst = 0;
  state.knockoutRounds.forEach(round => {
    round.forEach(m => {
      if (!m.played) return;
      const won = koWinner(m);
      if (won.name === champ.name) {
        wins++;
        if (m.home.name === champ.name) { goalsFor += m.homeGoals; goalsAgainst += m.awayGoals; }
        else                            { goalsFor += m.awayGoals; goalsAgainst += m.homeGoals; }
      }
    });
  });

  // Group stats
  GROUP_LETTERS.forEach(letter => {
    state.standings[letter].forEach(row => {
      if (row.team.name === champ.name) {
        goalsFor += row.GF; goalsAgainst += row.GA;
      }
    });
  });

  const scene = document.getElementById('championScene');
  scene.innerHTML = `
    <div class="confetti-row">🎊 🥇 🎉 🏅 🎊</div>
    <div class="champ-trophy">🏆</div>
    <div class="champ-label">WORLD CUP CHAMPION</div>
    <div class="champ-flag">${champ.flag}</div>
    <div class="champ-team">${champ.name.toUpperCase()}</div>
    <div class="champ-stats">
      <div class="champ-stat">
        <span class="champ-stat-val">${wins}</span>
        <span class="champ-stat-lbl">KO WINS</span>
      </div>
      <div class="champ-stat">
        <span class="champ-stat-val">${goalsFor}</span>
        <span class="champ-stat-lbl">GOALS FOR</span>
      </div>
      <div class="champ-stat">
        <span class="champ-stat-val">${goalsAgainst}</span>
        <span class="champ-stat-lbl">GOALS AGAINST</span>
      </div>
    </div>
    <button class="btn btn-primary" id="btnNewTournament">🔄 NEW TOURNAMENT</button>`;

  document.getElementById('btnChampion').disabled = false;
  switchPanel('champion');
  toast(`🏆 ${champ.name} are WORLD CHAMPIONS!`, 'gold');

  document.getElementById('btnNewTournament').addEventListener('click', () => {
    // Reset state
    state = {
      teams:[], groups:{}, standings:{}, groupMatches:{},
      matchday:0, allMatchdays:[], matchResults:[],
      qualified:[], knockoutRounds:[], koRoundIndex:0,
      simMode:'auto', champion:null,
    };
    document.getElementById('btnGroups').disabled = true;
    document.getElementById('btnKnockout').disabled = true;
    document.getElementById('btnChampion').disabled = true;
    document.getElementById('qualifySection').classList.add('hidden');
    document.getElementById('resultsGrid').innerHTML = '';
    document.getElementById('matchResults').style.display = 'none';
    document.getElementById('btnSimMatchday').disabled = false;
    document.getElementById('btnAutoAll').disabled = false;
    switchPanel('setup');
    toast('Ready for a new tournament!');
  });
}

// ─── NAVIGATION ────────────────────────────────────────

const PANELS = { setup:'panelSetup', groups:'panelGroups', knockout:'panelKnockout', champion:'panelChampion' };

function switchPanel(name) {
  Object.values(PANELS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(PANELS[name]);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.stage-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stage === name);
  });
}

document.getElementById('stageNav').addEventListener('click', e => {
  const btn = e.target.closest('.stage-btn');
  if (!btn || btn.disabled) return;
  switchPanel(btn.dataset.stage);
});

// ─── INIT ──────────────────────────────────────────────

initTeamsGrid();
switchPanel('setup');