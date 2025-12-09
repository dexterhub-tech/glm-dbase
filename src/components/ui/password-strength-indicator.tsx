import { cn } from "@/lib/utils";
import { PasswordStrength, getPasswordStrengthColor } from "@/utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  className?: string;
}

/**
 * A visual indicator for password strength
 */
export function PasswordStrengthIndicator({
  strength,
  className,
}: PasswordStrengthIndicatorProps) {
  // Map strength to number of filled segments
  const getSegmentCount = () => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 1;
      case PasswordStrength.MEDIUM:
        return 2;
      case PasswordStrength.STRONG:
        return 3;
      case PasswordStrength.VERY_STRONG:
        return 4;
      default:
        return 0;
    }
  };

  // Get color based on strength
  const color = getPasswordStrengthColor(strength);
  const segmentCount = getSegmentCount();

  return (
    <div className={cn("flex gap-1 w-full mt-1", className)}>
      {[1, 2, 3, 4].map((segment) => (
        <div
          key={segment}
          className={cn(
            "h-1.5 rounded-full flex-1 transition-all duration-200",
            {
              "bg-destructive": color === "destructive" && segment <= segmentCount,
              "bg-warning": color === "warning" && segment <= segmentCount,
              "bg-primary": color === "primary" && segment <= segmentCount,
              "bg-success": color === "success" && segment <= segmentCount,
              "bg-muted": segment > segmentCount,
            }
          )}
        />
      ))}
    </div>
  );
}

interface PasswordFeedbackProps {
  strength: PasswordStrength;
  message: string;
  className?: string;
}

/**
 * Feedback text for password strength
 */
export function PasswordFeedback({
  strength,
  message,
  className,
}: PasswordFeedbackProps) {
  // Get color based on strength
  const color = getPasswordStrengthColor(strength);
  
  return (
    <p
      className={cn(
        "text-xs mt-1",
        {
          "text-destructive": color === "destructive",
          "text-warning": color === "warning",
          "text-primary": color === "primary",
          "text-success": color === "success",
        },
        className
      )}
    >
      {message}
    </p>
  );
}
