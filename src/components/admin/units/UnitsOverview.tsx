import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";
import { getUnitIcon, getUnitIconColors } from "@/constants/unitIcons";

interface UnitStats {
  unitId: string;
  unitName: string;
  totalMembers: number;
  activeMembers: number;
}

const UnitsOverview = () => {
  const [unitStats, setUnitStats] = useState<UnitStats[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnitStats();
  }, []);

  const fetchUnitStats = async () => {
    try {
      setLoading(true);
      const stats: UnitStats[] = [];

      for (const unit of OFFICIAL_CHURCH_UNITS) {
        // Get total members in this unit
        const { count: totalCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .or(`churchunit.eq.${unit.id},churchunits.cs.{${unit.id}}`);

        // Get active members in this unit
        const { count: activeCount } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .or(`churchunit.eq.${unit.id},churchunits.cs.{${unit.id}}`)
          .eq('isactive', true);

        stats.push({
          unitId: unit.id,
          unitName: unit.name,
          totalMembers: totalCount || 0,
          activeMembers: activeCount || 0,
        });
      }

      // Sort by total members (descending)
      stats.sort((a, b) => b.totalMembers - a.totalMembers);
      setUnitStats(stats);
    } catch (error) {
      console.error('Error fetching unit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUnit = (unitId: string) => {
    navigate(`/admin/units/${unitId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-sans font-bold">Church Units Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex font-sans font-semibold items-center gap-2">
          {/* <Users className="h-5 w-5" /> */}
          Church Units Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {unitStats.map((unit) => (
            <div
              key={unit.unitId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {(() => {
                  const IconComponent = getUnitIcon(unit.unitId);
                  const colors = getUnitIconColors(unit.unitId);
                  return (
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <IconComponent className={`h-6 w-6 ${colors.text}`} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold font-sans text-gray-900">{unit.unitName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {unit.totalMembers} total
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {unit.activeMembers} active
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewUnit(unit.unitId)}
                className="flex items-center gap-2"
              >
                View
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {unitStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No unit data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitsOverview;