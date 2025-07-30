-- Add LinkedIn data storage columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN linkedin_data JSONB,
ADD COLUMN linkedin_name TEXT,
ADD COLUMN linkedin_company TEXT,
ADD COLUMN linkedin_about TEXT,
ADD COLUMN linkedin_location TEXT,
ADD COLUMN linkedin_headline TEXT,
ADD COLUMN linkedin_scraped_at TIMESTAMP WITH TIME ZONE;