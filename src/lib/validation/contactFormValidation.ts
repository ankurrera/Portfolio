// Shared validation constants and utilities for contact forms

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field length constraints
export const VALIDATION_RULES = {
  name: {
    min: 1,
    max: 100,
  },
  email: {
    max: 255,
  },
  subject: {
    max: 200,
  },
  message: {
    min: 10,
    max: 1000,
  },
} as const;

// Validation error messages
export const VALIDATION_MESSAGES = {
  name: {
    required: 'Name is required',
    tooLong: `Name must be less than ${VALIDATION_RULES.name.max} characters`,
  },
  email: {
    required: 'Email is required',
    invalid: 'Invalid email address',
    tooLong: `Email must be less than ${VALIDATION_RULES.email.max} characters`,
  },
  message: {
    required: 'Message is required',
    tooShort: `Message must be at least ${VALIDATION_RULES.message.min} characters long`,
    tooLong: `Message must be less than ${VALIDATION_RULES.message.max} characters`,
  },
} as const;

// Validate email format
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// Sanitize input to prevent XSS and injection attacks
export function sanitizeInput(input: string): string {
  let sanitized = input
    .replace(/[<>'"]/g, '') // Remove potential HTML/script tags and quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
  
  // Remove event handlers like onclick=, onload=, etc.
  // Repeat until no more matches to handle nested patterns
  let prevLength;
  do {
    prevLength = sanitized.length;
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  } while (sanitized.length !== prevLength);
  
  // Limit length
  return sanitized.substring(0, VALIDATION_RULES.message.max);
}
