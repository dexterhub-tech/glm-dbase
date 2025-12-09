
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, MemberFormValues } from "@/types/member";
import { useToast } from "@/hooks/use-toast";
import { Member } from "@/types/member";
import { MemberFormFields } from "./MemberFormFields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onEditMember: (member: MemberFormValues) => void;
  pastors: { id: string; fullName: string }[];
}

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  onEditMember,
  pastors
}: EditMemberDialogProps) {
  const { toast } = useToast();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      fullname: "",
      email: "",
      phone: "",
      address: "",
      genotype: "",
      category: "Members",
      title: "",
      assignedto: "",
      churchunit: "",
      churchunits: [],
      auxanogroup: "",
      notes: "",
      isactive: true,
      role: "user",
    },
  });

  useEffect(() => {
    if (member && open) {
      form.reset({
        fullname: member.fullname || member.fullName || "",
        email: member.email,
        phone: member.phone || "",
        address: member.address || "",
        genotype: member.genotype || "",
        category: member.category,
        title: member.title || "",
        assignedto: member.assignedto || member.assignedTo || "",
        churchunit: member.churchunit || member.churchUnit || "",
        churchunits: member.churchunits || member.churchUnits || [],
        auxanogroup: member.auxanogroup || member.auxanoGroup || "",
        notes: member.notes || "",
        isactive: member.isactive !== undefined ? member.isactive : member.isActive !== undefined ? member.isActive : true,
        role: member.role || "user",
      });
    }
  }, [member, open, form]);

  const handleEditMember = async (values: MemberFormValues) => {
    try {
      onEditMember(values);

      toast({
        title: "Member updated successfully",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating member",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEditMember)} className="space-y-3">
            <MemberFormFields control={form.control} pastors={pastors} />
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
