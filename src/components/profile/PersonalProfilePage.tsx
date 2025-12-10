import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getAccessToken } from "@/utils/authApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProfileCompletionPrompt } from "./ProfileCompletionPrompt";
import { useProfileData } from "@/hooks/useProfileData";
import { 
  applyProfileDefaults, 
  validateAndSanitizeProfile,
  getProfileFieldDisplay,
  type ProfileData 
} from "@/utils/profileDataHandling";

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  User, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Shield,
  Church,
  Heart,
  Briefcase,
  Users
} from "lucide-react";
import axios from "axios";

// Profile form schema
const profileSchema = z.object({
  fullname: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  occupation: z.string().optional(),
  bio: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  baptism_date: z.string().optional(),
  baptism_location: z.string().optional(),
  is_baptized: z.boolean().optional(),
  preferred_contact_method: z.enum(["email", "phone", "sms", "whatsapp"]).optional(),
  skills_talents: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  genotype: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface MemberProfile {
  id: string;
  user_id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  title?: string;
  category: string;
  churchunit?: string;
  churchunits?: string[];
  assigned_pastor_name?: string;
  joindate?: string;
  created_at: string;
  updated_at: string;
  // Extended profile fields
  bio?: string;
  marital_status?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  profile_image_url?: string;
  baptism_date?: string;
  baptism_location?: string;
  is_baptized?: boolean;
  membership_status?: string;
  preferred_contact_method?: string;
  skills_talents?: string[];
  interests?: string[];
  genotype?: string;
  roles?: string[];
  is_super_admin?: boolean;
  is_pastor?: boolean;
}

export const PersonalProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needsCreation, setNeedsCreation] = useState(false);
  const [createTitle, setCreateTitle] = useState<string>("Brother");
  const [createCategory, setCreateCategory] = useState<string>("adult");
  const [createJoinDate, setCreateJoinDate] = useState<string>("2023-09-15");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      skills_talents: [],
      interests: [],
    },
  });

// Load member profile using backend API with enhanced data handling
const loadProfile = async () => {
  if (!user?.email) return;

  try {
    setLoading(true);
    const token = getAccessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    // Try to get member by email
    const res = await axios.get(
      `https://church-management-api-p709.onrender.com/api/members/user/${user._id}`,
      { headers: { 'Content-Type': 'application/json', ...headers } }
    );
    
    console.log("isMember", res.data?.data);
    const member = res.data.data as any | undefined;
    console.log("member", member);
    
    if (!member) {
      setNeedsCreation(true);
      // Apply default values for new profile creation
      const defaultProfileData = applyProfileDefaults({
        fullname: "",
        email: user?.email || "",
        phone: "",
        address: "",
        date_of_birth: "1990-07-12",
        gender: "male",
        occupation: "",
        bio: "",
        genotype: "AA",
      });
      
      form.reset(defaultProfileData);
      return;
    }

    // If member exists, map and load with validation and defaults
    const rawProfileData: Partial<ProfileData> = {
      fullname: member.fullname || member.fullName || '',
      email: member.email || user?.email || '',
      phone: member.phone || '',
      address: member.address || '',
      date_of_birth: member.date_of_birth || '',
      gender: member.gender as "male" | "female" | "other" || undefined,
      occupation: member.occupation || '',
      bio: member.notes || '',
      genotype: member.genotype || '',
      emergency_contact_name: member.emergency_contact_name || '',
      emergency_contact_phone: member.emergency_contact_phone || '',
      emergency_contact_relationship: member.emergency_contact_relationship || '',
      city: member.city || '',
      state: member.state || '',
      postal_code: member.postal_code || '',
      country: member.country || '',
      baptism_date: member.baptism_date || '',
      baptism_location: member.baptism_location || '',
      is_baptized: member.is_baptized || false,
      preferred_contact_method: member.preferred_contact_method as "email" | "phone" | "sms" | "whatsapp" || undefined,
      marital_status: member.marital_status as "single" | "married" | "divorced" | "widowed" || undefined,
    };

    // Validate and sanitize the profile data
    const validation = validateAndSanitizeProfile(rawProfileData);
    
    if (validation.isValid && validation.data) {
      // Create the member profile with validated data
      const profileData: MemberProfile = {
        id: member._id,
        user_id: member.user_id || user._id || '',
        email: validation.data.email,
        fullname: validation.data.fullname,
        phone: validation.data.phone,
        address: validation.data.address,
        date_of_birth: validation.data.date_of_birth,
        gender: validation.data.gender,
        title: member.title,
        category: member.category,
        churchunit: member.church_unit,
        churchunits: [],
        assigned_pastor_name: undefined,
        joindate: member.join_date,
        created_at: member.created_at,
        updated_at: member.updated_at,
        bio: validation.data.bio,
        marital_status: validation.data.marital_status,
        occupation: validation.data.occupation,
        emergency_contact_name: validation.data.emergency_contact_name,
        emergency_contact_phone: validation.data.emergency_contact_phone,
        emergency_contact_relationship: validation.data.emergency_contact_relationship,
        city: validation.data.city,
        state: validation.data.state,
        postal_code: validation.data.postal_code,
        country: validation.data.country,
        baptism_date: validation.data.baptism_date,
        baptism_location: validation.data.baptism_location,
        is_baptized: validation.data.is_baptized,
        preferred_contact_method: validation.data.preferred_contact_method,
        genotype: validation.data.genotype,
      } as any;

      setProfile(profileData);
      form.reset(validation.data);
    } else {
      // If validation fails, apply defaults and show errors
      const profileWithDefaults = applyProfileDefaults(rawProfileData);
      const profileData: MemberProfile = {
        id: member._id,
        user_id: member.user_id || user._id || '',
        email: profileWithDefaults.email,
        fullname: profileWithDefaults.fullname,
        phone: profileWithDefaults.phone,
        address: profileWithDefaults.address,
        date_of_birth: profileWithDefaults.date_of_birth,
        gender: profileWithDefaults.gender,
        title: member.title,
        category: member.category,
        churchunit: member.church_unit,
        churchunits: [],
        assigned_pastor_name: undefined,
        joindate: member.join_date,
        created_at: member.created_at,
        updated_at: member.updated_at,
        bio: profileWithDefaults.bio,
      } as any;

      setProfile(profileData);
      form.reset(profileWithDefaults);
      
      // Show validation errors
      if (validation.errors && Object.keys(validation.errors).length > 0) {
        toast({
          title: "Profile Data Issues",
          description: "Some profile data needs attention. Please review and update.",
          variant: "destructive",
        });
      }
    }

  } catch (error) {
    console.error("Error loading profile:", error);
    toast({
      title: "Error",
      description: "Failed to load member profile.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


// Save profile changes via backend API with enhanced validation
const onSubmit = async (values: ProfileFormValues) => {
  if (!user || !profile) return;

  try {
    setSaving(true);
    
    // Validate and sanitize the form data
    const validation = validateAndSanitizeProfile(values);
    
    if (!validation.isValid) {
      // Show validation errors
      const errorMessages = Object.values(validation.errors).join(', ');
      toast({
        title: "Validation Error",
        description: `Please fix the following issues: ${errorMessages}`,
        variant: "destructive",
      });
      return;
    }

    const token = getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Use validated and sanitized data
    const sanitizedData = validation.data!;
    const payload: any = {
      fullname: sanitizedData.fullname,
      phone: sanitizedData.phone,
      address: sanitizedData.address,
      date_of_birth: sanitizedData.date_of_birth,
      gender: sanitizedData.gender,
      occupation: sanitizedData.occupation,
      notes: sanitizedData.bio,
      genotype: sanitizedData.genotype,
      emergency_contact_name: sanitizedData.emergency_contact_name,
      emergency_contact_phone: sanitizedData.emergency_contact_phone,
      emergency_contact_relationship: sanitizedData.emergency_contact_relationship,
      city: sanitizedData.city,
      state: sanitizedData.state,
      postal_code: sanitizedData.postal_code,
      country: sanitizedData.country,
      baptism_date: sanitizedData.baptism_date,
      baptism_location: sanitizedData.baptism_location,
      is_baptized: sanitizedData.is_baptized,
      preferred_contact_method: sanitizedData.preferred_contact_method,
      marital_status: sanitizedData.marital_status,
    };

    const res = await fetch(`https://church-management-api-p709.onrender.com/api/members/${profile.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to update profile');
    }

    toast({
      title: "Success",
      description: "Profile updated successfully with validated data",
    });
    setEditing(false);
    await loadProfile();
  } catch (error) {
    console.error("Error updating profile:", error);
    toast({
      title: "Error",
      description: "Failed to update profile",
      variant: "destructive",
    });
  } finally {
    setSaving(false);
  }
};


  useEffect(() => {
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen mt-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="text-center text-gray-700">Loading profile...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen mt-20 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-white pt-6 text-gray-900">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold font-sans">Create Your Member Profile</h1>
                <p className="text-gray-600 text-sm">Enter your details to continue</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground">
              We couldn’t find a profile for your account. Please provide a few details to get started.
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(async (values) => {
                  try {
                    setSaving(true);
                    
                    // Validate and sanitize the form data before creation
                    const profileData = {
                      ...values,
                      email: user?.email || '',
                    };
                    
                    const validation = validateAndSanitizeProfile(profileData);
                    
                    if (!validation.isValid) {
                      const errorMessages = Object.values(validation.errors).join(', ');
                      toast({
                        title: "Validation Error",
                        description: `Please fix the following issues: ${errorMessages}`,
                        variant: "destructive",
                      });
                      return;
                    }

                    const token = getAccessToken();
                    const headers: any = {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    };
                    
                    // Use validated and sanitized data
                    const sanitizedFormData = validation.data!;
                    const payload: any = {
                      fullname: sanitizedFormData.fullname,
                      email: sanitizedFormData.email,
                      user_id: (user as any)?._id || '',
                      phone: sanitizedFormData.phone,
                      address: sanitizedFormData.address,
                      date_of_birth: sanitizedFormData.date_of_birth ? new Date(sanitizedFormData.date_of_birth).toISOString() : "1990-07-12T00:00:00.000Z",
                      gender: sanitizedFormData.gender || "male",
                      genotype: sanitizedFormData.genotype || "AA",
                      category: createCategory || "adult",
                      title: createTitle || "Brother",
                      join_date: createJoinDate ? new Date(createJoinDate).toISOString() : "2023-09-15T00:00:00.000Z",
                    };
                    const res = await fetch('https://church-management-api-p709.onrender.com/api/members', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                      const text = await res.text();
                      throw new Error(text || 'Failed to create member');
                    }
                    const created = await res.json();
                    const m = created?.data;
                    const newProfileData: MemberProfile = {
                      id: m._id,
                      user_id: m.user_id || '',
                      email: m.email,
                      fullname: m.fullname || m.fullName || '',
                      phone: m.phone || '',
                      address: m.address || '',
                      date_of_birth: m.date_of_birth || '',
                      gender: m.gender || '',
                      title: m.title,
                      category: m.category || 'adult',
                      churchunit: m.church_unit,
                      churchunits: [],
                      assigned_pastor_name: undefined,
                      joindate: m.join_date,
                      created_at: m.created_at || new Date().toISOString(),
                      updated_at: m.updated_at || new Date().toISOString(),
                    } as any;
                    setProfile(newProfileData);
                    setNeedsCreation(false);
                    toast({ title: 'Profile created', description: 'Your member profile has been created.' });
                  } catch (err) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to create profile' });
                  } finally {
                    setSaving(false);
                  }
                })}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="fullname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled className="bg-muted" />
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+2348000000000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genotype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genotype</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AA" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Your address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <Label>Title</Label>
                    <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="Brother" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={createCategory} onChange={(e) => setCreateCategory(e.target.value)} placeholder="adult" />
                  </div>
                  <div>
                    <Label>Join Date</Label>
                    <Input type="date" value={createJoinDate} onChange={(e) => setCreateJoinDate(e.target.value)} />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#ff0000] to-red-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {saving ? 'Creating...' : 'Create Profile'}
                </button>
              </form>
            </Form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-28 max-w-4xl">
      {/* Profile Completion Prompt */}
      {profile && (
        <ProfileCompletionPrompt
          profileData={{
            fullname: profile.fullname || '',
            email: profile.email || '',
            phone: profile.phone,
            address: profile.address,
            date_of_birth: profile.date_of_birth,
            gender: profile.gender as "male" | "female" | "other" | undefined,
            marital_status: profile.marital_status as "single" | "married" | "divorced" | "widowed" | undefined,
            occupation: profile.occupation,
            bio: profile.bio,
            emergency_contact_name: profile.emergency_contact_name,
            emergency_contact_phone: profile.emergency_contact_phone,
            emergency_contact_relationship: profile.emergency_contact_relationship,
            city: profile.city,
            state: profile.state,
            postal_code: profile.postal_code,
            country: profile.country,
            baptism_date: profile.baptism_date,
            baptism_location: profile.baptism_location,
            is_baptized: profile.is_baptized,
            preferred_contact_method: profile.preferred_contact_method as "email" | "phone" | "sms" | "whatsapp" | undefined,
            genotype: profile.genotype,
            skills_talents: profile.skills_talents || [],
            interests: profile.interests || [],
          }}
          onEditProfile={() => setEditing(true)}
          showDetailed={!editing}
          className="mb-6"
        />
      )}

      {/* Header */}
      <div className="space-y-2 md:space-y-0 md:flex md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-sans font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and church details
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  form.reset();
                }}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-sans items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed here
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!editing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!editing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={!editing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Church Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-sans items-center gap-2">
                <Church className="w-5 h-5" />
                Church Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={profile.category === 'Pastors' ? 'default' : 'secondary'}>
                      {profile.category}
                    </Badge>
                    {profile.is_super_admin && (
                      <Badge variant="destructive">
                        <Shield className="w-3 h-3 mr-1" />
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Category can only be changed by administrators
                  </p>
                </div>

                <div>
                  <Label>Church Units</Label>
                  <div className="mt-1">
                    {profile.churchunits && profile.churchunits.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.churchunits.map((unit, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {unit}
                          </Badge>
                        ))}
                      </div>
                    ) : profile.churchunit ? (
                      <Badge variant="outline" className="text-xs">
                        {profile.churchunit}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not assigned to any unit</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Church unit assignments are managed by administrators
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Assigned Pastor</Label>
                  <Input
                    value={getProfileFieldDisplay(profile.assigned_pastor_name, 'assigned_pastor_name' as keyof ProfileData, "Not assigned")}
                    disabled
                    className="bg-muted mt-1"
                  />
                </div>

                <div>
                  <Label>Join Date</Label>
                  <Input
                    value={profile.joindate ? new Date(profile.joindate).toLocaleDateString() : "Not set"}
                    disabled
                    className="bg-muted mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional & Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-sans items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional & Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!editing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!editing}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="genotype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genotype</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} placeholder="e.g., AA, AS, SS" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_contact_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!editing}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-sans items-center gap-2">
                <Heart className="w-5 h-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="emergency_contact_relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!editing} placeholder="e.g., Spouse, Parent, Sibling" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex font-sans items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!editing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex font-sans items-center gap-2">
                <Users className="w-5 h-5" />
                Spiritual Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_baptized"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Baptized</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Have you been baptized?
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={!editing}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baptism_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Baptism Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={!editing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="baptism_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baptism Location</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!editing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Member Since</Label>
                  <Input
                    value={new Date(profile.created_at).toLocaleDateString()}
                    disabled
                    className="bg-muted mt-1"
                  />
                </div>

                <div>
                  <Label>Last Updated</Label>
                  <Input
                    value={new Date(profile.updated_at).toLocaleDateString()}
                    disabled
                    className="bg-muted mt-1"
                  />
                </div>
              </div>

              {profile.roles && profile.roles.length > 0 && (
                <div>
                  <Label>System Roles</Label>
                  <div className="flex gap-2 mt-1">
                    {profile.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};