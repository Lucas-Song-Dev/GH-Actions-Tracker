import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TestFailure {
  file: string;
  test: string;
  message: string;
}

interface FailureDetails {
  repository: string;
  runId: number;
  summary: string;
  failedTests: TestFailure[];
  isTestRun: boolean;
}

interface TestFailureDetailsProps {
  repository: string;
  runId: number | null;
}

export default function TestFailureDetails({ repository, runId }: TestFailureDetailsProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const { data: failureDetails, isLoading } = useQuery<FailureDetails>({
    queryKey: [`/api/workflow-failures?repo=${repository}&runId=${runId}`],
    enabled: !!runId && repository === "Lucas-Song-Dev/RedditPainpoint"
  });
  
  // Return early if no runId or it's not a test run
  if (!runId) return null;
  if (!isLoading && (!failureDetails || !failureDetails.isTestRun)) return null;
  
  return (
    <Card className="mb-6">
      <CardHeader className="py-4 px-6 bg-red-50">
        <CardTitle className="text-lg font-semibold text-github-failure flex items-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          Python Test Failures
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <div className="h-6 w-full bg-gray-200 animate-pulse rounded mb-3"></div>
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : (
          <Collapsible
            open={isExpanded}
            onOpenChange={setIsExpanded}
            className="w-full"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-sm text-left hover:bg-gray-50">
              <div>
                <span className="font-medium">{failureDetails?.summary}</span>
                <span className="text-github-neutral ml-2">
                  ({failureDetails?.failedTests.length} failed tests)
                </span>
              </div>
              <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-github-neutral`}></i>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                {failureDetails?.failedTests.map((failure, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <div className="font-mono text-xs p-3 bg-white border border-github-border rounded-md">
                      <div className="flex items-start">
                        <div className="mr-3 text-red-500 mt-0.5">
                          <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 font-medium">{failure.file} :: {failure.test}</div>
                          <div className="text-github-neutral whitespace-pre-wrap">{failure.message}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}