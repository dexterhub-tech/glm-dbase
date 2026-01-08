import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, ShieldCheck, UserPlus, ArrowUpRight } from "lucide-react";
import { Member } from "@/types/member";

interface OverviewStatsProps {
    members: Member[];
}

export function OverviewStats({ members }: OverviewStatsProps) {
    const stats = [
        {
            title: "Total Members",
            value: members.length,
            icon: Users,
            change: "+12% from last month", // Placeholder for now
            trend: "up",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/20",
        },
        {
            title: "Active Members",
            value: members.filter(m => m.isactive).length,
            icon: UserCheck,
            change: "+4% from last month",
            trend: "up",
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-950/20",
        },
        {
            title: "Pastors",
            value: members.filter(m => m.category === "Pastors").length,
            icon: ShieldCheck,
            change: "No change",
            trend: "neutral",
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-950/20",
        },
        {
            title: "Workers",
            value: members.filter(m => m.category === "Workers").length,
            icon: UserPlus,
            change: "+2% from last month",
            trend: "up",
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-950/20",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title} className="overflow-hidden border-none shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${stat.bg}`}>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            {stat.trend === "up" && <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />}
                            <span className={stat.trend === "up" ? "text-green-500" : ""}>{stat.change}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
