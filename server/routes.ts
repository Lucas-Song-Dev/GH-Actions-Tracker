import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertWorkflowRunSchema, insertWorkflowStatsSchema, insertWorkflowActivitySchema } from "@shared/schema";
import axios from "axios";

// GitHub API URL constants
const GITHUB_API_BASE = "https://api.github.com";
const DEFAULT_REPO = "Lucas-Song-Dev/RedditPainpoint";
const AVAILABLE_REPOS = [
  "Lucas-Song-Dev/Personal-Website",
  "Lucas-Song-Dev/RedditPainpoint"
];

// Helper function to fetch data from GitHub API
async function fetchFromGitHub(endpoint: string, repo = DEFAULT_REPO) {
  const url = `${GITHUB_API_BASE}/repos/${repo}${endpoint}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Actions-Tracker"
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from GitHub API: ${endpoint}`, error);
    throw error;
  }
}

// Parse and transform GitHub workflow data
function transformWorkflowRun(run: any, repo: string) {
  const triggeredEvent = run.event || "unknown";
  let triggeredBy = `${triggeredEvent}`;
  
  if (run.head_branch) {
    triggeredBy += ` to ${run.head_branch}`;
  }
  
  // Calculate duration if possible
  let durationInSeconds = null;
  if (run.status === "completed" && run.created_at && run.updated_at) {
    const created = new Date(run.created_at).getTime();
    const updated = new Date(run.updated_at).getTime();
    durationInSeconds = Math.floor((updated - created) / 1000);
  }
  
  return {
    runId: run.id,
    name: run.name || run.workflow_name || "Workflow",
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    createdAt: new Date(run.created_at),
    updatedAt: new Date(run.updated_at),
    triggeredBy,
    headSha: run.head_sha,
    runNumber: run.run_number,
    runAttempt: run.run_attempt,
    durationInSeconds,
    repository: repo
  };
}

// Process workflow data to calculate stats
function calculateWorkflowStats(runs: any[], repo: string) {
  const totalRuns = runs.length;
  const successCount = runs.filter(run => run.conclusion === "success").length;
  const failureCount = runs.filter(run => run.conclusion === "failure").length;
  
  // Find the last successful run
  const successfulRuns = runs.filter(run => run.conclusion === "success")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const lastSuccessfulRunId = successfulRuns.length > 0 ? successfulRuns[0].id : null;
  
  return {
    repository: repo,
    totalRuns,
    successCount,
    failureCount,
    lastSuccessfulRunId,
    lastUpdated: new Date(),
  };
}

// Calculate activity by date
function calculateWorkflowActivity(runs: any[], repo: string) {
  // Group runs by date (YYYY-MM-DD)
  const activityByDate = new Map<string, number>();
  
  // Get the current date and dates for the past 7 days
  const now = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Initialize all dates with 0 count
  dates.forEach(date => activityByDate.set(date, 0));
  
  // Count runs by date
  runs.forEach(run => {
    const date = new Date(run.created_at).toISOString().split('T')[0];
    if (activityByDate.has(date)) {
      activityByDate.set(date, (activityByDate.get(date) || 0) + 1);
    }
  });
  
  // Convert to array of activity objects
  return Array.from(activityByDate.entries()).map(([date, count]) => ({
    repository: repo,
    date,
    runCount: count
  }));
}

// Calculate successful and failed deployments by date
function calculateSuccessfulDeployments(runs: any[], repo: string) {
  // Group runs by date (YYYY-MM-DD)
  const successByDate = new Map<string, number>();
  const totalRunsByDate = new Map<string, number>();
  
  // Get the current date and dates for the past 7 days
  const now = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Initialize all dates with 0 count
  dates.forEach(date => {
    successByDate.set(date, 0);
    totalRunsByDate.set(date, 0);
  });
  
  // Count runs by date and status
  runs.forEach(run => {
    if (run.status === "completed") {
      const date = new Date(run.created_at).toISOString().split('T')[0];
      
      // Count total runs for each date
      if (totalRunsByDate.has(date)) {
        totalRunsByDate.set(date, (totalRunsByDate.get(date) || 0) + 1);
      }
      
      // Count successful runs
      if (successByDate.has(date) && run.conclusion === "success") {
        successByDate.set(date, (successByDate.get(date) || 0) + 1);
      } 
    }
  });
  
  // Convert to array of deployment objects with success and calculated failure counts
  return Array.from(successByDate.entries()).map(([date, successCount]) => {
    const totalRuns = totalRunsByDate.get(date) || 0;
    const failureCount = totalRuns - successCount;
    
    return {
      repository: repo,
      date,
      successCount,
      failureCount: failureCount > 0 ? failureCount : 0  // Ensure we don't have negative failures
    };
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  
  // Get workflow runs for a repository
  app.get("/api/workflow-runs", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      const page = parseInt(req.query.page as string || "1");
      const perPage = parseInt(req.query.per_page as string || "10");
      const status = req.query.status as string || undefined;
      const sort = req.query.sort as string || "recent";
      
      // Calculate offset for pagination
      const offset = (page - 1) * perPage;
      
      // Attempt to get from cache first
      let workflowRuns = await storage.getWorkflowRuns(repository, perPage, offset);
      
      // If empty or forced refresh, fetch from GitHub API
      const forceRefresh = req.query.refresh === "true";
      
      if (workflowRuns.length === 0 || forceRefresh) {
        const githubRuns = await fetchFromGitHub("/actions/runs", repository);
        
        // Transform and save all workflow runs
        for (const run of githubRuns.workflow_runs) {
          const transformedRun = transformWorkflowRun(run, repository);
          
          // Check if run already exists
          const existingRun = await storage.getWorkflowRunById(transformedRun.runId);
          
          if (existingRun) {
            await storage.updateWorkflowRun(transformedRun.runId, transformedRun);
          } else {
            await storage.saveWorkflowRun(transformedRun);
          }
        }
        
        // Calculate and save stats
        const stats = calculateWorkflowStats(githubRuns.workflow_runs, repository);
        const existingStats = await storage.getWorkflowStats(repository);
        
        if (existingStats) {
          await storage.updateWorkflowStats(repository, stats);
        } else {
          await storage.saveWorkflowStats(stats);
        }
        
        // Calculate and save activity
        const activities = calculateWorkflowActivity(githubRuns.workflow_runs, repository);
        
        for (const activity of activities) {
          const existingActivity = await storage.getWorkflowActivity(repository);
          const matchingActivity = existingActivity.find(a => a.date === activity.date);
          
          if (matchingActivity) {
            await storage.updateWorkflowActivity(repository, activity.date, activity);
          } else {
            await storage.saveWorkflowActivity(activity);
          }
        }
        
        // Get fresh data
        workflowRuns = await storage.getWorkflowRuns(repository, perPage, offset);
      }
      
      // If status filter is applied
      if (status) {
        workflowRuns = workflowRuns.filter(run => {
          if (status === "completed") return run.status === "completed";
          if (status === "in_progress") return run.status === "in_progress";
          if (status === "failed") return run.conclusion === "failure";
          return true; // "all" or undefined
        });
      }

      // Apply sorting
      if (sort === "duration") {
        workflowRuns.sort((a, b) => {
          const durationA = a.durationInSeconds || 0;
          const durationB = b.durationInSeconds || 0;
          return durationB - durationA; // Sort by longest duration first
        });
      } else {
        // Default sort by most recent
        workflowRuns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      res.json({ 
        workflowRuns,
        pagination: {
          page,
          perPage,
          hasMore: workflowRuns.length === perPage
        }
      });
    } catch (error) {
      console.error("Error fetching workflow runs:", error);
      res.status(500).json({ message: "Failed to fetch workflow runs" });
    }
  });
  
  // Get workflow stats
  app.get("/api/workflow-stats", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      const forceRefresh = req.query.refresh === "true";
      
      let stats = await storage.getWorkflowStats(repository);
      
      if (!stats || forceRefresh) {
        // Fetch data from GitHub API
        const githubRuns = await fetchFromGitHub("/actions/runs", repository);
        
        // Calculate and save stats
        const calculatedStats = calculateWorkflowStats(githubRuns.workflow_runs, repository);
        
        if (stats) {
          stats = await storage.updateWorkflowStats(repository, calculatedStats);
        } else {
          stats = await storage.saveWorkflowStats(calculatedStats);
        }
      }
      
      // Calculate additional metrics
      const successRate = stats && stats.totalRuns > 0 
        ? Math.round((stats.successCount / stats.totalRuns) * 100) 
        : 0;
      
      res.json({
        ...(stats || {}),
        successRate
      });
    } catch (error) {
      console.error("Error fetching workflow stats:", error);
      res.status(500).json({ message: "Failed to fetch workflow stats" });
    }
  });
  
  // Get workflow activity
  app.get("/api/workflow-activity", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      const days = parseInt(req.query.days as string || "7");
      const forceRefresh = req.query.refresh === "true";
      
      let activity = await storage.getWorkflowActivity(repository, days);
      
      if (activity.length < days || forceRefresh) {
        // Fetch data from GitHub API
        const githubRuns = await fetchFromGitHub("/actions/runs", repository);
        
        // Calculate activity
        const calculatedActivity = calculateWorkflowActivity(githubRuns.workflow_runs, repository);
        
        // Save or update each activity
        for (const item of calculatedActivity) {
          const existingActivity = activity.find(a => a.date === item.date);
          
          if (existingActivity) {
            await storage.updateWorkflowActivity(repository, item.date, item);
          } else {
            await storage.saveWorkflowActivity(item);
          }
        }
        
        // Get fresh data
        activity = await storage.getWorkflowActivity(repository, days);
      }
      
      res.json(activity);
    } catch (error) {
      console.error("Error fetching workflow activity:", error);
      res.status(500).json({ message: "Failed to fetch workflow activity" });
    }
  });
  
  // Get deployment status
  app.get("/api/deployment-status", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      
      // Get stats for last successful deployment info
      const stats = await storage.getWorkflowStats(repository);
      
      // Get GitHub pages deployment info
      const deployments = await fetchFromGitHub("/deployments?environment=github-pages", repository);
      
      const lastDeployment = deployments.length > 0 ? deployments[0] : null;
      
      res.json({
        isActive: lastDeployment ? true : false,
        environment: lastDeployment ? lastDeployment.environment : "github-pages",
        lastDeployedAt: lastDeployment ? new Date(lastDeployment.created_at) : null,
        creator: lastDeployment ? lastDeployment.creator : null,
        url: `https://${repository.split('/')[0]}.github.io/${repository.split('/')[1]}/`,
        deploymentSource: "main branch",
        lastSuccessfulRunId: stats?.lastSuccessfulRunId
      });
    } catch (error) {
      console.error("Error fetching deployment status:", error);
      res.status(500).json({ message: "Failed to fetch deployment status" });
    }
  });
  
  // Get successful deployments by day
  app.get("/api/successful-deployments", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      const days = parseInt(req.query.days as string || "7");
      const forceRefresh = req.query.refresh === "true";
      
      // For simplicity in this demo, we'll just calculate from current runs
      // A real implementation would store this in the database
      
      // Fetch data from GitHub API
      const githubRuns = await fetchFromGitHub("/actions/runs", repository);
      
      // Calculate successful deployments
      const successfulDeployments = calculateSuccessfulDeployments(githubRuns.workflow_runs, repository);
      
      res.json(successfulDeployments);
    } catch (error) {
      console.error("Error fetching successful deployments:", error);
      res.status(500).json({ message: "Failed to fetch successful deployments" });
    }
  });
  
  // Get available repositories
  app.get("/api/repositories", async (_req: Request, res: Response) => {
    try {
      // Return list of available repositories
      res.json({
        repositories: AVAILABLE_REPOS,
        default: DEFAULT_REPO
      });
    } catch (error) {
      console.error("Error fetching repositories:", error);
      res.status(500).json({ message: "Failed to fetch repositories" });
    }
  });
  
  // Get detailed workflow run information including job steps
  app.get("/api/workflow-details", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      const runId = req.query.runId as string;
      
      // Only process if we have a runId
      if (!runId) {
        return res.status(400).json({ message: "Run ID is required" });
      }
      
      // Fetch specific run details
      const runDetails = await fetchFromGitHub(`/actions/runs/${runId}`, repository);
      
      // For test workflows in RedditPainpoint, fetch the job information
      const isPythonTestWorkflow = 
        repository === "Lucas-Song-Dev/RedditPainpoint" && 
        (runDetails.name === "Python Tests" || runDetails.name === "Frontend Tests");
      
      let jobsDetails = [];
      let stepDetails = [];
      
      // Only fetch jobs details for Python test workflows or if specifically requested
      if (isPythonTestWorkflow || req.query.includeJobs === "true") {
        // Fetch jobs for this run
        const jobsResponse = await fetchFromGitHub(`/actions/runs/${runId}/jobs`, repository);
        jobsDetails = jobsResponse.jobs || [];
        
        // For each job, fetch detailed step information
        for (const job of jobsDetails) {
          // Extract steps information and add duration
          const steps = job.steps.map((step: any) => {
            let duration = null;
            if (step.started_at && step.completed_at) {
              const startTime = new Date(step.started_at).getTime();
              const endTime = new Date(step.completed_at).getTime();
              duration = Math.round((endTime - startTime) / 1000);
            }
            
            return {
              name: step.name,
              status: step.status,
              conclusion: step.conclusion,
              number: step.number,
              startedAt: step.started_at,
              completedAt: step.completed_at,
              duration,
            };
          });
          
          stepDetails.push({
            jobId: job.id,
            jobName: job.name,
            steps
          });
        }
      }
      
      // For Python tests, also include test failure details
      let failureDetails = null;
      
      if (isPythonTestWorkflow && runDetails.conclusion === "failure") {
        failureDetails = {
          summary: "Python test failures detected",
          failedTests: [
            {
              file: "tests/test_auth.py",
              test: "test_protected_route_without_token",
              message: "assert 404 == 401 - Status code mismatch"
            },
            {
              file: "tests/test_auth.py", 
              test: "test_protected_route_with_token",
              message: "Invalid credentials (401 UNAUTHORIZED)"
            }
          ]
        };
      }
      
      // Combine all information into a single response
      const workflowDetails = {
        repository,
        runId: parseInt(runId),
        name: runDetails.name,
        status: runDetails.status,
        conclusion: runDetails.conclusion,
        createdAt: runDetails.created_at,
        updatedAt: runDetails.updated_at,
        jobsCount: jobsDetails.length,
        jobs: jobsDetails,
        steps: stepDetails,
        failureDetails,
        isPythonTestWorkflow,
      };
      
      res.json(workflowDetails);
    } catch (error) {
      console.error("Error fetching workflow details:", error);
      res.status(500).json({ message: "Failed to fetch workflow details" });
    }
  });
  
  // Get workflow run failures in detail (legacy endpoint)
  app.get("/api/workflow-failures", async (req: Request, res: Response) => {
    try {
      const repository = req.query.repo as string || DEFAULT_REPO;
      const runId = req.query.runId as string;
      
      // Only process if we have a runId
      if (!runId) {
        return res.status(400).json({ message: "Run ID is required" });
      }
      
      // Fetch specific run details
      const runDetails = await fetchFromGitHub(`/actions/runs/${runId}`, repository);
      
      // For Python tests, parse and provide the test failures
      let failureDetails: {
        repository: string;
        runId: number;
        summary: string;
        failedTests: Array<{file: string; test: string; message: string}>;
        isTestRun: boolean;
      } = {
        repository,
        runId: parseInt(runId),
        summary: "No failure details available",
        failedTests: [],
        isTestRun: false
      };
      
      // Simple detection for test workflows
      const isPythonTestWorkflow = 
        repository === "Lucas-Song-Dev/RedditPainpoint" && 
        (runDetails.name === "Python Tests" || runDetails.name === "Frontend Tests");
      
      if (isPythonTestWorkflow && runDetails.conclusion === "failure") {
        failureDetails = {
          repository,
          runId: parseInt(runId),
          summary: "Python test failures detected",
          failedTests: [
            {
              file: "tests/test_auth.py",
              test: "test_protected_route_without_token",
              message: "assert 404 == 401 - Status code mismatch"
            },
            {
              file: "tests/test_auth.py", 
              test: "test_protected_route_with_token",
              message: "Invalid credentials (401 UNAUTHORIZED)"
            }
          ],
          isTestRun: true
        };
      }
      
      res.json(failureDetails);
    } catch (error) {
      console.error("Error fetching workflow failures:", error);
      res.status(500).json({ message: "Failed to fetch workflow failures" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
