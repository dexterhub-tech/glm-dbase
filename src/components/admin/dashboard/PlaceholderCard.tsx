
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderCardProps {
  title: string;
  description: string;
}

const PlaceholderCard = ({ title, description }: PlaceholderCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center py-10 text-muted-foreground">
          {title} functionality will be implemented soon.
        </p>
      </CardContent>
    </Card>
  );
};

export default PlaceholderCard;
