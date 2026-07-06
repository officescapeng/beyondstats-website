import { db } from "@/db";
import { incidents } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { StatsCards } from "@/components/stats-cards";
import { IncidentTable } from "@/components/incident-table";
import { StateHeatmap } from "@/components/state-heatmap";
import { INCIDENT_TYPE_COLORS } from "@/lib/nigeria-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Overall stats
  const [overallStats] = await db
    .select({
      totalIncidents: sql<number>`count(*)::int`,
      totalFatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      totalAbductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
      totalInjuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
    })
    .from(incidents);

  // By state for heatmap
  const byState = await db
    .select({
      state: incidents.state,
      count: sql<number>`count(*)::int`,
      fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      abductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
      injuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
      topType: sql<string>`mode() WITHIN GROUP (ORDER BY ${incidents.incidentType})`,
    })
    .from(incidents)
    .groupBy(incidents.state)
    .orderBy(sql`coalesce(sum(${incidents.fatalities}), 0) desc`);

  // Recent incidents
  const recentIncidents = await db
    .select()
    .from(incidents)
    .orderBy(desc(incidents.date), desc(incidents.fatalities))
    .limit(20);

  // Top affected states (for sidebar)
  const topStates = byState.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tracking security incidents and conflict-related casualties across Nigeria
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalIncidents={overallStats.totalIncidents}
          totalFatalities={overallStats.totalFatalities}
          totalAbductions={overallStats.totalAbductions}
          totalInjuries={overallStats.totalInjuries}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* State Heatmap */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Fatalities by State
            </h3>
            <StateHeatmap stateStats={byState} />
          </div>

          {/* Top affected states sidebar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Most Affected States
            </h3>
            <div className="space-y-3">
              {topStates.map((state, idx) => {
                const typeColor =
                  INCIDENT_TYPE_COLORS[state.topType] || INCIDENT_TYPE_COLORS.other;
                return (
                  <div key={state.state} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-300 w-6">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">
                          {state.state}
                        </span>
                        <span className="text-sm font-bold text-red-700">
                          {state.fatalities} killed
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="h-1.5 rounded-full bg-red-200"
                          style={{
                            width: `${Math.min(
                              (state.fatalities / (topStates[0]?.fatalities || 1)) * 100,
                              100
                            )}%`,
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ backgroundColor: typeColor, width: "100%" }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {state.count} incidents
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick type breakdown */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Incident Breakdown
              </h4>
              {/* By type summary */}
              <TypeBreakdown />
            </div>
          </div>
        </div>

        {/* Recent incidents */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Recent Incidents
          </h3>
          <IncidentTable incidents={recentIncidents} />
        </div>
      </div>
    </main>
  );
}

async function TypeBreakdown() {
  const byType = await db
    .select({
      incidentType: incidents.incidentType,
      count: sql<number>`count(*)::int`,
      fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
    })
    .from(incidents)
    .groupBy(incidents.incidentType)
    .orderBy(sql`coalesce(sum(${incidents.fatalities}), 0) desc`);

  const totalFatalities = byType.reduce((a, b) => a + b.fatalities, 0);

  return (
    <div className="space-y-2">
      {byType.map((type) => {
        const color =
          INCIDENT_TYPE_COLORS[type.incidentType] || INCIDENT_TYPE_COLORS.other;
        const pct = totalFatalities > 0 ? (type.fatalities / totalFatalities) * 100 : 0;
        return (
          <div key={type.incidentType}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 capitalize">
                {type.incidentType}
              </span>
              <span className="text-slate-500">
                {type.fatalities} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
