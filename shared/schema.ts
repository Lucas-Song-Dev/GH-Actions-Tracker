import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base schema for GitHub workflow runs
export const workflowRuns = pgTable("workflow_runs", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  conclusion: text("conclusion"),
  htmlUrl: text("html_url").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  triggeredBy: text("triggered_by").notNull(),
  headSha: text("head_sha").notNull(),
  runNumber: integer("run_number").notNull(),
  runAttempt: integer("run_attempt").notNull(),
  durationInSeconds: integer("duration_in_seconds"),
  repository: text("repository").notNull(),
});

export const insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({
  id: true,
});

export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;
export type WorkflowRun = typeof workflowRuns.$inferSelect;

// Workflow stats schema
export const workflowStats = pgTable("workflow_stats", {
  id: serial("id").primaryKey(),
  repository: text("repository").notNull().unique(),
  totalRuns: integer("total_runs").notNull(),
  successCount: integer("success_count").notNull(),
  failureCount: integer("failure_count").notNull(),
  lastSuccessfulRunId: integer("last_successful_run_id"),
  lastUpdated: timestamp("last_updated").notNull(),
});

export const insertWorkflowStatsSchema = createInsertSchema(workflowStats).omit({
  id: true,
});

export type InsertWorkflowStats = z.infer<typeof insertWorkflowStatsSchema>;
export type WorkflowStats = typeof workflowStats.$inferSelect;

// Schema for GitHub workflow activity
export const workflowActivity = pgTable("workflow_activity", {
  id: serial("id").primaryKey(),
  repository: text("repository").notNull(),
  date: text("date").notNull(),
  runCount: integer("run_count").notNull(),
});

export const insertWorkflowActivitySchema = createInsertSchema(workflowActivity).omit({
  id: true,
});

export type InsertWorkflowActivity = z.infer<typeof insertWorkflowActivitySchema>;
export type WorkflowActivity = typeof workflowActivity.$inferSelect;
