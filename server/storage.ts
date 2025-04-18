import { 
  WorkflowRun, InsertWorkflowRun, 
  WorkflowStats, InsertWorkflowStats,
  WorkflowActivity, InsertWorkflowActivity
} from "@shared/schema";

export interface IStorage {
  // Workflow runs
  getWorkflowRuns(repository: string, limit?: number, offset?: number): Promise<WorkflowRun[]>;
  getWorkflowRunById(runId: number): Promise<WorkflowRun | undefined>;
  saveWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun>;
  updateWorkflowRun(runId: number, updates: Partial<WorkflowRun>): Promise<WorkflowRun | undefined>;
  deleteWorkflowRun(runId: number): Promise<boolean>;
  
  // Workflow stats
  getWorkflowStats(repository: string): Promise<WorkflowStats | undefined>;
  saveWorkflowStats(stats: InsertWorkflowStats): Promise<WorkflowStats>;
  updateWorkflowStats(repository: string, updates: Partial<WorkflowStats>): Promise<WorkflowStats | undefined>;
  
  // Workflow activity
  getWorkflowActivity(repository: string, days?: number): Promise<WorkflowActivity[]>;
  saveWorkflowActivity(activity: InsertWorkflowActivity): Promise<WorkflowActivity>;
  updateWorkflowActivity(repository: string, date: string, updates: Partial<WorkflowActivity>): Promise<WorkflowActivity | undefined>;
}

export class MemStorage implements IStorage {
  private workflowRuns: Map<number, WorkflowRun>;
  private workflowStats: Map<string, WorkflowStats>;
  private workflowActivity: Map<string, WorkflowActivity>;
  private currentId: number;
  
  constructor() {
    this.workflowRuns = new Map();
    this.workflowStats = new Map();
    this.workflowActivity = new Map();
    this.currentId = 1;
  }
  
  // Workflow runs methods
  async getWorkflowRuns(repository: string, limit = 10, offset = 0): Promise<WorkflowRun[]> {
    const runs = Array.from(this.workflowRuns.values())
      .filter(run => run.repository === repository)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return runs.slice(offset, offset + limit);
  }
  
  async getWorkflowRunById(runId: number): Promise<WorkflowRun | undefined> {
    return Array.from(this.workflowRuns.values()).find(run => run.runId === runId);
  }
  
  async saveWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun> {
    const id = this.currentId++;
    const workflowRun: WorkflowRun = { ...run, id };
    this.workflowRuns.set(id, workflowRun);
    return workflowRun;
  }
  
  async updateWorkflowRun(runId: number, updates: Partial<WorkflowRun>): Promise<WorkflowRun | undefined> {
    const existingRun = Array.from(this.workflowRuns.values()).find(run => run.runId === runId);
    
    if (!existingRun) {
      return undefined;
    }
    
    const updatedRun = { ...existingRun, ...updates };
    this.workflowRuns.set(existingRun.id, updatedRun);
    return updatedRun;
  }
  
  async deleteWorkflowRun(runId: number): Promise<boolean> {
    const run = Array.from(this.workflowRuns.values()).find(run => run.runId === runId);
    
    if (!run) {
      return false;
    }
    
    this.workflowRuns.delete(run.id);
    return true;
  }
  
  // Workflow stats methods
  async getWorkflowStats(repository: string): Promise<WorkflowStats | undefined> {
    return this.workflowStats.get(repository);
  }
  
  async saveWorkflowStats(stats: InsertWorkflowStats): Promise<WorkflowStats> {
    const id = this.currentId++;
    const workflowStats: WorkflowStats = { ...stats, id };
    this.workflowStats.set(stats.repository, workflowStats);
    return workflowStats;
  }
  
  async updateWorkflowStats(repository: string, updates: Partial<WorkflowStats>): Promise<WorkflowStats | undefined> {
    const existingStats = this.workflowStats.get(repository);
    
    if (!existingStats) {
      return undefined;
    }
    
    const updatedStats = { ...existingStats, ...updates };
    this.workflowStats.set(repository, updatedStats);
    return updatedStats;
  }
  
  // Workflow activity methods
  async getWorkflowActivity(repository: string, days = 7): Promise<WorkflowActivity[]> {
    return Array.from(this.workflowActivity.values())
      .filter(activity => activity.repository === repository)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);
  }
  
  async saveWorkflowActivity(activity: InsertWorkflowActivity): Promise<WorkflowActivity> {
    const key = `${activity.repository}-${activity.date}`;
    const id = this.currentId++;
    const workflowActivity: WorkflowActivity = { ...activity, id };
    this.workflowActivity.set(key, workflowActivity);
    return workflowActivity;
  }
  
  async updateWorkflowActivity(repository: string, date: string, updates: Partial<WorkflowActivity>): Promise<WorkflowActivity | undefined> {
    const key = `${repository}-${date}`;
    const existingActivity = this.workflowActivity.get(key);
    
    if (!existingActivity) {
      return undefined;
    }
    
    const updatedActivity = { ...existingActivity, ...updates };
    this.workflowActivity.set(key, updatedActivity);
    return updatedActivity;
  }
}

export const storage = new MemStorage();
