/**
 * Form validation utilities
 */

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationRules = {
  [key: string]: Array<(value: any) => string | null>;
};

/**
 * Common validation functions
 */
export const validators = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (fieldName: string, min: number) => (value: any) => {
    if (value && value.toString().length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (fieldName: string, max: number) => (value: any) => {
    if (value && value.toString().length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  },

  email: (fieldName: string = 'Email') => (value: any) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  phone: (fieldName: string = 'Phone') => (value: any) => {
    if (!value) return null;
    // Accept various phone formats: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
    const phoneRegex = /^[\d\s\-\+\(\)]+$|^$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      return `${fieldName} must be a valid phone number`;
    }
    return null;
  },

  numeric: (fieldName: string) => (value: any) => {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(parseFloat(value))) {
      return `${fieldName} must be a number`;
    }
    return null;
  },

  minValue: (fieldName: string, min: number) => (value: any) => {
    if (value === '' || value === null || value === undefined) return null;
    if (parseFloat(value) < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  maxValue: (fieldName: string, max: number) => (value: any) => {
    if (value === '' || value === null || value === undefined) return null;
    if (parseFloat(value) > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  },

  url: (fieldName: string = 'URL') => (value: any) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return `${fieldName} must be a valid URL`;
    }
  },

  zipCode: (fieldName: string = 'Zip Code') => (value: any) => {
    if (!value) return null;
    // Accept US and Canadian zip codes
    const zipRegex = /^[A-Za-z0-9\s\-]{3,10}$/;
    if (!zipRegex.test(value)) {
      return `${fieldName} must be a valid zip/postal code`;
    }
    return null;
  },
};

/**
 * Validate a single field
 */
export function validateField(
  value: any,
  rules: Array<(value: any) => string | null>
): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/**
 * Validate all fields in a form
 */
export function validateForm(
  formData: Record<string, any>,
  validationRules: ValidationRules
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(validationRules)) {
    const error = validateField(formData[field], rules);
    if (error) {
      errors.push({ field, message: error });
    }
  }

  return errors;
}

/**
 * Convert validation errors array to a map for easy lookup
 */
export function errorsToMap(errors: ValidationError[]): Record<string, string> {
  return errors.reduce((acc, err) => {
    acc[err.field] = err.message;
    return acc;
  }, {} as Record<string, string>);
}
