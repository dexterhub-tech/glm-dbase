import {
    LayoutDashboard,
    Users,
    CreditCard,
    Calendar,
    Settings,
    LogOut,
    UserPlus,
    FileText,
    Church
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Members",
        url: "/members",
        icon: Users,
    },
    {
        title: "Donations",
        url: "/donations",
        icon: CreditCard,
    },
    {
        title: "Events",
        url: "/events",
        icon: Calendar,
    },
    {
        title: "Messages",
        url: "/messages",
        icon: FileText,
    },
    {
        title: "Users",
        url: "/users",
        icon: UserPlus,
    },
    {
        title: "Auxano Centers",
        url: "/auxano-centers",
        icon: Users,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    },
];

export function AppSidebar() {
    const { pathname } = useLocation();
    const { logout, user } = useAuth();

    return (
        <Sidebar collapsible="icon" className="border-r-0">
            <SidebarHeader>
                <div className="flex items-center gap-3 px-3 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                        <Church className="size-6" />
                    </div>
                    <span className="truncate font-serif text-xl font-bold tracking-tight">
                        GLM Admin
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground/60 hidden group-data-[collapsible=icon]:hidden md:block">
                        Main Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="pt-2">
                        <SidebarMenu className="gap-2">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                        size="lg"
                                        className="rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1"
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="!size-5" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            {user?.role === 'superadmin' && (
                                <>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/create-user"}
                                            tooltip="Create User"
                                            size="lg"
                                            className="rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1"
                                        >
                                            <Link to="/create-user">
                                                <UserPlus className="!size-5" />
                                                <span>Create User</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === "/users"}
                                            tooltip="All Users"
                                            size="lg"
                                            className="rounded-xl text-base font-medium transition-all duration-200 hover:translate-x-1"
                                        >
                                            <Link to="/users">
                                                <Users className="!size-5" />
                                                <span>All Users</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg">
                                    {user?.profile?.full_name?.slice(0, 2)?.toUpperCase() || "AD"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user?.profile?.full_name || "Admin"}</span>
                                <span className="truncate text-xs">{user?.email || "admin@example.com"}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={logout} tooltip="Logout">
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
