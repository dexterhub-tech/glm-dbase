import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface EditMemberForm {
    fullname: string;
    email: string;
    phone: string;
    category: string;
    churchunit: string;
    assignedto: string;
    unit?: string;
    auxanoCenter?: string;
}

export default function EditMemberPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<EditMemberForm>();

    const { data: units } = useQuery({
        queryKey: ["units"],
        queryFn: async () => {
            const response = await api.get("/lists/units");
            return response.data;
        },
    });

    const { data: centers } = useQuery({
        queryKey: ["centers"],
        queryFn: async () => {
            const response = await api.get("/lists/centers");
            return response.data;
        },
    });

    const { data: member, isLoading: isLoadingMember } = useQuery({
        queryKey: ["member", id],
        queryFn: async () => {
            const response = await api.get(`/members/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    useEffect(() => {
        if (member) {
            reset({
                fullname: member.fullname,
                email: member.email,
                phone: member.phone,
                category: member.category,
                churchunit: member.churchunit || member.churchunits?.[0] || "",
                assignedto: member.assignedto,
                unit: member.unit?._id || member.unit || "", // Handle populated or ID
                auxanoCenter: member.auxanoCenter?._id || member.auxanoCenter || "",
            });
        }
    }, [member, reset]);

    const updateMutation = useMutation({
        mutationFn: async (data: EditMemberForm & { unit?: string; auxanoCenter?: string }) => {
            const response = await api.put(`/members/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            queryClient.invalidateQueries({ queryKey: ["member", id] });
            toast({ title: "Success", description: "Member updated successfully" });
            navigate("/members");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update member",
                variant: "destructive"
            });
        }
    });

    const onSubmit = (data: EditMemberForm) => {
        updateMutation.mutate(data);
    };

    if (isLoadingMember) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-slate-600"
                onClick={() => navigate("/members")}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Members
            </Button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Edit Member</h1>
                    <p className="text-slate-500 mt-1">Update the details of the member below.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullname">Full Name</Label>
                            <Input
                                id="fullname"
                                placeholder="e.g. John Doe"
                                {...register("fullname", { required: "Full name is required" })}
                                className={errors.fullname ? "border-red-500" : ""}
                            />
                            {errors.fullname && (
                                <p className="text-sm text-red-500">{errors.fullname.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="e.g. john@example.com"
                                    {...register("email", {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address"
                                        }
                                    })}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="e.g. +1234567890"
                                    {...register("phone")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    onValueChange={(value) => setValue("category", value)}
                                    defaultValue={member?.category}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Member">Member</SelectItem>
                                        <SelectItem value="Worker">Worker</SelectItem>
                                        <SelectItem value="Leader">Leader</SelectItem>
                                        <SelectItem value="Pastor">Pastor</SelectItem>
                                        <SelectItem value="Visitor">Visitor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="churchunit">Church Unit (Legacy)</Label>
                                <Input
                                    id="churchunit"
                                    placeholder="e.g. Choir"
                                    {...register("churchunit")}
                                />
                            </div>
                        </div>

                        {/* New Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Unit (New)</Label>
                                <Select onValueChange={(value) => setValue("unit", value)} defaultValue={member?.unit?._id || member?.unit}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units?.map((u: any) => (
                                            <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="auxanoCenter">Auxano Center</Label>
                                <Select onValueChange={(value) => setValue("auxanoCenter", value)} defaultValue={member?.auxanoCenter?._id || member?.auxanoCenter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Center" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {centers?.map((c: any) => (
                                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="assignedto">Assigned To (Pastor/Leader)</Label>
                            <Input
                                id="assignedto"
                                placeholder="Name of pastor or leader responsible"
                                {...register("assignedto")}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/members")}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-black text-white hover:bg-slate-800"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
