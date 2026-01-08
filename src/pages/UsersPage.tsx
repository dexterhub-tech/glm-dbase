import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/member";

export default function UsersPage() {
    const { data: users, isLoading, error } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const response = await api.get("/auth/users", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500">
                Failed to load users. Please try again.
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-0 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Users</h2>
                    <p className="text-muted-foreground">
                        Manage admins, pastors, and system users.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        A list of all users with access to the admin portal.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Assigned Center</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell className="font-medium">
                                        {user.profile?.full_name || "N/A"}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.role === "superadmin"
                                                    ? "destructive"
                                                    : user.role === "admin"
                                                        ? "default"
                                                        : user.role === "pastor"
                                                            ? "secondary"
                                                            : "outline"
                                            }
                                            className="uppercase text-xs"
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(user.assignedAuxanoCenter as any)?.name || "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
