import { db } from "@/db";
import { incidents } from "@/db/schema";
import { sql, desc, eq, and, gte, lte } from "drizzle-orm";
import { NIGERIAN_STATES, INCIDENT_TYPE_LABELS } from "@/lib/nigeria-data";
import { IncidentTable } from "@/components/incident-table";
import { IncidentFilters } from "./filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    state?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function IncidentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const state = params.state;
  const type = params.type;
  const startDate = params.startDate;
  const endDate = params.endDate;
  const page = parseInt(params.page || "1");
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (state) conditions.push(eq(incidents.state, state));
  if (type) conditions.push(eq(incidents.incidentType, type));
  if (startDate) conditions.push(gte(incidents.date, startDate));
  if (endDate) conditions.push(lte(incidents.date, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(incidents)
    .where(whereClause);

  const totalIncidents = countResult.total;
  const totalPages = Math.ceil(totalIncidents / pageSize);

  const results = await db
    .select()
    .from(incidents)
    .where(whereClause)
    .orderBy(desc(incidents.date), desc(incidents.fatalities))
    .limit(pageSize)
    .offset(offset);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Incidents</h2>
          <p className="text-sm text-slate-500 mt-1">
            {totalIncidents} incident{totalIncidents !== 1 ? "s" : ""} found
          </p>
        </div>

        <IncidentFilters
          states={NIGERIAN_STATES as unknown as string[]}
          types={Object.keys(INCIDENT_TYPE_LABELS)}
          currentState={state || ""}
          currentType={type || ""}
          currentStartDate={startDate || ""}
          currentEndDate={endDate || ""}
        />

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <IncidentTable incidents={results} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <PaginationLink
                  page={page - 1}
                  state={state}
                  type={type}
                  startDate={startDate}
                  endDate={endDate}
                  label="Previous"
                />
              )}
              {page < totalPages && (
                <PaginationLink
                  page={page + 1}
                  state={state}
                  type={type}
                  startDate={startDate}
                  endDate={endDate}
                  label="Next"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function PaginationLink({
  page,
  state,
  type,
  startDate,
  endDate,
  label,
}: {
  page: number;
  state?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  label: string;
}) {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (type) params.set("type", type);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  params.set("page", String(page));

  return (
    <a
      href={`/incidents?${params.toString()}`}
      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
    >
      {label}
    </a>
  );
}
