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
const addMemberToUnitSchema = z.object({
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

type AddMemberToUnitFormValues = z.infer<typeof addMemberToUnitSchema>;

interface AddMemberToUnitDialogProps {
  unitId: string;
  unitName: string;
  onMemberAdded: () => void;
}

export function AddMemberToUnitDialog({ unitId, unitName, onMemberAdded }: AddMemberToUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddMemberToUnitFormValues>({
    resolver: zodResolver(addMemberToUnitSchema),
    defaultValues: {
      memberId: "",
      memberEmail: "",
      useEmail: false,
    },
  });

  // Fetch available members (not already in this unit)
  const fetchAvailableMembers = async () => {
    setIsLoading(true);
    try {
      // Get all members who are not already in this unit
      const { data, error } = await supabase
        .from('members')
        .select('id, fullname, email, churchunit, churchunits')
        .neq('category', 'Pastors');

      if (error) throw error;

      // Filter out members who are already in this unit
      const filteredMembers = (data || []).filter(member => {
        const memberUnits = member.churchunits || [];
        const memberUnit = member.churchunit;
        
        // Check if member is already in this unit
        return !memberUnits.includes(unitId) && memberUnit !== unitId;
      });

      setAvailableMembers(filteredMembers.map(member => ({
        id: member.id,
        fullName: member.fullname || '',
        email: member.email || ''
      })));
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

  const onSubmit = async (values: AddMemberToUnitFormValues) => {
    setIsSubmitting(true);
    try {
      if (values.useEmail && values.memberEmail) {
        // Using email to add member to unit
        // First check if member exists
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, fullname, email, churchunit, churchunits')
          .eq('email', values.memberEmail.toLowerCase());

        if (memberError) throw memberError;

        if (!memberData || memberData.length === 0) {
          // Member doesn't exist, create a new one and add to unit
          const nameFromEmail = values.memberEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
          const fullName = nameFromEmail
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Create new member with unit assignment
          const { error: insertError } = await supabase
            .from('members')
            .insert([
              {
                fullname: fullName,
                email: values.memberEmail.toLowerCase(),
                category: 'Members',
                churchunit: unitId,
                churchunits: [unitId],
                isactive: true,
                joindate: new Date().toISOString().split('T')[0],
              }
            ]);

          if (insertError) throw insertError;

          toast({
            title: "New member created and added to unit",
            description: `${fullName} has been created and added to ${unitName}.`,
          });
        } else {
          // Member exists, add them to this unit
          const member = memberData[0];
          const currentUnits = member.churchunits || [];
          const updatedUnits = [...currentUnits, unitId];

          const { error: updateError } = await supabase
            .from('members')
            .update({ 
              churchunit: unitId, // Set primary unit
              churchunits: updatedUnits // Add to units array
            })
            .eq('email', values.memberEmail.toLowerCase());

          if (updateError) throw updateError;

          toast({
            title: "Member added to unit successfully",
            description: `${member.fullname} has been added to ${unitName}.`,
          });
        }
      } else {
        // Using dropdown selection
        // Get the selected member's current units
        const { data: memberData, error: fetchError } = await supabase
          .from('members')
          .select('churchunit, churchunits, fullname')
          .eq('id', values.memberId)
          .single();

        if (fetchError) throw fetchError;

        const currentUnits = memberData.churchunits || [];
        const updatedUnits = [...currentUnits, unitId];

        // Update the member to add them to this unit
        const { error } = await supabase
          .from('members')
          .update({ 
            churchunit: unitId, // Set as primary unit
            churchunits: updatedUnits // Add to units array
          })
          .eq('id', values.memberId);

        if (error) throw error;

        toast({
          title: "Member added to unit successfully",
          description: `${memberData.fullname} has been added to ${unitName}.`,
        });
      }

      onMemberAdded();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error adding member to unit:", error);
      toast({
        variant: "destructive",
        title: "Error adding member to unit",
        description: error.message || "An error occurred while adding the member to the unit.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member to Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Member to {unitName}</DialogTitle>
          <DialogDescription>
            Add a member to the {unitName} unit.
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
                  <FormLabel>Add by email address</FormLabel>
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
                    Adding...
                  </>
                ) : (
                  "Add to Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}