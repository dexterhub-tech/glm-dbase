import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Member } from "@/types/member";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentMessages } from "@/components/dashboard/RecentMessages";
import { useAuth } from "@/contexts/AuthContext";
import { PastorDashboard } from "@/components/dashboard/PastorDashboard";

export default function Dashboard() {
    const { data: members, isLoading, error } = useQuery<Member[]>({
        queryKey: ["members"],
        queryFn: async () => {
            // Ensure we handle potential wrapper objects from the API
            const response = await api.get("/members");
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data && Array.isArray(response.data.members)) {
                return response.data.members;
            }
            return [];
        },
    });

    // Derived state for the subtitle
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse p-4">
                <div className="h-8 w-48 bg-slate-200 rounded-lg mb-8" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-200 rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="lg:col-span-4 h-[350px] bg-slate-200 rounded-xl" />
                    <div className="lg:col-span-3 h-[350px] bg-slate-200 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-8 text-red-500">
                Failed to load dashboard data. Please try again later.
            </div>
        )
    }

    const memberData = members || [];
    const { user } = useAuth(); // Assuming useAuth is imported

    if (user?.role === 'pastor') {
        return (
            <div className="flex-1 space-y-4 p-0 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="md:text-3xl text-xl font-bold tracking-tight font-serif text-primary">Hello, Pastor {user.profile?.full_name || user.email}</h2>
                        <p className="text-muted-foreground">
                            Managing {user.assignedAuxanoCenter ? 'your Auxano Center' : 'your members'}.
                        </p>
                    </div>
                </div>
                <PastorDashboard />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-0 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="md:text-3xl text-xl font-bold tracking-tight font-serif text-primary">Hello, Admin</h2>
                    <p className="text-muted-foreground">
                        Here's what's happening in your church today.
                    </p>
                </div>
                {/* Optional: Add a date picker or action buttons here */}
            </div>

            <OverviewStats members={memberData} />

            <div className="md:grid space-y-4 md:space-y-0 gap-6 md:grid-cols-2 lg:grid-cols-7">
                <GrowthChart members={memberData} />
                <RecentActivity members={memberData} />

            </div>

            <div className="">
                <RecentMessages />
            </div>
        </div>
    );
}
