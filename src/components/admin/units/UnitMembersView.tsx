import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UnitMembersTable } from "./UnitMembersTable";

interface UnitMembersViewProps {
  unitId: string;
  unitName: string;
}

interface UnitStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
}

export default function UnitMembersView({ unitId, unitName }: UnitMembersViewProps) {
  const [stats, setStats] = useState<UnitStats>({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnitStats();
  }, [unitId]);

  const fetchUnitStats = async () => {
    try {
      setLoading(true);

      // Get total members in this unit
      const { count: totalCount } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .or(`churchunit.eq.${unitId},churchunits.cs.{${unitId}}`);

      // Get active members in this unit
      const { count: activeCount } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .or(`churchunit.eq.${unitId},churchunits.cs.{${unitId}}`)
        .eq('isactive', true);

      setStats({
        totalMembers: totalCount || 0,
        activeMembers: activeCount || 0,
        inactiveMembers: (totalCount || 0) - (activeCount || 0),
      });
    } catch (error) {
      console.error('Error fetching unit stats:', error);
      setStats({
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-6">
        <div>
          <CardTitle className="flex font-sans items-center gap-2">
            {unitName} Unit
            <Badge variant="secondary">{stats.totalMembers} members</Badge>
          </CardTitle>
          <CardDescription>Manage members in the {unitName} unit</CardDescription>
        </div>
      </div>
      {/* Unit Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans text-gray-900 mb-1">{stats.totalMembers}</div>
          <p className="text-sm font-medium text-gray-600">Total Members</p>
        </div>

        {/* <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col justify-between space-y-4">
               <div className="p-3 bg-green-600 dark:bg-green-900/30 rounded-2xl">
                <UserCheck className="h-6 w-6 text-white dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Members</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {loading ? <span className="animate-pulse">...</span> : stats.activeMembers}
                </p>
              </div>
             
            </div>
          </CardContent>
        </Card> */}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans text-gray-900 mb-1">{stats.activeMembers}</div>
          <p className="text-sm font-medium text-gray-600">Active Members</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans text-gray-900 mb-1">{stats.inactiveMembers}</div>
          <p className="text-sm font-medium text-gray-600">InActive Members</p>
        </div>
      </div>

      {/* Unit Members Table */}
      <Card>
        <CardHeader>
          {/* <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex font-sans items-center gap-2">
                {unitName} Unit
                <Badge variant="secondary">{stats.totalMembers} members</Badge>
              </CardTitle>
              <CardDescription>Manage members in the {unitName} unit</CardDescription>
            </div>
          </div> */}
        </CardHeader>
        <CardContent className="w-full">
          <UnitMembersTable
            unitId={unitId}
            unitName={unitName}
            onStatsUpdate={fetchUnitStats}
          />
        </CardContent>
      </Card>
    </div>
  );
}
