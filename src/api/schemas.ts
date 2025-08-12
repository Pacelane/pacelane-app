// API Validation Schemas
// Centralized validation schemas for all API operations
// This replaces the old /lib/validationSchemas.ts file

import { z } from 'zod';

// ========== AUTHENTICATION SCHEMAS ==========

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signUpSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

// ========== PROFILE SCHEMAS ==========

export const profileUpdateSchema = z.object({
  display_name: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

export const linkedInProfileSchema = z.object({
  profileUrl: z.string()
    .url('Please enter a valid URL')
    .refine((url) => url.includes('linkedin.com'), {
      message: 'Please enter a valid LinkedIn profile URL',
    }),
});

// ========== ONBOARDING SCHEMAS ==========

export const goalsSchema = z.object({
  goals: z.array(z.string()).min(1, 'Please select at least one goal'),
});

export const contentPillarsSchema = z.object({
  pillars: z.array(z.string()).min(1, 'Please select at least one content pillar'),
});

export const guidesSchema = z.object({
  guides: z.array(z.string().min(1, 'Guide cannot be empty')).min(1, 'Please add at least one guide'),
});

export const pacingSchema = z.object({
  frequency: z.string().min(1, 'Please select a posting frequency'),
});

export const contactSchema = z.object({
  countryCode: z.string().min(1, 'Please select a country code'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
});

// ========== CONTENT SCHEMAS ==========

export const linkDataSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const fileUploadSchema = z.object({
  file: z.instanceof(File, 'Please select a file'),
  userId: z.string().min(1, 'User ID is required'),
});

// ========== INSPIRATIONS SCHEMAS ==========

export const addInspirationSchema = z.object({
  linkedinUrl: z.string()
    .url('Please enter a valid URL')
    .refine((url) => url.includes('linkedin.com/in/'), {
      message: 'Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)',
    }),
});

// ========== EXPORT TYPES ==========

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type LinkedInProfileFormData = z.infer<typeof linkedInProfileSchema>;
export type GoalsFormData = z.infer<typeof goalsSchema>;
export type ContentPillarsFormData = z.infer<typeof contentPillarsSchema>;
export type GuidesFormData = z.infer<typeof guidesSchema>;
export type PacingFormData = z.infer<typeof pacingSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type LinkDataFormData = z.infer<typeof linkDataSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type AddInspirationFormData = z.infer<typeof addInspirationSchema>;

// ========== VALIDATION HELPERS ==========

/**
 * Validate data against a schema and return formatted errors
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and errors
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.reduce((acc, curr) => {
          const field = curr.path.join('.');
          acc[field] = curr.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    return {
      success: false,
      data: null,
      errors: { general: 'Validation failed' }
    };
  }
};
