import { Card, CardContent } from "@/components/ui/card";
import { WorkflowActivity } from "@/lib/github";
import { formatDateShort } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getLastNDays } from "@/lib/utils";

interface WorkflowActivityChartProps {
  activity: WorkflowActivity[] | undefined;
  isLoading: boolean;
}

export default function WorkflowActivityChart({ activity, isLoading }: WorkflowActivityChartProps) {
  // Calculate the maximum run count for scaling
  const maxRunCount = activity 
    ? Math.max(...activity.map(day => day.runCount), 1) 
    : 1;
  
  // Get the last 7 days for the chart labels
  const lastSevenDays = getLastNDays(7);
  
  // Prepare data for the chart, ensuring we have entries for all 7 days
  const chartData = lastSevenDays.map(date => {
    const matchingActivity = activity?.find(a => a.date === date);
    return {
      date,
      runCount: matchingActivity?.runCount || 0,
      height: matchingActivity 
        ? Math.max(10, (matchingActivity.runCount / maxRunCount) * 100) 
        : 0
    };
  });
  
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-github-border p-4">
        <h2 className="text-lg font-semibold">Workflow Activity</h2>
      </div>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="h-48 mb-2">
            <div className="flex items-end justify-between gap-1 h-full">
              {Array(7).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-6 h-12 rounded-t" />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {Array(7).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-12 h-3" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="h-48 flex items-end justify-between gap-1 mb-2 pr-2 relative">
              {/* Optional zero line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
              
              {chartData.map((day, index) => (
                <div 
                  key={index} 
                  className="bg-github-blue rounded-t"
                  style={{ 
                    height: `${day.height}%`,
                    width: '100%',
                    flex: '1'
                  }}
                  title={`${day.runCount} runs on ${formatDateShort(day.date)}`}
                ></div>
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-github-neutral">
              {chartData.map((day, index) => (
                <span key={index}>{formatDateShort(day.date)}</span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
