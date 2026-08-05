import { pgTable, serial, text, integer, date, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const incidents = pgTable(
  "incidents",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    state: text("state").notNull(),
    lga: text("lga"),
    community: text("community"),
    incidentType: text("incident_type").notNull(),
    fatalities: integer("fatalities").default(0).notNull(),
    abductions: integer("abductions").default(0).notNull(),
    injuries: integer("injuries").default(0).notNull(),
    rescued: integer("rescued").default(0).notNull(),
    summary: text("summary"),
    sourceUrl: text("source_url"),
    contentFp: text("content_fp"),
    semanticFp: text("semantic_fp"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_incidents_date").on(table.date),
    index("idx_incidents_state").on(table.state),
    index("idx_incidents_type").on(table.incidentType),
    index("idx_incidents_state_date").on(table.state, table.date),
    uniqueIndex("idx_incidents_semantic_fp").on(table.semanticFp),
  ]
);

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
