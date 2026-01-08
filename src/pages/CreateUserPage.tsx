import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface CreateUserForm {
    full_name: string;
    email: string;
    password: string;
    role: string;
    assignedAuxanoCenter?: string;
}

export default function CreateUserPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateUserForm>();
    const selectedRole = watch("role");

    const { data: centers } = useQuery({
        queryKey: ["centers"],
        queryFn: async () => {
            const response = await api.get("/lists/centers");
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: CreateUserForm) => {
            const response = await api.post("/auth/create-user", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] }); // If we had a users list
            toast({ title: "Success", description: "User created successfully" });
            navigate("/"); // Or to a users list if it existed
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create user",
                variant: "destructive"
            });
        }
    });

    const onSubmit = (data: CreateUserForm) => {
        createMutation.mutate(data);
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-slate-600"
                onClick={() => navigate("/")}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Create New User</h1>
                    <p className="text-slate-500 mt-1">Create an account for a new admin or pastor.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                placeholder="e.g. John Doe"
                                {...register("full_name", { required: "Full name is required" })}
                                className={errors.full_name ? "border-red-500" : ""}
                            />
                            {errors.full_name && (
                                <p className="text-sm text-red-500">{errors.full_name.message}</p>
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
                                        required: "Email is required",
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
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                                    className={errors.password ? "border-red-500" : ""}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select onValueChange={(value) => setValue("role", value)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User (Standard)</SelectItem>
                                    <SelectItem value="pastor">Pastor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="superadmin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedRole === 'pastor' && (
                            <div className="grid gap-2">
                                <Label htmlFor="assignedAuxanoCenter">Assigned Auxano Center</Label>
                                <Select onValueChange={(value) => setValue("assignedAuxanoCenter", value)}>
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
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/")}
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
                            Create User
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
