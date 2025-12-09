import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AddPastorDialog } from "./AddPastorDialog";

interface Pastor {
  id: string;
  fullname: string;
  email: string;
  phone?: string;
  title?: string;
  bio?: string;
  memberCount: number;
  churchunit?: string;
  auxanogroup?: string;
}

const PastorsPage = () => {
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPastors = useCallback(async () => {
    try {
      setLoading(true);
      console.log('PastorsPage: Fetching pastors from Supabase...');

      // Fetch all pastors (members with category 'Pastors')
      const { data: pastorsData, error: pastorsError } = await supabase
        .from('members')
        .select('*')
        .eq('category', 'Pastors');

      if (pastorsError) {
        console.error('PastorsPage: Error fetching pastors data:', pastorsError);
        throw pastorsError;
      }

      console.log('PastorsPage: Pastors data received:', pastorsData);

      if (!pastorsData || pastorsData.length === 0) {
        console.log('PastorsPage: No pastors found in database');
        setPastors([]);
        return;
      }

      // For each pastor, count how many members are assigned to them
      console.log('PastorsPage: Counting members assigned to each pastor...');
      const pastorsWithCounts = await Promise.all(
        pastorsData.map(async (pastor) => {
          try {
            const { data, error: countError } = await supabase
              .from('members')
              .select('id')
              .eq('assignedto', pastor.id);

            if (countError) {
              console.error(`PastorsPage: Error counting members for pastor ${pastor.id}:`, countError);
              throw countError;
            }

            return {
              ...pastor,
              memberCount: data?.length || 0
            };
          } catch (countingError) {
            console.error(`PastorsPage: Error processing pastor ${pastor.id}:`, countingError);
            // Return the pastor with 0 members instead of failing completely
            return {
              ...pastor,
              memberCount: 0
            };
          }
        })
      );

      console.log('PastorsPage: Successfully processed all pastors with member counts');
      setPastors(pastorsWithCounts);
    } catch (error: unknown) {
      console.error('PastorsPage: Error fetching pastors:', error);
      toast({
        variant: "destructive",
        title: "Error fetching pastors",
        description: error instanceof Error ? error.message : "Failed to fetch pastors. Please try again later."
      });
      // Set empty array in case of error
      setPastors([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPastors();
  }, [fetchPastors]);

  // Filter pastors based on search query
  const filteredPastors = pastors.filter(pastor => {
    const name = pastor.fullname || '';
    const email = pastor.email || '';
    const churchUnit = pastor.churchunit || '';
    const auxanoGroup = pastor.auxanogroup || '';

    const query = searchQuery.toLowerCase();

    return name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      churchUnit.toLowerCase().includes(query) ||
      auxanoGroup.toLowerCase().includes(query);
  });

  const handleViewPastor = (pastorId: string) => {
    navigate(`/admin/pastors/${pastorId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
        <div>
          <h2 className="text-2xl font-sans font-bold">Pastors</h2>
          <p className="text-muted-foreground">Manage pastors and view their assigned members</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search pastors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <AddPastorDialog onPastorAdded={fetchPastors} />
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">
            <UserCog className="mr-2 h-4 w-4" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="list">
            <Users className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPastors.length > 0 ? (
                filteredPastors.map((pastor) => (
                  <Card key={pastor.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-sans font-bold">{pastor.fullname}</CardTitle>
                      <CardDescription>{pastor.title || 'Pastor'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Email:</span> {pastor.email}
                        </div>
                        {pastor.phone && (
                          <div className="text-sm">
                            <span className="font-medium">Phone:</span> {pastor.phone}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="bg-blue-50">
                            {pastor.memberCount} Members
                          </Badge>
                          {pastor.churchunit && (
                            <Badge variant="outline" className="bg-green-50">
                              {pastor.churchunit}
                            </Badge>
                          )}
                          {pastor.auxanogroup && (
                            <Badge variant="outline" className="bg-yellow-50">
                              {pastor.auxanogroup}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => handleViewPastor(pastor.id)}
                        >
                          View Members
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">No pastors found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Phone</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Church Unit</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Auxano Group</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Members</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {loading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4 align-middle"><Skeleton className="h-4 w-32" /></td>
                          <td className="p-4 align-middle"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-4 align-middle"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4 align-middle"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-4 align-middle"><Skeleton className="h-4 w-12" /></td>
                          <td className="p-4 align-middle"><Skeleton className="h-8 w-20" /></td>
                        </tr>
                      ))
                    ) : filteredPastors.length > 0 ? (
                      filteredPastors.map((pastor) => (
                        <tr key={pastor.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{pastor.fullname}</td>
                          <td className="p-4 align-middle">{pastor.email}</td>
                          <td className="p-4 align-middle">{pastor.phone || '-'}</td>
                          <td className="p-4 align-middle">{pastor.churchunit || '-'}</td>
                          <td className="p-4 align-middle">{pastor.auxanogroup || '-'}</td>
                          <td className="p-4 align-middle">{pastor.memberCount}</td>
                          <td className="p-4 align-middle">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPastor(pastor.id)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          No pastors found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PastorsPage;
