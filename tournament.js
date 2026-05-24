/* ================================================================
   PLAYVERSE eFOOTBALL — tournament_engine.js
   Auto-calculates standings, draws, brackets. Read-only display.
   ================================================================ */
'use strict';

// ── HELPERS ──────────────────────────────────────────────────────
const qi  = id => document.getElementById(id);
const esc = s  => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── GROUP STANDINGS ENGINE ────────────────────────────────────────
function groupStandings(groupKey) {
  const teams = GROUPS[groupKey];
  const matches = GROUP_MATCHES[groupKey];
  const tbl = {};
  teams.forEach(n => { tbl[n] = {name:n,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,PTS:0}; });
  matches.forEach(m => {
    if (m.s1===null||m.s2===null) return;
    const a=tbl[m.t1], b=tbl[m.t2];
    if(!a||!b) return;
    a.P++; b.P++;
    a.GF+=m.s1; a.GA+=m.s2; a.GD=a.GF-a.GA;
    b.GF+=m.s2; b.GA+=m.s1; b.GD=b.GF-b.GA;
    if(m.s1>m.s2){a.W++;a.PTS+=3;b.L++;}
    else if(m.s1<m.s2){b.W++;b.PTS+=3;a.L++;}
    else{a.D++;a.PTS++;b.D++;b.PTS++;}
  });
  return Object.values(tbl).sort((a,b)=>
    b.PTS-a.PTS||b.GD-a.GD||b.GF-a.GF||a.name.localeCompare(b.name)
  );
}

// ── AUTO DRAW ENGINE ─────────────────────────────────────────────
function buildDraw() {
  if (KNOCKOUT.r16 && KNOCKOUT.r16.length > 0) return KNOCKOUT.r16;
  const winners = [], runners = [];
  Object.keys(GROUPS).sort().forEach(g => {
    const st = groupStandings(g);
    winners.push({team: st[0].name, group: g});
    runners.push({team: st[1].name, group: g});
  });
  const shuffledRunners = seededShuffle(runners, DRAW_SEED);
  const pairs = [];
  const usedRunners = [];
  winners.forEach(w => {
    const eligible = shuffledRunners.filter(r =>
      r.group !== w.group && !usedRunners.includes(r.team)
    );
    if (eligible.length > 0) {
      const r = eligible[0];
      usedRunners.push(r.team);
      pairs.push({ t1: w.team, t2: r.team, s1: null, s2: null, label: `1${w.group} vs 2${r.group}` });
    }
  });
  return pairs;
}

// ── STATS ────────────────────────────────────────────────────────
function getTournamentStats() {
  let played=0, totalGoals=0, total=0;
  Object.values(GROUP_MATCHES).forEach(arr => {
    arr.forEach(m => {
      total++;
      if(m.s1!==null){played++;totalGoals+=m.s1+m.s2;}
    });
  });
  return {played,total,totalGoals,avgGoals:played?+(totalGoals/played).toFixed(2):0};
}

function getForm(teamName) {
  const results = [];
  Object.values(GROUP_MATCHES).forEach(arr => arr.forEach(m => {
    if(m.s1===null||(m.t1!==teamName&&m.t2!==teamName)) return;
    const mine=m.t1===teamName?m.s1:m.s2, opp=m.t1===teamName?m.s2:m.s1;
    results.push(mine>opp?'w':mine<opp?'l':'d');
  }));
  return results.slice(-5).map(r=>`<span class="fb ${r}">${r.toUpperCase()}</span>`).join('');
}

// ── RENDER: DASHBOARD ────────────────────────────────────────────
function renderDashboard() {
  const stats = getTournamentStats();
  const pct = stats.total ? Math.round(100*stats.played/stats.total) : 0;

  qi('dashPlayed').textContent  = stats.played;
  qi('dashTotal').textContent   = stats.total;
  qi('dashGoals').textContent   = stats.totalGoals;
  qi('dashAvg').textContent     = stats.avgGoals;
  qi('dashPct').textContent     = pct+'%';
  qi('dashBar').style.width     = pct+'%';

  // Team is the scorer identity (1 player per team)
  const topSc = [...SCORERS].sort((a,b)=>b.goals-a.goals||b.assists-a.assists);
  const dsList = qi('dashScorers');
  dsList.innerHTML = '';
  topSc.slice(0,5).forEach((s,i) => {
    dsList.innerHTML += `
      <div class="ds-row">
        <span class="ds-rank">${i+1}</span>
        <div class="ds-info">
          <div class="ds-player">${esc(s.team)}</div>
          <div class="ds-team">${esc(s.player)} · Top Scorer</div>
        </div>
        <div class="ds-stats">
          <span class="ds-goals">${s.goals} <small>G</small></span>
          <span class="ds-assists">${s.assists} <small>A</small></span>
        </div>
      </div>`;
  });

  const allMatches = [];
  Object.entries(GROUP_MATCHES).forEach(([g, arr]) =>
    arr.forEach(m => allMatches.push({...m, group: g}))
  );
  const recent = allMatches.filter(m=>m.s1!==null).slice(-4).reverse();
  const upcoming = allMatches.filter(m=>m.s1===null).slice(0,4);

  const rEl = qi('dashRecent');
  rEl.innerHTML = '';
  if(!recent.length) { rEl.innerHTML='<div class="empty-s">No results yet</div>'; }
  recent.forEach(m => {
    const hw=m.s1>m.s2, aw=m.s2>m.s1;
    rEl.innerHTML += `
      <div class="dm-card played">
        <span class="dm-grp">GROUP ${m.group}</span>
        <div class="dm-body">
          <span class="dm-team ${hw?'dw':aw?'dl':''}">${esc(m.t1)}</span>
          <span class="dm-score">${m.s1} – ${m.s2}</span>
          <span class="dm-team right ${aw?'dw':hw?'dl':''}">${esc(m.t2)}</span>
        </div>
      </div>`;
  });

  const uEl = qi('dashUpcoming');
  uEl.innerHTML = '';
  if(!upcoming.length) { uEl.innerHTML='<div class="empty-s">All matches played!</div>'; }
  upcoming.forEach(m => {
    uEl.innerHTML += `
      <div class="dm-card">
        <span class="dm-grp">GROUP ${m.group}</span>
        <div class="dm-body">
          <span class="dm-team">${esc(m.t1)}</span>
          <span class="dm-score upc-dot">VS</span>
          <span class="dm-team right">${esc(m.t2)}</span>
        </div>
      </div>`;
  });
}

// ── RENDER: GROUPS ───────────────────────────────────────────────
function renderGroups() {
  const wrap = qi('groupsWrap');
  wrap.innerHTML = '';
  Object.keys(GROUPS).sort().forEach(g => {
    const st = groupStandings(g);
    const matches = GROUP_MATCHES[g];
    const playedM = matches.filter(m=>m.s1!==null).length;
    const pct = Math.round(100*playedM/matches.length);

    let tableRows = st.map((r,i) => {
      const gd = r.GD>=0?'+'+r.GD:r.GD;
      const posC = i===0?'gold':i===1?'silver':i===2?'bronze':'';
      const qual = i<2?' qz':'';
      return `
        <tr class="sr${qual}">
          <td class="pc ${posC}">${i+1}</td>
          <td class="tnc">${esc(r.name)}</td>
          <td>${r.P}</td><td class="wc">${r.W}</td><td class="dc">${r.D}</td><td class="lc">${r.L}</td>
          <td>${r.GF}</td><td>${r.GA}</td>
          <td class="gdc ${r.GD>0?'pos':r.GD<0?'neg':''}">${r.P>0?gd:'—'}</td>
          <td class="ptsc">${r.PTS}</td>
          <td class="fmc">${getForm(r.name)}</td>
        </tr>`;
    }).join('');

    let matchCards = matches.map(m => {
      const played=m.s1!==null, hw=played&&m.s1>m.s2, aw=played&&m.s2>m.s1;
      return `
        <div class="gm-row ${played?'played':''}">
          <span class="gm-team ${hw?'gw':aw?'gl':''}">${esc(m.t1)}</span>
          <span class="gm-sc ${played?'has':''}">${played?`${m.s1}–${m.s2}`:'vs'}</span>
          <span class="gm-team right ${aw?'gw':hw?'gl':''}">${esc(m.t2)}</span>
        </div>`;
    }).join('');

    wrap.innerHTML += `
      <div class="group-card">
        <div class="group-hdr">
          <div class="group-letter">GROUP ${g}</div>
          <div class="group-prog">
            <div class="gp-track"><div class="gp-fill" style="width:${pct}%"></div></div>
            <span class="gp-txt">${playedM}/${matches.length}</span>
          </div>
        </div>
        <table class="stbl">
          <thead><tr>
            <th>#</th><th class="thteam">TEAM</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>PTS</th><th class="thform">FORM</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="group-matches">${matchCards}</div>
      </div>`;
  });
}

// ── RENDER: KNOCKOUT (horizontal bracket skeleton) ────────────────
function renderKnockout() {
  const draw = buildDraw();
  const wrap = qi('knockoutWrap');
  wrap.innerHTML = '';

  const r16 = draw.length ? draw : Array(8).fill(null).map(()=>({t1:null,t2:null,s1:null,s2:null}));
  const qf  = KNOCKOUT.qf.length  ? KNOCKOUT.qf  : Array(4).fill(null).map(()=>({t1:null,t2:null,s1:null,s2:null}));
  const sf  = KNOCKOUT.sf.length  ? KNOCKOUT.sf  : Array(2).fill(null).map(()=>({t1:null,t2:null,s1:null,s2:null}));
  const fin = KNOCKOUT.final.length? KNOCKOUT.final: [{t1:null,t2:null,s1:null,s2:null}];

  function teamSlot(name, score, isWinner, isLoser) {
    const cls = isWinner ? 'bkt-team winner' : isLoser ? 'bkt-team loser' : 'bkt-team';
    const sClass = isWinner ? 'bkt-score win' : 'bkt-score';
    const scoreDisplay = score !== null && score !== undefined ? score : '';
    return `<div class="${cls}">
      <span class="bkt-name">${esc(name || 'TBD')}</span>
      <span class="${sClass}">${scoreDisplay}</span>
    </div>`;
  }

  function matchCard(m) {
    if (!m) m = {t1:null,t2:null,s1:null,s2:null};
    const played = m.s1 !== null && m.s2 !== null;
    const hw = played && m.s1 > m.s2;
    const aw = played && m.s2 > m.s1;
    return `<div class="bkt-match">
      ${teamSlot(m.t1, m.s1, hw, aw)}
      ${teamSlot(m.t2, m.s2, aw, hw)}
    </div>`;
  }

  const finalMatch = fin[0];
  let champion = null;
  if (finalMatch && finalMatch.s1 !== null && finalMatch.s2 !== null) {
    champion = finalMatch.s1 > finalMatch.s2 ? finalMatch.t1
             : finalMatch.s2 > finalMatch.s1 ? finalMatch.t2 : null;
  }

  wrap.innerHTML = `
    <div class="bkt-bracket">

      <!-- LEFT SIDE -->
      <div class="bkt-side bkt-left">
        <div class="bkt-col bkt-r16">
          <div class="bkt-col-label">ROUND OF 16</div>
          <div class="bkt-matches bkt-top">
            ${matchCard(r16[0])}
            ${matchCard(r16[1])}
          </div>
          <div class="bkt-matches bkt-bot">
            ${matchCard(r16[2])}
            ${matchCard(r16[3])}
          </div>
        </div>
        <div class="bkt-col bkt-qf">
          <div class="bkt-col-label">QUARTER-FINALS</div>
          <div class="bkt-matches bkt-top">${matchCard(qf[0])}</div>
          <div class="bkt-matches bkt-bot">${matchCard(qf[1])}</div>
        </div>
        <div class="bkt-col bkt-sf">
          <div class="bkt-col-label">SEMI-FINALS</div>
          <div class="bkt-matches bkt-center">${matchCard(sf[0])}</div>
        </div>
      </div>

      <!-- FINAL -->
      <div class="bkt-final-col">
        <div class="bkt-final-label">FINAL</div>
        <div class="bkt-final-match">${matchCard(finalMatch)}</div>
        <div class="bkt-champion">
          <div class="bkt-champ-label">CHAMPION</div>
          <div class="bkt-trophy">🏆</div>
          <div class="bkt-champ-name">${champion ? esc(champion) : '?'}</div>
        </div>
      </div>

      <!-- RIGHT SIDE (mirror) -->
      <div class="bkt-side bkt-right">
        <div class="bkt-col bkt-sf">
          <div class="bkt-col-label">SEMI-FINALS</div>
          <div class="bkt-matches bkt-center">${matchCard(sf[1])}</div>
        </div>
        <div class="bkt-col bkt-qf">
          <div class="bkt-col-label">QUARTER-FINALS</div>
          <div class="bkt-matches bkt-top">${matchCard(qf[2])}</div>
          <div class="bkt-matches bkt-bot">${matchCard(qf[3])}</div>
        </div>
        <div class="bkt-col bkt-r16">
          <div class="bkt-col-label">ROUND OF 16</div>
          <div class="bkt-matches bkt-top">
            ${matchCard(r16[4])}
            ${matchCard(r16[5])}
          </div>
          <div class="bkt-matches bkt-bot">
            ${matchCard(r16[6])}
            ${matchCard(r16[7])}
          </div>
        </div>
      </div>

    </div>`;
}

// ── RENDER: SCORERS ──────────────────────────────────────────────
// 1 player per team → team name is the scorer identity
function renderScorers() {
  const sorted = [...SCORERS].sort((a,b)=>b.goals-a.goals||b.assists-a.assists);
  const wrap = qi('scorersWrap');
  wrap.innerHTML = '';
  sorted.forEach((s,i) => {
    const pos = i+1;
    const medal = pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':'';
    const maxG  = sorted[0].goals||1;
    const barW  = Math.round(100*s.goals/maxG);
    wrap.innerHTML += `
      <div class="sc-row ${pos<=3?'sc-top':''}">
        <div class="sc-pos ${pos===1?'gold':pos===2?'silver':pos===3?'bronze':''}">${pos<=3?medal:pos}</div>
        <div class="sc-info">
          <div class="sc-name">${esc(s.team)}</div>
          <div class="sc-team">${esc(s.player)} · Top Scorer</div>
        </div>
        <div class="sc-bar-wrap">
          <div class="sc-bar"><div class="sc-fill" style="width:${barW}%"></div></div>
        </div>
        <div class="sc-nums">
          <span class="sc-g">${s.goals}<small>G</small></span>
          <span class="sc-a">${s.assists}<small>A</small></span>
        </div>
      </div>`;
  });
}

// ── RENDER: TEAMS ────────────────────────────────────────────────
function renderTeams() {
  const wrap = qi('teamsWrap');
  wrap.innerHTML = '';
  let num = 1;
  Object.keys(GROUPS).sort().forEach(g => {
    GROUPS[g].forEach(name => {
      const st = groupStandings(g);
      const teamSt = st.find(r=>r.name===name)||{P:0,W:0,D:0,L:0,GF:0,GA:0,PTS:0};
      wrap.innerHTML += `
        <div class="tchip">
          <span class="tnum">${num++}</span>
          <div class="tinfo">
            <span class="tname">${esc(name)}</span>
            <span class="tgrp">Group ${g}</span>
          </div>
          <div class="tstats">
            <span class="tp">${teamSt.PTS} <small>PTS</small></span>
            <span class="tgf">${teamSt.GF} <small>GF</small></span>
          </div>
        </div>`;
    });
  });
}

// ── TAB NAVIGATION ───────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    qi(btn.dataset.tab).classList.add('active');
  });
});

// ── AUTO-REFRESH ─────────────────────────────────────────────────
let refreshInterval = null;
function startAutoRefresh() {
  renderAll();
  refreshInterval = setInterval(renderAll, 30000);
}
function renderAll() {
  renderDashboard();
  renderGroups();
  renderKnockout();
  renderScorers();
  renderTeams();
  updateHeader();
  updateLastRefresh();
}
function updateHeader() {
  const el = qi('tStatus'); if(el) el.textContent = TOURNAMENT.status;
  const s  = qi('tSeason'); if(s) s.textContent  = TOURNAMENT.season;
}
function updateLastRefresh() {
  const el = qi('lastRefresh');
  if(el) el.textContent = new Date().toLocaleTimeString();
}

document.addEventListener('DOMContentLoaded', startAutoRefresh);