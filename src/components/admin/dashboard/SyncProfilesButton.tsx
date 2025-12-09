import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncProfilesToMembers } from "@/utils/syncProfilesToMembers";
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query-config';
// Note: Diagnostic tools may need to be updated for consolidated structure
// import { checkProfileMemberSync, manualSyncProfileToMember } from "@/utils/diagnosticTools";

interface SyncProfilesButtonProps {
  onSyncComplete?: () => void;
}

export function SyncProfilesButton({ onSyncComplete }: SyncProfilesButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSync = async () => {
    // Prevent multiple clicks
    if (isSyncing) return;

    setIsSyncing(true);

    // Set a timeout to ensure the button doesn't stay in loading state forever
    const syncTimeout = setTimeout(() => {
      console.log("Sync operation timed out after 45 seconds");
      setIsSyncing(false);
      toast({
        variant: "destructive",
        title: "Sync timed out",
        description: "The operation took too long. Please try again.",
      });
    }, 45000); // 45 second timeout

    try {
      // Start the sync process with consolidated structure
      console.log("Starting sync process with consolidated structure...");
      const result = await syncProfilesToMembers();
      console.log("Consolidated sync result:", result);

      // Check if the result indicates consolidated structure usage
      if (result.consolidatedStructure) {
        console.log("Sync completed using consolidated database structure");
      }

      // Clear the timeout since we got a response
      clearTimeout(syncTimeout);

      if (result.success) {
        // Invalidate all member-related queries to force a refresh
        console.log("Invalidating all member queries to force data refresh");
        await queryClient.invalidateQueries({ queryKey: queryKeys.members.all });

        // Call onSyncComplete to refresh the data
        if (onSyncComplete) {
          console.log("Calling onSyncComplete to refresh data");
          onSyncComplete();
        }

        // Show success toast
        toast({
          title: "Sync completed",
          description: result.message,
        });

        // Always do an aggressive refresh to ensure we see the latest data
        console.log("Performing additional data refresh steps");

        // Invalidate all queries to ensure everything is fresh
        await queryClient.invalidateQueries();

        // Call onSyncComplete again after a short delay
        setTimeout(() => {
          console.log("Calling onSyncComplete again to ensure data is refreshed");
          if (onSyncComplete) {
            onSyncComplete();
          }

          // Force a page refresh after a short delay as a last resort
          // This ensures the UI shows the latest data from the database
          setTimeout(() => {
            console.log("Forcing page refresh to ensure all data is updated");
            window.location.reload();
          }, 1000);
        }, 2000);
      } else {
        console.error("Sync failed:", result);
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: result.message,
        });
      }

      // If there were errors during sync, log them
      if (result.errors && result.errors.length > 0) {
        console.error("Errors during sync:", result.errors);
      }
    } catch (error: any) {
      // Clear the timeout since we got a response (even if it's an error)
      clearTimeout(syncTimeout);

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
      variant="default"
      size="sm"
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
    >
      {isSyncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {isSyncing ? "Syncing to Consolidated Table..." : "Sync to Consolidated Members"}
    </Button>
  );
}
