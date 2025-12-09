import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus } from "lucide-react";

// Define the form schema with validation
const assignMemberSchema = z.object({
  memberId: z.string().optional(),
  memberEmail: z.string().email({ message: "Please enter a valid email address" }).optional(),
  useEmail: z.boolean().default(false),
}).refine((data) => {
  if (data.useEmail) {
    return data.memberEmail && data.memberEmail.length > 0;
  } else {
    return data.memberId && data.memberId.length > 0;
  }
}, {
  message: "Please select a member or enter an email address",
  path: ["memberId"], // This will show the error on the memberId field
});

type AssignMemberFormValues = z.infer<typeof assignMemberSchema>;

interface AssignMemberDialogProps {
  pastorId: string;
  pastorName: string;
  onMemberAssigned: () => void;
}

export function AssignMemberDialog({ pastorId, pastorName, onMemberAssigned }: AssignMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AssignMemberFormValues>({
    resolver: zodResolver(assignMemberSchema),
    defaultValues: {
      memberId: "",
      memberEmail: "",
      useEmail: false,
    },
  });

  // Fetch available members (not assigned to any pastor)
  const fetchAvailableMembers = async () => {
    setIsLoading(true);
    try {
      // Get members who are not pastors and not assigned to any pastor
      const { data, error } = await supabase
        .from('members')
        .select('id, fullname, email')
        .not('category', 'eq', 'Pastors')
        .is('assignedto', null);

      if (error) throw error;

      // Transform the data to match the expected interface
      const transformedMembers = (data || []).map((member: any) => ({
        id: member.id,
        fullName: member.fullname,
        email: member.email
      }));
      setAvailableMembers(transformedMembers);
    } catch (error: any) {
      console.error("Error fetching available members:", error);
      toast({
        variant: "destructive",
        title: "Error fetching members",
        description: error.message || "An error occurred while fetching available members.",
      });
      setAvailableMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch members when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableMembers();
    }
  }, [open]);

  const onSubmit = async (values: AssignMemberFormValues) => {
    setIsSubmitting(true);
    try {
      if (values.useEmail && values.memberEmail) {
        // Using email to assign member
        // First check if member exists
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, fullname, email')
          .eq('email', values.memberEmail.toLowerCase());

        if (memberError) throw memberError;

        if (!memberData || memberData.length === 0) {
          // Member doesn't exist, create a new one
          const nameFromEmail = values.memberEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
          const fullName = nameFromEmail
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Create new member
          const { error: insertError } = await supabase
            .from('members')
            .insert([
              {
                fullname: fullName,
                email: values.memberEmail.toLowerCase(),
                category: 'Others', // Default category
                assignedto: pastorId,
                isactive: true,
                joindate: new Date().toISOString().split('T')[0],
              }
            ])
            .select();

          if (insertError) throw insertError;

          toast({
            title: "New member created and assigned",
            description: `${fullName} has been created and assigned to ${pastorName}.`,
          });
        } else {
          // Member exists, update assignedto field
          const { error: updateError } = await supabase
            .from('members')
            .update({ assignedto: pastorId })
            .eq('email', values.memberEmail.toLowerCase());

          if (updateError) throw updateError;

          toast({
            title: "Member assigned successfully",
            description: `${memberData[0].fullname} has been assigned to ${pastorName}.`,
          });
        }
      } else {
        // Using dropdown selection
        // Update the member to assign them to this pastor
        const { error } = await supabase
          .from('members')
          .update({ assignedto: pastorId })
          .eq('id', values.memberId);

        if (error) throw error;

        toast({
          title: "Member assigned successfully",
          description: `Member has been assigned to ${pastorName}.`,
        });
      }

      onMemberAssigned();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error assigning member:", error);
      toast({
        variant: "destructive",
        title: "Error assigning member",
        description: error.message || "An error occurred while assigning the member.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Assign Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Member to Pastor</DialogTitle>
          <DialogDescription>
            Assign a member to {pastorName} for pastoral care.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="useEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Assign by email address</FormLabel>
                </FormItem>
              )}
            />

            {form.watch("useEmail") ? (
              <FormField
                control={form.control}
                name="memberEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="member@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Member</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </div>
                        ) : availableMembers.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No available members found
                          </div>
                        ) : (
                          availableMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.fullName} ({member.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting || (isLoading && !form.watch("useEmail"))}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
