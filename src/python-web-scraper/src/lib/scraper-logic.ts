// ─────────────────────────────────────────────────────────────
// IMPROVED SCRAPER LOGIC
// ─────────────────────────────────────────────────────────────
// Key fixes vs the original Python scraper:
//
// 1. LOWERED Nigeria relevance threshold from 2 → 1 for KNOWN
//    Nigerian source domains. All feeds ARE Nigerian news sites,
//    so any Nigeria marker = relevant.
//
// 2. LESS AGGRESSIVE follow-up/aftermath detection:
//    - Only skip if aftermath keyword is in the TITLE AND
//      there are NO fresh incident keywords in the title
//    - Raised the "aftermath signals dominate" threshold
//      from 3 to 5 so legitimate incident reports with some
//      aftermath context are not filtered
//
// 3. ADDED injuries field - the original only tracked fatalities
//    and abductions, missing incidents where people were wounded
//
// 4. BROADER conflict-casualty gate: accepts injuries as a
//    valid casualty type (not just deaths/abductions)
//
// 5. IMPROVED state resolution with more aliases and fuzzy matching
//
// 6. BETTER deduplication: tiered approach with looser date
//    tolerance for high-casualty events
// ─────────────────────────────────────────────────────────────

import { resolveState } from "./nigeria-data";

// ─────────────────────────────────────────────────────────────
// NIGERIA RELEVANCE (FIX #1: Lower threshold for known sources)
// ─────────────────────────────────────────────────────────────
const NIGERIA_TERMS = [
  "nigeria", "nigerian", "abuja", "lagos", "kaduna", "kano", "borno", "plateau",
  "army", "police", "dss", "bandits", "banditry", "boko haram", "herdsmen",
  "kidnap", "kidnapped", "kidnapping", "abducted", "abduction", "hostage", "ransom",
  // ADDED: more Nigerian markers the original missed
  "fulani", "iswap", "insurgency", "militant", "militia",
  "igbo", "hausa", "yoruba", "niger delta",
  "northeast", "northwest", "northcentral", "southeast", "southsouth", "southwest",
  "fct", "herder", "cultist", "cultism", "jungle justice",
  // All state names
  "abia", "adamawa", "akwa ibom", "anambra", "bauchi", "bayelsa", "benue",
  "cross river", "delta", "ebonyi", "edo", "ekiti", "enugu", "gombe", "imo",
  "jigawa", "katsina", "kebbi", "kogi", "kwara", "nasarawa", "niger state",
  "ogun", "ondo", "osun", "oyo", "rivers", "sokoto", "taraba", "yobe", "zamfara",
];

const nigeriaPatterns = NIGERIA_TERMS.map(
  (t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
);

/** Known Nigerian news domains - these are ALL Nigerian sources */
const NIGERIAN_DOMAINS = new Set([
  "premiumtimesng.com",
  "punchng.com",
  "vanguardngr.com",
  "dailytrust.com",
  "thecable.ng",
  "channelstv.com",
]);

/**
 * FIX #1: For known Nigerian source domains, threshold = 1.
 * For unknown domains, threshold = 2 (keeps the original behavior).
 */
export function nigeriaScore(text: string): number {
  return nigeriaPatterns.reduce((count, p) => count + (p.test(text) ? 1 : 0), 0);
}

export function isNigeriaRelevant(
  title: string,
  text: string,
  sourceDomain?: string
): boolean {
  if (text.length < 100) return false; // lowered from 150

  const isNigerianSource = sourceDomain
    ? NIGERIAN_DOMAINS.has(sourceDomain) ||
      Array.from(NIGERIAN_DOMAINS).some((d) => sourceDomain.includes(d))
    : false;

  const threshold = isNigerianSource ? 1 : 2;
  const score = nigeriaScore(`${title} ${text}`);
  return score >= threshold;
}

// ─────────────────────────────────────────────────────────────
// AFTERMATH / FOLLOW-UP DETECTION (FIX #2: Less aggressive)
// ─────────────────────────────────────────────────────────────
const AFTERMATH_KEYWORDS = [
  "rescue", "rescued", "rescue operation",
  "release", "released", "freed", "regain freedom", "regained freedom",
  "recover", "recovered", "recovery",
  "escape", "escaped",
  "reunite", "reunited",
  "condole", "condolence", "commiserate", "commiseration",
  "compensation", "compensate", "palliative",
  "arrest", "arrested", "apprehend", "apprehended",
  "trial", "court", "prosecution", "prosecuted", "charged",
  "sentenced", "convict", "convicted",
  "memorial", "remembrance", "anniversary",
  "buried", "funeral", "burial", "laid to rest", "mass burial",
  "widow", "widows", "survivor", "survivors",
  "orphan", "orphans", "displaced",
  "update on", "update:", "latest on",
  // REMOVED: "investigation", "investigate", "probe", "visit", "visits",
  // "relief", "aid", "donate", "donation", "sympathize", "sympathy"
  // These are too generic and cause false positives
];

const FRESH_INCIDENT_KEYWORDS = [
  "attack", "attacked", "attackers", "attacking",
  "kill", "killed", "killing", "slain",
  "kidnap", "kidnapped", "kidnapping",
  "abduct", "abducted", "abduction",
  "gunmen", "armed men", "assailants",
  "bomb", "bombing", "explosion", "blast",
  "clash", "clashed", "fighting",
  "ambush", "ambushed",
  "raid", "raided", "invasion", "invaded",
  "storm", "stormed",
  "massacre", "massacred",
  "shot", "shooting", "gunfire",
  "wound", "wounded", "injured",
  "burn", "burnt", "torched",
];

/**
 * FIX #2: Improved follow-up detection.
 *
 * The original skipped articles if:
 *   - Any aftermath keyword appeared in the title
 *   - aftermath_count >= 3 AND aftermath_count > fresh_count
 *
 * The new logic:
 *   - Only skip if aftermath keyword in title AND no fresh keywords in title
 *   - Raised threshold to 5 (from 3) for body text dominance check
 *   - Exception: rescue operations with casualties are NEVER skipped
 */
export function isFollowupArticle(title: string, text: string): boolean {
  const titleLower = (title || "").toLowerCase();
  const textLower = (text || "").toLowerCase();

  // ── Exception: rescue with casualties = never skip ──
  const rescueTerms = ["rescue", "rescued", "freed", "released"];
  const casualtyTerms = [
    "kill", "killed", "death", "die", "died",
    "wound", "wounded", "casualty", "casualties",
    "blast", "explosion", "shooting", "gunfire", "crossfire",
  ];

  const hasRescue = rescueTerms.some((t) => textLower.includes(t));
  const hasCasualties = casualtyTerms.some((t) => textLower.includes(t));

  if (hasRescue && hasCasualties) {
    return false; // Allow LLM to evaluate
  }

  // ── Rule 1: Aftermath in title = skip ONLY IF no fresh keywords in title ──
  const hasAftermathInTitle = AFTERMATH_KEYWORDS.some((k) => titleLower.includes(k));
  const hasFreshInTitle = FRESH_INCIDENT_KEYWORDS.some((k) => titleLower.includes(k));

  if (hasAftermathInTitle && !hasFreshInTitle) {
    return true; // Clearly aftermath
  }

  // ── Rule 2: Body text dominance check (threshold raised from 3 → 5) ──
  const aftermathCount = AFTERMATH_KEYWORDS.filter((k) => textLower.includes(k)).length;
  const freshCount = FRESH_INCIDENT_KEYWORDS.filter((k) => textLower.includes(k)).length;

  if (aftermathCount >= 5 && aftermathCount > freshCount * 2) {
    return true; // Overwhelmingly aftermath
  }

  return false;
}

// ─────────────────────────────────────────────────────────────
// CONFLICT-CASUALTY CLASSIFICATION (FIX #3 & #4)
// ─────────────────────────────────────────────────────────────
const CONFLICT_KEYWORDS = [
  "attack", "assault", "killing", "killed", "massacre", "slain", "gunmen",
  "bandit", "banditry", "terror", "insurg", "boko", "iswap", "ispwa",
  "clash", "communal", "ethnic", "reprisal", "herdsmen", "herder", "fulani",
  "kidnap", "abduct", "hostage", "ransom", "ambush", "raid", "invasion",
  "shoot", "shooting", "gun", "bomb", "ied", "explos", "suicide",
  "militia", "cult", "cultism", "armed", "violence", "unrest", "riot",
  // ADDED: more conflict indicators
  "wound", "wounded", "injured", "burnt", "torched", "hacked",
  "behead", "slaughter", "execute", "execution",
];

const NON_CONFLICT_KEYWORDS = [
  "accident", "crash", "collision", "collapse", "flood", "fire outbreak",
  "stampede", "drown", "electrocut", "lightning", "cholera",
  "epidemic", "poison", "food poisoning",
  "childbirth", "capsize",
  // REMOVED: "outbreak", "suicide bid", "tanker explosion", "disease"
  // These can overlap with conflict incidents
];

export function canonicalIncidentType(raw: string): string {
  const it = (raw || "").toLowerCase().trim();
  if (!it) return "other";

  if (["kidnap", "abduct", "hostage", "ransom"].some((k) => it.includes(k))) return "kidnapping";
  if (["boko", "iswap", "ispwa", "insurg", "terror"].some((k) => it.includes(k))) return "terrorism";
  if (it.includes("bandit")) return "banditry";
  if (["bomb", "ied", "explos", "suicide"].some((k) => it.includes(k))) return "bombing";
  if (["clash", "communal", "ethnic", "reprisal", "herd", "farmer", "cult"].some((k) => it.includes(k))) return "clash";
  if (["attack", "ambush", "raid", "gun", "shoot", "assault", "invasion", "militia", "armed", "killing", "robbery"].some((k) => it.includes(k))) return "armed attack";
  return "other";
}

/**
 * FIX #3 & #4: Accept injuries as valid casualty type.
 *
 * Original: only accepted fatalities > 0 OR abductions > 0
 * New: also accepts injuries > 0 for known conflict types
 */
export function isConflictCasualty(
  incidentType: string,
  fatalities: number,
  abductions: number,
  injuries: number = 0
): boolean {
  const f = fatalities || 0;
  const a = abductions || 0;
  const w = injuries || 0;

  const it = (incidentType || "").toLowerCase().trim();

  // Explicit non-conflict cause → reject
  if (NON_CONFLICT_KEYWORDS.some((k) => it.includes(k))) {
    return false;
  }

  // Any deaths or abductions = conflict incident
  if (f > 0 || a > 0) return true;

  // FIX: Injuries also count if there's a conflict keyword
  if (w > 0 && CONFLICT_KEYWORDS.some((k) => it.includes(k))) return true;

  // If no casualties at all, reject
  if (f <= 0 && a <= 0 && w <= 0) return false;

  // Has conflict keyword but no specific casualty = still allow
  // (the LLM might have missed the numbers)
  if (CONFLICT_KEYWORDS.some((k) => it.includes(k))) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────
// DEDUPLICATION (FIX #5: Tiered approach)
// ─────────────────────────────────────────────────────────────
export function casualtyBand(n: number): string {
  const num = n || 0;
  if (num <= 0) return "0";
  if (num <= 5) return "1-5";
  if (num <= 15) return "6-15";
  if (num <= 50) return "16-50";
  return "50+";
}

export function semanticFingerprint(
  dateStr: string,
  state: string | null,
  lga: string | null,
  canonicalType: string,
  fatalities: number,
  abductions: number
): string {
  const stateN = (state || "unknown").trim().toLowerCase();
  const lgaN = (lga || "").trim().toLowerCase();
  const incN = (canonicalType || "unknown").trim().toLowerCase();

  // Date bucketing (7-day windows)
  let bucket = "unknown";
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      bucket = String(Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000)));
    }
  }

  let base = `${stateN}|${incN}|${casualtyBand(fatalities)}|${casualtyBand(abductions)}|${bucket}`;
  if (lgaN) base += `|${lgaN}`;

  // Simple hash (browser-friendly, no crypto dependency needed at this layer)
  return base; // The DB will hash this if needed
}

/**
 * FIX #6: Improved duplicate detection.
 *
 * Two-tier approach:
 * - Tier 1: Exact semantic fingerprint match (fast)
 * - Tier 2: Fuzzy match with state + type + date proximity
 *
 * For high-casualty events (50+), use wider date tolerance
 * because reporting can span weeks.
 */
export interface IncidentSignature {
  state: string;
  lga: string | null;
  incidentType: string;
  date: Date | null;
  fatalities: number;
  abductions: number;
}

const DEFAULT_DATE_TOLERANCE = 7; // days
const HIGH_CASUALTY_DATE_TOLERANCE = 14; // days for 50+ events
const FATALITY_TOLERANCE = 5;
const ABDUCTION_TOLERANCE = 10;

export function isDuplicate(
  sig: IncidentSignature,
  existing: IncidentSignature[]
): boolean {
  for (const r of existing) {
    // State must match exactly
    if (r.state !== sig.state) continue;

    // Incident type must match exactly
    if (r.incidentType !== sig.incidentType) continue;

    // LGA must be compatible
    const rLga = (r.lga || "").trim().toLowerCase() || null;
    const sLga = (sig.lga || "").trim().toLowerCase() || null;
    if (rLga && sLga && rLga !== sLga) continue;

    // Date proximity check
    if (!r.date || !sig.date) continue;
    const daysDiff = Math.abs(
      (r.date.getTime() - sig.date.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Higher tolerance for mass-casualty events
    const maxFat = Math.max(r.fatalities, sig.fatalities);
    const tolerance = maxFat >= 50 ? HIGH_CASUALTY_DATE_TOLERANCE : DEFAULT_DATE_TOLERANCE;

    if (daysDiff > tolerance) continue;

    // Casualty tolerance (more forgiving for high counts)
    const fatTolerance = Math.max(FATALITY_TOLERANCE, Math.max(r.fatalities, sig.fatalities) * 0.2);
    const abdTolerance = Math.max(ABDUCTION_TOLERANCE, Math.max(r.abductions, sig.abductions) * 0.2);

    if (Math.abs(r.fatalities - sig.fatalities) > fatTolerance) continue;
    if (Math.abs(r.abductions - sig.abductions) > abdTolerance) continue;

    return true; // This is a duplicate
  }

  return false;
}

// ─────────────────────────────────────────────────────────────
// POST-PROCESSING VALIDATION (IMPROVED)
// ─────────────────────────────────────────────────────────────
export function validateAndFixIncident(
  incident: Record<string, unknown>,
  articleText: string,
  articleDate: string
): Record<string, unknown> | null {
  if (!incident) return null;

  const textLower = articleText.toLowerCase();
  const articleYear = articleDate.slice(0, 4);

  // ── Fix 1: Detect missed fatalities ──
  let fatalities = Number(incident.fatalities) || 0;
  if (fatalities === 0) {
    const patterns = [
      /at least (\d+)\s+(?:killed|shot|slain|dead)/,
      /over (\d+)\s+(?:killed|shot|slain|dead)/,
      /(\d+)\s+(?:killed|shot|slain|dead|murdered)/,
      /(?:killed|shot|slain|dead|murdered)\s+(\d+)/,
      /(\d+)\s+(?:people|residents|persons?|soldiers?|civilians?)\s+(?:killed|shot|dead)/,
    ];

    for (const pattern of patterns) {
      const match = textLower.match(pattern);
      if (match) {
        const nums = match.filter((g, i) => i > 0 && g && /^\d+$/.test(g));
        if (nums.length > 0) {
          fatalities = parseInt(nums[0], 10);
          incident.fatalities = fatalities;
          break;
        }
      }
    }
  }

  // ── Fix 2: Detect missed abductions ──
  let abductions = Number(incident.abductions) || 0;
  if (abductions === 0) {
    const patterns = [
      /at least (\d+)\s+(?:abducted|kidnapped|missing)/,
      /(\d+)\s+(?:abducted|kidnapped|missing|taken)/,
      /(?:abducted|kidnapped|missing|taken)\s+(\d+)/,
      /(\d+)\s+(?:people|residents|persons?|civilians?)\s+(?:abducted|kidnapped)/,
    ];

    for (const pattern of patterns) {
      const match = textLower.match(pattern);
      if (match) {
        const nums = match.filter((g, i) => i > 0 && g && /^\d+$/.test(g));
        if (nums.length > 0) {
          abductions = parseInt(nums[0], 10);
          incident.abductions = abductions;
          break;
        }
      }
    }
  }

  // ── Fix 3: Detect missed injuries ──
  let injuries = Number(incident.injuries) || 0;
  if (injuries === 0) {
    const patterns = [
      /(\d+)\s+(?:wounded|injured|hurt)/,
      /(?:wounded|injured|hurt)\s+(\d+)/,
      /at least (\d+)\s+(?:wounded|injured)/,
    ];

    for (const pattern of patterns) {
      const match = textLower.match(pattern);
      if (match) {
        const nums = match.filter((g, i) => i > 0 && g && /^\d+$/.test(g));
        if (nums.length > 0) {
          injuries = parseInt(nums[0], 10);
          incident.injuries = injuries;
          break;
        }
      }
    }
  }

  // ── Fix 4: Correct date year mismatches ──
  const occDate = String(incident.occurrence_date || "").slice(0, 10);
  if (occDate && occDate.length >= 4) {
    const occYear = parseInt(occDate.slice(0, 4), 10);
    const artYear = parseInt(articleYear, 10);

    if (!isNaN(occYear) && !isNaN(artYear)) {
      if (occYear < artYear - 1 || occYear > artYear + 1) {
        incident.occurrence_date = `${articleYear}${occDate.slice(4)}`;
      }
    }
  }

  // ── Fix 5: Reclassify robbery with violence ──
  const incidentType = String(incident.incident_type || "").toLowerCase();
  if (incidentType === "robbery") {
    const violenceMarkers = ["gun", "shot", "killed", "attack", "armed", "gunfire", "wound"];
    if (violenceMarkers.some((m) => textLower.includes(m))) {
      incident.incident_type = "armed attack";
    }
  }

  // ── Final validation ──
  fatalities = Number(incident.fatalities) || 0;
  abductions = Number(incident.abductions) || 0;
  injuries = Number(incident.injuries) || 0;

  // FIX #4: Accept injuries as valid too
  if (fatalities <= 0 && abductions <= 0 && injuries <= 0) {
    return null;
  }

  return incident;
}

// ─────────────────────────────────────────────────────────────
// LLM EXTRACTION PROMPT (IMPROVED)
// ─────────────────────────────────────────────────────────────
export const EXTRACTION_PROMPT = `The article was published on: {article_date}.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no preamble.

Extract ONLY conflict-related casualty incidents in Nigeria.

A qualifying incident is:
- Terrorist / bandit attacks
- Kidnappings / abductions
- Communal / farmer-herder clashes
- Armed robberies with deaths or injuries
- Bombings / explosions
- Cult clashes / militia attacks
- Any violent incident with casualties

INCIDENTS MUST HAVE AT LEAST ONE CASUALTY (killed, abducted, OR wounded).

════════════════════════════════════════════════════════════════

CASUALTY EXTRACTION RULES:

1. FATALITIES (people killed):
   - Look for: "killed", "shot dead", "slain", "murdered", "dead", "died"
   - If it says "at least 12 killed" → fatalities = 12
   - If it says "over 20 killed" → fatalities = 20
   - If it says "many killed" and no number → fatalities = 1
   ✅ EXTRACT NUMBERS EVEN IF THEY ARE APPROXIMATE
   ❌ DO NOT REJECT INCIDENTS BECAUSE THE NUMBER IS APPROXIMATE

2. ABDUCTIONS (people kidnapped):
   - Look for: "kidnapped", "abducted", "hostage", "missing", "taken"
   - Same rules as above.

3. INJURIES (people wounded):
   - Look for: "wounded", "injured", "hurt", "hospitalised", "hospitalized"
   - Same rules as above.
   - This is IMPORTANT - do not omit injured counts.

4. REJECTION GATE:
   - If fatalities = 0 AND abductions = 0 AND injuries = 0 → Return {{"incidents": []}}
   - At least ONE must be > 0 to extract

════════════════════════════════════════════════════════════════

DATE EXTRACTION RULES:

1. occurrence_date is when the INCIDENT happened (not the article date)
2. Article date context: {article_date}
3. Extract from phrases:
   - "on Friday" → infer actual date from article context
   - "yesterday" → day before article_date
   - "last Sunday" → most recent Sunday before article_date
   - "July 3" → use article year

4. YEAR CORRECTION:
   - If LLM extracts a year from 2022-2025 → CORRECT to {article_date} year
   - Default to {article_date} year if uncertain

════════════════════════════════════════════════════════════════

INCIDENT TYPE CLASSIFICATION:

- "bandits attack" → "banditry"
- "Boko Haram / ISWAP attack" → "terrorism"
- "farmers herders clash" → "clash"
- "communal clash" → "clash"
- "cult clash" → "clash"
- "armed robbery with deaths" → "armed attack"
- "robbery with violence" → "armed attack"
- "kidnapping" → "kidnapping"
- "bombing/explosion" → "bombing"

════════════════════════════════════════════════════════════════

IF NO QUALIFYING INCIDENTS: Return exactly:
{{"incidents": []}}

OTHERWISE: Extract every distinct incident with ALL these keys:
{{
  "state": "State Name" or null,
  "lga": "LGA Name" or null,
  "community": "Village/Community Name" or "Unknown",
  "incident_type": one of [kidnapping, terrorism, banditry, bombing, clash, armed attack, other],
  "fatalities": integer >= 0 or null,
  "abductions": integer >= 0 or null,
  "injuries": integer >= 0 or null,
  "occurrence_date": "YYYY-MM-DD" or null,
  "summary": "Brief description of what happened"
}}

Title: {title}
Text: {text}`;
