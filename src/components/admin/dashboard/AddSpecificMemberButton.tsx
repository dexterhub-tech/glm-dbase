import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addSpecificMember } from "@/utils/addSpecificMember";

interface AddSpecificMemberButtonProps {
  onComplete?: () => void;
}

export function AddSpecificMemberButton({ onComplete }: AddSpecificMemberButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      console.log("Adding specific member");
      const result = await addSpecificMember();
      console.log("Add result:", result);
      
      if (result.success) {
        // Always call onComplete to refresh the UI
        if (onComplete) {
          console.log("Calling onComplete to refresh data");
          onComplete();
        }
        
        // Show success toast
        toast({
          title: result.existing ? "Member already exists" : "Member added",
          description: result.message,
        });
      } else {
        console.error("Add failed:", result);
        toast({
          variant: "destructive",
          title: "Add failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error("Exception during add:", error);
      toast({
        variant: "destructive",
        title: "Add error",
        description: error.message || "An error occurred during add",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAdd}
      disabled={isAdding}
      className="flex items-center gap-2"
    >
      {isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isAdding ? "Adding..." : "Add Samuel Adeyemi"}
    </Button>
  );
}
