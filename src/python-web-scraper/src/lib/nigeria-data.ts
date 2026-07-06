// ─────────────────────────────────────────────────────────────
// NIGERIAN STATES + ALIASES (EXPANDED)
// ─────────────────────────────────────────────────────────────
export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara", "FCT",
] as const;

export const STATE_SET = new Set(NIGERIAN_STATES);

export const STATE_MAP = new Map<string, string>();
for (const s of NIGERIAN_STATES) {
  STATE_MAP.set(s.toLowerCase(), s);
}

// EXPANDED aliases - the original missed many common forms
export const STATE_ALIASES: Record<string, string> = {
  // FCT variants
  abuja: "FCT",
  "federal capital": "FCT",
  "federal capital territory": "FCT",
  "abuja municipal": "FCT",

  // State name variants with "State" suffix
  "cross river state": "Cross River",
  "akwa ibom state": "Akwa Ibom",
  "river state": "Rivers",
  "rivers state": "Rivers",
  "lagos state": "Lagos",
  "kano state": "Kano",
  "kaduna state": "Kaduna",
  "borno state": "Borno",
  "plateau state": "Plateau",
  "benue state": "Benue",
  "niger state": "Niger",
  "oyo state": "Oyo",
  "ogun state": "Ogun",
  "delta state": "Delta",
  "edo state": "Edo",
  "enugu state": "Enugu",
  "imo state": "Imo",
  "anambra state": "Anambra",
  "katsina state": "Katsina",
  "sokoto state": "Sokoto",
  "kebbi state": "Kebbi",
  "zamfara state": "Zamfara",
  "taraba state": "Taraba",
  "yobe state": "Yobe",
  "adamawa state": "Adamawa",
  "gombe state": "Gombe",
  "bauchi state": "Bauchi",
  "jigawa state": "Jigawa",
  "kwara state": "Kwara",
  "kogi state": "Kogi",
  "nasarawa state": "Nasarawa",
  "abia state": "Abia",
  "ebonyi state": "Ebonyi",
  "ekiti state": "Ekiti",
  "ondo state": "Ondo",
  "osun state": "Osun",
  "bayelsa state": "Bayelsa",

  // Common misspellings / abbreviations
  "akwa ibon": "Akwa Ibom",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
  "nassarawa": "Nasarawa",
};

// ─────────────────────────────────────────────────────────────
// IMPROVED STATE RESOLUTION
// ─────────────────────────────────────────────────────────────
export function resolveState(raw: string): string | null {
  const val = raw.trim().toLowerCase();
  if (!val) return null;

  // Direct match
  if (STATE_MAP.has(val)) return STATE_MAP.get(val)!;

  // Alias match
  for (const [alias, canonical] of Object.entries(STATE_ALIASES)) {
    if (alias === val) return canonical;
  }

  // Partial match: check if any state name is contained in the input
  for (const [key, canonical] of STATE_MAP) {
    if (val.includes(key) || key.includes(val)) return canonical;
  }

  // Partial alias match
  for (const [alias, canonical] of Object.entries(STATE_ALIASES)) {
    if (val.includes(alias) || alias.includes(val)) return canonical;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// GEO-POLITICAL ZONES
// ─────────────────────────────────────────────────────────────
export const GEO_POLITICAL_ZONES: Record<string, string[]> = {
  "North Central": ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT"],
  "North East": ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  "North West": ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"],
  "South East": ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  "South South": ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"],
  "South West": ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"],
};

export function getZoneForState(state: string): string | null {
  for (const [zone, states] of Object.entries(GEO_POLITICAL_ZONES)) {
    if (states.includes(state)) return zone;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// INCIDENT TYPE COLORS
// ─────────────────────────────────────────────────────────────
export const INCIDENT_TYPE_COLORS: Record<string, string> = {
  terrorism: "#dc2626",     // red-600
  banditry: "#ea580c",     // orange-600
  kidnapping: "#d97706",   // amber-600
  "armed attack": "#e11d48", // rose-600
  clash: "#9333ea",        // purple-600
  bombing: "#c026d3",      // fuchsia-600
  other: "#6b7280",        // gray-500
};

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  terrorism: "Terrorism",
  banditry: "Banditry",
  kidnapping: "Kidnapping",
  "armed attack": "Armed Attack",
  clash: "Clash",
  bombing: "Bombing",
  other: "Other",
};

// ─────────────────────────────────────────────────────────────
// STATE COORDINATES (for map visualization)
// ─────────────────────────────────────────────────────────────
export const STATE_POSITIONS: Record<string, { row: number; col: number }> = {
  // North West
  Sokoto: { row: 0, col: 0 },
  Zamfara: { row: 0, col: 1 },
  Kebbi: { row: 1, col: 0 },
  Katsina: { row: 0, col: 2 },
  Kano: { row: 1, col: 2 },
  Kaduna: { row: 1, col: 1 },
  Jigawa: { row: 0, col: 3 },

  // North East
  Borno: { row: 0, col: 5 },
  Yobe: { row: 0, col: 4 },
  Bauchi: { row: 1, col: 4 },
  Gombe: { row: 1, col: 5 },
  Adamawa: { row: 1, col: 6 },
  Taraba: { row: 2, col: 6 },

  // North Central
  Niger: { row: 2, col: 0 },
  FCT: { row: 2, col: 2 },
  Nasarawa: { row: 2, col: 3 },
  Plateau: { row: 2, col: 4 },
  Kwara: { row: 3, col: 0 },
  Kogi: { row: 3, col: 2 },
  Benue: { row: 2, col: 5 },

  // South West
  Ogun: { row: 5, col: 0 },
  Lagos: { row: 6, col: 0 },
  Oyo: { row: 5, col: 1 },
  Osun: { row: 5, col: 2 },
  Ekiti: { row: 5, col: 3 },
  Ondo: { row: 6, col: 2 },

  // South East
  Enugu: { row: 4, col: 3 },
  Ebonyi: { row: 4, col: 4 },
  Anambra: { row: 5, col: 4 },
  Imo: { row: 5, col: 5 },
  Abia: { row: 5, col: 6 },

  // South South
  Edo: { row: 4, col: 1 },
  Delta: { row: 5, col: 1 },
  Bayelsa: { row: 6, col: 3 },
  Rivers: { row: 6, col: 4 },
  "Akwa Ibom": { row: 6, col: 5 },
  "Cross River": { row: 4, col: 5 },
};
