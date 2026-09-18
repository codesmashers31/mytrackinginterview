// server/utils/phoneUtils.js

/**
 * Normalizes any phone number string into a clean 10-digit number for Indian mobile numbers.
 * Strips non-digits, country code (+91 / 91), and leading zeros.
 * @param {string|number} raw 
 * @returns {string} 10-digit phone number or raw digits if length != 10
 */
export const normalizePhone = (raw) => {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

/**
 * Generates an array of phone representations/variants for querying MongoDB.
 * Example: '9876543210' -> ['9876543210', '919876543210', '+919876543210', '+91 9876543210', '09876543210']
 * @param {string|number} raw 
 * @returns {string[]}
 */
export const getPhoneVariants = (raw) => {
  if (!raw) return [];
  const clean10 = normalizePhone(raw);
  if (!clean10) return [];
  
  const rawStr = String(raw).trim();
  const variants = new Set([
    rawStr,
    clean10,
    `91${clean10}`,
    `+91${clean10}`,
    `+91 ${clean10}`,
    `0${clean10}`
  ]);
  return Array.from(variants);
};

/**
 * Builds an $or query array for matching student by phone variants or email.
 * @param {string} mobile 
 * @param {string} email 
 * @returns {object[]}
 */
export const buildPhoneOrEmailQuery = (mobile, email) => {
  const orConditions = [];
  if (mobile) {
    const variants = getPhoneVariants(mobile);
    if (variants.length > 0) {
      orConditions.push({ mobile: { $in: variants } });
    }
  }
  if (email) {
    const em = email.trim().toLowerCase();
    if (em) {
      orConditions.push({ email: em });
    }
  }
  return orConditions;
};
