import { Card, CardContent } from "@/components/ui/card";
import { WorkflowStats } from "@/lib/github";
import { formatTimeAgo } from "@/lib/github";

interface WorkflowSummaryProps {
  stats: WorkflowStats | undefined;
  isLoading: boolean;
  lastDeployedAt: string | null | undefined;
}

export default function WorkflowSummary({ stats, isLoading, lastDeployedAt }: WorkflowSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Runs Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-github-neutral">Total Runs</h3>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold mt-1">
                  {stats?.totalRuns || 0}
                </p>
              )}
            </div>
            <div className="bg-gray-100 rounded-full p-2">
              <i className="fas fa-history text-github-neutral"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-github-neutral">Success Rate</h3>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold mt-1 text-github-success">
                  {stats?.successRate || 0}%
                </p>
              )}
            </div>
            <div className="bg-gray-100 rounded-full p-2">
              <i className="fas fa-check-circle text-github-success"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Deployment Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-github-neutral">Last Deployment</h3>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold mt-1">
                  {lastDeployedAt ? formatTimeAgo(lastDeployedAt) : 'Never'}
                </p>
              )}
            </div>
            <div className="bg-gray-100 rounded-full p-2">
              <i className="fas fa-rocket text-github-blue"></i>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
