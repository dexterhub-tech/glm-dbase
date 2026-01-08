import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    UserCircle,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: Users, label: "Members", href: "/members" },
    { icon: UserCircle, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Toggle */}
            <Button
                variant="ghost"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={toggleSidebar}
            >
                {isOpen ? <X /> : <Menu />}
            </Button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full md:translate-x-0 bg-white border-r border-slate-200 flex flex-col",
                isOpen && "translate-x-0"
            )}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs">GLM</div>
                        Admin Portal
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-slate-900" : "text-slate-400")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-lg bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                            {user?.fullname?.substring(0, 2) || "AD"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullname}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
                        onClick={logout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </Button>
                </div>
            </aside>
        </>
    );
}
