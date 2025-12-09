
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardMembersTable from "./DashboardMembersTable";
import { MemberCategory } from "@/types/member";

const AdminSection = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<MemberCategory | 'All'>('All');

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Members Management</CardTitle>
          <Button onClick={() => navigate("/admin/members")}>Manage Members</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="All" onClick={() => setSelectedCategory('All')}>All</TabsTrigger>
            <TabsTrigger value="Sons" onClick={() => setSelectedCategory('Sons')}>Sons</TabsTrigger>
            <TabsTrigger value="Pastors" onClick={() => setSelectedCategory('Pastors')}>Pastors</TabsTrigger>
            <TabsTrigger value="MINT" onClick={() => setSelectedCategory('MINT')}>MINT</TabsTrigger>
            <TabsTrigger value="Others" onClick={() => setSelectedCategory('Others')}>Others</TabsTrigger>
          </TabsList>

          <TabsContent value="All">
            <DashboardMembersTable category="All" />
          </TabsContent>
          <TabsContent value="Sons">
            <DashboardMembersTable category="Sons" />
          </TabsContent>
          <TabsContent value="Pastors">
            <DashboardMembersTable category="Pastors" />
          </TabsContent>
          <TabsContent value="MINT">
            <DashboardMembersTable category="MINT" />
          </TabsContent>
          <TabsContent value="Others">
            <DashboardMembersTable category="Others" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSection;
