import { supabase } from "@/integrations/supabase/client";

export interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  newMembers: number;
  registeredUsers: number;
  adminUsers: number;
  superAdmins: number;
  pastors: number;
  churchUnits: {
    [key: string]: number;
  };
  systemStatus: {
    status: 'Healthy' | 'Warning' | 'Error';
    message: string;
  };
}

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    // Initialize default metrics
    const metrics: DashboardMetrics = {
      totalMembers: 0,
      activeMembers: 0,
      newMembers: 0,
      registeredUsers: 0,
      adminUsers: 0,
      superAdmins: 0,
      pastors: 0,
      churchUnits: {},
      systemStatus: {
        status: 'Healthy',
        message: 'All services running'
      }
    };

    // Get total members count
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id');

    if (membersError) throw membersError;
    metrics.totalMembers = allMembers?.length || 0;

    // Get active members (members with isActive = true)
    const { data: activeMembers, error: activeError } = await supabase
      .from('members')
      .select('id')
      .eq('isactive', true);

    if (activeError) throw activeError;
    metrics.activeMembers = activeMembers?.length || 0;

    // Get new members (joined in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: newMembers, error: newMembersError } = await supabase
      .from('members')
      .select('id')
      .gte('joindate', thirtyDaysAgoStr);

    if (newMembersError) throw newMembersError;
    metrics.newMembers = newMembers?.length || 0;

    // Get registered users count
    const { data: registeredUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;
    metrics.registeredUsers = registeredUsers?.length || 0;

    // Get admin users count (both admin and superuser roles)
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('id')
      .in('role', ['admin', 'superuser']);

    if (adminError) throw adminError;
    metrics.adminUsers = adminUsers?.length || 0;

    // Get super admin count from database
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'superuser');

    if (superAdminError) {
      console.warn('Error fetching superuser roles:', superAdminError);
      // Fallback to email-based counting
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email');

      if (!profilesError) {
        const superUserEmails = [
          'ojidelawrence@gmail.com',
          'popsabey1@gmail.com',
          'dev.samadeyemi@gmail.com'
        ];
        metrics.superAdmins = profiles?.filter(p => 
          p.email && superUserEmails.includes(p.email.toLowerCase())
        ).length || 0;
      } else {
        metrics.superAdmins = 0;
      }
    } else {
      metrics.superAdmins = superAdmins?.length || 0;
    }

    // Get pastors count
    const { data: pastors, error: pastorsError } = await supabase
      .from('members')
      .select('id')
      .eq('category', 'Pastors');

    if (pastorsError) throw pastorsError;
    metrics.pastors = pastors?.length || 0;

    // Get church units distribution - use lowercase column name
    const { data: unitsData, error: unitsError } = await supabase
      .from('members')
      .select('churchunit');

    if (unitsError) throw unitsError;

    // Count members by church unit
    const churchUnits: { [key: string]: number } = {};
    unitsData.forEach(member => {
      if (member.churchunit) {
        churchUnits[member.churchunit] = (churchUnits[member.churchunit] || 0) + 1;
      }
    });
    metrics.churchUnits = churchUnits;

    // Check system status (this is a mock, in a real app you'd check actual services)
    // For now, we'll assume everything is healthy
    metrics.systemStatus = {
      status: 'Healthy',
      message: 'All services running'
    };

    return metrics;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    // Return default metrics in case of error
    return {
      totalMembers: 0,
      activeMembers: 0,
      newMembers: 0,
      registeredUsers: 0,
      adminUsers: 0,
      superAdmins: 1,
      pastors: 0,
      churchUnits: {},
      systemStatus: {
        status: 'Warning',
        message: 'Error fetching some metrics'
      }
    };
  }
};
