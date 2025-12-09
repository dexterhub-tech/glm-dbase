
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type AdminUser } from "./types";
import { useAuth } from "@/contexts/AuthContext";
import { MultipleChurchUnitsSelect } from "../../admin/members/MultipleChurchUnitsSelect";
import { addUserRoleSafe, removeUserRoleSafe } from "@/utils/roleManagement";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const editUserSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  isAdmin: z.boolean().optional(),
  churchUnits: z.array(z.string()).optional(),
  churchUnit: z.string().optional(), // Legacy field
  assignedPastor: z.string().optional(),
  phone: z.string().optional(),
  genotype: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["user", "admin", "superuser"]).optional(),
});

type EditUserDialogProps = {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
};

const EditUserDialog = ({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) => {
  const { toast } = useToast();
  const { isSuperUser } = useAuth();

  const editForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      isAdmin: false,
      churchUnits: [],
      churchUnit: "",
      assignedPastor: "",
      phone: "",
      genotype: "",
      address: "",
      role: "user",
    },
  });

  const pastors = [
    { id: "timileyin_fadeyi", name: "Timileyin Fadeyi" },
    { id: "samuel_friday", name: "Samuel Friday" },
    { id: "femi_fatoyinbo", name: "Femi Fatoyinbo" },
    { id: "igbalaye_olajide", name: "Igbalaye Olajide" },
    { id: "olaiya_sunday", name: "Olaiya Sunday" },
  ];

  useEffect(() => {
    if (user && open) {
      // Get user metadata
      const getUserMetadata = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user metadata:", error);
          return;
        }

        // Check if the user is an admin
        const isAdmin = await checkUserRole(user.id);

        // Get user metadata from auth
        const { data: authData } = await supabase.auth.admin.getUserById(user.id);
        const metadata = authData?.user?.user_metadata;

        // Determine role
        let role = "user";
        if (isAdmin) role = "admin";
        if (user.email === "ojidelawrence@gmail.com") role = "superuser";

        // Get church units (either from metadata or convert single unit to array)
        const churchUnits = metadata?.church_units ||
          (metadata?.church_unit ? [metadata.church_unit] : []);

        editForm.reset({
          fullName: user.full_name || "",
          isAdmin,
          churchUnits,
          churchUnit: metadata?.church_unit || "",
          assignedPastor: metadata?.assigned_pastor || "",
          phone: data?.phone || "",
          genotype: data?.genotype || "",
          address: data?.address || "",
          role,
        });
      };

      getUserMetadata();
    }
  }, [user, open, editForm]);

  const checkUserRole = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (error) {
      console.error("Error checking user role:", error);
      return false;
    }

    return data && data.length > 0;
  };

  const handleEditUser = async (values: z.infer<typeof editUserSchema>) => {
    if (!user) return;

    try {
      // Update the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: values.fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Check if the user is currently an admin
      const isCurrentlyAdmin = await checkUserRole(user.id);

      // Handle admin role changes
      if (values.isAdmin && !isCurrentlyAdmin) {
        // Add admin role using our safe method
        const result = await addUserRoleSafe(user.id, "admin");
        if (!result.success) {
          throw result.error || new Error("Failed to add admin role");
        }
      } else if (!values.isAdmin && isCurrentlyAdmin) {
        // Remove admin role using our safe method
        const result = await removeUserRoleSafe(user.id, "admin");
        if (!result.success) {
          throw result.error || new Error("Failed to remove admin role");
        }
      }

      // If superuser, update user metadata and profile
      if (isSuperUser) {
        // Process metadata values
        const processedAssignedPastor = values.assignedPastor === "none" ? null : values.assignedPastor || null;

        // Update user metadata
        const { error: metadataError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              // Handle both camelCase and lowercase column names
              church_units: values.churchUnits || [],
              church_unit: values.churchUnits && values.churchUnits.length > 0 ? values.churchUnits[0] : null,
              churchunits: values.churchUnits || [],
              churchunit: values.churchUnits && values.churchUnits.length > 0 ? values.churchUnits[0] : null,
              assigned_pastor: processedAssignedPastor,
            }
          }
        );

        if (metadataError) throw metadataError;

        // Process form values
        const processedValues = {
          phone: values.phone || null,
          genotype: values.genotype === "none" ? null : values.genotype || null,
          address: values.address || null,
          updated_at: new Date().toISOString()
        };

        console.log("Updating user profile with values:", processedValues);

        // Update profile with additional fields
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update(processedValues)
          .eq("id", user.id);

        if (profileUpdateError) throw profileUpdateError;
      }

      toast({
        title: "User updated successfully",
      });

      onOpenChange(false);
      onUserUpdated(); // Refresh the user list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
            <FormField
              control={editForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel>Admin privileges</FormLabel>
                </FormItem>
              )}
            />

            {isSuperUser && (
              <>
                <FormField
                  control={editForm.control}
                  name="churchUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Church Units</FormLabel>
                      <FormControl>
                        <MultipleChurchUnitsSelect
                          value={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="genotype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genotype</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genotype" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not Specified</SelectItem>
                          <SelectItem value="AA">AA</SelectItem>
                          <SelectItem value="AS">AS</SelectItem>
                          <SelectItem value="SS">SS</SelectItem>
                          <SelectItem value="AC">AC</SelectItem>
                          <SelectItem value="SC">SC</SelectItem>
                          <SelectItem value="CC">CC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editForm.watch('churchUnit') === 'auxano' && (
                  <FormField
                    control={editForm.control}
                    name="assignedPastor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Pastor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a pastor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {pastors.map((pastor) => (
                              <SelectItem key={pastor.id} value={pastor.id}>
                                {pastor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
