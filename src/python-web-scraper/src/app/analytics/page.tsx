import { db } from "@/db";
import { incidents } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { NIGERIAN_STATES } from "@/lib/nigeria-data";
import {
  IncidentTypeChart,
  FatalitiesByTypeChart,
  TimelineChart,
  TopStatesChart,
} from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Overall stats
  const [overallStats] = await db
    .select({
      totalIncidents: sql<number>`count(*)::int`,
      totalFatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      totalAbductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
      totalInjuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
    })
    .from(incidents);

  // By type
  const byType = await db
    .select({
      incidentType: incidents.incidentType,
      count: sql<number>`count(*)::int`,
      fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      abductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
      injuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
    })
    .from(incidents)
    .groupBy(incidents.incidentType)
    .orderBy(sql`count(*) desc`);

  // By date
  const byDate = await db
    .select({
      date: incidents.date,
      count: sql<number>`count(*)::int`,
      fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      abductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
    })
    .from(incidents)
    .groupBy(incidents.date)
    .orderBy(incidents.date);

  // By state
  const byState = await db
    .select({
      state: incidents.state,
      count: sql<number>`count(*)::int`,
      fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      abductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
      injuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
    })
    .from(incidents)
    .groupBy(incidents.state)
    .orderBy(sql`coalesce(sum(${incidents.fatalities}), 0) desc`);

  // Most dangerous LGAs
  const topLgas = await db
    .select({
      state: incidents.state,
      lga: incidents.lga,
      count: sql<number>`count(*)::int`,
      fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
    })
    .from(incidents)
    .groupBy(incidents.state, incidents.lga)
    .orderBy(sql`coalesce(sum(${incidents.fatalities}), 0) desc`)
    .limit(15);

  // Average fatalities per incident by type
  const avgByType = await db
    .select({
      incidentType: incidents.incidentType,
      avgFatalities: sql<number>`round(avg(${incidents.fatalities})::numeric, 1)`,
      maxFatalities: sql<number>`max(${incidents.fatalities})`,
    })
    .from(incidents)
    .groupBy(incidents.incidentType)
    .orderBy(sql`avg(${incidents.fatalities}) desc`);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Detailed analysis of conflict patterns and trends
          </p>
        </div>

        {/* Summary stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            label="Avg. Fatalities/Incident"
            value={
              overallStats.totalIncidents > 0
                ? (overallStats.totalFatalities / overallStats.totalIncidents).toFixed(1)
                : "0"
            }
            color="text-red-700"
          />
          <StatBox
            label="Avg. Abductions/Incident"
            value={
              overallStats.totalIncidents > 0
                ? (overallStats.totalAbductions / overallStats.totalIncidents).toFixed(1)
                : "0"
            }
            color="text-amber-700"
          />
          <StatBox
            label="States Affected"
            value={`${new Set(byState.map((s) => s.state)).size}/${NIGERIAN_STATES.length}`}
            color="text-blue-700"
          />
          <StatBox
            label="Days Tracked"
            value={String(byDate.length)}
            color="text-green-700"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimelineChart data={byDate} />
          <IncidentTypeChart data={byType} />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopStatesChart data={byState} />
          <FatalitiesByTypeChart data={byType} />
        </div>

        {/* Data tables row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most dangerous LGAs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Most Dangerous LGAs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 font-semibold text-slate-600 text-xs">
                      LGA
                    </th>
                    <th className="text-left py-2 px-2 font-semibold text-slate-600 text-xs">
                      State
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600 text-xs">
                      Incidents
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600 text-xs">
                      Killed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topLgas.map((lga, idx) => (
                    <tr
                      key={`${lga.state}-${lga.lga}-${idx}`}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2 px-2 font-medium text-slate-900">
                        {lga.lga || "Unknown"}
                      </td>
                      <td className="py-2 px-2 text-slate-600">{lga.state}</td>
                      <td className="py-2 px-2 text-center text-slate-700">
                        {lga.count}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-red-700">
                        {lga.fatalities}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Severity by type */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Severity by Incident Type
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 font-semibold text-slate-600 text-xs">
                      Type
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600 text-xs">
                      Avg. Killed
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600 text-xs">
                      Max Killed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {avgByType.map((t) => (
                    <tr
                      key={t.incidentType}
                      className="border-b border-slate-100"
                    >
                      <td className="py-2 px-2 font-medium text-slate-900 capitalize">
                        {t.incidentType}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-700">
                        {t.avgFatalities}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-red-700">
                        {t.maxFatalities}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
