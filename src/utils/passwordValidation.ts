/**
 * Password validation utility functions
 */

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very-strong'
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  message: string;
  validations: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validates a password against security requirements
 * @param password The password to validate
 * @returns Validation result with strength assessment
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  // Define validation criteria
  const minLength = 8;
  const hasMinLength = password.length >= minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  // Count the number of criteria met
  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;
  
  // Determine password strength
  let strength: PasswordStrength;
  let message: string;
  let isValid = false;
  
  if (criteriaCount <= 2) {
    strength = PasswordStrength.WEAK;
    message = "Password is too weak. Please use a stronger password.";
  } else if (criteriaCount === 3) {
    strength = PasswordStrength.MEDIUM;
    message = "Password strength is medium. Consider adding more variety.";
    isValid = true;
  } else if (criteriaCount === 4) {
    strength = PasswordStrength.STRONG;
    message = "Password strength is strong.";
    isValid = true;
  } else {
    strength = PasswordStrength.VERY_STRONG;
    message = "Password strength is very strong.";
    isValid = true;
  }
  
  return {
    isValid,
    strength,
    message,
    validations: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar
    }
  };
};

/**
 * Gets specific feedback for improving a password
 * @param validations The validation results
 * @returns Specific feedback message
 */
export const getPasswordFeedback = (validations: PasswordValidationResult['validations']): string => {
  const issues: string[] = [];
  
  if (!validations.hasMinLength) {
    issues.push("at least 8 characters");
  }
  if (!validations.hasUppercase) {
    issues.push("an uppercase letter");
  }
  if (!validations.hasLowercase) {
    issues.push("a lowercase letter");
  }
  if (!validations.hasNumber) {
    issues.push("a number");
  }
  if (!validations.hasSpecialChar) {
    issues.push("a special character");
  }
  
  if (issues.length === 0) {
    return "Password meets all requirements.";
  }
  
  return `Your password should include ${issues.join(", ")}.`;
};

/**
 * Gets a color based on password strength
 * @param strength The password strength
 * @returns A color string (for UI purposes)
 */
export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case PasswordStrength.WEAK:
      return "destructive"; // red
    case PasswordStrength.MEDIUM:
      return "warning"; // yellow/orange
    case PasswordStrength.STRONG:
      return "primary"; // blue/brand color
    case PasswordStrength.VERY_STRONG:
      return "success"; // green
    default:
      return "destructive";
  }
};
