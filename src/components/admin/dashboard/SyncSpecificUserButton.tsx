import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncSpecificUser } from "@/utils/syncSpecificUser";

interface SyncSpecificUserButtonProps {
  email: string;
  onSyncComplete?: () => void;
}

export function SyncSpecificUserButton({ email, onSyncComplete }: SyncSpecificUserButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      console.log(`Syncing specific user: ${email}`);
      const result = await syncSpecificUser(email);
      console.log("Sync result:", result);
      
      if (result.success) {
        // Always call onSyncComplete to refresh the UI
        if (onSyncComplete) {
          console.log("Calling onSyncComplete to refresh data");
          onSyncComplete();
        }
        
        // Show success toast
        toast({
          title: "User synced",
          description: result.message,
        });
      } else {
        console.error("Sync failed:", result);
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error("Exception during sync:", error);
      toast({
        variant: "destructive",
        title: "Sync error",
        description: error.message || "An error occurred during sync",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-2"
    >
      {isSyncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isSyncing ? "Syncing..." : `Sync User: ${email}`}
    </Button>
  );
}
