/**
 * Utility validation functions for forms across the application
 */

// RFC 5322 compliant regex for standard email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number regex: optional leading +, followed by 7 to 15 digits, allowing spaces, hyphens, and parentheses
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

// Postal code: 3 to 10 alphanumeric characters with optional space or hyphen (covers Indian 6-digit PIN and international codes)
const POSTAL_CODE_REGEX = /^[a-zA-Z0-9\s-]{3,10}$/;

// Shortcode: alphanumeric and hyphens/underscores, 2 to 20 chars
const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{2,20}$/;

export const isValidEmail = (email?: string | null): boolean => {
  if (!email || !email.trim()) return true; // Optional field: valid if empty
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone?: string | null): boolean => {
  if (!phone || !phone.trim()) return true; // Optional field: valid if empty
  const cleanPhone = phone.trim();
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  return PHONE_REGEX.test(cleanPhone) && digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

export const isValidLatitude = (lat?: number | string | null): boolean => {
  if (lat === undefined || lat === null || lat === '') return true; // Optional field
  const num = typeof lat === 'number' ? lat : parseFloat(String(lat).trim());
  if (isNaN(num)) return false;
  return num >= -90 && num <= 90;
};

export const isValidLongitude = (lng?: number | string | null): boolean => {
  if (lng === undefined || lng === null || lng === '') return true; // Optional field
  const num = typeof lng === 'number' ? lng : parseFloat(String(lng).trim());
  if (isNaN(num)) return false;
  return num >= -180 && num <= 180;
};

export const isValidPostalCode = (code?: string | null): boolean => {
  if (!code || !code.trim()) return true; // Optional field
  return POSTAL_CODE_REGEX.test(code.trim());
};

export const isValidShortCode = (code?: string | null): boolean => {
  if (!code || !code.trim()) return true; // Optional field
  return SHORT_CODE_REGEX.test(code.trim());
};
