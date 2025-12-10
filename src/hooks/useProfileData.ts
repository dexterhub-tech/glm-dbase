import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  validateAndSanitizeProfile, 
  applyProfileDefaults, 
  calculateProfileCompletion,
  formatPhoneNumber,
  sanitizeTextInput,
  type ProfileData 
} from '@/utils/profileDataHandling';

interface UseProfileDataOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  enableValidation?: boolean;
  onProfileChange?: (profile: ProfileData) => void;
  onValidationError?: (errors: Record<string, string>) => void;
}

interface UseProfileDataReturn {
  profileData: ProfileData | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: Record<string, string>;
  completionInfo: ReturnType<typeof calculateProfileCompletion>;
  
  // Data management methods
  updateProfile: (updates: Partial<ProfileData>) => void;
  updateField: (field: keyof ProfileData, value: any) => void;
  resetProfile: () => void;
  saveProfile: () => Promise<boolean>;
  
  // Validation methods
  validateProfile: () => boolean;
  validateField: (field: keyof ProfileData, value: any) => string | null;
  clearValidationErrors: () => void;
  
  // Utility methods
  getFieldValue: (field: keyof ProfileData, fallback?: any) => any;
  getFieldDisplay: (field: keyof ProfileData, fallback?: string) => string;
  hasRequiredFields: () => boolean;
}

export const useProfileData = (
  initialProfile: Partial<ProfileData> | null = null,
  options: UseProfileDataOptions = {}
): UseProfileDataReturn => {
  const {
    autoSave = false,
    autoSaveDelay = 2000,
    enableValidation = true,
    onProfileChange,
    onValidationError,
  } = options;

  const { toast } = useToast();
  
  // State management
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize profile data with defaults
  useEffect(() => {
    if (initialProfile) {
      const profileWithDefaults = applyProfileDefaults(initialProfile);
      setProfileData(profileWithDefaults);
      setOriginalProfile(profileWithDefaults);
    }
  }, [initialProfile]);

  // Calculate completion info
  const completionInfo = profileData ? calculateProfileCompletion(profileData) : {
    completionPercentage: 0,
    missingRequired: [],
    missingOptional: [],
    completedFields: [],
    totalFields: 0,
    completedCount: 0,
  };

  // Check for unsaved changes
  const hasUnsavedChanges = profileData && originalProfile ? 
    JSON.stringify(profileData) !== JSON.stringify(originalProfile) : false;

  // Validation methods
  const validateField = useCallback((field: keyof ProfileData, value: any): string | null => {
    if (!enableValidation) return null;

    try {
      // Create a test object with just this field
      const testData = { [field]: value };
      const validation = validateAndSanitizeProfile(testData);
      
      if (validation.errors[field]) {
        return validation.errors[field];
      }
      
      return null;
    } catch (error) {
      return 'Validation error';
    }
  }, [enableValidation]);

  const validateProfile = useCallback((): boolean => {
    if (!profileData || !enableValidation) return true;

    const validation = validateAndSanitizeProfile(profileData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      onValidationError?.(validation.errors);
      return false;
    }
    
    setValidationErrors({});
    return true;
  }, [profileData, enableValidation, onValidationError]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  // Data management methods
  const updateField = useCallback((field: keyof ProfileData, value: any) => {
    if (!profileData) return;

    let sanitizedValue = value;
    
    // Apply field-specific sanitization
    if (typeof value === 'string') {
      if (field === 'phone' || field === 'emergency_contact_phone') {
        sanitizedValue = formatPhoneNumber(value);
      } else if (field !== 'email') { // Don't sanitize email as it has its own validation
        sanitizedValue = sanitizeTextInput(value);
      }
    }

    const updatedProfile = {
      ...profileData,
      [field]: sanitizedValue,
    };

    setProfileData(updatedProfile);

    // Validate the specific field
    if (enableValidation) {
      const fieldError = validateField(field, sanitizedValue);
      if (fieldError) {
        setValidationErrors(prev => ({ ...prev, [field]: fieldError }));
      } else {
        setValidationErrors(prev => {
          const { [field]: removed, ...rest } = prev;
          return rest;
        });
      }
    }

    // Trigger change callback
    onProfileChange?.(updatedProfile);

    // Handle auto-save
    if (autoSave) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      const timeout = setTimeout(() => {
        saveProfile();
      }, autoSaveDelay);
      
      setAutoSaveTimeout(timeout);
    }
  }, [profileData, enableValidation, validateField, onProfileChange, autoSave, autoSaveDelay, autoSaveTimeout]);

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    if (!profileData) return;

    const updatedProfile = { ...profileData, ...updates };
    setProfileData(updatedProfile);
    onProfileChange?.(updatedProfile);

    // Validate if enabled
    if (enableValidation) {
      const validation = validateAndSanitizeProfile(updatedProfile);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors({});
      }
    }
  }, [profileData, onProfileChange, enableValidation]);

  const resetProfile = useCallback(() => {
    if (originalProfile) {
      setProfileData(originalProfile);
      setValidationErrors({});
    }
  }, [originalProfile]);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    if (!profileData) return false;

    // Validate before saving
    if (enableValidation && !validateProfile()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);
    
    try {
      // Here you would typically make an API call to save the profile
      // For now, we'll simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the original profile to reflect saved state
      setOriginalProfile(profileData);
      
      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully.",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profileData, enableValidation, validateProfile, toast]);

  // Utility methods
  const getFieldValue = useCallback((field: keyof ProfileData, fallback: any = null) => {
    return profileData?.[field] ?? fallback;
  }, [profileData]);

  const getFieldDisplay = useCallback((field: keyof ProfileData, fallback: string = 'Not provided') => {
    const value = profileData?.[field];
    
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : fallback;
    }
    
    if (field === 'date_of_birth' || field === 'baptism_date') {
      try {
        return new Date(value as string).toLocaleDateString();
      } catch {
        return fallback;
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  }, [profileData]);

  const hasRequiredFields = useCallback((): boolean => {
    return completionInfo.missingRequired.length === 0;
  }, [completionInfo.missingRequired.length]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  return {
    profileData,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    validationErrors,
    completionInfo,
    
    // Data management methods
    updateProfile,
    updateField,
    resetProfile,
    saveProfile,
    
    // Validation methods
    validateProfile,
    validateField,
    clearValidationErrors,
    
    // Utility methods
    getFieldValue,
    getFieldDisplay,
    hasRequiredFields,
  };
};