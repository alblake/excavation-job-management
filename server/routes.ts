import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { estimateValidationSchema, insertJobSchema, calculateCubicYards } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Jobs API Routes
  app.get("/api/jobs", async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getJobs();
      return res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      return res.json(job);
    } catch (error) {
      console.error(`Error fetching job ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req: Request, res: Response) => {
    try {
      const parseResult = insertJobSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid job data", 
          errors: parseResult.error.format() 
        });
      }
      
      const job = await storage.createJob(parseResult.data);
      return res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      return res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.put("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const parseResult = insertJobSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid job data", 
          errors: parseResult.error.format() 
        });
      }
      
      const updatedJob = await storage.updateJob(jobId, parseResult.data);
      
      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      return res.json(updatedJob);
    } catch (error) {
      console.error(`Error updating job ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const success = await storage.deleteJob(jobId);
      
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error(`Error deleting job ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Estimates API Routes
  app.get("/api/estimates", async (req: Request, res: Response) => {
    try {
      let estimates;
      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
      
      if (jobId) {
        estimates = await storage.getEstimatesByJobId(jobId);
      } else {
        estimates = await storage.getEstimates();
      }
      
      return res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      return res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.get("/api/estimates/:id", async (req: Request, res: Response) => {
    try {
      const estimateId = parseInt(req.params.id);
      const estimate = await storage.getEstimate(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      return res.json(estimate);
    } catch (error) {
      console.error(`Error fetching estimate ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to fetch estimate" });
    }
  });

  app.post("/api/estimates", async (req: Request, res: Response) => {
    try {
      const parseResult = estimateValidationSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid estimate data", 
          errors: parseResult.error.format() 
        });
      }
      
      // Calculate cubic yards
      const { pipeLength, trenchWidth, trenchDepth, materialWeight } = parseResult.data;
      const cubicYards = calculateCubicYards(pipeLength, trenchWidth, trenchDepth);
      
      // Create estimate with calculated cubic yards and material weight
      const estimate = await storage.createEstimate({
        ...parseResult.data,
        materialWeight: typeof parseResult.data.materialWeight === 'number' ? parseResult.data.materialWeight : 145,
        cubicYards
      });
      
      return res.status(201).json(estimate);
    } catch (error) {
      console.error("Error creating estimate:", error);
      return res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  app.put("/api/estimates/:id", async (req: Request, res: Response) => {
    try {
      const estimateId = parseInt(req.params.id);
      const parseResult = estimateValidationSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid estimate data", 
          errors: parseResult.error.format() 
        });
      }
      
      const currentEstimate = await storage.getEstimate(estimateId);
      if (!currentEstimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      // Recalculate cubic yards if any dimensions are updated
      let cubicYards = currentEstimate.cubicYards;
      const { pipeLength, trenchWidth, trenchDepth, materialWeight } = parseResult.data;
      
      if (pipeLength !== undefined || trenchWidth !== undefined || trenchDepth !== undefined) {
        const newPipeLength = pipeLength ?? currentEstimate.pipeLength;
        const newTrenchWidth = trenchWidth ?? currentEstimate.trenchWidth;
        const newTrenchDepth = trenchDepth ?? currentEstimate.trenchDepth;
        
        cubicYards = calculateCubicYards(newPipeLength, newTrenchWidth, newTrenchDepth);
      }
      
      // Make sure to include material weight in the updated estimate
      const updatedEstimate = await storage.updateEstimate(estimateId, {
        ...parseResult.data,
        materialWeight: typeof materialWeight === 'number' ? materialWeight : currentEstimate.materialWeight,
        cubicYards
      });
      
      if (!updatedEstimate) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      return res.json(updatedEstimate);
    } catch (error) {
      console.error(`Error updating estimate ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to update estimate" });
    }
  });

  app.delete("/api/estimates/:id", async (req: Request, res: Response) => {
    try {
      const estimateId = parseInt(req.params.id);
      const success = await storage.deleteEstimate(estimateId);
      
      if (!success) {
        return res.status(404).json({ message: "Estimate not found" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error(`Error deleting estimate ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to delete estimate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
