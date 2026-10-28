export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a Product ID against business requirements:
 * - Must not be empty or whitespace only
 * - Must be trimmed
 * - Must not duplicate an existing product ID (case-insensitive check option)
 */
export function validateProductId(
  id: string,
  existingIds: string[] = [],
  excludeSelfId?: string
): ValidationResult {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'Product ID is required.' };
  }

  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Product ID cannot be blank or contain only whitespace.' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Product ID must be at least 2 characters long.' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Product ID must not exceed 30 characters.' };
  }

  const isDuplicate = existingIds.some(
    existing => existing.toLowerCase() === trimmed.toLowerCase() && existing.toLowerCase() !== excludeSelfId?.toLowerCase()
  );

  if (isDuplicate) {
    return { isValid: false, error: `Product ID "${trimmed}" already exists. Product IDs must be unique.` };
  }

  return { isValid: true };
}

/**
 * Validates a Product Name:
 * - Must not be empty or whitespace only
 * - Must be trimmed
 */
export function validateProductName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Product name is required.' };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Product name cannot be blank or contain only whitespace.' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Product name must be at least 2 characters long.' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Product name must not exceed 100 characters.' };
  }

  return { isValid: true };
}

/**
 * Validates a Stock Quantity:
 * - Must be a whole number (integer)
 * - Must be >= 0 (allows 0)
 * - Rejects negative values, decimals, non-numeric values, and numbers > 1,000,000
 */
export function validateStockQuantity(value: string | number): ValidationResult {
  if (value === '' || value === null || value === undefined) {
    return { isValid: false, error: 'Stock quantity is required.' };
  }

  const strVal = String(value).trim();
  if (strVal.length === 0) {
    return { isValid: false, error: 'Stock quantity cannot be blank.' };
  }

  // Check for non-numeric characters (allow optional positive sign, but no decimals or letters)
  if (!/^-?\d+(\.\d+)?$/.test(strVal)) {
    return { isValid: false, error: 'Enter a valid whole number (non-numeric input is not allowed).' };
  }

  if (strVal.includes('.')) {
    return { isValid: false, error: 'Decimal quantities are not allowed. Enter a whole number.' };
  }

  const num = Number(strVal);

  if (!Number.isInteger(num)) {
    return { isValid: false, error: 'Enter a valid non-negative whole number.' };
  }

  if (num < 0) {
    return { isValid: false, error: 'Quantity cannot be negative. Stock must be zero or greater.' };
  }

  if (num > 1000000) {
    return { isValid: false, error: 'Quantity exceeds maximum allowed limit (1,000,000 units).' };
  }

  return { isValid: true };
}

/**
 * Validates an Order Quantity:
 * - Must be a positive integer (> 0)
 * - Must be <= available stock
 */
export function validateOrderQuantity(
  value: string | number,
  availableStock: number
): ValidationResult {
  const stockVal = validateStockQuantity(value);
  if (!stockVal.isValid) {
    return stockVal;
  }

  const num = Number(value);
  if (num <= 0) {
    return { isValid: false, error: 'Order quantity must be at least 1 unit.' };
  }

  if (num > availableStock) {
    return {
      isValid: false,
      error: `Requested quantity (${num}) exceeds available stock (${availableStock} available).`,
    };
  }

  return { isValid: true };
}
