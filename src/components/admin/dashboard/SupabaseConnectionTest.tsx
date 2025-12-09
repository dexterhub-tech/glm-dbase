import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Database } from "lucide-react";
import { testSupabaseConnection, testMembersTable } from "@/utils/supabaseTest";

const SupabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });

  const [membersTableStatus, setMembersTableStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });

  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);

    try {
      // Test Supabase connection
      console.log("Starting Supabase connection test...");
      const connectionResult = await testSupabaseConnection();
      console.log("Connection test result:", connectionResult);
      setConnectionStatus({
        tested: true,
        success: connectionResult.success,
        message: connectionResult.message
      });

      // Test members table
      console.log("Starting members table test...");
      const membersTableResult = await testMembersTable();
      console.log("Members table test result:", membersTableResult);
      setMembersTableStatus({
        tested: true,
        success: membersTableResult.success,
        message: membersTableResult.message
      });
    } catch (error) {
      console.error("Error running database tests:", error);
      // Set both statuses to error if an exception occurs
      setConnectionStatus({
        tested: true,
        success: false,
        message: `Test failed with error: ${error instanceof Error ? error.message : String(error)}`
      });
      setMembersTableStatus({
        tested: true,
        success: false,
        message: `Test failed with error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      // Always set loading to false, even if there's an error
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If you're experiencing issues with data loading, run this test to check the database connection.
        </p>

        {connectionStatus.tested && (
          <Alert variant={connectionStatus.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {connectionStatus.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5" />
              )}
              <div>
                <AlertTitle>Supabase Connection</AlertTitle>
                <AlertDescription>{connectionStatus.message}</AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {membersTableStatus.tested && (
          <Alert variant={membersTableStatus.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {membersTableStatus.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5" />
              )}
              <div>
                <AlertTitle>Members Table</AlertTitle>
                <AlertDescription>{membersTableStatus.message}</AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <Button
          onClick={runTests}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Running Tests..." : "Test Database Connection"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
