import { db } from "@/db";
import { incidents } from "@/db/schema";
import { sql, and, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = [];
    if (startDate) dateFilter.push(gte(incidents.date, startDate));
    if (endDate) dateFilter.push(lte(incidents.date, endDate));
    const whereClause = dateFilter.length > 0 ? and(...dateFilter) : undefined;

    // Overall stats
    const [overallStats] = await db
      .select({
        totalIncidents: sql<number>`count(*)::int`,
        totalFatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
        totalAbductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
        totalInjuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
      })
      .from(incidents)
      .where(whereClause);

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
      .where(whereClause)
      .groupBy(incidents.state)
      .orderBy(sql`coalesce(sum(${incidents.fatalities}), 0) desc`);

    // By incident type
    const byType = await db
      .select({
        incidentType: incidents.incidentType,
        count: sql<number>`count(*)::int`,
        fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
        abductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
        injuries: sql<number>`coalesce(sum(${incidents.injuries}), 0)::int`,
      })
      .from(incidents)
      .where(whereClause)
      .groupBy(incidents.incidentType)
      .orderBy(sql`count(*) desc`);

    // By date (daily timeline)
    const byDate = await db
      .select({
        date: incidents.date,
        count: sql<number>`count(*)::int`,
        fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
        abductions: sql<number>`coalesce(sum(${incidents.abductions}), 0)::int`,
      })
      .from(incidents)
      .where(whereClause)
      .groupBy(incidents.date)
      .orderBy(incidents.date);

    // Most affected LGAs
    const byLga = await db
      .select({
        state: incidents.state,
        lga: incidents.lga,
        count: sql<number>`count(*)::int`,
        fatalities: sql<number>`coalesce(sum(${incidents.fatalities}), 0)::int`,
      })
      .from(incidents)
      .where(whereClause)
      .groupBy(incidents.state, incidents.lga)
      .orderBy(sql`coalesce(sum(${incidents.fatalities}), 0) desc`)
      .limit(10);

    return NextResponse.json({
      overall: overallStats,
      byState,
      byType,
      byDate,
      byLga,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
