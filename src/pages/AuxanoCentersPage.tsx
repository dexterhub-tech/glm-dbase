import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MapPin, Users, Loader2, MoreVertical, Edit, Trash2, CheckCircle2, UserPlus, UserMinus, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CenterFormData {
    name: string;
    location: string;
}

export default function AuxanoCentersPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCenter, setEditingCenter] = useState<any>(null);
    const [assigningPastorsCenter, setAssigningPastorsCenter] = useState<any>(null);
    const [assigningMembersCenter, setAssigningMembersCenter] = useState<any>(null);
    const [selectedPastors, setSelectedPastors] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, setValue } = useForm<CenterFormData>();

    const { data: centers, isLoading } = useQuery({
        queryKey: ["auxano-centers"],
        queryFn: async () => {
            const response = await api.get("/auxano");
            return response.data;
        },
    });

    const { data: pastors } = useQuery({
        queryKey: ["pastors-list"],
        queryFn: async () => {
            const response = await api.get("/lists/pastors");
            return response.data;
        },
    });

    const { data: members } = useQuery({
        queryKey: ["members-list"],
        queryFn: async () => {
            const response = await api.get("/members");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: CenterFormData) => {
            const response = await api.post("/auxano", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auxano-centers"] });
            toast({ title: "Success", description: "Center created successfully" });
            setIsCreateOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create center",
                variant: "destructive"
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: CenterFormData) => {
            const response = await api.put(`/auxano/${editingCenter._id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auxano-centers"] });
            toast({ title: "Success", description: "Center updated successfully" });
            setEditingCenter(null);
            reset();
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update center",
                variant: "destructive"
            });
        }
    });

    const assignPastorsMutation = useMutation({
        mutationFn: async (pastorIds: string[]) => {
            const response = await api.put(`/auxano/${assigningPastorsCenter._id}`, {
                pastors: pastorIds
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auxano-centers"] });
            toast({ title: "Success", description: "Pastors assigned successfully" });
            setAssigningPastorsCenter(null);
        }
    });

    const assignMembersMutation = useMutation({
        mutationFn: async ({ memberIds, centerId }: { memberIds: string[], centerId: string }) => {
            // Bulk update members
            const promises = memberIds.map(id =>
                api.put(`/members/${id}/assign-center`, { auxanoCenterId: centerId })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auxano-centers"] });
            queryClient.invalidateQueries({ queryKey: ["members-list"] });
            toast({ title: "Success", description: "Members assigned successfully" });
            setAssigningMembersCenter(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/auxano/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auxano-centers"] });
            toast({ title: "Success", description: "Center deleted successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete center",
                variant: "destructive"
            });
        }
    });

    const onSubmit = (data: CenterFormData) => {
        if (editingCenter) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (center: any) => {
        setEditingCenter(center);
        setValue("name", center.name);
        setValue("location", center.location);
    };

    const handleAssignPastors = (center: any) => {
        setAssigningPastorsCenter(center);
        setSelectedPastors(center.pastors?.map((p: any) => p._id || p) || []);
    };

    const handleAssignMembers = (center: any) => {
        setAssigningMembersCenter(center);
        // Find members currently in this center
        const currentMembers = members?.filter((m: any) =>
            (m.auxanoCenter?._id || m.auxanoCenter) === center._id
        ).map((m: any) => m._id);
        setSelectedMembers(currentMembers || []);
    };

    const togglePastor = (pastorId: string) => {
        setSelectedPastors(prev =>
            prev.includes(pastorId)
                ? prev.filter(id => id !== pastorId)
                : [...prev, pastorId]
        );
    };

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const filteredCenters = centers?.filter((center: any) =>
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif">Auxano Centers</h1>
                    <p className="text-slate-500 mt-1">Manage fellowship centers and cell groups.</p>
                </div>

                <div className="flex gap-2">
                    <Dialog open={isCreateOpen || !!editingCenter} onOpenChange={(open) => {
                        if (!open) {
                            setIsCreateOpen(false);
                            setEditingCenter(null);
                            reset();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-md" onClick={() => setIsCreateOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Center
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingCenter ? "Edit Center" : "Add New Center"}</DialogTitle>
                                <DialogDescription>
                                    Enter the details for the Auxano Center here. Click save when you're done.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Center Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Lekki Center"
                                        {...register("name", { required: true })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Address / Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="e.g. 123 Admiralty Way, Lekki"
                                        {...register("location", { required: true })}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingCenter ? "Update Center" : "Save Center"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search centers..."
                        className="pl-9 bg-white rounded-xl border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCenters?.map((center: any) => (
                        <Card key={center._id} className="border-none shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-white hover:-translate-y-1">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <CardTitle
                                    className="font-serif text-xl text-slate-800 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => navigate(`/auxano-centers/${center._id}`)}
                                >
                                    {center.name}
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/auxano-centers/${center._id}`)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEdit(center)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAssignPastors(center)}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Assign Pastors
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this center?")) {
                                                    deleteMutation.mutate(center._id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 text-sm text-slate-600">
                                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{center.location}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Users className="w-4 h-4 text-primary shrink-0" />
                                    <div className="flex justify-between w-full">
                                        <span>Pastors: {center.pastors?.length || 0}</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col sm:flex-row gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-lg border-slate-200 hover:bg-slate-50 text-xs py-5"
                                        onClick={() => handleAssignPastors(center)}
                                    >
                                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                        Assign Pastor
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs py-5"
                                        onClick={() => handleAssignMembers(center)}
                                    >
                                        <Users className="w-3.5 h-3.5 mr-1.5" />
                                        Assign Members
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assign Pastors Dialog */}
            <Dialog open={!!assigningPastorsCenter} onOpenChange={(open) => !open && setAssigningPastorsCenter(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Assign Pastors to {assigningPastorsCenter?.name}</DialogTitle>
                        <DialogDescription>
                            Select the pastors you want to assign to this center.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4 py-4">
                            {pastors?.map((pastor: any) => (
                                <div key={pastor._id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`pastor-${pastor._id}`}
                                        checked={selectedPastors.includes(pastor._id)}
                                        onCheckedChange={() => togglePastor(pastor._id)}
                                    />
                                    <Label htmlFor={`pastor-${pastor._id}`} className="flex flex-col">
                                        <span className="font-medium">{pastor.name || pastor.email}</span>
                                        <span className="text-xs text-slate-500">{pastor.email}</span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button
                            onClick={() => assignPastorsMutation.mutate(selectedPastors)}
                            disabled={assignPastorsMutation.isPending}
                        >
                            {assignPastorsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Assignments
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Members Dialog */}
            <Dialog open={!!assigningMembersCenter} onOpenChange={(open) => !open && setAssigningMembersCenter(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assign Members to {assigningMembersCenter?.name}</DialogTitle>
                        <DialogDescription>
                            Select members to add to this center. Members already in this center are pre-selected.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4 py-4">
                            {members?.map((member: any) => {
                                const inAnotherCenter = member.auxanoCenter &&
                                    (member.auxanoCenter?._id || member.auxanoCenter) !== assigningMembersCenter?._id;

                                return (
                                    <div key={member._id} className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`member-${member._id}`}
                                            checked={selectedMembers.includes(member._id)}
                                            onCheckedChange={() => toggleMember(member._id)}
                                        />
                                        <Label htmlFor={`member-${member._id}`} className="flex flex-col flex-1">
                                            <span className="font-medium">{member.fullname}</span>
                                            <div className="flex justify-between items-center w-full">
                                                <span className="text-xs text-slate-500">{member.email || member.phone}</span>
                                                {inAnotherCenter && (
                                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                        Previously in another center
                                                    </span>
                                                )}
                                            </div>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button
                            onClick={() => assignMembersMutation.mutate({
                                memberIds: selectedMembers,
                                centerId: assigningMembersCenter._id
                            })}
                            disabled={assignMembersMutation.isPending}
                        >
                            {assignMembersMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Assignments
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
