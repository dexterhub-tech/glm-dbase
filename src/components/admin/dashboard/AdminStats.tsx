import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, UserCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalDonations: number;
  monthlyDonations: number;
  totalSermons: number;
  recentSermons: number;
  prayerRequests: number;
  activePrayerRequests: number;
  testimonies: number;
  approvedTestimonies: number;
  visitors: number;
  recentVisitors: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalMembers: 0,
    activeMembers: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalDonations: 0,
    monthlyDonations: 0,
    totalSermons: 0,
    recentSermons: 0,
    prayerRequests: 0,
    activePrayerRequests: 0,
    testimonies: 0,
    approvedTestimonies: 0,
    visitors: 0,
    recentVisitors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch stats from existing tables only
      const [
        membersResult,
        activeMembersResult,
        recentMembersResult,
      ] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('isactive', true),
        supabase.from('members').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalMembers: membersResult.count || 0,
        activeMembers: activeMembersResult.count || 0,
        totalEvents: 0, // Will be implemented when events table is added
        upcomingEvents: 0,
        totalDonations: 0, // Will be implemented when financial_records table is added
        monthlyDonations: 0,
        totalSermons: 0, // Will be implemented when sermons table is added
        recentSermons: 0,
        prayerRequests: 0, // Will be implemented when prayer_requests table is added
        activePrayerRequests: 0,
        testimonies: 0, // Will be implemented when testimonies table is added
        approvedTestimonies: 0,
        visitors: 0, // Will be implemented when visitors table is added
        recentVisitors: recentMembersResult.count || 0, // Using recent members as proxy
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed formatCurrency function as it's not needed for current stats

  const statCards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      subtitle: `${stats.activeMembers} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Members",
      value: stats.activeMembers,
      subtitle: "currently active",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "New Members",
      value: stats.recentVisitors,
      subtitle: "last 30 days",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Activity Rate",
      value: stats.totalMembers > 0 ? `${Math.round((stats.activeMembers / stats.totalMembers) * 100)}%` : "0%",
      subtitle: "member activity",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminStats;