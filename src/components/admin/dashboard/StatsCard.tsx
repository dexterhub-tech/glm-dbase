
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  description: string;
  value: string | number;
  trend?: string;
}

const StatsCard = ({ title, description, value, trend }: StatsCardProps) => {
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl md:text-3xl font-bold">{value}</p>
        {trend && <p className="text-xs md:text-sm text-green-600 mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
