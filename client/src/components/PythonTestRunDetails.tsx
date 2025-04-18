import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { formatDuration, formatTimeAgo } from "@/lib/github";

interface JobStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

interface JobSteps {
  jobId: number;
  jobName: string;
  steps: JobStep[];
}

interface TestFailure {
  file: string;
  test: string;
  message: string;
}

interface FailureDetails {
  summary: string;
  failedTests: TestFailure[];
}

interface WorkflowDetails {
  repository: string;
  runId: number;
  name: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  jobsCount: number;
  jobs: any[];
  steps: JobSteps[];
  failureDetails: FailureDetails | null;
  isPythonTestWorkflow: boolean;
}

interface PythonTestRunDetailsProps {
  repository: string;
  runId: number | null;
}

export default function PythonTestRunDetails({ repository, runId }: PythonTestRunDetailsProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Fetch detailed workflow information
  const { data: workflowDetails, isLoading } = useQuery<WorkflowDetails>({
    queryKey: [`/api/workflow-details?repo=${repository}&runId=${runId}`],
    enabled: !!runId && repository === "Lucas-Song-Dev/RedditPainpoint"
  });
  
  // Return early if no runId or it's not a Python test workflow
  if (!runId) return null;
  if (!isLoading && (!workflowDetails || !workflowDetails.isPythonTestWorkflow)) return null;
  
  // Calculate overall duration if available
  const getOverallDuration = () => {
    if (!workflowDetails) return "";
    if (workflowDetails.createdAt && workflowDetails.updatedAt) {
      const startTime = new Date(workflowDetails.createdAt).getTime();
      const endTime = new Date(workflowDetails.updatedAt).getTime();
      const durationInSeconds = Math.round((endTime - startTime) / 1000);
      return formatDuration(durationInSeconds);
    }
    return "In progress";
  };
  
  // Get status color
  const getStatusColor = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") return "text-github-success";
      if (conclusion === "failure") return "text-github-failure";
      return "text-github-neutral";
    }
    if (status === "in_progress") return "text-github-pending";
    return "text-github-neutral";
  };
  
  // Get status icon
  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") return "fa-check-circle";
      if (conclusion === "failure") return "fa-times-circle";
      return "fa-circle";
    }
    if (status === "in_progress") return "fa-spinner fa-spin";
    return "fa-circle";
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="py-4 px-6 bg-blue-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-github-blue flex items-center">
            <i className="fab fa-python mr-2"></i>
            Python Test Run Details
          </CardTitle>
          {workflowDetails && (
            <div className={`flex items-center ${getStatusColor(workflowDetails.status, workflowDetails.conclusion)}`}>
              <i className={`fas ${getStatusIcon(workflowDetails.status, workflowDetails.conclusion)} mr-2`}></i>
              <span className="font-medium">
                {workflowDetails.status === "completed" 
                  ? workflowDetails.conclusion === "success" ? "Success" : "Failed" 
                  : "In Progress"}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <div className="h-6 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : workflowDetails ? (
          <div>
            {/* Summary section */}
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-github-neutral mb-1">Workflow</div>
                  <div className="font-medium">{workflowDetails.name}</div>
                </div>
                <div>
                  <div className="text-sm text-github-neutral mb-1">Run Time</div>
                  <div className="font-medium">{getOverallDuration()}</div>
                </div>
                <div>
                  <div className="text-sm text-github-neutral mb-1">Started</div>
                  <div className="font-medium">{formatTimeAgo(workflowDetails.createdAt)}</div>
                </div>
              </div>
            </div>
            
            {/* Tabs section */}
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="border-b border-gray-200 w-full rounded-none p-0">
                <TabsTrigger 
                  value="overview"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-github-blue py-3 px-4"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="steps"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-github-blue py-3 px-4"
                >
                  Job Steps
                </TabsTrigger>
                {workflowDetails.failureDetails && (
                  <TabsTrigger 
                    value="failures"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-github-blue py-3 px-4"
                  >
                    Test Failures
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Overview tab content */}
              <TabsContent value="overview" className="p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-3">Workflow Timeline</h3>
                  <div className="relative overflow-hidden py-4">
                    {/* Draw timeline graph */}
                    <div className="absolute top-0 bottom-0 left-6 border-l-2 border-dashed border-gray-300"></div>
                    
                    {workflowDetails.steps.map((jobSteps, jobIdx) => (
                      <div key={jobSteps.jobId} className="mb-6 last:mb-0">
                        <div className="relative pl-10 mb-2">
                          <div className="absolute left-5 top-1 w-3 h-3 rounded-full bg-github-blue transform -translate-x-1/2"></div>
                          <h4 className="font-medium">{jobSteps.jobName}</h4>
                        </div>
                        
                        {jobSteps.steps.map((step, stepIdx) => (
                          <div key={step.number} className="relative pl-10 py-1.5">
                            <div 
                              className={`absolute left-5 top-2 w-2 h-2 rounded-full transform -translate-x-1/2 ${
                                step.status === "completed" 
                                  ? step.conclusion === "success" 
                                    ? "bg-github-success" 
                                    : "bg-github-failure"
                                  : "bg-github-pending"
                              }`}
                            ></div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div>
                                <span className="text-sm font-medium">{step.name}</span>
                                <span 
                                  className={`ml-2 text-xs ${
                                    step.status === "completed" 
                                      ? step.conclusion === "success" 
                                        ? "text-github-success" 
                                        : "text-github-failure"
                                      : "text-github-pending"
                                  }`}
                                >
                                  {step.status === "completed" 
                                    ? step.conclusion === "success" ? "Success" : "Failed" 
                                    : "In Progress"}
                                </span>
                              </div>
                              <div className="text-xs text-github-neutral mt-1 md:mt-0">
                                {step.duration !== null ? formatDuration(step.duration) : "In progress"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* Job Steps tab content */}
              <TabsContent value="steps" className="p-0">
                {workflowDetails.steps.map((jobSteps) => (
                  <div key={jobSteps.jobId} className="border-b border-gray-200 last:border-b-0">
                    <div className="p-4 bg-gray-50 font-medium">
                      {jobSteps.jobName}
                    </div>
                    <div className="divide-y divide-gray-200">
                      {jobSteps.steps.map((step) => (
                        <div key={step.number} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center">
                            <div 
                              className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 ${
                                step.status === "completed" 
                                  ? step.conclusion === "success" 
                                    ? "bg-green-100 text-github-success" 
                                    : "bg-red-100 text-github-failure"
                                  : "bg-yellow-100 text-github-pending"
                              }`}
                            >
                              <i className={`fas ${
                                step.status === "completed" 
                                  ? step.conclusion === "success" 
                                    ? "fa-check" 
                                    : "fa-times"
                                  : "fa-spinner fa-spin"
                              } text-xs`}></i>
                            </div>
                            <div>
                              <div className="font-medium">{step.name}</div>
                              <div className="text-xs text-github-neutral mt-1">
                                {step.status === "completed"
                                  ? `Completed ${formatTimeAgo(step.completedAt!)}`
                                  : `Started ${formatTimeAgo(step.startedAt)}`}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0 flex items-center">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                step.status === "completed" 
                                  ? step.conclusion === "success" 
                                    ? "bg-green-100 text-github-success" 
                                    : "bg-red-100 text-github-failure"
                                  : "bg-yellow-100 text-github-pending"
                              }`}
                            >
                              {step.status === "completed" 
                                ? step.conclusion === "success" ? "Success" : "Failed" 
                                : "In Progress"}
                            </span>
                            {step.duration !== null && (
                              <span className="ml-2 text-sm text-github-neutral">
                                {formatDuration(step.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              {/* Test Failures tab content */}
              {workflowDetails.failureDetails && (
                <TabsContent value="failures" className="p-4">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium mb-1">Test Failures Summary</h3>
                    <p className="text-github-neutral text-sm">{workflowDetails.failureDetails.summary}</p>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    {workflowDetails.failureDetails.failedTests.map((failure, idx) => (
                      <div key={idx} className="font-mono text-xs p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                          <div className="mr-3 text-github-failure mt-0.5">
                            <i className="fas fa-times-circle"></i>
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 font-medium">{failure.file} :: {failure.test}</div>
                            <div className="text-github-neutral whitespace-pre-wrap">{failure.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        ) : (
          <div className="p-4 text-center text-github-neutral">
            <p>No workflow details available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}