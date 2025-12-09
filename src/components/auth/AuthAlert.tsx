
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";

interface AuthAlertProps {
  isSignUp: boolean;
  errorMessage: string | null;
}

export const AuthAlert = ({ isSignUp, errorMessage }: AuthAlertProps) => {
  // Determine if we're in development mode
  const isDev = import.meta.env.DEV;

  return (
    <>
      {isDev && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-blue-700 font-medium">Development Mode</AlertTitle>
          <AlertDescription>
            {isSignUp
              ? "In development mode, you'll be automatically signed in after creating an account."
              : "Email confirmation is enabled but you can still sign in during development."}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700 font-medium">Error</AlertTitle>
          <AlertDescription className="text-red-600">
            {errorMessage}
            {errorMessage && errorMessage.includes("Database error") && (
              <div className="mt-2 text-sm">
                <p>This could be due to:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>A temporary database connection issue</li>
                  <li>The email address is already in use</li>
                  <li>Required fields are missing</li>
                </ul>
                <p className="mt-1">Please try again or use a different email address.</p>
              </div>
            )}
            {errorMessage && errorMessage.includes("Failed to fetch") && (
              <div className="mt-2 text-sm">
                <p>This could be due to:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Your internet connection is unstable</li>
                  <li>The server is temporarily unavailable</li>
                </ul>
                <p className="mt-1">Please check your connection and try again in a few moments.</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
