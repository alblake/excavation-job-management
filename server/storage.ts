import { jobs, type Job, type InsertJob, estimates, type Estimate, type InsertEstimate } from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

export interface IStorage {
  // Job operations
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Estimate operations
  getEstimates(): Promise<Estimate[]>;
  getEstimatesByJobId(jobId: number): Promise<Estimate[]>;
  getEstimate(id: number): Promise<Estimate | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: number, estimate: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: number): Promise<boolean>;
}

export class DbStorage implements IStorage {
  private db;
  
  constructor() {
    try {
      // Connect to the database using the DATABASE_URL environment variable
      const connectionString = process.env.DATABASE_URL as string;
      console.log("Connecting to Supabase database...");
      
      // Use SSL for Supabase connections
      const client = postgres(connectionString, { ssl: 'require' });
      this.db = drizzle(client);
      
      console.log("Database connection established successfully");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }

  // Job operations
  async getJobs(): Promise<Job[]> {
    return await this.db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const results = await this.db.select().from(jobs).where(eq(jobs.id, id));
    return results[0];
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await this.db.insert(jobs).values({
      name: insertJob.name,
      location: insertJob.location,
      client: insertJob.client,
      startDate: insertJob.startDate || null,
      status: insertJob.status || 'pending',
      notes: insertJob.notes || null
    }).returning();
    return result[0];
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    // Ensure all fields have valid types
    const validData: Partial<InsertJob> = {};
    if ('name' in updateData) validData.name = updateData.name;
    if ('location' in updateData) validData.location = updateData.location;
    if ('client' in updateData) validData.client = updateData.client;
    if ('startDate' in updateData) validData.startDate = updateData.startDate;
    if ('status' in updateData) validData.status = updateData.status;
    if ('notes' in updateData) validData.notes = updateData.notes;

    const result = await this.db
      .update(jobs)
      .set(validData)
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }

  async deleteJob(id: number): Promise<boolean> {
    // First delete all estimates for this job
    try {
      await this.db.delete(estimates).where(eq(estimates.jobId, id));
    } catch (error) {
      console.log("No estimates to delete for job:", id);
    }

    // Then delete the job
    const result = await this.db.delete(jobs).where(eq(jobs.id, id)).returning();
    return result.length > 0;
  }

  // Estimate operations
  async getEstimates(): Promise<Estimate[]> {
    return await this.db.select().from(estimates);
  }

  async getEstimatesByJobId(jobId: number): Promise<Estimate[]> {
    return await this.db.select().from(estimates).where(eq(estimates.jobId, jobId));
  }

  async getEstimate(id: number): Promise<Estimate | undefined> {
    const results = await this.db.select().from(estimates).where(eq(estimates.id, id));
    return results[0];
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const result = await this.db.insert(estimates).values({
      jobId: insertEstimate.jobId,
      description: insertEstimate.description || null,
      pipeLength: insertEstimate.pipeLength,
      trenchWidth: insertEstimate.trenchWidth,
      trenchDepth: insertEstimate.trenchDepth,
      cubicYards: insertEstimate.cubicYards,
      materialWeight: insertEstimate.materialWeight,
      importUnitCost: insertEstimate.importUnitCost,
      estimatedHours: insertEstimate.estimatedHours || 0,
      notes: insertEstimate.notes || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateEstimate(id: number, updateData: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    // Ensure all fields have valid types
    const validData: Partial<InsertEstimate> = {};
    if ('jobId' in updateData) validData.jobId = updateData.jobId;
    if ('description' in updateData) validData.description = updateData.description;
    if ('pipeLength' in updateData) validData.pipeLength = updateData.pipeLength;
    if ('trenchWidth' in updateData) validData.trenchWidth = updateData.trenchWidth;
    if ('trenchDepth' in updateData) validData.trenchDepth = updateData.trenchDepth;
    if ('cubicYards' in updateData) validData.cubicYards = updateData.cubicYards;
    if ('materialWeight' in updateData) validData.materialWeight = updateData.materialWeight;
    if ('importUnitCost' in updateData) validData.importUnitCost = updateData.importUnitCost;
    if ('estimatedHours' in updateData) validData.estimatedHours = updateData.estimatedHours;
    if ('notes' in updateData) validData.notes = updateData.notes;

    const result = await this.db
      .update(estimates)
      .set(validData)
      .where(eq(estimates.id, id))
      .returning();
    return result[0];
  }

  async deleteEstimate(id: number): Promise<boolean> {
    const result = await this.db.delete(estimates).where(eq(estimates.id, id)).returning();
    return result.length > 0;
  }
}

// Export an instance of the storage implementation
export const storage = new DbStorage();