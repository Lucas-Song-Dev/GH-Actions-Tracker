import { Card, CardContent } from "@/components/ui/card";
import { DeploymentStatus } from "@/lib/github";
import { formatTimeAgo } from "@/lib/github";
import { Skeleton } from "@/components/ui/skeleton";

interface DeploymentStatusProps {
  deploymentStatus: DeploymentStatus | undefined;
  isLoading: boolean;
}

export default function DeploymentStatusCard({ deploymentStatus, isLoading }: DeploymentStatusProps) {
  return (
    <Card className="overflow-hidden mb-6">
      <div className="border-b border-github-border p-4">
        <h2 className="text-lg font-semibold">Deployment Status</h2>
      </div>
      
      <CardContent className="p-4">
        {isLoading ? (
          <>
            <div className="flex items-center mb-4">
              <Skeleton className="h-3 w-3 rounded-full mr-2" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="mb-4">
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center mb-4">
              <span className={`inline-block w-3 h-3 rounded-full ${deploymentStatus?.isActive ? 'bg-github-success' : 'bg-github-failure'} mr-2`}></span>
              <span className="font-medium">
                {deploymentStatus?.isActive ? 'GitHub Pages Active' : 'GitHub Pages Inactive'}
              </span>
            </div>
            
            <div className="text-sm text-github-neutral mb-4">
              <p className="mb-1">Latest deployment:</p>
              <p className="font-mono p-2 bg-github-lightgray rounded break-all">
                {deploymentStatus?.url || 'No deployment URL available'}
              </p>
            </div>
            
            <div className="text-sm text-github-neutral flex flex-col gap-2">
              <div className="flex justify-between">
                <span>Last successful deployment:</span>
                <span className="font-medium">
                  {deploymentStatus?.lastDeployedAt 
                    ? formatTimeAgo(deploymentStatus.lastDeployedAt) 
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deployment source:</span>
                <span className="font-medium">{deploymentStatus?.deploymentSource || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-medium">{deploymentStatus?.environment || 'Unknown'}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
