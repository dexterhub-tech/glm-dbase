import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  applyProfileDefaults,
  validateAndSanitizeProfile,
  calculateProfileCompletion,
  generateCompletionPrompts,
  formatPhoneNumber,
  sanitizeTextInput,
  getProfileFieldDisplay,
  type ProfileData,
  DEFAULT_PROFILE_VALUES,
  PROFILE_COMPLETION_REQUIREMENTS,
} from './profileDataHandling';

describe('Profile Data Handling - Property Tests', () => {
  describe('Property 16: Profile data defaults', () => {
    it('should always apply consistent defaults for missing profile data', () => {
      fc.assert(
        fc.property(
          fc.record({
            fullname: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            email: fc.option(fc.emailAddress()),
            phone: fc.option(fc.string({ minLength: 0, maxLength: 20 })),
            address: fc.option(fc.string({ minLength: 0, maxLength: 200 })),
            date_of_birth: fc.option(fc.date().map(d => d.toISOString().split('T')[0])),
            gender: fc.option(fc.constantFrom('male', 'female', 'other')),
            marital_status: fc.option(fc.constantFrom('single', 'married', 'divorced', 'widowed')),
            occupation: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            bio: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            country: fc.option(fc.string({ minLength: 0, maxLength: 50 })),
            preferred_contact_method: fc.option(fc.constantFrom('email', 'phone', 'sms', 'whatsapp')),
          }, { requiredKeys: [] }),
          (partialProfile) => {
            const result = applyProfileDefaults(partialProfile);
            
            // Property: All required fields should have non-null values
            expect(result.fullname).toBeDefined();
            expect(result.email).toBeDefined();
            expect(result.country).toBeDefined();
            expect(result.preferred_contact_method).toBeDefined();
            expect(result.skills_talents).toBeDefined();
            expect(result.interests).toBeDefined();
            
            // Property: Default values should be applied when fields are missing
            if (!partialProfile.fullname) {
              expect(result.fullname).toBe(DEFAULT_PROFILE_VALUES.fullname || "");
            }
            
            if (!partialProfile.email) {
              expect(result.email).toBe(DEFAULT_PROFILE_VALUES.email || "");
            }
            
            if (!partialProfile.country) {
              expect(result.country).toBe(DEFAULT_PROFILE_VALUES.country);
            }
            
            // Property: Arrays should always be initialized
            expect(Array.isArray(result.skills_talents)).toBe(true);
            expect(Array.isArray(result.interests)).toBe(true);
            
            // Property: Smart defaults should be applied consistently
            if (partialProfile.phone && partialProfile.phone.includes('+234') && !partialProfile.country) {
              expect(result.country).toBe('Nigeria');
            }
            
            // Property: Preferred contact method should have smart defaults
            if (!partialProfile.preferred_contact_method) {
              if (partialProfile.phone && partialProfile.phone.trim()) {
                expect(result.preferred_contact_method).toBe('phone');
              } else {
                expect(result.preferred_contact_method).toBe('email');
              }
            }
            
            // Property: Existing values should be preserved, except null/empty values get defaults
            if (partialProfile.fullname !== undefined && partialProfile.fullname !== null && partialProfile.fullname !== '') {
              expect(result.fullname).toBe(partialProfile.fullname);
            }
            
            if (partialProfile.email !== undefined && partialProfile.email !== null && partialProfile.email !== '') {
              expect(result.email).toBe(partialProfile.email);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases in profile data consistently', () => {
      fc.assert(
        fc.property(
          fc.record({
            fullname: fc.option(fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.string())),
            email: fc.option(fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.emailAddress())),
            phone: fc.option(fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined), fc.string())),
            skills_talents: fc.option(fc.oneof(fc.constant(null), fc.constant(undefined), fc.array(fc.string()))),
            interests: fc.option(fc.oneof(fc.constant(null), fc.constant(undefined), fc.array(fc.string()))),
          }, { requiredKeys: [] }),
          (edgeCaseProfile) => {
            const result = applyProfileDefaults(edgeCaseProfile);
            
            // Property: Should never return null or undefined for required fields
            expect(result.fullname).not.toBeNull();
            expect(result.fullname).not.toBeUndefined();
            expect(result.email).not.toBeNull();
            expect(result.email).not.toBeUndefined();
            
            // Property: Arrays should be initialized to empty arrays after applying defaults
            expect(Array.isArray(result.skills_talents)).toBe(true);
            expect(Array.isArray(result.interests)).toBe(true);
            
            // If input was null/undefined, should get default empty array
            if (edgeCaseProfile.skills_talents === null || edgeCaseProfile.skills_talents === undefined) {
              expect(result.skills_talents).toEqual([]);
            }
            if (edgeCaseProfile.interests === null || edgeCaseProfile.interests === undefined) {
              expect(result.interests).toEqual([]);
            }
            
            // Property: Should handle empty strings appropriately
            if (edgeCaseProfile.fullname === '') {
              expect(result.fullname).toBe('');
            }
            
            if (edgeCaseProfile.email === '') {
              expect(result.email).toBe('');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 17: Privilege verification fallback', () => {
    it('should provide appropriate fallback values when profile data is incomplete', () => {
      fc.assert(
        fc.property(
          fc.record({
            fullname: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            email: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            phone: fc.option(fc.string({ minLength: 0, maxLength: 20 })),
            date_of_birth: fc.option(fc.string()),
            gender: fc.option(fc.string()),
          }, { requiredKeys: [] }),
          (incompleteProfile) => {
            const completion = calculateProfileCompletion(incompleteProfile);
            const prompts = generateCompletionPrompts(incompleteProfile);
            
            // Property: Should always return valid completion data
            expect(completion.completionPercentage).toBeGreaterThanOrEqual(0);
            expect(completion.completionPercentage).toBeLessThanOrEqual(100);
            expect(completion.totalFields).toBe(PROFILE_COMPLETION_REQUIREMENTS.length);
            expect(completion.completedCount).toBeGreaterThanOrEqual(0);
            expect(completion.completedCount).toBeLessThanOrEqual(completion.totalFields);
            
            // Property: Missing required fields should be identified
            const requiredFields = PROFILE_COMPLETION_REQUIREMENTS.filter(req => req.required);
            const providedRequiredFields = requiredFields.filter(req => {
              const value = incompleteProfile[req.field];
              return value !== undefined && value !== null && value !== '';
            });
            
            expect(completion.missingRequired.length).toBe(requiredFields.length - providedRequiredFields.length);
            
            // Property: Should provide appropriate prompts based on completion
            if (completion.missingRequired.length > 0) {
              expect(prompts.hasRequiredMissing).toBe(true);
              expect(prompts.primaryPrompt).toBeTruthy();
            }
            
            // Property: Action items should be sorted by priority
            const priorities = prompts.actionItems.map(item => item.priority);
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            for (let i = 1; i < priorities.length; i++) {
              expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(priorityOrder[priorities[i - 1]]);
            }
            
            // Property: Completion percentage should match actual completion
            const expectedPercentage = Math.round((completion.completedCount / completion.totalFields) * 100);
            expect(completion.completionPercentage).toBe(expectedPercentage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle display values with appropriate fallbacks', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.oneof(
              fc.constant(undefined),
              fc.constant(null),
              fc.constant(''),
              fc.string(),
              fc.boolean(),
              fc.array(fc.string()),
              fc.date().map(d => d.toISOString())
            ),
            fc.constantFrom('fullname', 'date_of_birth', 'baptism_date', 'is_baptized', 'skills_talents')
          ).filter(([value, fieldName]) => {
            // Don't test boolean values with date fields
            if (typeof value === 'boolean' && (fieldName === 'date_of_birth' || fieldName === 'baptism_date')) {
              return false;
            }
            // Don't test date strings with boolean fields
            if (typeof value === 'string' && fieldName === 'is_baptized' && !isNaN(Date.parse(value))) {
              return false;
            }
            return true;
          }).map(([value, fieldName]) => ({ value, fieldName })),
          fc.string({ minLength: 1, maxLength: 50 }),
          ({ value, fieldName }, fallbackText) => {
            const result = getProfileFieldDisplay(value, fieldName as keyof ProfileData, fallbackText);
            
            // Property: Should never return null or undefined
            expect(result).not.toBeNull();
            expect(result).not.toBeUndefined();
            expect(typeof result).toBe('string');
            
            // Property: Should use fallback for empty values
            if (value === undefined || value === null || value === '') {
              expect(result).toBe(fallbackText);
            }
            
            // Property: Should handle arrays appropriately
            if (Array.isArray(value)) {
              if (value.length === 0) {
                expect(result).toBe(fallbackText);
              } else {
                expect(result).toBe(value.join(', '));
              }
            }
            
            // Property: Should handle booleans appropriately
            if (typeof value === 'boolean') {
              expect(result).toBe(value ? 'Yes' : 'No');
            }
            
            // Property: Should handle dates appropriately for date fields
            if ((fieldName === 'date_of_birth' || fieldName === 'baptism_date') && 
                typeof value === 'string' && value && !isNaN(Date.parse(value))) {
              // Only expect date format if it's actually a valid date string, not a boolean
              if (typeof value === 'string') {
                expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Data Sanitization Properties', () => {
    it('should consistently sanitize text input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 2000 }),
          (input) => {
            const result = sanitizeTextInput(input);
            
            // Property: Should never contain dangerous content
            expect(result).not.toContain('<script');
            expect(result).not.toContain('javascript:');
            expect(result).not.toMatch(/on\w+=/i);
            
            // Property: Should be limited in length
            expect(result.length).toBeLessThanOrEqual(1000);
            
            // Property: Should not have leading/trailing whitespace
            expect(result).toBe(result.trim());
            
            // Property: Should handle empty input
            if (!input || input.trim() === '') {
              expect(result).toBe('');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should consistently format phone numbers', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant(undefined),
            fc.string({ minLength: 8, maxLength: 15 }).map(s => s.replace(/[^\d]/g, '')),
            fc.string({ minLength: 10, maxLength: 11 }).map(s => '0' + s.replace(/[^\d]/g, '').slice(0, 10)),
            fc.string({ minLength: 10, maxLength: 13 }).map(s => '+234' + s.replace(/[^\d]/g, '').slice(0, 10)),
          ),
          (phone) => {
            const result = formatPhoneNumber(phone);
            
            // Property: Should handle empty input
            if (!phone) {
              expect(result).toBe('');
              return;
            }
            
            // Property: Should only contain digits and + at start
            if (result) {
              expect(result).toMatch(/^(\+\d+|\d+)$/);
            }
            
            // Property: Nigerian numbers should be formatted consistently
            if (result.startsWith('+234')) {
              expect(result.length).toBeGreaterThanOrEqual(14);
              expect(result.length).toBeLessThanOrEqual(16);
            }
            
            // Property: Should preserve international format
            if (phone && phone.startsWith('+234') && result) {
              expect(result.startsWith('+234')).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Properties', () => {
    it('should consistently validate profile data', () => {
      fc.assert(
        fc.property(
          fc.record({
            fullname: fc.string({ minLength: 0, maxLength: 150 }),
            email: fc.oneof(fc.emailAddress(), fc.string({ minLength: 0, maxLength: 50 })),
            phone: fc.option(fc.string({ minLength: 0, maxLength: 30 })),
            date_of_birth: fc.option(fc.oneof(
              fc.date().map(d => d.toISOString().split('T')[0]),
              fc.string({ minLength: 0, maxLength: 20 })
            )),
            gender: fc.option(fc.oneof(
              fc.constantFrom('male', 'female', 'other'),
              fc.string({ minLength: 0, maxLength: 20 })
            )),
          }),
          (profileData) => {
            const result = validateAndSanitizeProfile(profileData);
            
            // Property: Should always return a result object
            expect(result).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
            
            // Property: If valid, should have data; if invalid, should have errors
            if (result.isValid) {
              expect(result.data).toBeTruthy();
              expect(Object.keys(result.errors)).toHaveLength(0);
            } else {
              expect(result.data).toBeNull();
              expect(Object.keys(result.errors).length).toBeGreaterThan(0);
            }
            
            // Property: Should validate email format
            if (profileData.email && !profileData.email.includes('@')) {
              expect(result.isValid).toBe(false);
              expect(result.errors.email).toBeTruthy();
            }
            
            // Property: Should validate fullname length
            if (profileData.fullname && profileData.fullname.length < 2) {
              expect(result.isValid).toBe(false);
              expect(result.errors.fullname).toBeTruthy();
            }
            
            // Property: Should validate gender enum
            if (profileData.gender && !['male', 'female', 'other'].includes(profileData.gender)) {
              expect(result.isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});