import { db } from "@/db";
import { incidents } from "@/db/schema";
import { eq, sql, and, gte, lte, desc, count, sum } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const state = searchParams.get("state");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(incidents).orderBy(desc(incidents.date)).limit(limit).offset(offset).$dynamic();

    const conditions = [];

    if (state) {
      conditions.push(eq(incidents.state, state));
    }
    if (type) {
      conditions.push(eq(incidents.incidentType, type));
    }
    if (startDate) {
      conditions.push(gte(incidents.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(incidents.date, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    return NextResponse.json({ incidents: results, count: results.length });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}
