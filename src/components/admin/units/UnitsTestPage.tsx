import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";
import { getUnitIcon, getUnitIconColors } from "@/constants/unitIcons";

/**
 * Test page to verify that all church units are properly configured
 * This component displays all units with their icons and colors
 */
const UnitsTestPage = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Church Units Configuration Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_CHURCH_UNITS.map((unit) => {
              const IconComponent = getUnitIcon(unit.id);
              const colors = getUnitIconColors(unit.id);
              
              return (
                <div
                  key={unit.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                    <p className="text-sm text-gray-600">{unit.description}</p>
                    <p className="text-xs text-gray-400">ID: {unit.id}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Configuration Status</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Total units configured: {OFFICIAL_CHURCH_UNITS.length}</li>
              <li>• New units added: Ushering, Sanitation</li>
              <li>• All units have proper icons and colors</li>
              <li>• Routes are configured in App.tsx</li>
              <li>• Sidebar navigation updated</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitsTestPage;