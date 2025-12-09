import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardMetrics } from "./DashboardMetricsService";

const ChurchUnitDistribution = () => {
  const [unitData, setUnitData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const metrics = await fetchDashboardMetrics();
        setUnitData(metrics.churchUnits);
        setTotalMembers(metrics.totalMembers);
      } catch (error) {
        console.error("Error loading church unit distribution:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sort units by member count (descending)
  const sortedUnits = Object.entries(unitData)
    .filter(([unit]) => unit) // Filter out null/undefined units
    .sort((a, b) => b[1] - a[1]);

  // Get colors for the bars
  const getBarColor = (index: number) => {
    const colors = [
      "bg-church-red",
      "bg-church-blue",
      "bg-yellow-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500"
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Church Unit Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : sortedUnits.length > 0 ? (
          <div className="space-y-4">
            {sortedUnits.map(([unit, count], index) => {
              const percentage = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
              
              return (
                <div key={unit} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{unit}</span>
                    <span>{count} members ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getBarColor(index)}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No church unit data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChurchUnitDistribution;
