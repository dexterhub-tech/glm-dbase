import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await register(email, password, fullName);
            toast({
                title: "Success",
                description: "Account created successfully",
            });
            navigate("/");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.response?.data?.message || "Please check your details and try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg rounded-2xl border-slate-100">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-serif font-bold text-slate-800">Start your journey</CardTitle>
                    <CardDescription>Create your admin account for Gospel Labour Ministry</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Full Name</label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Email</label>
                            <Input
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button className="w-full rounded-xl h-11 text-base shadow-md hover:shadow-lg transition-all" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating account..." : "Create Account"}
                        </Button>
                        <p className="text-xs text-center text-slate-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Login here
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
