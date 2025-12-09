import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { addSuperAdminByEmail, SuperAdmin, listSuperAdmins, removeSuperAdmin } from "./SuperAdminService";
import { Shield, UserPlus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Schema for adding a super admin
const superAdminSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

interface SuperAdminDialogProps {
  onSuperAdminAdded?: () => void;
}

const SuperAdminDialog = ({ onSuperAdminAdded }: SuperAdminDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof superAdminSchema>>({
    resolver: zodResolver(superAdminSchema),
    defaultValues: {
      email: "",
    },
  });

  // Load super admins when dialog opens
  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      await loadSuperAdmins();
    }
  };

  // Load the list of super admins
  const loadSuperAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { superAdmins, error } = await listSuperAdmins();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading super admins",
          description: error.message,
        });
      } else {
        setSuperAdmins(superAdmins);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading super admins",
        description: error.message,
      });
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Handle form submission
  const handleAddSuperAdmin = async (values: z.infer<typeof superAdminSchema>) => {
    setLoading(true);
    try {
      const result = await addSuperAdminByEmail(values.email);

      if (result.success) {
        toast({
          title: "Super admin added",
          description: result.message,
        });
        form.reset();
        await loadSuperAdmins();

        // Close the dialog
        setOpen(false);

        // Call the callback to refresh the parent component
        if (onSuperAdminAdded) {
          onSuperAdminAdded();
        }

        // Force a page refresh after a short delay to ensure everything is updated
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast({
          variant: "destructive",
          title: "Error adding super admin",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding super admin",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a super admin
  const handleRemoveSuperAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this super admin?")) {
      return;
    }

    try {
      const result = await removeSuperAdmin(userId);

      if (result.success) {
        toast({
          title: "Super admin removed",
          description: result.message,
        });
        await loadSuperAdmins();

        // Call the callback to refresh the parent component
        if (onSuperAdminAdded) {
          onSuperAdminAdded();
        }

        // Force a page refresh after a short delay to ensure everything is updated
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast({
          variant: "destructive",
          title: "Error removing super admin",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing super admin",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Shield className="mr-2 h-4 w-4" />
          Manage Super Admins
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Super Admin Management</DialogTitle>
          <DialogDescription>
            Super admins have full access to all system features and can manage other administrators.
          </DialogDescription>
        </DialogHeader>

        <Alert className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Super admins have unrestricted access to the entire system. Only add trusted individuals.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddSuperAdmin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Adding..." : "Add Super Admin"}
            </Button>
          </form>
        </Form>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Super Admins</CardTitle>
            <CardDescription>
              Users with super admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAdmins ? (
              <div className="text-center py-4">Loading...</div>
            ) : superAdmins.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No super admins found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superAdmins.map((admin) => (
                    <TableRow key={admin.user_id}>
                      <TableCell>{admin.full_name || 'N/A'}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSuperAdmin(admin.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuperAdminDialog;
