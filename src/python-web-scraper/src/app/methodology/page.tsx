import { db } from "@/db";
import { incidents } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const [stats] = await db
    .select({
      totalIncidents: sql<number>`count(*)::int`,
      totalFatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      statesAffected: sql<number>`count(distinct ${incidents.state})::int`,
    })
    .from(incidents);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Methodology &amp; Data Sources
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          How we collect, filter, and verify incident data
        </p>

        {/* Current coverage */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-bold text-red-900 mb-2">
            Current Coverage
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-800">
                {stats.totalIncidents}
              </p>
              <p className="text-xs text-red-600">Incidents Tracked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-800">
                {stats.totalFatalities}
              </p>
              <p className="text-xs text-red-600">Fatalities Recorded</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-800">
                {stats.statesAffected}
              </p>
              <p className="text-xs text-red-600">States Affected</p>
            </div>
          </div>
        </div>

        {/* Data sources */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            📡 Data Sources
          </h3>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <p className="text-sm text-slate-700">
              We monitor RSS feeds from major Nigerian news outlets:
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                { name: "Premium Times", url: "premiumtimesng.com" },
                { name: "Punch Nigeria", url: "punchng.com" },
                { name: "Vanguard", url: "vanguardngr.com" },
                { name: "Daily Trust", url: "dailytrust.com" },
                { name: "The Cable", url: "thecable.ng" },
                { name: "Channels TV", url: "channelstv.com" },
              ].map((source) => (
                <li key={source.url} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium text-slate-800">{source.name}</span>
                  <span className="text-slate-400">({source.url})</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Scraping pipeline */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            ⚙️ Processing Pipeline
          </h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "RSS Feed Collection",
                desc: "Fetch and parse RSS feeds from Nigerian news sources every few hours. Each article is checked against a 30-day dedup window.",
              },
              {
                step: 2,
                title: "Full Article Extraction",
                desc: "Download full article text using trafilatura (or BeautifulSoup fallback). Rate-limited per domain to be respectful.",
              },
              {
                step: 3,
                title: "Nigeria Relevance Filter",
                desc: "Check if the article is about Nigeria. For known Nigerian sources, any single Nigeria marker is sufficient.",
              },
              {
                step: 4,
                title: "Aftermath/Follow-up Detection",
                desc: "Skip articles that are purely about aftermath (rescues, trials, funerals). Only skip if there are NO fresh incident keywords in the title.",
              },
              {
                step: 5,
                title: "LLM Extraction (Groq)",
                desc: "Use LLM to extract structured incident data: state, LGA, community, type, casualties, date, and summary.",
              },
              {
                step: 6,
                title: "Post-Processing Validation",
                desc: "Fix common LLM errors: missed casualty numbers, wrong dates, misclassified incident types.",
              },
              {
                step: 7,
                title: "Deduplication",
                desc: "Check against existing incidents using semantic fingerprints and fuzzy matching (state + type + date + casualty band).",
              },
              {
                step: 8,
                title: "Storage",
                desc: "Store unique incidents in the database with full metadata and source URL.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key fixes */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            🔧 Key Fixes (vs Original Scraper)
          </h3>
          <div className="space-y-4">
            <FixCard
              title="Lowered Nigeria Relevance Threshold"
              old="Required 2+ Nigeria markers for ALL articles"
              fix="Threshold of 1 for known Nigerian source domains (Premium Times, Punch, etc.). These sites ARE Nigerian — any single marker confirms relevance."
              impact="Catches articles about specific states/incidents that only mention one Nigerian term (e.g., 'Lagos' alone was insufficient before)."
            />
            <FixCard
              title="Less Aggressive Aftermath Detection"
              old="Skipped if ANY aftermath keyword in title, or if 3+ aftermath keywords in body"
              fix="Only skip if aftermath keyword is in the title AND there are no fresh incident keywords in the title. Raised body threshold from 3 to 5. Rescue operations with casualties are never skipped."
              impact="Articles like 'Gunmen kill 12, 5 rescued in Kaduna attack' are no longer incorrectly filtered."
            />
            <FixCard
              title="Added Injuries Field"
              old="Only tracked fatalities and abductions — incidents with only wounded people were discarded"
              fix="Added injuries/wounded as a third casualty type. Incidents with injuries but no deaths/abductions are now accepted if they have conflict keywords."
              impact="Captures bombings, shootings, and clashes where people were wounded but survived."
            />
            <FixCard
              title="Broader Conflict-Casualty Gate"
              old="Required fatalities > 0 OR abductions > 0 (strict)"
              fix="Also accepts injuries > 0 for known conflict types. The gate now recognizes that wounded casualties are real casualties."
              impact="Incidents like '15 wounded in bomb blast' are no longer discarded."
            />
            <FixCard
              title="Expanded State Resolution"
              old="~15 aliases for state names"
              fix="50+ aliases including 'X State' variants, common misspellings, abbreviations, and partial matching."
              impact="Incidents no longer rejected because the LLM returned 'Rivers State' instead of 'Rivers'."
            />
            <FixCard
              title="Improved Deduplication"
              old="Fixed date window (7 days) and casualty tolerance for all events"
              fix="Tiered approach: wider date tolerance (14 days) for mass-casualty events (50+ fatalities). Proportional casualty tolerance (20% of count) for high-casualty events."
              impact="Mass-casualty events reported over multiple days are correctly identified as duplicates, while smaller events with different dates are not incorrectly merged."
            />
          </div>
        </section>

        {/* Incident types */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            🏷️ Incident Classification
          </h3>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: "Terrorism",
                  color: "#dc2626",
                  desc: "Boko Haram, ISWAP, ISWAP, and other terrorist group attacks",
                },
                {
                  type: "Banditry",
                  color: "#ea580c",
                  desc: "Armed bandit attacks, particularly in NW Nigeria",
                },
                {
                  type: "Kidnapping",
                  color: "#d97706",
                  desc: "Abductions for ransom, hostage-taking",
                },
                {
                  type: "Armed Attack",
                  color: "#e11d48",
                  desc: "Armed robbery with violence, cult clashes, militia attacks",
                },
                {
                  type: "Clash",
                  color: "#9333ea",
                  desc: "Communal, ethnic, farmer-herder clashes",
                },
                {
                  type: "Bombing",
                  color: "#c026d3",
                  desc: "IED explosions, suicide bombings, other blasts",
                },
              ].map((item) => (
                <div key={item.type} className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.type}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            ⚠️ Limitations
          </h3>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <ul className="space-y-2 text-sm text-amber-900">
              <li>
                • Data depends on media coverage — underreported areas may have
                gaps
              </li>
              <li>
                • Casualty numbers are approximate and based on media reports
              </li>
              <li>
                • LLM extraction may occasionally misclassify or miss details
              </li>
              <li>
                • Deduplication is conservative — some near-duplicates may
                appear
              </li>
              <li>
                • Historical data before the tracking start date is not
                included
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function FixCard({
  title,
  old,
  fix,
  impact,
}: {
  title: string;
  old: string;
  fix: string;
  impact: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h4 className="text-sm font-bold text-slate-900 mb-3">✅ {title}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="text-red-500 font-medium shrink-0">Before:</span>
          <span className="text-slate-600">{old}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-green-600 font-medium shrink-0">After:</span>
          <span className="text-slate-800 font-medium">{fix}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-blue-600 font-medium shrink-0">Impact:</span>
          <span className="text-slate-600">{impact}</span>
        </div>
      </div>
    </div>
  );
}
