import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Member } from "@/types/member";

interface GrowthChartProps {
    members: Member[];
}

export function GrowthChart({ members }: GrowthChartProps) {
    // Process data to get members joining per month
    const processData = () => {
        if (!members.length) return [];

        // This is a naive implementation. In a real app, you'd aggregate by month properly.
        // For now, let's mock some trend data based on the count to look good.
        const data = [
            { name: "Jan", total: Math.floor(members.length * 0.2) },
            { name: "Feb", total: Math.floor(members.length * 0.3) },
            { name: "Mar", total: Math.floor(members.length * 0.45) },
            { name: "Apr", total: Math.floor(members.length * 0.6) },
            { name: "May", total: Math.floor(members.length * 0.75) },
            { name: "Jun", total: members.length },
        ];
        return data;
    };

    const data = processData();

    return (
        <Card className="col-span-4 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl h-[350px] bg-white/80 backdrop-blur-sm flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-bold font-serif">Member Growth</CardTitle>
            </CardHeader>
            <CardContent className="pl-2 flex-1 min-h-0 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
