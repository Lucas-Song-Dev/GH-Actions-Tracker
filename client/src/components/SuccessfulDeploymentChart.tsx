import { Card, CardContent } from "@/components/ui/card";
import { SuccessfulDeployment } from "@/lib/github";
import { formatDateShort } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getLastNDays } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface SuccessfulDeploymentChartProps {
  deployments: SuccessfulDeployment[] | undefined;
  isLoading: boolean;
}

export default function SuccessfulDeploymentChart({ deployments, isLoading }: SuccessfulDeploymentChartProps) {
  // Get the last 7 days for the chart labels
  const lastSevenDays = getLastNDays(7);
  
  // Prepare data for the chart, ensuring we have entries for all 7 days
  const chartData = lastSevenDays.map(date => {
    const matchingDeployment = deployments?.find(d => d.date === date);
    return {
      date: formatDateShort(date),
      successes: matchingDeployment?.successCount || 0,
      failures: matchingDeployment?.failureCount || 0,
      total: (matchingDeployment?.successCount || 0) + (matchingDeployment?.failureCount || 0)
    };
  });
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const successes = payload[0].value;
      const failures = payload[1]?.value || 0;
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-sm">
          <p className="font-medium">{label}</p>
          <p className="text-github-success">Successes: {successes}</p>
          <p className="text-github-failure">Failures: {failures}</p>
          <p className="text-github-neutral">Total: {successes + failures}</p>
        </div>
      );
    }
  
    return null;
  };
  
  return (
    <Card className="overflow-hidden mb-6">
      <div className="border-b border-github-border p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Deployment Metrics</h2>
            <p className="text-sm text-github-neutral mt-1">Successful and failed deployments per day</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-2 rounded"
          >
            <i className="fas fa-sync-alt mr-1"></i>
            Refresh
          </button>
        </div>
      </div>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="w-full">
              <Skeleton className="h-4 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-48 w-full rounded" />
              <div className="flex justify-between mt-4">
                {Array(7).fill(0).map((_, i) => (
                  <Skeleton key={i} className="w-12 h-3" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Draw horizontal lines at each point for better visibility */}
                <CartesianGrid horizontal={true} vertical={false} stroke="#eee" />
                
                {/* Success line */}
                <Line 
                  type="monotone" 
                  dataKey="successes" 
                  name="Successful Deployments"
                  stroke="#22863a" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#22863a" }}
                  dot={{ r: 4, fill: "#22863a" }}
                  isAnimationActive={true}
                />
                
                {/* Failure line */}
                <Line 
                  type="monotone" 
                  dataKey="failures" 
                  name="Failed Deployments"
                  stroke="#cb2431" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#cb2431" }}
                  dot={{ r: 4, fill: "#cb2431" }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}