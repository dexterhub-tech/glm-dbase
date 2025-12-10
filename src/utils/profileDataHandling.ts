import { z } from "zod";

// Enhanced profile schema with comprehensive validation
export const profileDataSchema = z.object({
  fullname: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name too long"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional().refine(
    (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')),
    "Invalid phone number format"
  ),
  address: z.string().optional().transform(val => val?.trim() || undefined),
  date_of_birth: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid date format"
  ),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  occupation: z.string().optional().transform(val => val?.trim() || undefined),
  bio: z.string().optional().transform(val => val?.trim() || undefined),
  emergency_contact_name: z.string().optional().transform(val => val?.trim() || undefined),
  emergency_contact_phone: z.string().optional().refine(
    (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')),
    "Invalid emergency contact phone format"
  ),
  emergency_contact_relationship: z.string().optional().transform(val => val?.trim() || undefined),
  city: z.string().optional().transform(val => val?.trim() || undefined),
  state: z.string().optional().transform(val => val?.trim() || undefined),
  postal_code: z.string().optional().transform(val => val?.trim() || undefined),
  country: z.string().optional().transform(val => val?.trim() || undefined),
  baptism_date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    "Invalid baptism date format"
  ),
  baptism_location: z.string().optional().transform(val => val?.trim() || undefined),
  is_baptized: z.boolean().optional(),
  preferred_contact_method: z.enum(["email", "phone", "sms", "whatsapp"]).optional(),
  skills_talents: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  genotype: z.string().optional().refine(
    (val) => !val || /^(AA|AS|SS|AC|SC|CC)$/i.test(val),
    "Invalid genotype format"
  ),
});

export type ProfileData = z.infer<typeof profileDataSchema>;

// Default values for profile fields
export const DEFAULT_PROFILE_VALUES: Partial<ProfileData> = {
  fullname: "",
  phone: "",
  address: "",
  date_of_birth: "",
  gender: undefined,
  marital_status: undefined,
  occupation: "",
  bio: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Nigeria", // Default country
  baptism_date: "",
  baptism_location: "",
  is_baptized: false,
  preferred_contact_method: undefined,
  skills_talents: [],
  interests: [],
  genotype: "",
};

// Profile completion requirements
export interface ProfileCompletionRequirement {
  field: keyof ProfileData;
  label: string;
  required: boolean;
  category: 'basic' | 'contact' | 'personal' | 'spiritual' | 'emergency';
  priority: 'high' | 'medium' | 'low';
}

export const PROFILE_COMPLETION_REQUIREMENTS: ProfileCompletionRequirement[] = [
  { field: 'fullname', label: 'Full Name', required: true, category: 'basic', priority: 'high' },
  { field: 'email', label: 'Email Address', required: true, category: 'contact', priority: 'high' },
  { field: 'phone', label: 'Phone Number', required: true, category: 'contact', priority: 'high' },
  { field: 'date_of_birth', label: 'Date of Birth', required: true, category: 'basic', priority: 'high' },
  { field: 'gender', label: 'Gender', required: true, category: 'basic', priority: 'high' },
  { field: 'address', label: 'Address', required: false, category: 'contact', priority: 'medium' },
  { field: 'emergency_contact_name', label: 'Emergency Contact Name', required: false, category: 'emergency', priority: 'medium' },
  { field: 'emergency_contact_phone', label: 'Emergency Contact Phone', required: false, category: 'emergency', priority: 'medium' },
  { field: 'emergency_contact_relationship', label: 'Emergency Contact Relationship', required: false, category: 'emergency', priority: 'low' },
  { field: 'occupation', label: 'Occupation', required: false, category: 'personal', priority: 'low' },
  { field: 'preferred_contact_method', label: 'Preferred Contact Method', required: false, category: 'contact', priority: 'medium' },
];

/**
 * Applies default values to incomplete profile data
 */
export function applyProfileDefaults(profileData: Partial<ProfileData>): ProfileData {
  const merged = { ...DEFAULT_PROFILE_VALUES, ...profileData };
  
  // Ensure required fields have at least empty string values
  if (!merged.fullname) merged.fullname = "";
  if (!merged.email) merged.email = "";
  
  // Handle null/empty values for all fields by applying defaults
  if (!merged.country) {
    merged.country = DEFAULT_PROFILE_VALUES.country;
  }
  
  // Ensure arrays are never null
  if (!Array.isArray(merged.skills_talents)) {
    merged.skills_talents = DEFAULT_PROFILE_VALUES.skills_talents || [];
  }
  if (!Array.isArray(merged.interests)) {
    merged.interests = DEFAULT_PROFILE_VALUES.interests || [];
  }
  
  // Apply smart defaults based on existing data
  if (!merged.country && merged.phone?.startsWith('+234')) {
    merged.country = "Nigeria";
  }
  
  // Set phone as preferred if phone is provided, otherwise default to email
  if (!merged.preferred_contact_method) {
    if (merged.phone) {
      merged.preferred_contact_method = "phone";
    } else {
      merged.preferred_contact_method = "email";
    }
  }
  
  return merged as ProfileData;
}

/**
 * Validates and sanitizes profile data
 */
export function validateAndSanitizeProfile(profileData: Partial<ProfileData>): {
  isValid: boolean;
  data: ProfileData | null;
  errors: Record<string, string>;
} {
  try {
    // Apply defaults first
    const dataWithDefaults = applyProfileDefaults(profileData);
    
    // Validate with schema
    const validatedData = profileDataSchema.parse(dataWithDefaults);
    
    return {
      isValid: true,
      data: validatedData,
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return {
        isValid: false,
        data: null,
        errors,
      };
    }
    
    return {
      isValid: false,
      data: null,
      errors: { general: 'Validation failed' },
    };
  }
}

/**
 * Calculates profile completion percentage and missing fields
 */
export function calculateProfileCompletion(profileData: Partial<ProfileData>): {
  completionPercentage: number;
  missingRequired: ProfileCompletionRequirement[];
  missingOptional: ProfileCompletionRequirement[];
  completedFields: string[];
  totalFields: number;
  completedCount: number;
} {
  const missingRequired: ProfileCompletionRequirement[] = [];
  const missingOptional: ProfileCompletionRequirement[] = [];
  const completedFields: string[] = [];
  
  PROFILE_COMPLETION_REQUIREMENTS.forEach((requirement) => {
    const value = profileData[requirement.field];
    const isEmpty = value === undefined || value === null || value === '' || 
                   (Array.isArray(value) && value.length === 0);
    
    if (isEmpty) {
      if (requirement.required) {
        missingRequired.push(requirement);
      } else {
        missingOptional.push(requirement);
      }
    } else {
      completedFields.push(requirement.label);
    }
  });
  
  const totalFields = PROFILE_COMPLETION_REQUIREMENTS.length;
  const completedCount = completedFields.length;
  const completionPercentage = Math.round((completedCount / totalFields) * 100);
  
  return {
    completionPercentage,
    missingRequired,
    missingOptional,
    completedFields,
    totalFields,
    completedCount,
  };
}

/**
 * Generates profile completion prompts based on missing data
 */
export function generateCompletionPrompts(profileData: Partial<ProfileData>): {
  hasRequiredMissing: boolean;
  primaryPrompt: string | null;
  secondaryPrompts: string[];
  actionItems: Array<{
    field: keyof ProfileData;
    label: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
} {
  const completion = calculateProfileCompletion(profileData);
  
  let primaryPrompt: string | null = null;
  const secondaryPrompts: string[] = [];
  const actionItems = [...completion.missingRequired, ...completion.missingOptional]
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .map(req => ({
      field: req.field,
      label: req.label,
      priority: req.priority,
      category: req.category,
    }));
  
  if (completion.missingRequired.length > 0) {
    primaryPrompt = `Please complete your profile by adding ${completion.missingRequired.length} required field${completion.missingRequired.length > 1 ? 's' : ''}.`;
  } else if (completion.completionPercentage < 70) {
    primaryPrompt = `Your profile is ${completion.completionPercentage}% complete. Consider adding more information to help others connect with you.`;
  }
  
  if (completion.missingOptional.length > 0) {
    const highPriorityOptional = completion.missingOptional.filter(req => req.priority === 'high');
    const mediumPriorityOptional = completion.missingOptional.filter(req => req.priority === 'medium');
    
    if (highPriorityOptional.length > 0) {
      secondaryPrompts.push(`Consider adding ${highPriorityOptional.map(req => req.label.toLowerCase()).join(', ')} for better communication.`);
    }
    
    if (mediumPriorityOptional.length > 0) {
      secondaryPrompts.push(`You can also add ${mediumPriorityOptional.map(req => req.label.toLowerCase()).join(', ')} when convenient.`);
    }
  }
  
  return {
    hasRequiredMissing: completion.missingRequired.length > 0,
    primaryPrompt,
    secondaryPrompts,
    actionItems,
  };
}

/**
 * Sanitizes text input by removing potentially harmful content
 */
export function sanitizeTextInput(input: string | undefined): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Formats phone number to a consistent format
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If too short to be a valid phone number, return empty
  if (cleaned.length < 8) return '';
  
  // If it starts with +234, keep as is (but only if it has enough digits)
  if (cleaned.startsWith('+234')) {
    return cleaned.length >= 14 ? cleaned : '';
  }
  
  // If it starts with 234, add + (but only if it has enough digits)
  if (cleaned.startsWith('234')) {
    return cleaned.length >= 13 ? '+' + cleaned : '';
  }
  
  // If it starts with 0 and is Nigerian format, convert to international
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+234' + cleaned.substring(1);
  }
  
  // If it's 10 digits, assume Nigerian and add country code
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return '+234' + cleaned;
  }
  
  // For other cases, return as is if it's long enough
  return cleaned.length >= 8 ? cleaned : '';
}

/**
 * Validates email format
 */
export function isValidEmail(email: string | undefined): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gets profile field display value with fallback
 */
export function getProfileFieldDisplay(
  value: any, 
  fieldName: keyof ProfileData, 
  fallbackText: string = 'Not provided'
): string {
  if (value === undefined || value === null || value === '') {
    return fallbackText;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : fallbackText;
  }
  
  if (fieldName === 'date_of_birth' || fieldName === 'baptism_date') {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return fallbackText;
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
}