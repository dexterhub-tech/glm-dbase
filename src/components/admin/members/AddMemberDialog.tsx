
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { UserPlus } from "lucide-react";

interface AddMemberDialogProps {
  onAddMember: (member: Member) => void;
  pastors: { id: string; fullName: string }[];
}

export function AddMemberDialog({ onAddMember, pastors }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
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

  const handleAddMember = async (values: MemberFormValues) => {
    try {
      // In a real app, you would add the member to Supabase here
      const newMember: Member = {
        id: Date.now().toString(), // use UUID in real app
        fullname: values.fullname,
        email: values.email,
        phone: values.phone,
        address: values.address,
        genotype: values.genotype,
        category: values.category,
        title: values.title,
        assignedto: values.assignedto,
        churchunit: values.churchunit,
        churchunits: values.churchunits,
        auxanogroup: values.auxanogroup,
        joindate: values.joindate || new Date().toISOString().split('T')[0],
        notes: values.notes,
        isactive: values.isactive,
        role: values.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      onAddMember(newMember);

      toast({
        title: "Member added successfully",
      });

      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding member",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddMember)} className="space-y-3">
            <MemberFormFields control={form.control} pastors={pastors} />
            <DialogFooter>
              <Button type="submit">Add Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
