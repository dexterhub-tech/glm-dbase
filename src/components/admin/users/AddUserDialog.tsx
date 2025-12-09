
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "@/utils/createUserProfile";
import { addUserRoleSafe } from "@/utils/roleManagement";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const addUserSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().min(2, { message: "Full name is required" }),
  isAdmin: z.boolean().optional(),
});

type AddUserDialogProps = {
  onUserAdded: () => void;
};

const AddUserDialog = ({ onUserAdded }: AddUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const addForm = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      isAdmin: false,
    },
  });

  const handleAddUser = async (values: z.infer<typeof addUserSchema>) => {
    try {
      // First, create the user in Supabase Auth using signUp instead of admin.createUser
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      // If the user should be an admin, add them to the user_roles table using our safe method
      if (values.isAdmin && authData.user) {
        const result = await addUserRoleSafe(authData.user.id, "admin");
        if (!result.success) {
          throw result.error || new Error("Failed to add admin role");
        }
      }

      // Create profile record if it doesn't exist
      if (authData.user) {
        // Use our utility function to create the profile
        const profileResult = await createUserProfile(
          authData.user.id,
          values.email,
          values.fullName
        );

        if (!profileResult.success) {
          console.error("Error creating profile:", profileResult.message);
          // Continue anyway as the user was created
        } else {
          console.log("Profile created successfully");
        }
      }

      toast({
        title: "User created successfully",
      });

      setOpen(false);
      addForm.reset();
      onUserAdded(); // Refresh the user list

      // Force a page refresh after a short delay to ensure everything is updated
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Error creating user:", error);

      // Provide more specific error messages based on the error
      let errorMsg = "Failed to create user. Please try again.";

      if (error.message) {
        if (error.message.includes("duplicate key")) {
          errorMsg = "A user with this email already exists.";
        } else if (error.message.includes("database")) {
          errorMsg = "Database error. Please try again or contact support if the issue persists.";
        } else {
          errorMsg = error.message;
        }
      }

      // If we have a Supabase error code, log it for debugging
      if (error.code) {
        console.error("Error code:", error.code);
      }

      // If we have detailed error information, log it
      if (error.details) {
        console.error("Error details:", error.details);
      }

      toast({
        variant: "destructive",
        title: "Error creating user",
        description: errorMsg,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. Provide their email, password, and name.
          </DialogDescription>
        </DialogHeader>
        <Form {...addForm}>
          <form onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-4">
            <FormField
              control={addForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addForm.control}
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
              control={addForm.control}
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
                  <FormLabel>Make user an admin</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
