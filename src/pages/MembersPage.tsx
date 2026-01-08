import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Member } from "@/types/member";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Search,
    UserPlus,
    MoreVertical,
    Filter,
    Trash2,
    Edit
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function MembersPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth(); // Assuming useAuth is available and provides user info

    const { data: members, isLoading } = useQuery<Member[]>({
        queryKey: ["members", searchTerm],
        queryFn: async () => {
            const response = await api.get("/members", {
                params: { searchTerm: searchTerm || undefined }
            });
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/members/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            toast({ title: "Deleted", description: "Member removed successfully" });
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/members/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            toast({ title: "Approved", description: "Member approved successfully" });
        },
    });

    return (
        <div className="space-y-8 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Member Directory</h1>
                    <p className="text-slate-500 mt-1">Manage and track all church members across categories.</p>
                </div>
                <Button
                    className="bg-black text-white hover:bg-slate-800"
                    onClick={() => navigate("/members/add")}
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search name, email, or phone..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="bg-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold">Full Name</TableHead>
                            <TableHead className="font-bold">Category</TableHead>
                            <TableHead className="font-bold">Center / Unit</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold md:table-cell hidden">Phone</TableHead>
                            <TableHead className="text-right font-bold w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    <TableCell />
                                </TableRow>
                            ))
                        ) : members?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members?.map((member) => (
                                <TableRow key={member.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">
                                        <div>{member.fullname}</div>
                                        <div className="text-xs text-slate-400 font-normal">{member.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                            {member.category}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-600">
                                            {(member.auxanoCenter as any)?.name || "-"}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {(member.unit as any)?.name || "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", member.isactive ? "bg-green-500" : "bg-slate-300")} />
                                                <span className="text-sm text-slate-600">{member.isactive ? "Active" : "Inactive"}</span>
                                            </div>
                                            {member.status === 'pending' && (
                                                <span className="inline-flex max-w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 md:table-cell hidden">{member.phone || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                {member.status === 'pending' && (
                                                    <DropdownMenuItem onClick={() => approveMutation.mutate(member.id)}>
                                                        <UserPlus className="w-4 h-4 mr-2" /> Approve
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => navigate(`/members/edit/${member.id}`)}>
                                                    <Edit className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => deleteMutation.mutate(member.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
