import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Member } from "@/types/member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DiscipleshipPage() {
    const { data: members, isLoading } = useQuery<Member[]>({
        queryKey: ["members", "discipleship"],
        queryFn: async () => {
            const response = await api.get("/members"); // Get all members
            // Filter locally or backend should support filter
            // Ideally backend supports filter. For now efficient to just filter here if list is small,
            // or better add backend filter. Member model added `discipleshipStatus`. 
            // I'll assume I can filter on frontend for now or update backend query if needed.
            // Actually, backend getMembers implementation generic query support might not cover boolean strictly without parsing.
            // Let's rely on client side filtering for this specific flag or update backend.
            // Checking backend controller: `req.query` is passed to `find(query)`. 
            // `discipleshipStatus` was not explicitly handled in backend `getMembers` but generic `req.query` might pass through if not destructured?
            // No, `getMembers` destructures specific fields.
            // So I should request all and filter, or update backend. 
            // I'll filter client side for now to minimize backend churn unless list is huge.
            return response.data;
        },
    });

    const discipleshipMembers = members?.filter(m => m.discipleshipStatus) || [];

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Discipleship Requests</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Members Requesting Discipleship</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Category</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discipleshipMembers.map((member) => (
                                <TableRow key={member.id || member._id}>
                                    <TableCell className="font-medium">{member.fullname}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.phone}</TableCell>
                                    <TableCell>{member.category}</TableCell>
                                </TableRow>
                            ))}
                            {discipleshipMembers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No discipleship requests found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
