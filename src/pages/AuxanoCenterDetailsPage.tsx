import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Users, Loader2, Mail, Phone, User as UserIcon } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function AuxanoCenterDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: center, isLoading: isLoadingCenter } = useQuery({
        queryKey: ["auxano-center", id],
        queryFn: async () => {
            const response = await api.get(`/auxano/${id}`);
            return response.data;
        },
    });

    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["auxano-center-members", id],
        queryFn: async () => {
            const response = await api.get(`/members?auxanoCenter=${id}`);
            return response.data;
        },
    });

    if (isLoadingCenter) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!center) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Center not found</h2>
                <Button variant="link" onClick={() => navigate("/auxano-centers")}>Back to Centers</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/auxano-centers")} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">{center.name}</h1>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{center.location}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Center Stats */}
                <Card className="md:col-span-1 border-none shadow-md rounded-2xl bg-white">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Center Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm">Pastors</span>
                            <Badge variant="secondary">{center.pastors?.length || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm">Members</span>
                            <Badge variant="secondary">{members?.length || 0}</Badge>
                        </div>
                        <Separator />
                        <div className="pt-2">
                            <h4 className="text-sm font-semibold mb-3">Assigned Pastors</h4>
                            <div className="space-y-3">
                                {center.pastors?.length > 0 ? (
                                    center.pastors.map((pastor: any) => (
                                        <div key={pastor._id} className="flex flex-col">
                                            <span className="text-sm font-medium">{pastor.name}</span>
                                            <span className="text-xs text-slate-500">{pastor.email}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No pastors assigned yet.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members List */}
                <Card className="md:col-span-2 border-none shadow-md rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-serif">Members List</CardTitle>
                        <Badge variant="outline" className="font-normal">{members?.length || 0} Members</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingMembers ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : members && members.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">Member</th>
                                            <th className="px-6 py-3">Contact</th>
                                            <th className="px-6 py-3">Category</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {members.map((member: any) => (
                                            <tr key={member._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <UserIcon className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-slate-900">{member.fullname}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="text-xs truncate max-w-[150px]">{member.email || "N/A"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <Phone className="w-3 h-3" />
                                                            <span className="text-xs">{member.phone || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="text-[10px] font-normal">
                                                        {member.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${member.isactive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                        }`}>
                                                        {member.isactive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No members assigned to this center yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
