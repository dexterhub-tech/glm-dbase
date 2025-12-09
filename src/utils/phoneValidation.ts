/**
 * Phone validation utilities for Nigerian and international phone numbers
 */

/**
 * Validates a phone number format
 * Accepts:
 * - Nigerian numbers starting with 0 (e.g., 07031098097, 08012345678)
 * - International numbers with + prefix (e.g., +2347031098097, +1234567890)
 * - Numbers starting with 1-9 for other countries
 * - Empty/null values (phone is optional)
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || phone.trim() === '') {
    return true; // Phone is optional
  }

  // Clean up the phone number (remove spaces)
  const cleanPhone = phone.replace(/\s+/g, '');
  
  // Regex pattern that matches:
  // - International format: +[1-9]followed by 1-14 digits
  // - Nigerian format: 0[1-9] followed by 8-10 digits
  const phoneRegex = /^(\+?[1-9]\d{1,14}|0[1-9]\d{8,10})$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Formats a phone number by removing extra spaces
 */
export function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') {
    return null;
  }
  
  return phone.replace(/\s+/g, '');
}

/**
 * Gets a user-friendly error message for invalid phone numbers
 */
export function getPhoneValidationMessage(): string {
  return "Please enter a valid phone number (e.g., 07031098097 or +2347031098097)";
}

/**
 * Common Nigerian phone number prefixes for reference
 */
export const NIGERIAN_PHONE_PREFIXES = {
  MTN: ['0703', '0706', '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906'],
  AIRTEL: ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907'],
  GLO: ['0705', '0805', '0807', '0811', '0815', '0905'],
  '9MOBILE': ['0809', '0817', '0818', '0908', '0909'],
};

/**
 * Checks if a phone number appears to be Nigerian based on common prefixes
 */
export function isNigerianPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const cleanPhone = phone.replace(/\s+/g, '');
  
  // Check if it starts with +234 (Nigeria country code)
  if (cleanPhone.startsWith('+234')) {
    return true;
  }
  
  // Check if it starts with 0 and matches Nigerian prefixes
  if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
    const prefix = cleanPhone.substring(0, 4);
    return Object.values(NIGERIAN_PHONE_PREFIXES).some(prefixes => 
      prefixes.includes(prefix)
    );
  }
  
  return false;
}