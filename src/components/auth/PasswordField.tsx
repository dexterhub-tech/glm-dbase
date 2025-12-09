
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
  validatePassword,
  getPasswordFeedback
} from "@/utils/passwordValidation";
import {
  PasswordStrengthIndicator,
  PasswordFeedback
} from "@/components/ui/password-strength-indicator";

interface PasswordFieldProps {
  password: string;
  setPassword: (value: string) => void;
  clearErrors: () => void;
  showConfirmation?: boolean;
  confirmPassword?: string;
  setConfirmPassword?: (value: string) => void;
  isSignUp?: boolean;
}

export const PasswordField = ({
  password,
  setPassword,
  clearErrors,
  showConfirmation = false,
  confirmPassword = "",
  setConfirmPassword,
  isSignUp = false
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] = useState(false);
  const [passwordValidationResult, setPasswordValidationResult] = useState<ReturnType<typeof validatePassword> | null>(null);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPasswordField(!showConfirmPasswordField);
  };

  // Calculate password strength
  useEffect(() => {
    if (!password || password.length === 0) {
      setPasswordValidationResult(null);
      return;
    }

    // Use our utility function to validate the password
    const result = validatePassword(password);
    setPasswordValidationResult(result);
  }, [password]);

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              clearErrors();
              setPassword(e.target.value);
            }}
            required
            className="pr-10"
            placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {isSignUp && password.length > 0 && passwordValidationResult && (
          <div className="mt-2">
            <PasswordStrengthIndicator strength={passwordValidationResult.strength} />
            <PasswordFeedback
              strength={passwordValidationResult.strength}
              message={passwordValidationResult.message}
            />
            {!passwordValidationResult.isValid && (
              <p className="text-xs mt-1 text-gray-600">
                {getPasswordFeedback(passwordValidationResult.validations)}
              </p>
            )}
          </div>
        )}
      </div>

      {showConfirmation && setConfirmPassword && (
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPasswordField ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                clearErrors();
                setConfirmPassword(e.target.value);
              }}
              required
              className="pr-10"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPasswordField ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
          )}
        </div>
      )}
    </div>
  );
};
