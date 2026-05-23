// ============================================================
//  TOURNAMENT DATA — EDIT THIS FILE TO UPDATE THE TOURNAMENT
//  PlayVerse eFootball — Single Round Robin (32 Teams)
//  Points: Win = 3 | Draw = 1 | Loss = 0
// ============================================================

// ─── TOURNAMENT META ────────────────────────────────────────
const TOURNAMENT = {
  name: "PlayVerse eFootball Competition",
  season: "Season 2026",
  format: "Single Round Robin",
  status: "Ongoing",         // e.g. "Ongoing", "Completed"
};

// ─── TEAMS ──────────────────────────────────────────────────
// Add/rename teams here. Exactly 32 teams.
const TEAMS = [
  "Alpha FC",       "Beta United",    "Gamma City",     "Delta Rangers",
  "Epsilon SC",     "Zeta Athletic",  "Eta Wolves",     "Theta Tigers",
  "Iota Stars",     "Kappa Kings",    "Lambda Lions",   "Mu Mavericks",
  "Nu Ninjas",      "Xi Xtreme",      "Omicron FC",     "Pi Panthers",
  "Rho Raiders",    "Sigma Strikers", "Tau Titans",     "Upsilon United",
  "Phi Phoenix",    "Chi Chargers",   "Psi Warriors",   "Omega FC",
  "Nova SC",        "Pulsar FC",      "Quasar United",  "Comet City",
  "Astral FC",      "Nebula Rangers", "Solar SC",       "Lunar United",
];

// ─── MATCH RESULTS ──────────────────────────────────────────
// Format: { home: "Team A", away: "Team B", hg: 2, ag: 1 }
// hg = home goals, ag = away goals
// Leave hg/ag as null for unplayed matches
// Each team plays every other team once (32×31/2 = 496 total matches)

const MATCH_RESULTS = [
  // ── ROUND 1 ───────────────────────────────────────────
  { home: "Alpha FC",       away: "Beta United",    hg: 2, ag: 1 },
  { home: "Gamma City",     away: "Delta Rangers",  hg: 1, ag: 1 },
  { home: "Epsilon SC",     away: "Zeta Athletic",  hg: 3, ag: 0 },
  { home: "Eta Wolves",     away: "Theta Tigers",   hg: 2, ag: 2 },
  { home: "Iota Stars",     away: "Kappa Kings",    hg: 1, ag: 0 },
  { home: "Lambda Lions",   away: "Mu Mavericks",   hg: 0, ag: 2 },
  { home: "Nu Ninjas",      away: "Xi Xtreme",      hg: 4, ag: 1 },
  { home: "Omicron FC",     away: "Pi Panthers",    hg: 2, ag: 3 },
  { home: "Rho Raiders",    away: "Sigma Strikers", hg: 1, ag: 1 },
  { home: "Tau Titans",     away: "Upsilon United", hg: 0, ag: 2 },
  { home: "Phi Phoenix",    away: "Chi Chargers",   hg: 2, ag: 0 },
  { home: "Psi Warriors",   away: "Omega FC",       hg: 1, ag: 3 },
  { home: "Nova SC",        away: "Pulsar FC",      hg: 2, ag: 2 },
  { home: "Quasar United",  away: "Comet City",     hg: 3, ag: 1 },
  { home: "Astral FC",      away: "Nebula Rangers", hg: 1, ag: 0 },
  { home: "Solar SC",       away: "Lunar United",   hg: 2, ag: 2 },

  // ── ROUND 2 ───────────────────────────────────────────
  { home: "Beta United",    away: "Gamma City",     hg: 0, ag: 1 },
  { home: "Delta Rangers",  away: "Epsilon SC",     hg: 2, ag: 2 },
  { home: "Zeta Athletic",  away: "Eta Wolves",     hg: 1, ag: 0 },
  { home: "Theta Tigers",   away: "Iota Stars",     hg: 3, ag: 1 },
  { home: "Kappa Kings",    away: "Lambda Lions",   hg: 1, ag: 2 },
  { home: "Mu Mavericks",   away: "Nu Ninjas",      hg: 2, ag: 0 },
  { home: "Xi Xtreme",      away: "Omicron FC",     hg: 1, ag: 1 },
  { home: "Pi Panthers",    away: "Rho Raiders",    hg: 3, ag: 0 },
  { home: "Sigma Strikers", away: "Tau Titans",     hg: 2, ag: 1 },
  { home: "Upsilon United", away: "Phi Phoenix",    hg: 0, ag: 1 },
  { home: "Chi Chargers",   away: "Psi Warriors",   hg: 2, ag: 2 },
  { home: "Omega FC",       away: "Nova SC",        hg: 3, ag: 1 },
  { home: "Pulsar FC",      away: "Quasar United",  hg: 1, ag: 2 },
  { home: "Comet City",     away: "Astral FC",      hg: 0, ag: 0 },
  { home: "Nebula Rangers", away: "Solar SC",       hg: 2, ag: 1 },
  { home: "Lunar United",   away: "Alpha FC",       hg: 1, ag: 3 },

  // ── Add more rounds below as matches are played ───────
  // { home: "Team A", away: "Team B", hg: 2, ag: 1 },
];