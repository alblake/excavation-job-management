import { pgTable, text, serial, integer, boolean, timestamp, real, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Status type for jobs
export const JobStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed"
} as const;

export type JobStatusType = keyof typeof JobStatus;

// Job table schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  client: text("client").notNull(),
  startDate: text("start_date"),
  status: text("status").notNull().default(JobStatus.PENDING),
  notes: text("notes"),
});

// Estimate table schema
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  description: text("description"),
  pipeLength: real("pipe_length").notNull(), // in feet
  trenchWidth: real("trench_width").notNull(), // in feet
  trenchDepth: real("trench_depth").notNull(), // in feet
  cubicYards: real("cubic_yards").notNull(), // calculated field
  materialWeight: real("material_weight").notNull().default(145), // pounds per cubic foot
  importUnitCost: real("import_unit_cost").notNull().default(24.50), // cost per unit for import
  estimatedHours: real("estimated_hours").default(0), // labor hours for excavator
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
});

// Insert schemas
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export const insertEstimateSchema = createInsertSchema(estimates).omit({ id: true });

// Custom validation for estimate inputs
export const estimateValidationSchema = insertEstimateSchema.extend({
  pipeLength: z.number().positive("Pipe length must be greater than 0"),
  trenchWidth: z.number().positive("Trench width must be greater than 0"),
  trenchDepth: z.number().positive("Trench depth must be greater than 0"),
  materialWeight: z.union([
    z.number().positive("Material weight must be greater than 0"),
    z.string().transform(val => parseFloat(val) || 145)
  ]),
  importUnitCost: z.union([
    z.number().positive("Import unit cost must be greater than 0"),
    z.string().transform(val => parseFloat(val) || 24.50)
  ]),
  estimatedHours: z.union([
    z.number().min(0, "Estimated hours cannot be negative"),
    z.string().transform(val => parseFloat(val) || 0)
  ]),
});

// Types
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;

// Helper functions
export const calculateCubicYards = (
  pipeLength: number, 
  trenchWidth: number, 
  trenchDepth: number
): number => {
  const cubicFeet = pipeLength * trenchWidth * trenchDepth;
  return Number((cubicFeet / 27).toFixed(2)); // Convert to cubic yards with 2 decimal precision
};
