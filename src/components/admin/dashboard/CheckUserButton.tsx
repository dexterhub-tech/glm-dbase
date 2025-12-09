import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkUserByEmail, manualSyncProfileToMember } from "@/utils/diagnosticTools";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CheckUserButton() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const checkUser = async (emailToCheck: string) => {
    if (!emailToCheck) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter an email address to check",
      });
      return;
    }

    setIsChecking(true);
    setResults(null);

    try {
      console.log(`Checking user with email: ${emailToCheck}`);

      const checkResult = await checkUserByEmail(emailToCheck);

      if (!checkResult.success) {
        throw new Error(checkResult.error || "Error checking user");
      }

      console.log("User check results:", checkResult.results);
      setResults(checkResult.results);

      // Show toast with summary
      toast({
        title: "User check complete",
        description: `User ${emailToCheck} found in: ${[
          checkResult.results.inProfiles ? "Profiles" : "",
          checkResult.results.inMembers ? "Members" : "",
          checkResult.results.hasRole ? "Roles" : "",
        ]
          .filter(Boolean)
          .join(", ") || "No tables"}`,
      });

      return checkResult.results;
    } catch (error) {
      console.error("Error checking user:", error);
      toast({
        variant: "destructive",
        title: "Error checking user",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSync = async () => {
    if (!results?.profileData?.id) {
      toast({
        variant: "destructive",
        title: "Cannot sync",
        description: "No profile found to sync",
      });
      return;
    }

    setIsChecking(true);

    try {
      const syncResult = await manualSyncProfileToMember(results.profileData.id);
      console.log("Manual sync result:", syncResult);

      if (syncResult.success) {
        toast({
          title: "Sync successful",
          description: "User has been manually synced to members table",
        });

        // Refresh the check
        await checkUser(email);
      } else {
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: syncResult.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error syncing user:", error);
      toast({
        variant: "destructive",
        title: "Error syncing user",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Check User
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check User Status</DialogTitle>
            <DialogDescription>
              Check if a user exists in the database and fix sync issues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  onClick={() => checkUser(email)}
                  disabled={isChecking || !email}
                >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Check
                </Button>
              </div>
            </div>

            {results && (
              <div className="border rounded p-4 space-y-2">
                <h3 className="font-medium">Results for {results.email}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>In Profiles:</div>
                  <div>{results.inProfiles ? "✅ Yes" : "❌ No"}</div>
                  <div>In Members:</div>
                  <div>{results.inMembers ? "✅ Yes" : "❌ No"}</div>
                  <div>Has Role:</div>
                  <div>{results.hasRole ? `✅ Yes (${results.roleData?.role})` : "❌ No"}</div>
                </div>

                {results.inProfiles && !results.inMembers && (
                  <Button
                    onClick={handleSync}
                    disabled={isChecking}
                    className="mt-4"
                  >
                    {isChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      "Manually Sync to Members"
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
