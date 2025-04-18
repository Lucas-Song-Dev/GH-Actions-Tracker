import { apiRequest } from "./queryClient";

export interface WorkflowRun {
  id: number;
  runId: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  triggeredBy: string;
  headSha: string;
  runNumber: number;
  runAttempt: number;
  durationInSeconds: number | null;
  repository: string;
}

export interface WorkflowStats {
  id: number;
  repository: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  lastSuccessfulRunId: number | null;
  lastUpdated: string;
  successRate: number;
}

export interface WorkflowActivity {
  id: number;
  repository: string;
  date: string;
  runCount: number;
}

export interface SuccessfulDeployment {
  id: number;
  repository: string;
  date: string;
  successCount: number;
  failureCount: number;
}

export interface DeploymentStatus {
  isActive: boolean;
  environment: string;
  lastDeployedAt: string | null;
  creator: any | null;
  url: string;
  deploymentSource: string;
  lastSuccessfulRunId: number | null;
}

export interface WorkflowRunsResponse {
  workflowRuns: WorkflowRun[];
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

// Helper function to refresh all workflow data
export async function refreshAllWorkflowData() {
  // Use Promise.all to run these in parallel
  const refreshPromises = [
    apiRequest("GET", "/api/workflow-runs?refresh=true"),
    apiRequest("GET", "/api/workflow-stats?refresh=true"),
    apiRequest("GET", "/api/workflow-activity?refresh=true"),
    apiRequest("GET", "/api/deployment-status?refresh=true"),
    apiRequest("GET", "/api/successful-deployments?refresh=true")
  ];
  
  await Promise.all(refreshPromises);
}

// Format the workflow status for display
export function formatWorkflowStatus(status: string, conclusion: string | null): {
  label: string;
  color: string;
  icon: string;
} {
  if (status === "in_progress" || status === "queued" || status === "waiting") {
    return {
      label: "Running",
      color: "bg-yellow-100 text-github-pending",
      icon: "fas fa-spinner fa-spin"
    };
  }
  
  if (status === "completed") {
    if (conclusion === "success") {
      return {
        label: "Success",
        color: "bg-green-100 text-github-success",
        icon: "fas fa-check"
      };
    } else if (conclusion === "failure" || conclusion === "cancelled") {
      return {
        label: conclusion === "cancelled" ? "Cancelled" : "Failed",
        color: "bg-red-100 text-github-failure",
        icon: "fas fa-times"
      };
    }
  }
  
  return {
    label: "Unknown",
    color: "bg-gray-100 text-github-neutral",
    icon: "fas fa-question"
  };
}

// Format time for display (e.g., "2 hours ago")
export function formatTimeAgo(date: string | null): string {
  if (!date) return "N/A";
  
  const now = new Date();
  const pastDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
}

// Format duration for display
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "N/A";
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}
