import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { login as backendLogin, setAccessToken, clearAccessToken } from "@/utils/authApi";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword, PasswordValidationResult } from "@/utils/passwordValidation";

export const useAuthentication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginLocked, setLoginLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const clearErrors = () => {
    setErrorMessage(null);
    setPasswordValidation(null);
  };

  /**
   * Validates a password and updates the validation state
   * @param password The password to validate
   * @returns Whether the password is valid
   */
  const validateAndSetPassword = (password: string): boolean => {
    const validation = validatePassword(password);
    setPasswordValidation(validation);
    return validation.isValid;
  };

  // Helper function to clear all auth storage
  const clearAuthStorage = () => {
    clearAccessToken();
    sessionStorage.removeItem('glm-auth-token');
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  };

  const signIn = async (email: string, password: string, returnTo?: string) => {
    setIsLoading(true);
    clearErrors();

    // Check if login is locked
    if (loginLocked) {
      const now = new Date();
      if (lockoutEndTime && now < lockoutEndTime) {
        const remainingMinutes = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 60000);
        setErrorMessage(`Too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`);
        setIsLoading(false);
        return;
      } else {
        // Reset lockout if time has passed
        setLoginLocked(false);
        setLoginAttempts(0);
        setLockoutEndTime(null);
      }
    }

    console.log("[signIn] Attempting login for:", email);
    try {
      // Clear any existing auth data first to ensure a fresh login
      clearAuthStorage();

      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase();
      try {
        const result = await backendLogin(normalizedEmail, password);
        setAccessToken(result.accessToken);
      } catch (err: any) {
        // Increment login attempts on failure
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          const lockoutEnd = new Date();
          lockoutEnd.setMinutes(lockoutEnd.getMinutes() + 15); // 15 minute lockout
          setLoginLocked(true);
          setLockoutEndTime(lockoutEnd);
          setErrorMessage(`Too many failed login attempts. Your account is locked for 15 minutes.`);

          toast({
            variant: "destructive",
            title: "Account temporarily locked",
            description: "Too many failed login attempts. Please try again in 15 minutes.",
          });

          setIsLoading(false);
          return;
        }

        setErrorMessage(err?.message || 'Login failed');
        console.error("[signIn] Error:", err?.message || err);
        throw err;
      }

      // Success - reset login attempts and navigate
      setLoginAttempts(0);
      console.log("[signIn] Login successful, navigating to:", returnTo || "/");

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Navigate to returnTo URL or home
      navigate(returnTo || "/");
    } catch (error: any) {
      console.error("[signIn] Authentication error:", error.message);
      // Error already set in the flow above
    } finally {
      setIsLoading(false);
    }
  };

const signUp = async (
    email: string,
    password: string,
    fullName: string,
    churchUnit: string = "",
    assignedPastor: string = "",
    phone: string = "",
    address: string = ""
  ) => {
    setIsLoading(true);
    clearErrors();

    // Validate password strength
    const isPasswordValid = validateAndSetPassword(password);
    if (!isPasswordValid) {
      setIsLoading(false);
      setErrorMessage("Please use a stronger password.");
      return;
    }

    try {
      console.log("Attempting signup with:", {
        email,
        passwordLength: password.length,
        fullName,
        churchUnit: churchUnit || "None",
        assignedPastor: assignedPastor || "None",
        phone: phone || "None",
        address: address ? "Provided" : "None"
      });

      // No signup via frontend for now — instruct user to contact admin
      setErrorMessage("Signup is disabled. Please contact an administrator.");
      toast({
        variant: "destructive",
        title: "Signup disabled",
        description: "Please contact an administrator to create an account.",
      });
    } catch (error: any) {
      console.error("Authentication error:", error);

      // Provide more specific error messages based on the error
      let errorMsg = "Failed to create account. Please try again.";
      let shouldRetry = false;

      if (error.message) {
        const message = error.message.toLowerCase();
        
        if (message.includes("duplicate key") || message.includes("already registered") || message.includes("user already registered")) {
          errorMsg = "An account with this email already exists. Please sign in instead.";
        } else if (message.includes("database") || message.includes("violates")) {
          errorMsg = "Database error saving new user. This could be due to:\n• A temporary database connection issue\n• The email address is already in use\n• Required fields are missing\n\nPlease try again or use a different email address.";
          shouldRetry = true;
        } else if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
          errorMsg = "Failed to connect to the server. Please check your internet connection and try again.";
          shouldRetry = true;
        } else if (message.includes("timeout")) {
          errorMsg = "The request timed out. Please try again when you have a better connection.";
          shouldRetry = true;
        } else if (message.includes("foreign key") || message.includes("constraint")) {
          errorMsg = "Database configuration issue. Please contact support or try again later.";
          shouldRetry = true;
        } else {
          errorMsg = error.message;
        }
      }

      // No special error code mapping now

      // Log additional error information for debugging
      if (error.details) {
        console.error("Error details:", error.details);
      }
      if (error.hint) {
        console.error("Error hint:", error.hint);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMsg = "Failed to connect to the server. Please check your internet connection and try again.";
        shouldRetry = true;
        console.error("Network error detected:", error);
      }

      setErrorMessage(errorMsg);

      // Show a toast with the error message
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: shouldRetry ? 
          "There was a temporary issue. Please try again." : 
          errorMsg.split('\n')[0], // Show only the first line in toast
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (_email: string) => {
    setErrorMessage("Password reset is not available. Contact support.");
      toast({
      variant: "destructive",
      title: "Not available",
      description: "Password reset flow is not configured.",
    });
  };

  return {
    isLoading,
    errorMessage,
    setErrorMessage,
    passwordValidation,
    loginLocked,
    lockoutEndTime,
    clearErrors,
    validateAndSetPassword,
    signIn,
    signUp,
    resetPassword,
  };
};
