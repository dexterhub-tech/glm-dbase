import { describe, it, expect } from 'vitest';
import {
  applyProfileDefaults,
  validateAndSanitizeProfile,
  calculateProfileCompletion,
  generateCompletionPrompts,
  formatPhoneNumber,
  sanitizeTextInput,
  getProfileFieldDisplay,
  type ProfileData,
} from './profileDataHandling';

describe('Profile Data Handling', () => {
  describe('applyProfileDefaults', () => {
    it('should apply default values to empty profile', () => {
      const result = applyProfileDefaults({});
      
      expect(result.fullname).toBe('');
      expect(result.email).toBe('');
      expect(result.country).toBe('Nigeria');
      expect(result.preferred_contact_method).toBe('email');
      expect(result.skills_talents).toEqual([]);
      expect(result.interests).toEqual([]);
    });

    it('should preserve existing values and only fill missing ones', () => {
      const input = {
        fullname: 'John Doe',
        email: 'john@example.com',
        phone: '+2348123456789',
      };
      
      const result = applyProfileDefaults(input);
      
      expect(result.fullname).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe('+2348123456789');
      expect(result.country).toBe('Nigeria');
      expect(result.preferred_contact_method).toBe('phone'); // Smart default based on phone
    });
  });

  describe('validateAndSanitizeProfile', () => {
    it('should validate correct profile data', () => {
      const validProfile = {
        fullname: 'John Doe',
        email: 'john@example.com',
        phone: '+2348123456789',
        date_of_birth: '1990-01-01',
        gender: 'male' as const,
      };
      
      const result = validateAndSanitizeProfile(validProfile);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.errors).toEqual({});
    });

    it('should reject invalid email', () => {
      const invalidProfile = {
        fullname: 'John Doe',
        email: 'invalid-email',
      };
      
      const result = validateAndSanitizeProfile(invalidProfile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toContain('Invalid email format');
    });

    it('should reject invalid phone number', () => {
      const invalidProfile = {
        fullname: 'John Doe',
        email: 'john@example.com',
        phone: 'invalid-phone',
      };
      
      const result = validateAndSanitizeProfile(invalidProfile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toContain('Invalid phone number format');
    });
  });

  describe('calculateProfileCompletion', () => {
    it('should calculate completion percentage correctly', () => {
      const partialProfile = {
        fullname: 'John Doe',
        email: 'john@example.com',
        phone: '+2348123456789',
        date_of_birth: '1990-01-01',
        gender: 'male' as const,
      };
      
      const result = calculateProfileCompletion(partialProfile);
      
      expect(result.completionPercentage).toBeGreaterThan(0);
      expect(result.completedCount).toBe(5);
      expect(result.missingRequired).toHaveLength(0); // All required fields provided
    });

    it('should identify missing required fields', () => {
      const incompleteProfile = {
        fullname: 'John Doe',
        email: 'john@example.com',
        // Missing phone, date_of_birth, gender
      };
      
      const result = calculateProfileCompletion(incompleteProfile);
      
      expect(result.missingRequired.length).toBeGreaterThan(0);
      expect(result.missingRequired.some(req => req.field === 'phone')).toBe(true);
      expect(result.missingRequired.some(req => req.field === 'date_of_birth')).toBe(true);
      expect(result.missingRequired.some(req => req.field === 'gender')).toBe(true);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Nigerian phone numbers correctly', () => {
      expect(formatPhoneNumber('08123456789')).toBe('+2348123456789');
      expect(formatPhoneNumber('2348123456789')).toBe('+2348123456789');
      expect(formatPhoneNumber('+2348123456789')).toBe('+2348123456789');
      expect(formatPhoneNumber('8123456789')).toBe('+2348123456789');
    });

    it('should handle empty or invalid input', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber(undefined)).toBe('');
    });
  });

  describe('sanitizeTextInput', () => {
    it('should remove potentially harmful content', () => {
      expect(sanitizeTextInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeTextInput('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeTextInput('onclick=alert("xss")')).toBe('alert("xss")');
    });

    it('should trim whitespace and limit length', () => {
      expect(sanitizeTextInput('  hello world  ')).toBe('hello world');
      expect(sanitizeTextInput('a'.repeat(1500))).toHaveLength(1000);
    });
  });

  describe('getProfileFieldDisplay', () => {
    it('should display values correctly', () => {
      expect(getProfileFieldDisplay('John Doe', 'fullname')).toBe('John Doe');
      expect(getProfileFieldDisplay('', 'fullname', 'No name')).toBe('No name');
      expect(getProfileFieldDisplay(undefined, 'fullname', 'No name')).toBe('No name');
      expect(getProfileFieldDisplay(true, 'is_baptized')).toBe('Yes');
      expect(getProfileFieldDisplay(false, 'is_baptized')).toBe('No');
    });

    it('should format dates correctly', () => {
      const dateString = '1990-01-01';
      const result = getProfileFieldDisplay(dateString, 'date_of_birth');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Should be formatted as date
    });

    it('should handle arrays correctly', () => {
      expect(getProfileFieldDisplay(['skill1', 'skill2'], 'skills_talents')).toBe('skill1, skill2');
      expect(getProfileFieldDisplay([], 'skills_talents', 'No skills')).toBe('No skills');
    });
  });
});