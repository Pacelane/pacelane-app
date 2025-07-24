-- Add new columns to profiles table for storing onboarding data
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN goals JSONB,
ADD COLUMN content_guides JSONB,
ADD COLUMN pacing_preferences JSONB;