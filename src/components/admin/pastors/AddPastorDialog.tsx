import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, UserCog } from "lucide-react";

// Define the form schema with validation
const pastorFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  title: z.string().optional(),
  churchUnit: z.string().optional(),
  auxanoGroup: z.string().optional(),
});

type PastorFormValues = z.infer<typeof pastorFormSchema>;

interface AddPastorDialogProps {
  onPastorAdded: () => void;
}

export function AddPastorDialog({ onPastorAdded }: AddPastorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFound, setUserFound] = useState(false);
  const [foundUserName, setFoundUserName] = useState("");
  const { toast } = useToast();

  const form = useForm<PastorFormValues>({
    resolver: zodResolver(pastorFormSchema),
    defaultValues: {
      email: "",
      title: "",
      churchUnit: "none",
      auxanoGroup: "none",
    },
  });

  const churchUnits = OFFICIAL_CHURCH_UNITS;

  const auxanoGroups = [
    { id: "group_a", name: "Group A" },
    { id: "group_b", name: "Group B" },
    { id: "group_c", name: "Group C" },
    { id: "group_d", name: "Group D" },
  ];

  // Check if the user exists when email field changes
  const checkUserExists = async (email: string) => {
    if (!email || !email.includes('@')) return;

    try {
      // First check if the user exists in auth or profiles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email.toLowerCase());

      // If no user found in profiles, we'll create one later
      const userExists = !userError && userData && userData.length > 0;

      // Check if the user is already a pastor
      const { data: pastorData, error: pastorError } = await supabase
        .from('members')
        .select('id, category')
        .eq('email', email.toLowerCase());

      // Check if the user is already a pastor
      const isPastor = !pastorError && pastorData && pastorData.length > 0 &&
                      pastorData.some(member => member.category === 'Pastors');

      if (isPastor) {
        toast({
          variant: "destructive",
          title: "User is already a pastor",
          description: "This user is already registered as a pastor in the system.",
        });
        setUserFound(false);
        setFoundUserName("");
        return;
      }

      // Check if the user exists in members table but is not a pastor
      const existsAsMember = !pastorError && pastorData && pastorData.length > 0;

      // User is not already a pastor, so we can proceed
      setUserFound(true);

      // If user exists in profiles, use their name
      if (userExists) {
        setFoundUserName(userData[0].full_name || email);
      } else if (existsAsMember) {
        // If user exists in members but not profiles, we'll update their category
        const { data: memberData } = await supabase
          .from('members')
          .select('fullname')
          .eq('email', email.toLowerCase())
          .single();

        setFoundUserName(memberData?.fullname || email);
      } else {
        // Extract name from email for new users
        const nameFromEmail = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
        const formattedName = nameFromEmail
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setFoundUserName(`New user: ${formattedName}`);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setUserFound(false);
      setFoundUserName("");
    }
  };

  const onSubmit = async (values: PastorFormValues) => {
    if (!userFound) {
      toast({
        variant: "destructive",
        title: "User not found",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if user exists in profiles
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', values.email.toLowerCase());

      let fullName = '';
      let userId = '';

      // If user doesn't exist in profiles, create a new user
      if (userError || !userData || userData.length === 0) {
        // Extract name from email
        const nameFromEmail = values.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
        fullName = nameFromEmail
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // Generate a random password for the new user
        const randomPassword = Math.random().toString(36).slice(-10);

        // Create user in auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: randomPassword,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Failed to create user account");
        }

        userId = authData.user.id;

        // Create profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: values.email.toLowerCase(),
            full_name: fullName,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Continue anyway as we have the user ID
        }
      } else {
        // Use existing user data
        fullName = userData[0].full_name || values.email;
        userId = userData[0].id;
      }

      // Create a new member record with category "Pastors"
      // First check if the user already exists in the members table
      const { data: existingMember, error: existingMemberError } = await supabase
        .from('members')
        .select('id')
        .eq('email', values.email.toLowerCase());

      if (existingMemberError) {
        console.error("Error checking existing member:", existingMemberError);
      }

      let data, error;

      if (existingMember && existingMember.length > 0) {
        // Update the existing member record
        const { data: updateData, error: updateError } = await supabase
          .from('members')
          .update({
            fullname: fullName,
            category: "Pastors",
            title: values.title || null,
            churchunit: values.churchUnit === "none" ? null : values.churchUnit,
            auxanogroup: values.auxanoGroup === "none" ? null : values.auxanoGroup,
            isactive: true,
            userid: userId || null, // Use null if userId is empty
          })
          .eq('id', existingMember[0].id)
          .select();

        data = updateData;
        error = updateError;
      } else {
        // Insert a new member record
        const { data: insertData, error: insertError } = await supabase
          .from('members')
          .insert([
            {
              fullname: fullName,
              email: values.email.toLowerCase(),
              category: "Pastors",
              title: values.title || null,
              churchunit: values.churchUnit === "none" ? null : values.churchUnit,
              auxanogroup: values.auxanoGroup === "none" ? null : values.auxanoGroup,
              joindate: new Date().toISOString().split('T')[0],
              isactive: true,
              userid: userId || null, // Use null if userId is empty
            }
          ])
          .select();

        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Pastor added successfully",
        description: `${fullName} has been added as a pastor.`,
      });

      onPastorAdded();
      setOpen(false);
      form.reset();
      setUserFound(false);
      setFoundUserName("");
    } catch (error: any) {
      console.error("Error adding pastor:", error);
      toast({
        variant: "destructive",
        title: "Error adding pastor",
        description: error.message || "An error occurred while adding the pastor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Pastor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Pastor</DialogTitle>
          <DialogDescription>
            Add a pastor from existing registered users by entering their email address.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="pastor@example.com"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        checkUserExists(e.target.value);
                      }}
                    />
                  </FormControl>
                  {userFound && (
                    <div className="text-sm text-green-600 flex items-center gap-1 mt-1">
                      <UserCog className="h-3 w-3" />
                      User found: {foundUserName}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Pastor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="churchUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Church Unit (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select church unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {churchUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auxanoGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auxano Group (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Auxano group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {auxanoGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !userFound}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Pastor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
