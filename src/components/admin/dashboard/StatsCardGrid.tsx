
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EnhancedStatsCard from "./EnhancedStatsCard";
import { fetchDashboardMetrics, DashboardMetrics } from "./DashboardMetricsService";
import {
  Users,
  UserCog,
  ShieldCheck,
  Activity,
  Building,
  UserPlus,
  CheckCircle,
  User
} from "lucide-react";

const StatsCardGrid = () => {
  const { isSuperUser } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();

    // Refresh metrics every 5 minutes
    const intervalId = setInterval(loadMetrics, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (isSuperUser) {
    // Calculate percentages and trends
    const activePercentage = metrics?.totalMembers
      ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
      : 0;

    const getSystemStatusColor = () => {
      if (!metrics) return 'info';
      switch (metrics.systemStatus.status) {
        case 'Healthy': return 'success';
        case 'Warning': return 'warning';
        case 'Error': return 'error';
        default: return 'info';
      }
    };

    // Get top church unit
    const topUnit = metrics?.churchUnits
      ? Object.entries(metrics.churchUnits).sort((a, b) => b[1] - a[1])[0]
      : null;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <EnhancedStatsCard
            title="Total Members"
            description="All registered members"
            value={loading ? "..." : metrics?.totalMembers || 0}
            trend="members registered"
            trendDirection="neutral"
            icon={<Users className="h-5 w-5 text-church-blue" />}
            loading={loading}
          />
          <EnhancedStatsCard
            title="Registered Users"
            description="Total user accounts"
            value={loading ? "..." : metrics?.registeredUsers || 0}
            trend="user accounts"
            icon={<User className="h-5 w-5 text-purple-600" />}
            loading={loading}
          />
          <EnhancedStatsCard
            title="Admin Users"
            description="Total admin accounts"
            value={loading ? "..." : metrics?.adminUsers || 0}
            trend={`including ${metrics?.superAdmins || 1} super admin`}
            icon={<ShieldCheck className="h-5 w-5 text-[#ff0000]" />}
            loading={loading}
          />
          <EnhancedStatsCard
            title="System Status"
            description="Overall system health"
            value={loading ? "..." : metrics?.systemStatus.status || "Checking..."}
            trend={metrics?.systemStatus.message || "Checking system status"}
            icon={<Activity className="h-5 w-5 text-green-600" />}
            loading={loading}
            status={getSystemStatusColor()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <EnhancedStatsCard
            title="Active Members"
            description="Currently active members"
            value={loading ? "..." : metrics?.activeMembers || 0}
            trend={`${activePercentage}% of total members`}
            trendDirection={activePercentage > 75 ? 'up' : activePercentage > 50 ? 'neutral' : 'down'}
            trendValue={activePercentage + "%"}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            loading={loading}
          />
          <EnhancedStatsCard
            title="Pastors"
            description="Total pastors in the ministry"
            value={loading ? "..." : metrics?.pastors || 0}
            trend="serving in the ministry"
            icon={<UserCog className="h-5 w-5 text-church-red" />}
            loading={loading}
          />
          <EnhancedStatsCard
            title="New Members"
            description="Joined in the last 30 days"
            value={loading ? "..." : metrics?.newMembers || 0}
            trend="new registrations"
            trendDirection="up"
            icon={<UserPlus className="h-5 w-5 text-blue-600" />}
            loading={loading}
          />
        </div>

        {topUnit && (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8">
            <EnhancedStatsCard
              title="Church Units"
              description="Distribution of members across units"
              value={Object.keys(metrics?.churchUnits || {}).length || 0}
              trend="active church units"
              icon={<Building className="h-5 w-5 text-purple-600" />}
              loading={loading}
              footer={
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Top unit:</span>
                    <span className="font-medium">{topUnit[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Members in top unit:</span>
                    <span className="font-medium">{topUnit[1]}</span>
                  </div>
                </div>
              }
            />
          </div>
        )}
      </>
    );
  }

  // Regular admin view
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      <EnhancedStatsCard
        title="Total Members"
        description="All registered members"
        value={loading ? "..." : metrics?.totalMembers || 0}
        trend="members registered"
        icon={<Users className="h-5 w-5 text-church-blue" />}
        loading={loading}
      />
      <EnhancedStatsCard
        title="Active Members"
        description="Currently active members"
        value={loading ? "..." : metrics?.activeMembers || 0}
        trend={`${metrics?.totalMembers ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100) : 0}% of total`}
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        loading={loading}
      />
      <EnhancedStatsCard
        title="New Members"
        description="Joined in the last 30 days"
        value={loading ? "..." : metrics?.newMembers || 0}
        trend="new registrations"
        icon={<UserPlus className="h-5 w-5 text-blue-600" />}
        loading={loading}
      />
    </div>
  );
};

export default StatsCardGrid;
