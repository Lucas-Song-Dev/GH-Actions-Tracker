import { useState } from "react";
import { WorkflowRun, formatWorkflowStatus, formatTimeAgo, formatDuration } from "@/lib/github";

interface WorkflowItemProps {
  run: WorkflowRun;
  onSelect?: (runId: number) => void;
  isPythonTest?: boolean;
}

export default function WorkflowItem({ run, onSelect, isPythonTest = false }: WorkflowItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = formatWorkflowStatus(run.status, run.conclusion);
  
  // Determine the status icon and color
  let statusIcon = <i className={`fas ${status.icon} text-xs`}></i>;
  
  // Handle click on the workflow item
  const handleClick = () => {
    if (onSelect && isPythonTest && run.conclusion === "failure") {
      onSelect(run.runId);
    }
  };
  
  // Determine if this item is clickable for test details
  const isClickable = isPythonTest && run.conclusion === "failure" && onSelect;
  
  return (
    <div 
      className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isClickable ? 'cursor-pointer hover:bg-red-50' : 'hover:bg-github-lightgray'
      }`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <span className={`flex items-center justify-center rounded-full w-6 h-6 ${run.status === 'in_progress' ? 'animate-pulse' : ''} ${
            run.status === 'completed' && run.conclusion === 'success' 
              ? 'bg-github-success' 
              : run.status === 'completed' && run.conclusion === 'failure'
                ? 'bg-github-failure'
                : 'bg-github-pending'
          } text-white`}>
            {statusIcon}
          </span>
        </div>
        <div>
          <h3 className="font-medium">
            {run.name}
            <span className="text-github-neutral text-sm font-normal ml-2">#{run.runNumber}</span>
            {isClickable && (
              <span className="ml-2 text-xs bg-red-100 text-github-failure px-2 py-0.5 rounded">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                View test failures
              </span>
            )}
          </h3>
          <div className="mt-1 text-sm">
            <span className="text-github-neutral">Triggered by:</span>
            <span className="font-medium ml-1">{run.triggeredBy}</span>
            {isPythonTest && (
              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                <i className={`fab ${run.name === "Frontend Tests" ? "fa-react" : "fa-python"} mr-1`}></i>
                {run.name === "Frontend Tests" ? "Frontend" : "Flask"} Tests
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center text-sm text-github-neutral">
            <span className="mr-4">
              <i className="far fa-clock mr-1"></i>
              {run.status === 'completed'
                ? `Completed ${formatTimeAgo(run.updatedAt)}`
                : `Started ${formatTimeAgo(run.createdAt)}`}
            </span>
            <span>
              <i className={`fas ${run.status === 'in_progress' ? 'fa-spinner fa-spin' : 'fa-stopwatch'} mr-1`}></i>
              {run.status === 'in_progress' 
                ? 'In progress' 
                : formatDuration(run.durationInSeconds)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <span className={`px-2 py-1 text-xs font-medium ${status.color} rounded-md mr-2`}>
          {status.label}
        </span>
        <a 
          href={run.htmlUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-github-blue hover:underline text-sm"
          onClick={(e) => isClickable && e.stopPropagation()}
        >
          View details
        </a>
      </div>
    </div>
  );
}
