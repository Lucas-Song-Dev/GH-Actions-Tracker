import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import WorkflowSummary from "@/components/WorkflowSummary";
import WorkflowList from "@/components/WorkflowList";
import DeploymentStatus from "@/components/DeploymentStatus";
import WorkflowActivityChart from "@/components/WorkflowActivityChart";
import SuccessfulDeploymentChart from "@/components/SuccessfulDeploymentChart";
import RepositorySelector from "@/components/RepositorySelector";
import PythonTestRunDetails from "@/components/PythonTestRunDetails";

import { 
  WorkflowStats, 
  WorkflowActivity, 
  DeploymentStatus as DeploymentStatusType, 
  SuccessfulDeployment,
  refreshAllWorkflowData 
} from "@/lib/github";

export default function Home() {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const autoRefreshCountdownRef = useRef<number>(15);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(15);
  const [selectedRepo, setSelectedRepo] = useState<string>("Lucas-Song-Dev/Personal-Website");
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch workflow stats
  const { 
    data: stats, 
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery<WorkflowStats>({
    queryKey: [`/api/workflow-stats?repo=${selectedRepo}`],
  });
  
  // Fetch deployment status
  const {
    data: deploymentStatus,
    isLoading: isDeploymentLoading,
    refetch: refetchDeployment
  } = useQuery<DeploymentStatusType>({
    queryKey: [`/api/deployment-status?repo=${selectedRepo}`],
  });
  
  // Fetch workflow activity
  const {
    data: activity,
    isLoading: isActivityLoading,
    refetch: refetchActivity
  } = useQuery<WorkflowActivity[]>({
    queryKey: [`/api/workflow-activity?repo=${selectedRepo}`],
  });
  
  // Fetch successful deployments
  const {
    data: successfulDeployments,
    isLoading: isDeploymentsLoading,
    refetch: refetchDeployments
  } = useQuery<SuccessfulDeployment[]>({
    queryKey: [`/api/successful-deployments?repo=${selectedRepo}`],
  });
  
  // Handle refresh button click
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      await refreshAllWorkflowData();
      
      // Refetch all data
      await Promise.all([
        refetchStats(),
        refetchDeployment(),
        refetchActivity(),
        refetchDeployments()
      ]);
      
      setLastRefreshed(new Date());
      
      toast({
        title: "Data refreshed",
        description: "Workflow data updated successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh workflow data",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Auto-refresh functionality
  useEffect(() => {
    // Start or stop auto-refresh timer
    if (autoRefreshEnabled) {
      // Start countdown timer
      const countdownTimer = window.setInterval(() => {
        autoRefreshCountdownRef.current -= 1;
        setAutoRefreshCountdown(autoRefreshCountdownRef.current);
        
        if (autoRefreshCountdownRef.current <= 0) {
          // Reset countdown and trigger refresh
          autoRefreshCountdownRef.current = 15;
          setAutoRefreshCountdown(15);
          
          // Trigger refresh
          if (!isRefreshing) {
            refreshAllWorkflowData().then(() => {
              Promise.all([
                refetchStats(),
                refetchDeployment(),
                refetchActivity(),
                refetchDeployments()
              ]).then(() => {
                setLastRefreshed(new Date());
              }).catch(console.error);
            }).catch(console.error);
          }
        }
      }, 1000);
      
      return () => {
        window.clearInterval(countdownTimer);
      };
    }
  }, [autoRefreshEnabled, isRefreshing]);
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    if (!autoRefreshEnabled) {
      // Reset countdown when enabling
      autoRefreshCountdownRef.current = 15;
      setAutoRefreshCountdown(15);
    }
  };
  
  // Format the last refreshed time
  const formatLastRefreshed = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000 / 60);
    
    if (diff < 1) {
      return 'Just now';
    } else if (diff === 1) {
      return '1 minute ago';
    } else {
      return `${diff} minutes ago`;
    }
  };
  
  // Handle repository change
  const handleRepoChange = (repo: string) => {
    setSelectedRepo(repo);
    // Reset selected run ID when changing repositories
    setSelectedRunId(null);
    
    // Refresh data with new repository
    refreshAllWorkflowData().then(() => {
      Promise.all([
        refetchStats(),
        refetchDeployment(),
        refetchActivity(),
        refetchDeployments()
      ]).then(() => {
        setLastRefreshed(new Date());
        
        toast({
          title: "Repository changed",
          description: `Now viewing workflows for ${repo}`,
          duration: 3000,
        });
      }).catch(console.error);
    }).catch(console.error);
  };
  
  // Handle selecting a run for test failure display
  const handleSelectRun = (runId: number) => {
    setSelectedRunId(runId);
  };
  
  return (
    <div className="bg-github-lightgray min-h-screen font-sans text-github-darkgray">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <i className="fas fa-play-circle mr-2 text-github-blue"></i>
                GitHub Actions Tracker
              </h1>
              <p className="text-github-neutral mt-1">
                Monitoring workflow runs across repositories
              </p>
            </div>
            
            {/* Refresh Control */}
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="flex items-center">
                <span className="text-sm text-github-neutral mr-3">
                  Last updated: {formatLastRefreshed()}
                </span>
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1 bg-github-blue text-white rounded-md hover:bg-opacity-90 flex items-center"
                >
                  <i className={`fas fa-sync-alt mr-2 ${isRefreshing ? 'fa-spin' : ''}`}></i>
                  Refresh
                </Button>
              </div>
              
              {/* Auto-refresh Toggle */}
              <div className="flex items-center bg-white rounded-md p-2 border border-gray-200 shadow-sm ml-2">
                <Button 
                  onClick={toggleAutoRefresh}
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center ${autoRefreshEnabled ? 'bg-github-success text-white' : ''}`}
                >
                  <i className={`fas fa-clock mr-2 ${autoRefreshEnabled ? 'fa-spin' : ''}`}></i>
                  {autoRefreshEnabled ? 'Auto-refresh On' : 'Auto-refresh Off'}
                </Button>
                
                {autoRefreshEnabled && (
                  <span className={`ml-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded ${autoRefreshCountdown <= 5 ? 'countdown-pulse text-github-failure' : ''}`}>
                    {autoRefreshCountdown}s
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Repository Selector */}
        <RepositorySelector 
          selectedRepo={selectedRepo} 
          onRepoChange={handleRepoChange} 
        />
        
        {/* For RedditPainpoint repo, show test run details if selected */}
        {selectedRepo === "Lucas-Song-Dev/RedditPainpoint" && (
          <PythonTestRunDetails 
            repository={selectedRepo}
            runId={selectedRunId}
          />
        )}

        {/* Summary Cards */}
        <WorkflowSummary 
          stats={stats} 
          isLoading={isStatsLoading} 
          lastDeployedAt={deploymentStatus?.lastDeployedAt}
        />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Workflow List */}
          <div className="w-full lg:w-2/3">
            <WorkflowList 
              isRefreshing={isRefreshing} 
              repository={selectedRepo}
              onSelectRun={handleSelectRun}
            />
          </div>
          
          {/* Sidebar */}
          <div className="w-full lg:w-1/3">
            {/* Deployment Status */}
            <DeploymentStatus 
              deploymentStatus={deploymentStatus}
              isLoading={isDeploymentLoading}
            />
            
            {/* Workflow Activity */}
            <WorkflowActivityChart 
              activity={activity}
              isLoading={isActivityLoading}
            />
            
            {/* Successful Deployments Chart */}
            <SuccessfulDeploymentChart
              deployments={successfulDeployments}
              isLoading={isDeploymentsLoading}
            />
          </div>
        </div>
        
        {/* Metrics Section */}
        <div className="mt-8 bg-white rounded-lg p-4 border border-github-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Metrics & Categorization</h2>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-green-100 text-github-success text-sm rounded-md">Success</span>
              <span className="px-2 py-1 bg-red-100 text-github-failure text-sm rounded-md">Failure</span>
              <span className="px-2 py-1 bg-yellow-100 text-github-pending text-sm rounded-md">In Progress</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border border-github-border rounded-md p-3">
              <h3 className="font-medium mb-2">Categorization</h3>
              <ul className="text-github-neutral">
                <li className="flex justify-between"><span>Success/Failure</span> <span className="font-mono">{stats?.successCount || 0}/{stats?.failureCount || 0}</span></li>
                <li className="flex justify-between"><span>Trends</span> <span className="font-mono">{Math.round((stats?.successRate || 0) / 10)}/10</span></li>
                <li className="flex justify-between"><span>Types</span> <span className="font-mono">Deploy/Build/Test</span></li>
              </ul>
            </div>
            
            <div className="border border-github-border rounded-md p-3">
              <h3 className="font-medium mb-2">Metrics API</h3>
              <ul className="text-github-neutral">
                <li className="flex justify-between"><span>Processed data</span> <span className="font-mono">{activity?.length || 0} days</span></li>
                <li className="flex justify-between"><span>Total metrics</span> <span className="font-mono">{stats?.totalRuns || 0} runs</span></li>
                <li className="flex justify-between"><span>API calls</span> <span className="font-mono">5 endpoints</span></li>
              </ul>
            </div>
            
            <div className="border border-github-border rounded-md p-3">
              <h3 className="font-medium mb-2">Dashboard Stats</h3>
              <ul className="text-github-neutral">
                <li className="flex justify-between"><span>Last refresh</span> <span className="font-mono">{formatLastRefreshed()}</span></li>
                <li className="flex justify-between"><span>Auto-refresh</span> <span className="font-mono">{autoRefreshEnabled ? 'On' : 'Off'}</span></li>
                <li className="flex justify-between"><span>Repositories</span> <span className="font-mono">2 sources</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
