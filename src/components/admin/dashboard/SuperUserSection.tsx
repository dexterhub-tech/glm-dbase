
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardMembersTable from "./DashboardMembersTable";
import ChurchUnitDistribution from "./ChurchUnitDistribution";
import SupabaseConnectionTest from "./SupabaseConnectionTest";
import SuperAdminManagementButton from "./SuperAdminManagementButton";
import { Shield, Users, UserCog, Crown } from "lucide-react";

const SuperUserSection = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#ff0000]" />
                <CardTitle>User Management</CardTitle>
              </div>
              <Button onClick={() => navigate("/admin/users")}>Manage Users</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4">
              <p className="text-gray-600">Admin users have special privileges to manage the church application. You can assign roles, manage permissions, and monitor user activity.</p>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>
                  View Admin Users
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#ff0000]" />
                <CardTitle>Super Admin</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4">
              <p className="text-gray-600">Manage super administrators who have full system access. Add or remove super admin privileges.</p>
              <div className="mt-4 flex justify-end">
                <SuperAdminManagementButton />
              </div>
            </div>
          </CardContent>
        </Card>

        <ChurchUnitDistribution />

        <SupabaseConnectionTest />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-church-blue" />
              <CardTitle>Members Overview</CardTitle>
            </div>
            <Button onClick={() => navigate("/admin/members")}>View All Members</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Members</TabsTrigger>
              <TabsTrigger value="pastors">Pastors</TabsTrigger>
              <TabsTrigger value="sons">Sons</TabsTrigger>
              <TabsTrigger value="mint">MINT</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <DashboardMembersTable category="All" />
            </TabsContent>

            <TabsContent value="pastors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-church-red" />
                  Pastors
                </h3>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/pastors")}>
                  Manage Pastors
                </Button>
              </div>
              <DashboardMembersTable category="Pastors" />
            </TabsContent>

            <TabsContent value="sons">
              <DashboardMembersTable category="Sons" />
            </TabsContent>

            <TabsContent value="mint">
              <DashboardMembersTable category="MINT" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default SuperUserSection;
