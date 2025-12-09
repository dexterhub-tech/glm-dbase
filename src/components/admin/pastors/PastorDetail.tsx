import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, Users, ArrowLeft, Mail, Phone, Building, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssignMemberDialog } from "./AssignMemberDialog";

interface Pastor {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  title?: string;
  bio?: string;
  churchUnit?: string;
  auxanoGroup?: string;
}

interface Member {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  joinDate: string;
  notes?: string;
  isActive: boolean;
}

const PastorDetail = () => {
  const { pastorId } = useParams<{ pastorId: string }>();
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (pastorId) {
      fetchPastorAndMembers();
    }
  }, [pastorId]);

  const fetchPastorAndMembers = async () => {
    if (!pastorId) return;

    try {
      setLoading(true);
      console.log('Fetching pastor details for ID:', pastorId);

      // Fetch pastor details
      const { data: pastorData, error: pastorError } = await supabase
        .from('members')
        .select('*')
        .eq('id', pastorId)
        .eq('category', 'Pastors')
        .single();

      if (pastorError) {
        console.error('Error fetching pastor:', pastorError);
        throw pastorError;
      }

      console.log('Pastor data received:', pastorData);

      // Normalize pastor data
      const normalizedPastor = normalizePastor(pastorData);
      setPastor(normalizedPastor);

      // Fetch members assigned to this pastor
      console.log('Fetching members assigned to pastor:', pastorId);
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('assignedto', pastorId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      console.log(`Found ${membersData?.length || 0} members assigned to this pastor`);

      // Set members (will be normalized in the filteredMembers computation)
      setMembers(membersData || []);
    } catch (error: any) {
      console.error('Error fetching pastor details:', error);
      toast({
        variant: "destructive",
        title: "Error fetching pastor details",
        description: error.message
      });
      // Set empty arrays to avoid undefined errors
      setPastor(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Normalize member data to handle case inconsistencies
  const normalizeMembers = (members: any[]): Member[] => {
    return members.map(member => ({
      id: member.id,
      fullName: member.fullName || member.fullname || '',
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      category: member.category || '',
      joinDate: member.joinDate || member.joindate || new Date().toISOString(),
      notes: member.notes || '',
      isActive: member.isActive || member.isactive || false
    }));
  };

  // Normalize pastor data to handle case inconsistencies
  const normalizePastor = (pastor: any): Pastor | null => {
    if (!pastor) return null;
    return {
      id: pastor.id,
      fullName: pastor.fullName || pastor.fullname || '',
      email: pastor.email || '',
      phone: pastor.phone || '',
      title: pastor.title || '',
      bio: pastor.bio || '',
      churchUnit: pastor.churchUnit || pastor.churchunit || '',
      auxanoGroup: pastor.auxanoGroup || pastor.auxanogroup || ''
    };
  };

  // Filter members based on search query
  const filteredMembers = normalizeMembers(members).filter(member => {
    const name = member.fullName.toLowerCase();
    const email = member.email.toLowerCase();
    const category = member.category.toLowerCase();
    const query = searchQuery.toLowerCase();

    return name.includes(query) || email.includes(query) || category.includes(query);
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (!pastorId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Pastor ID not provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => navigate('/admin/pastors')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pastors
      </Button>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ) : pastor ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-church-red text-white text-xl">
                  {getInitials(pastor.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{pastor.fullName}</CardTitle>
                <CardDescription>{pastor.title || 'Pastor'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{pastor.email}</span>
                </div>
                {pastor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{pastor.phone}</span>
                  </div>
                )}
                {pastor.churchUnit && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>Church Unit: {pastor.churchUnit}</span>
                  </div>
                )}
                {pastor.auxanoGroup && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Auxano Group: {pastor.auxanoGroup}</span>
                  </div>
                )}
              </div>
              <div>
                {pastor.bio && (
                  <div>
                    <h3 className="font-medium mb-2">Bio</h3>
                    <p className="text-sm text-muted-foreground">{pastor.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Pastor not found or not a valid pastor.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Assigned Members</h2>
          <p className="text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''} assigned to {pastor?.fullName || 'this pastor'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {pastor && (
            <AssignMemberDialog
              pastorId={pastor.id}
              pastorName={pastor.fullName}
              onMemberAssigned={fetchPastorAndMembers}
            />
          )}
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
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-church-blue text-white">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{member.fullName}</CardTitle>
                          <CardDescription className="text-xs">{member.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {member.phone && (
                          <div className="text-sm">
                            <span className="font-medium">Phone:</span> {member.phone}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="bg-blue-50">
                            {member.category}
                          </Badge>
                          {member.isActive ? (
                            <Badge variant="outline" className="bg-green-50">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                        >
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">No members found matching your search.</p>
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
                      <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Join Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
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
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <tr key={member.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle font-medium">{member.fullName}</td>
                          <td className="p-4 align-middle">{member.email}</td>
                          <td className="p-4 align-middle">{member.phone || '-'}</td>
                          <td className="p-4 align-middle">{member.category}</td>
                          <td className="p-4 align-middle">{new Date(member.joinDate).toLocaleDateString()}</td>
                          <td className="p-4 align-middle">
                            {member.isActive ? (
                              <Badge variant="outline" className="bg-green-50">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50">
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground">
                          No members found matching your search.
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

export default PastorDetail;
