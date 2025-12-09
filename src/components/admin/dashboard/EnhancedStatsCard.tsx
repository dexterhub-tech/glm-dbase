import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, ActivityIcon } from "lucide-react";

interface EnhancedStatsCardProps {
  title: string;
  description: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
  status?: 'success' | 'warning' | 'error' | 'info';
  footer?: React.ReactNode;
}

const EnhancedStatsCard = ({ 
  title, 
  description, 
  value, 
  trend, 
  trendDirection = 'neutral',
  trendValue,
  icon,
  loading = false,
  status,
  footer
}: EnhancedStatsCardProps) => {
  
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up': return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
      default: return <ActivityIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
          <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
        </div>
        {icon && (
          <div className="p-2 rounded-full bg-gray-100">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <p className="text-2xl md:text-3xl font-bold">{value}</p>
              {status && (
                <Badge variant="outline" className={`${getStatusColor()} ml-2 mb-1`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              )}
            </div>
            
            {trend && (
              <div className={`flex items-center gap-1 mt-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <p className="text-xs md:text-sm">
                  {trendValue && <span className="font-medium">{trendValue} </span>}
                  {trend}
                </p>
              </div>
            )}
            
            {footer && (
              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                {footer}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedStatsCard;
