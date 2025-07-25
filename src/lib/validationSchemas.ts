import { z } from 'zod';

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

// Onboarding schemas
export const linkedInProfileSchema = z.object({
  profileUrl: z.string()
    .url('Please enter a valid URL')
    .refine((url) => url.includes('linkedin.com'), {
      message: 'Please enter a valid LinkedIn profile URL',
    }),
});

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

// Profile schemas
export const profileUpdateSchema = z.object({
  display_name: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

// Export types
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LinkedInProfileFormData = z.infer<typeof linkedInProfileSchema>;
export type GoalsFormData = z.infer<typeof goalsSchema>;
export type ContentPillarsFormData = z.infer<typeof contentPillarsSchema>;
export type GuidesFormData = z.infer<typeof guidesSchema>;
export type PacingFormData = z.infer<typeof pacingSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;