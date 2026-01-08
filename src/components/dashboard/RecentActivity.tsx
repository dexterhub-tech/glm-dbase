import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Member } from "@/types/member";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RecentActivityProps {
    members: Member[];
}

export function RecentActivity({ members }: RecentActivityProps) {
    // Sort by join date descending
    const recentMembers = [...members]
        .sort((a, b) => new Date(b.joindate).getTime() - new Date(a.joindate).getTime())
        .slice(0, 5);

    return (
        <Card className="col-span-3 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Recent Members</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {recentMembers.map((member) => (
                        <div key={member.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{member.fullname.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{member.fullname}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground">
                                {new Date(member.joindate).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                    {recentMembers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent members found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
