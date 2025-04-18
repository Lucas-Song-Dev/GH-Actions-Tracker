import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WorkflowItem from "./WorkflowItem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowRun, WorkflowRunsResponse } from "@/lib/github";

interface WorkflowListProps {
  isRefreshing: boolean;
  repository?: string;
  onSelectRun?: (runId: number) => void;
}

export default function WorkflowList({ isRefreshing, repository = "Lucas-Song-Dev/Personal-Website", onSelectRun }: WorkflowListProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workflowTypeFilter, setWorkflowTypeFilter] = useState<string>("all");
  
  // Fetch workflow runs
  const { data, isLoading, error } = useQuery<WorkflowRunsResponse>({
    queryKey: [
      `/api/workflow-runs?repo=${repository}&page=${page}&per_page=10${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`,
      isRefreshing,
      repository,
      workflowTypeFilter
    ],
  });
  
  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };
  
  // Handle workflow type filter change
  const handleWorkflowTypeFilter = (type: string) => {
    setWorkflowTypeFilter(type);
    setPage(1);
  };
  
  // Handle pagination
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (data?.pagination.hasMore) {
      setPage(page + 1);
    }
  };
  
  // Rendering skeleton during loading
  const renderSkeleton = () => {
    return Array(4).fill(0).map((_, index) => (
      <div key={index} className="p-4 border-b border-github-border">
        <div className="flex items-start gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-64 mb-1" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="w-full lg:w-2/3">
      <Card className="overflow-hidden">
        <div className="border-b border-github-border p-4">
          <h2 className="text-lg font-semibold">Recent Workflow Runs</h2>
        </div>
        
        {/* Workflow Status Filters */}
        <div className="border-b border-github-border p-3 bg-github-lightgray flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("all")}
            className="px-3 py-1 text-sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("completed")}
            className="px-3 py-1 text-sm"
          >
            Completed
          </Button>
          <Button
            variant={statusFilter === "in_progress" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("in_progress")}
            className="px-3 py-1 text-sm"
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusFilter("failed")}
            className="px-3 py-1 text-sm"
          >
            Failed
          </Button>
        </div>
        
        {/* Workflow Type Filters - Only for RedditPainpoint repository */}
        {repository === "Lucas-Song-Dev/RedditPainpoint" && (
          <div className="border-b border-github-border p-3 bg-github-lightgray flex flex-wrap gap-2 items-center">
            <span className="text-sm text-github-neutral mr-2">Workflow Type:</span>
            <Button
              variant={workflowTypeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleWorkflowTypeFilter("all")}
              className="px-3 py-1 text-sm"
            >
              All
            </Button>
            <Button
              variant={workflowTypeFilter === "python" ? "default" : "outline"}
              size="sm"
              onClick={() => handleWorkflowTypeFilter("python")}
              className="px-3 py-1 text-sm"
            >
              <i className="fab fa-python mr-1"></i>
              Python Tests
            </Button>
            <Button
              variant={workflowTypeFilter === "frontend" ? "default" : "outline"}
              size="sm"
              onClick={() => handleWorkflowTypeFilter("frontend")}
              className="px-3 py-1 text-sm"
            >
              <i className="fab fa-react mr-1"></i>
              Frontend Tests
            </Button>
          </div>
        )}
        
        {/* Workflow List */}
        <div className="divide-y divide-github-border">
          {isLoading ? (
            renderSkeleton()
          ) : error ? (
            <div className="p-4 text-github-failure">
              <p>Error loading workflow runs</p>
            </div>
          ) : data?.workflowRuns.length === 0 ? (
            <div className="p-8 text-center text-github-neutral">
              <i className="fas fa-info-circle text-2xl mb-2"></i>
              <p>No workflow runs found with the current filter</p>
            </div>
          ) : (
            data?.workflowRuns
              .filter(run => {
                // Filter by workflow type if not "all" and repository is RedditPainpoint
                if (repository === "Lucas-Song-Dev/RedditPainpoint" && workflowTypeFilter !== "all") {
                  if (workflowTypeFilter === "python" && run.name !== "Python Tests") return false;
                  if (workflowTypeFilter === "frontend" && run.name !== "Frontend Tests") return false;
                }
                return true;
              })
              .map((run: WorkflowRun) => (
                <WorkflowItem 
                  key={run.runId} 
                  run={run} 
                  onSelect={onSelectRun} 
                  isPythonTest={
                    repository === "Lucas-Song-Dev/RedditPainpoint" && 
                    (run.name === "Python Tests" || run.name === "Frontend Tests")
                  }
                />
              ))
          )}
        </div>
        
        {/* Pagination */}
        {!isLoading && data?.workflowRuns && data.workflowRuns.length > 0 && (
          <div className="p-4 border-t border-github-border flex justify-between items-center">
            <span className="text-sm text-github-neutral">
              Showing {(page - 1) * 10 + 1}-
              {Math.min(page * 10, (page - 1) * 10 + (data?.workflowRuns.length || 0))} of{" "}
              {data?.pagination.hasMore ? "many" : (page - 1) * 10 + (data?.workflowRuns.length || 0)} workflow runs
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-github-border rounded-md hover:bg-gray-50 text-github-neutral"
              >
                Previous
              </Button>
              <Button
                variant={data?.pagination.hasMore ? "default" : "outline"}
                size="sm"
                onClick={handleNextPage}
                disabled={!data?.pagination.hasMore}
                className={`px-3 py-1 text-sm rounded-md ${
                  data?.pagination.hasMore 
                    ? "bg-github-blue text-white hover:bg-opacity-90" 
                    : "border border-github-border text-github-neutral"
                }`}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
