import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Crown, User, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const AdminAccess = () => {
    const { user, isAdmin, isSuperUser, isLoading } = useAuth();
    const navigate = useNavigate();

    const { toast } = useToast();

    // Check localStorage for stored admin status
    const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';
    const storedAdminStatus = localStorage.getItem('glm-is-admin') === 'true';

    const effectiveIsAdmin = isAdmin || storedAdminStatus;
    const effectiveIsSuperUser = isSuperUser || storedSuperUserStatus;

    useEffect(() => {
        // If user is confirmed admin/superuser, redirect to admin dashboard immediately
        if (!isLoading && user && (effectiveIsAdmin || effectiveIsSuperUser)) {
            console.log('Admin user detected, redirecting to dashboard');
            navigate("/admin", { replace: true });
        }
    }, [user, effectiveIsAdmin, effectiveIsSuperUser, isLoading, navigate]);

    const handleForceAccess = () => {
        if (user) {
            // Grant admin access based on email whitelist
            const adminEmails = [
                'ojidelawrence@gmail.com',
                'admin@gospellabourministry.com',
                'superadmin@gospellabourministry.com'
            ];
            
            if (adminEmails.includes(user.email?.toLowerCase() || '')) {
                localStorage.setItem('glm-is-admin', 'true');
                if (user.email?.toLowerCase() === 'ojidelawrence@gmail.com') {
                    localStorage.setItem('glm-is-superuser', 'true');
                }
                // Force page reload to update auth context
                window.location.href = '/admin';
            } else {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Your email is not authorized for admin access. Please contact an administrator.",
                });
            }
        }
    };

    const handleRefreshAuth = () => {
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="bg-white rounded-lg p-8 shadow-sm border max-w-md">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Verifying Access
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we check your admin permissions...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Access</h1>
                    <p className="text-lg text-gray-600">Access the Gospel Labour Ministry admin dashboard</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Current User Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Current User Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span>Logged In:</span>
                                    <span className={user ? "text-green-600" : "text-red-600"}>
                                        {user ? "✅ Yes" : "❌ No"}
                                    </span>
                                </div>
                                {user && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Email:</span>
                                            <span className="text-sm">{user.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Admin:</span>
                                            <span className={effectiveIsAdmin ? "text-green-600" : "text-red-600"}>
                                                {effectiveIsAdmin ? "✅ Yes" : "❌ No"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Super Admin:</span>
                                            <span className={effectiveIsSuperUser ? "text-[#ff0000]" : "text-red-600"}>
                                                {effectiveIsSuperUser ? "👑 Yes" : "❌ No"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Access Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Access Options
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!user ? (
                                <Button
                                    onClick={() => navigate("/auth")}
                                    className="w-full"
                                >
                                    Login First
                                </Button>
                            ) : effectiveIsAdmin || effectiveIsSuperUser ? (
                                <Button
                                    onClick={() => navigate("/admin")}
                                    className={`w-full ${effectiveIsSuperUser ? "bg-yellow-500 hover:bg-[#ff0000]" : ""}`}
                                >
                                    {effectiveIsSuperUser ? (
                                        <>
                                            <Crown className="h-4 w-4 mr-2" />
                                            Super Admin Dashboard
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-4 w-4 mr-2" />
                                            Admin Dashboard
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            You don't have admin privileges. Contact an administrator to grant access.
                                        </AlertDescription>
                                    </Alert>
                                    <Button
                                        variant="outline"
                                        onClick={handleRefreshAuth}
                                        className="w-full"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh Auth Status
                                    </Button>
                                    {user.email === 'ojidelawrence@gmail.com' && (
                                        <Button
                                            onClick={handleForceAccess}
                                            className="w-full bg-yellow-500 hover:bg-[#ff0000] text-black"
                                        >
                                            Force Super Admin Access (Testing)
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>How to Access Admin Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl mb-2">1️⃣</div>
                                    <h3 className="font-medium mb-2">Login</h3>
                                    <p className="text-sm text-gray-600">Sign in with your account</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl mb-2">2️⃣</div>
                                    <h3 className="font-medium mb-2">Get Admin Access</h3>
                                    <p className="text-sm text-gray-600">Contact admin to grant privileges</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl mb-2">3️⃣</div>
                                    <h3 className="font-medium mb-2">Access Dashboard</h3>
                                    <p className="text-sm text-gray-600">Click admin button in header</p>
                                </div>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>For ojidelawrence@gmail.com:</strong> Run the database setup and superadmin creation scripts first:
                                    <br />
                                    1. <code>node run-database-setup.js</code>
                                    <br />
                                    2. <code>node create-superadmin.js</code>
                                    <br />
                                    3. <code>node complete-superadmin-fix.js</code>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAccess;