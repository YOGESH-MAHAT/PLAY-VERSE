/* ================================================================
   PLAYVERSE eFOOTBALL — tournament_data.js
   World Cup Format: 8 Groups × 4 Teams → Knockout Rounds
   ================================================================

   HOW TO EDIT (admin only):
   ─────────────────────────────────────────────────────────────────
   1. TEAMS: Edit names in GROUPS below. 4 teams per group, 8 groups.
   2. GROUP MATCHES: Set s1/s2 (goals). null = not played yet.
   3. SCORERS: Add/update player goals in SCORERS array.
   4. KNOCKOUT: Fill in KNOCKOUT bracket manually after group stage.
   5. DRAW_SEED: Change this number to get a different bracket draw.
   ================================================================ */

'use strict';

// ── TOURNAMENT META ──────────────────────────────────────────────
const TOURNAMENT = {
  name:   'PlayVerse eFootball Championship',
  season: 'Season 2026',
  status: 'Group Stage', // 'Group Stage' | 'Knockout' | 'Completed'
};

// ── DRAW SEED (change to re-randomize knockout bracket) ──────────
const DRAW_SEED = 42;

// ── GROUPS (8 groups × 4 teams = 32 teams) ──────────────────────
// Edit team names freely. Keep exactly 4 per group.
const GROUPS = {
  A: ['Alpha FC',      'Beta United',   'Gamma City',    'Delta Rangers'],
  B: ['Epsilon SC',    'Zeta Athletic', 'Eta Wolves',    'Theta Tigers'],
  C: ['Iota Stars',    'Kappa Kings',   'Lambda Lions',  'Mu Mavericks'],
  D: ['Nu Ninjas',     'Xi Xtreme',     'Omicron FC',    'Pi Panthers'],
  E: ['Rho Raiders',   'Sigma Strike',  'Tau Titans',    'Upsilon Utd'],
  F: ['Phi Phoenix',   'Chi Chargers',  'Psi Warriors',  'Omega FC'],
  G: ['Nova SC',       'Pulsar FC',     'Quasar Utd',    'Comet City'],
  H: ['Astral FC',     'Nebula Rngrs',  'Solar SC',      'Lunar United'],
};

// ── GROUP STAGE MATCHES ──────────────────────────────────────────
// Each group: 6 matches (round-robin, every team vs every other once)
// s1 = score of t1, s2 = score of t2. null = not yet played.
const GROUP_MATCHES = {
  A: [
    { t1: 'Alpha FC',    t2: 'Beta United',  s1: 8,    s2: 1    },
    { t1: 'Gamma City',  t2: 'Delta Rangers',s1: 2,    s2: 2    },
    { t1: 'Alpha FC',    t2: 'Gamma City',   s1: 1,    s2: 0    },
    { t1: 'Beta United', t2: 'Delta Rangers',s1: 2,    s2: 3    },
    { t1: 'Alpha FC',    t2: 'Delta Rangers',s1: 2,    s2: 1    },
    { t1: 'Beta United', t2: 'Gamma City',   s1: null, s2: null },
  ],
  B: [
    { t1: 'Epsilon SC',   t2: 'Zeta Athletic', s1: 1, s2: 1    },
    { t1: 'Eta Wolves',   t2: 'Theta Tigers',  s1: 0, s2: 2    },
    { t1: 'Epsilon SC',   t2: 'Eta Wolves',    s1: 3, s2: 0    },
    { t1: 'Zeta Athletic',t2: 'Theta Tigers',  s1: 1, s2: 2    },
    { t1: 'Epsilon SC',   t2: 'Theta Tigers',  s1: 2, s2: 2    },
    { t1: 'Zeta Athletic',t2: 'Eta Wolves',    s1: null, s2: null },
  ],
  C: [
    { t1: 'Iota Stars',   t2: 'Kappa Kings',   s1: 2, s2: 0    },
    { t1: 'Lambda Lions', t2: 'Mu Mavericks',  s1: 1, s2: 3    },
    { t1: 'Iota Stars',   t2: 'Lambda Lions',  s1: 1, s2: 1    },
    { t1: 'Kappa Kings',  t2: 'Mu Mavericks',  s1: 0, s2: 1    },
    { t1: 'Iota Stars',   t2: 'Mu Mavericks',  s1: 3, s2: 2    },
    { t1: 'Kappa Kings',  t2: 'Lambda Lions',  s1: null, s2: null },
  ],
  D: [
    { t1: 'Nu Ninjas',   t2: 'Xi Xtreme',    s1: 4, s2: 1    },
    { t1: 'Omicron FC',  t2: 'Pi Panthers',  s1: 2, s2: 3    },
    { t1: 'Nu Ninjas',   t2: 'Omicron FC',   s1: 2, s2: 0    },
    { t1: 'Xi Xtreme',   t2: 'Pi Panthers',  s1: 1, s2: 2    },
    { t1: 'Nu Ninjas',   t2: 'Pi Panthers',  s1: 1, s2: 1    },
    { t1: 'Xi Xtreme',   t2: 'Omicron FC',   s1: null, s2: null },
  ],
  E: [
    { t1: 'Rho Raiders',  t2: 'Sigma Strike', s1: 1, s2: 1    },
    { t1: 'Tau Titans',   t2: 'Upsilon Utd',  s1: 2, s2: 0    },
    { t1: 'Rho Raiders',  t2: 'Tau Titans',   s1: 0, s2: 1    },
    { t1: 'Sigma Strike', t2: 'Upsilon Utd',  s1: 2, s2: 0    },
    { t1: 'Rho Raiders',  t2: 'Upsilon Utd',  s1: 3, s2: 2    },
    { t1: 'Sigma Strike', t2: 'Tau Titans',   s1: null, s2: null },
  ],
  F: [
    { t1: 'Phi Phoenix',  t2: 'Chi Chargers', s1: 2, s2: 0    },
    { t1: 'Psi Warriors', t2: 'Omega FC',     s1: 1, s2: 3    },
    { t1: 'Phi Phoenix',  t2: 'Psi Warriors', s1: 2, s2: 1    },
    { t1: 'Chi Chargers', t2: 'Omega FC',     s1: 2, s2: 2    },
    { t1: 'Phi Phoenix',  t2: 'Omega FC',     s1: 1, s2: 2    },
    { t1: 'Chi Chargers', t2: 'Psi Warriors', s1: null, s2: null },
  ],
  G: [
    { t1: 'Nova SC',      t2: 'Pulsar FC',    s1: 2, s2: 2    },
    { t1: 'Quasar Utd',   t2: 'Comet City',   s1: 3, s2: 1    },
    { t1: 'Nova SC',      t2: 'Quasar Utd',   s1: 0, s2: 1    },
    { t1: 'Pulsar FC',    t2: 'Comet City',   s1: 2, s2: 0    },
    { t1: 'Nova SC',      t2: 'Comet City',   s1: 2, s2: 1    },
    { t1: 'Pulsar FC',    t2: 'Quasar Utd',   s1: null, s2: null },
  ],
  H: [
    { t1: 'Astral FC',    t2: 'Nebula Rngrs', s1: 1, s2: 0    },
    { t1: 'Solar SC',     t2: 'Lunar United', s1: 2, s2: 2    },
    { t1: 'Astral FC',    t2: 'Solar SC',     s1: 1, s2: 1    },
    { t1: 'Nebula Rngrs', t2: 'Lunar United', s1: 2, s2: 1    },
    { t1: 'Astral FC',    t2: 'Lunar United', s1: 2, s2: 0    },
    { t1: 'Solar SC',     t2: 'Nebula Rngrs', s1: null, s2: null },
  ],
};

// ── TOP SCORERS ──────────────────────────────────────────────────
// Add players and their goals here. Update after each round.
// Format: { player: "Name", team: "Team Name", goals: 5, assists: 2 }
const SCORERS = [
  { player: 'Carlos Silva',    team: 'Alpha FC',      goals: 6, assists: 3 },
  { player: 'Kwame Mensah',    team: 'Nu Ninjas',     goals: 5, assists: 1 },
  { player: 'Aryan Patel',     team: 'Phi Phoenix',   goals: 4, assists: 4 },
  { player: 'Jordan Brooks',   team: 'Omega FC',      goals: 4, assists: 2 },
  { player: 'Luca Ferretti',   team: 'Quasar Utd',    goals: 4, assists: 1 },
  { player: 'Ravi Kumar',      team: 'Mu Mavericks',  goals: 3, assists: 3 },
  { player: 'Diego Reyes',     team: 'Delta Rangers', goals: 3, assists: 2 },
  { player: 'Yuki Tanaka',     team: 'Theta Tigers',  goals: 3, assists: 2 },
  { player: 'Finn Larsson',    team: 'Tau Titans',    goals: 3, assists: 1 },
  { player: 'Moses Okafor',    team: 'Pi Panthers',   goals: 3, assists: 0 },
  { player: 'Hassan Ali',      team: 'Sigma Strike',  goals: 2, assists: 4 },
  { player: 'Tomás Herrera',   team: 'Iota Stars',    goals: 2, assists: 3 },
  { player: 'Wei Chen',        team: 'Nova SC',       goals: 2, assists: 2 },
  { player: 'Emeka Nwachukwu', team: 'Nebula Rngrs',  goals: 2, assists: 1 },
  { player: 'Jake Morrison',   team: 'Rho Raiders',   goals: 2, assists: 1 },
];

// ── KNOCKOUT BRACKET ─────────────────────────────────────────────
// Filled automatically from group results via random draw.
// You can OVERRIDE the auto-draw by setting teams manually below.
// Leave as null to use the auto-draw system.
// Format: { t1: "Team A", t2: "Team B", s1: null, s2: null }
// For extra-time/penalties: add  et: true, pen1: 4, pen2: 3
const KNOCKOUT = {
  // Round of 16 — 8 matches (populated by draw engine or set manually)
  r16: [
    // { t1: 'Alpha FC', t2: 'Theta Tigers', s1: null, s2: null },
    // ... leave empty to use auto-draw
  ],
  // Quarter-Finals — 4 matches
  qf: [
    // { t1: null, t2: null, s1: null, s2: null },
  ],
  // Semi-Finals — 2 matches
  sf: [
    // { t1: null, t2: null, s1: null, s2: null },
  ],
  // Final — 1 match
  final: [
    // { t1: null, t2: null, s1: null, s2: null },
  ],
};