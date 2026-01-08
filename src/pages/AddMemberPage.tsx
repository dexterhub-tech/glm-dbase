import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface AddMemberForm {
    fullname: string;
    email: string;
    phone: string;
    category: string;
    churchunit: string;
    assignedto: string;
}

export default function AddMemberPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<AddMemberForm>();

    const createMutation = useMutation({
        mutationFn: async (data: AddMemberForm) => {
            const response = await api.post("/members", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            toast({ title: "Success", description: "Member added successfully" });
            navigate("/members");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to add member",
                variant: "destructive"
            });
        }
    });

    const onSubmit = (data: AddMemberForm) => {
        createMutation.mutate(data);
    };

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
                    <h1 className="text-2xl font-bold text-slate-900">Add New Member</h1>
                    <p className="text-slate-500 mt-1">Enter the details of the new member below.</p>
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
                                <Select onValueChange={(value) => setValue("category", value)} required>
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
                                <Label htmlFor="churchunit">Church Unit</Label>
                                <Input
                                    id="churchunit"
                                    placeholder="e.g. Choir, Media, Ushering"
                                    {...register("churchunit")}
                                />
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
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-black text-white hover:bg-slate-800"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Create Member
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
