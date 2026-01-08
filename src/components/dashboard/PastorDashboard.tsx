import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Member } from "@/types/member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function PastorDashboard() {
    const { user } = useAuth();

    const { data: members, isLoading } = useQuery<Member[]>({
        queryKey: ["members", "pastor", user?._id],
        queryFn: async () => {
            const response = await api.get("/members", {
                // The backend now handles this automatically based on role, 
                // but passing pastorId explicitly is also supported/good for clarity
                params: { pastorId: user?._id, auxanoCenter: user?.assignedAuxanoCenter }
            });
            return response.data;
        },
        enabled: !!user,
    });

    if (isLoading) {
        return <div>Loading your dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-serif">Pastor Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>My Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{members?.length || 0}</div>
                    </CardContent>
                </Card>
                {/* Add more stats if needed */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Members in Your Auxano Center</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members?.map((member) => (
                                <TableRow key={member.id || member._id}>
                                    <TableCell className="font-medium">{member.fullname}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.isactive ? "default" : "secondary"}>
                                            {member.isactive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {typeof member.unit === 'object' ? (member.unit as any)?.name : member.unit || 'None'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!members || members.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No members found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
