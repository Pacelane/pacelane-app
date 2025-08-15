-- Migration: Add email field to profiles table
-- Date: 2025-08-14
-- Description: Add email field to profiles table for user matching in webhooks

-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update existing profiles with email from auth.users
-- This will populate the email field for existing users
UPDATE public.profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE public.profiles.user_id = auth.users.id;

-- Add RLS policy for email field
CREATE POLICY "Users can view email in profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Add trigger to automatically update email when auth.users.email changes
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile email when auth user email changes
  IF TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles 
    SET email = NEW.email 
    WHERE user_id = NEW.id;
  END IF;
  
  -- Insert profile with email when new auth user is created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (user_id, display_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), NEW.email)
    ON CONFLICT (user_id) 
    DO UPDATE SET email = EXCLUDED.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_email_change ON auth.users;
CREATE TRIGGER on_auth_user_email_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_profile_email();

