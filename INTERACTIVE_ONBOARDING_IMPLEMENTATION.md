# Interactive Onboarding Implementation Plan

## Overview
Transform the current static onboarding flow into an interactive, real-time experience where users build their content environment while watching LinkedIn profiles and posts being analyzed in real-time.

## Current Issues
- **Data Modeling**: Dual storage of LinkedIn data (profiles table + inspirations table)
- **No Real-time Feedback**: Users don't see scraping progress or results
- **Unused Capabilities**: `linkedin-post-scraper` function exists but isn't used in onboarding
- **Poor UX**: Static forms with no engagement or validation

## Implementation Phases

### Phase 1: Database Schema Migration

#### 1.1 Create Migration File
```sql
-- File: supabase/migrations/20250116000000_redesign_onboarding_schema.sql

-- Clean up existing problematic columns
ALTER TABLE profiles DROP COLUMN IF EXISTS inspirations;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_about;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_company;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_data;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_headline;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_location;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_profile;
ALTER TABLE profiles DROP COLUMN IF EXISTS linkedin_scraped_at;

-- Add clean user profile storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_linkedin_profile JSONB;

-- Enhance inspirations table with post analysis
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS posts_data JSONB;
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS content_analysis JSONB;
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS posting_patterns JSONB;
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS writing_style JSONB;
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS last_posts_scraped_at TIMESTAMP WITH TIME ZONE;

-- Create scraping jobs tracking table
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('user_profile', 'inspiration_profile', 'inspiration_posts')),
  target_id UUID, -- References inspirations.id when applicable
  linkedin_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_step TEXT,
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create onboarding progress tracking
CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  current_step TEXT NOT NULL,
  step_data JSONB NOT NULL DEFAULT '{}',
  completed_steps TEXT[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profile cache for performance
CREATE TABLE IF NOT EXISTS profile_cache (
  url_hash TEXT PRIMARY KEY,
  profile_data JSONB NOT NULL,
  posts_data JSONB,
  content_analysis JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scraping jobs" ON scraping_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scraping jobs" ON scraping_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scraping jobs" ON scraping_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own onboarding progress" ON onboarding_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own onboarding progress" ON onboarding_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read profile cache" ON profile_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage profile cache" ON profile_cache FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_profile_cache_expires_at ON profile_cache(expires_at);

-- Add updated_at trigger for onboarding_progress
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_onboarding_progress_updated_at 
    BEFORE UPDATE ON onboarding_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Phase 2: Enhanced Edge Functions

#### 2.1 Create Enhanced LinkedIn Scraper
```typescript
// File: supabase/functions/enhanced-linkedin-scraper/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ScrapingRequest {
  jobId: string;
  linkedinUrl: string;
  userId: string;
  targetType: 'user_profile' | 'inspiration_profile' | 'inspiration_posts';
}

class EnhancedLinkedInScraper {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async updateJobProgress(jobId: string, percentage: number, step: string, status: string = 'running') {
    await this.supabase
      .from('scraping_jobs')
      .update({ 
        progress_percentage: percentage, 
        current_step: step,
        status: status,
        started_at: status === 'running' ? new Date().toISOString() : undefined
      })
      .eq('id', jobId);
  }

  async checkCache(url: string) {
    const urlHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(url)
    );
    const hashHex = Array.from(new Uint8Array(urlHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data } = await this.supabase
      .from('profile_cache')
      .select('*')
      .eq('url_hash', hashHex)
      .gt('expires_at', new Date().toISOString())
      .single();

    return data;
  }

  async cacheResult(url: string, profileData: any, postsData: any = null, analysis: any = null) {
    const urlHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(url)
    );
    const hashHex = Array.from(new Uint8Array(urlHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

    await this.supabase
      .from('profile_cache')
      .upsert({
        url_hash: hashHex,
        profile_data: profileData,
        posts_data: postsData,
        content_analysis: analysis,
        expires_at: expiresAt.toISOString()
      });
  }

  async scrapeProfile(url: string, jobId: string) {
    await this.updateJobProgress(jobId, 10, 'Checking profile accessibility...');
    
    // Check cache first
    const cached = await this.checkCache(url);
    if (cached) {
      await this.updateJobProgress(jobId, 100, 'Retrieved from cache', 'completed');
      return {
        profile: cached.profile_data,
        posts: cached.posts_data,
        analysis: cached.content_analysis
      };
    }

    await this.updateJobProgress(jobId, 20, 'Extracting profile information...');
    
    // Use existing linkedin-post-scraper logic here
    // This is a simplified version - use your existing scraping logic
    const profileData = await this.extractProfileData(url);
    
    await this.updateJobProgress(jobId, 50, 'Analyzing recent posts...');
    
    const postsData = await this.extractPostsData(url);
    
    await this.updateJobProgress(jobId, 80, 'Generating content insights...');
    
    const analysis = await this.analyzeContent(profileData, postsData);
    
    await this.updateJobProgress(jobId, 95, 'Caching results...');
    
    await this.cacheResult(url, profileData, postsData, analysis);
    
    await this.updateJobProgress(jobId, 100, 'Analysis complete!', 'completed');
    
    return { profile: profileData, posts: postsData, analysis };
  }

  async extractProfileData(url: string) {
    // Implement your existing profile scraping logic
    // Return structured profile data
    return {
      fullname: "Example User",
      headline: "Example Headline",
      about: "Example about section",
      location: "Example Location",
      company: "Example Company"
    };
  }

  async extractPostsData(url: string) {
    // Implement your existing posts scraping logic
    // Return array of recent posts
    return [];
  }

  async analyzeContent(profileData: any, postsData: any[]) {
    // Implement AI content analysis
    return {
      contentThemes: ["leadership", "technology", "business"],
      writingStyle: {
        tone: "professional",
        avgLength: 150,
        vocabularyLevel: "intermediate"
      },
      postingPatterns: {
        frequency: "3x per week",
        bestTimes: ["9am", "2pm", "6pm"],
        avgEngagement: 85
      }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { jobId, linkedinUrl, userId, targetType } = await req.json() as ScrapingRequest;
    
    const scraper = new EnhancedLinkedInScraper();
    
    // Update job to running
    await scraper.updateJobProgress(jobId, 0, 'Starting analysis...', 'running');
    
    // Perform scraping
    const result = await scraper.scrapeProfile(linkedinUrl, jobId);
    
    // Update job with final result
    await scraper.supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        result_data: result,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

### Phase 3: New Service Layer

#### 3.1 Scraping Service
```typescript
// File: src/services/scrapingService.ts

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';

export interface ScrapingJob {
  id: string;
  user_id: string;
  target_type: string;
  target_id?: string;
  linkedin_url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percentage: number;
  current_step?: string;
  result_data?: any;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export class ScrapingService {
  /**
   * Start a new scraping job
   */
  static async startScrapingJob(
    userId: string,
    linkedinUrl: string,
    targetType: 'user_profile' | 'inspiration_profile' | 'inspiration_posts',
    targetId?: string
  ): Promise<ApiResponse<ScrapingJob>> {
    try {
      console.log('ScrapingService: Starting scraping job', { userId, linkedinUrl, targetType });

      // Create scraping job record
      const { data: job, error: jobError } = await supabase
        .from('scraping_jobs')
        .insert({
          user_id: userId,
          linkedin_url: linkedinUrl,
          target_type: targetType,
          target_id: targetId,
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) {
        console.error('ScrapingService: Failed to create job', jobError);
        throw jobError;
      }

      // Trigger edge function
      const { error: functionError } = await supabase.functions.invoke(
        'enhanced-linkedin-scraper',
        {
          body: {
            jobId: job.id,
            linkedinUrl,
            userId,
            targetType
          }
        }
      );

      if (functionError) {
        console.error('ScrapingService: Failed to trigger scraping', functionError);
        // Update job status to failed
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'failed', 
            error_message: functionError.message 
          })
          .eq('id', job.id);
        throw functionError;
      }

      console.log('ScrapingService: Scraping job started successfully', job.id);
      return { data: job };

    } catch (error: any) {
      console.error('ScrapingService: startScrapingJob failed', error);
      return { error: error.message || 'Failed to start scraping job' };
    }
  }

  /**
   * Get scraping job progress
   */
  static async getJobProgress(jobId: string): Promise<ApiResponse<ScrapingJob>> {
    try {
      const { data: job, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('ScrapingService: Failed to get job progress', error);
        throw error;
      }

      return { data: job };

    } catch (error: any) {
      console.error('ScrapingService: getJobProgress failed', error);
      return { error: error.message || 'Failed to get job progress' };
    }
  }

  /**
   * Subscribe to real-time job updates
   */
  static subscribeToJobProgress(
    jobId: string,
    onUpdate: (job: ScrapingJob) => void,
    onError: (error: any) => void
  ) {
    const subscription = supabase
      .from('scraping_jobs')
      .on('UPDATE', { filter: `id=eq.${jobId}` }, (payload) => {
        onUpdate(payload.new as ScrapingJob);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get user's scraping jobs
   */
  static async getUserJobs(userId: string): Promise<ApiResponse<ScrapingJob[]>> {
    try {
      const { data: jobs, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('ScrapingService: Failed to get user jobs', error);
        throw error;
      }

      return { data: jobs || [] };

    } catch (error: any) {
      console.error('ScrapingService: getUserJobs failed', error);
      return { error: error.message || 'Failed to get user jobs' };
    }
  }
}
```

#### 3.2 Enhanced Onboarding Service
```typescript
// File: src/services/onboardingService.ts

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';

export interface OnboardingProgress {
  user_id: string;
  current_step: string;
  step_data: any;
  completed_steps: string[];
  started_at: string;
  updated_at: string;
}

export class OnboardingService {
  /**
   * Save onboarding progress
   */
  static async saveProgress(
    userId: string,
    step: string,
    stepData: any,
    completedSteps?: string[]
  ): Promise<ApiResponse<OnboardingProgress>> {
    try {
      console.log('OnboardingService: Saving progress', { userId, step });

      const { data: progress, error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: userId,
          current_step: step,
          step_data: stepData,
          completed_steps: completedSteps,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('OnboardingService: Failed to save progress', error);
        throw error;
      }

      return { data: progress };

    } catch (error: any) {
      console.error('OnboardingService: saveProgress failed', error);
      return { error: error.message || 'Failed to save progress' };
    }
  }

  /**
   * Get onboarding progress
   */
  static async getProgress(userId: string): Promise<ApiResponse<OnboardingProgress | null>> {
    try {
      const { data: progress, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('OnboardingService: Failed to get progress', error);
        throw error;
      }

      return { data: progress };

    } catch (error: any) {
      console.error('OnboardingService: getProgress failed', error);
      return { error: error.message || 'Failed to get progress' };
    }
  }

  /**
   * Mark step as completed
   */
  static async completeStep(userId: string, step: string): Promise<ApiResponse<void>> {
    try {
      // Get current progress
      const { data: currentProgress } = await this.getProgress(userId);
      
      const completedSteps = currentProgress?.completed_steps || [];
      if (!completedSteps.includes(step)) {
        completedSteps.push(step);
      }

      await this.saveProgress(userId, step, {}, completedSteps);
      return { data: undefined };

    } catch (error: any) {
      console.error('OnboardingService: completeStep failed', error);
      return { error: error.message || 'Failed to complete step' };
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static async isOnboardingComplete(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: progress } = await this.getProgress(userId);
      
      if (!progress) {
        return { data: false };
      }

      const requiredSteps = [
        'linkedin-profile',
        'inspirations',
        'content-strategy',
        'goals-preferences',
        'notifications'
      ];

      const completedSteps = progress.completed_steps || [];
      const isComplete = requiredSteps.every(step => completedSteps.includes(step));

      return { data: isComplete };

    } catch (error: any) {
      console.error('OnboardingService: isOnboardingComplete failed', error);
      return { error: error.message || 'Failed to check onboarding status' };
    }
  }
}
```

### Phase 4: New Frontend Components

#### 4.1 Scraping Progress Component
```jsx
// File: src/design-system/components/ScrapingProgressCard.jsx

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { ScrapingService } from '@/services/scrapingService';

// Design System Components
import ProgressBar from '@/design-system/components/ProgressBar';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ScrapingProgressCard = ({ 
  jobId, 
  onComplete, 
  onError,
  title = "Analyzing LinkedIn Profile" 
}) => {
  const { colors } = useTheme();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    // Subscribe to real-time updates
    const unsubscribe = ScrapingService.subscribeToJobProgress(
      jobId,
      (updatedJob) => {
        setJob(updatedJob);
        
        if (updatedJob.status === 'completed') {
          onComplete?.(updatedJob.result_data);
        } else if (updatedJob.status === 'failed') {
          const errorMsg = updatedJob.error_message || 'Scraping failed';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      },
      (err) => {
        console.error('Real-time subscription error:', err);
        setError('Connection error occurred');
        onError?.(err);
      }
    );

    return unsubscribe;
  }, [jobId, onComplete, onError]);

  const getStatusIcon = () => {
    if (error || job?.status === 'failed') {
      return <AlertCircle size={20} color={colors.icon.destructive} />;
    }
    
    if (job?.status === 'completed') {
      return <CheckCircle size={20} color={colors.icon.success} />;
    }
    
    return <Loader2 size={20} color={colors.icon.default} className="animate-spin" />;
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (job?.status === 'failed') return job.error_message || 'Analysis failed';
    if (job?.status === 'completed') return 'Analysis complete!';
    return job?.current_step || 'Starting analysis...';
  };

  const containerStyles = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[24],
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    minHeight: '200px',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  };

  const progressValue = job?.progress_percentage || 0;

  return (
    <div style={containerStyles}>
      {/* Animated mascot */}
      <div style={{ 
        animation: job?.status === 'running' ? 'pulse 2s infinite' : 'none' 
      }}>
        <Bichaurinho variant={12} size={64} />
      </div>

      {/* Title */}
      <h3 style={{
        ...textStyles.lg.semibold,
        color: colors.text.default,
        margin: 0
      }}>
        {title}
      </h3>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '300px' }}>
        <ProgressBar 
          value={progressValue} 
          showPercentage={true}
          color={error ? colors.border.destructive : colors.bg.state.primary}
        />
      </div>

      {/* Status message with icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.spacing[8]
      }}>
        {getStatusIcon()}
        <span style={{
          ...textStyles.sm.medium,
          color: error ? colors.text.destructive : colors.text.subtle
        }}>
          {getStatusMessage()}
        </span>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ScrapingProgressCard;
```

#### 4.2 Inspiration Analysis Card
```jsx
// File: src/design-system/components/InspirationAnalysisCard.jsx

import React from 'react';
import { useTheme } from '@/services/theme-context';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { TrendingUp, Calendar, Target, PenTool } from 'lucide-react';

const InspirationAnalysisCard = ({ inspiration, analysis }) => {
  const { colors } = useTheme();

  const cardStyles = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[20],
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16]
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    paddingBottom: spacing.spacing[12],
    borderBottom: `1px solid ${colors.border.default}`
  };

  const sectionStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8]
  };

  const tagStyles = {
    display: 'inline-block',
    backgroundColor: colors.bg.state.soft,
    color: colors.text.default,
    padding: `${spacing.spacing[4]}px ${spacing.spacing[8]}px`,
    borderRadius: cornerRadius.borderRadius.sm,
    fontSize: textStyles.xs.medium.fontSize,
    fontWeight: textStyles.xs.medium.fontWeight
  };

  return (
    <div style={cardStyles}>
      {/* Profile Header */}
      <div style={headerStyles}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: cornerRadius.borderRadius.full,
          backgroundColor: colors.bg.state.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: textStyles.md.semibold.fontWeight
        }}>
          {inspiration?.name?.charAt(0) || '?'}
        </div>
        
        <div style={{ flex: 1 }}>
          <h4 style={{
            ...textStyles.md.semibold,
            color: colors.text.default,
            margin: 0
          }}>
            {inspiration?.name || 'LinkedIn Profile'}
          </h4>
          <p style={{
            ...textStyles.sm.normal,
            color: colors.text.subtle,
            margin: 0
          }}>
            {inspiration?.headline || inspiration?.company}
          </p>
        </div>
      </div>

      {/* Content Themes */}
      {analysis?.contentThemes && (
        <div style={sectionStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <Target size={16} color={colors.icon.default} />
            <span style={{
              ...textStyles.sm.semibold,
              color: colors.text.default
            }}>
              Content Themes
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: spacing.spacing[8] 
          }}>
            {analysis.contentThemes.map((theme, index) => (
              <span key={index} style={tagStyles}>
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Writing Style */}
      {analysis?.writingStyle && (
        <div style={sectionStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <PenTool size={16} color={colors.icon.default} />
            <span style={{
              ...textStyles.sm.semibold,
              color: colors.text.default
            }}>
              Writing Style
            </span>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: spacing.spacing[8] 
          }}>
            <div>
              <span style={{
                ...textStyles.xs.medium,
                color: colors.text.subtle
              }}>
                Tone
              </span>
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.default,
                margin: 0,
                textTransform: 'capitalize'
              }}>
                {analysis.writingStyle.tone}
              </p>
            </div>
            <div>
              <span style={{
                ...textStyles.xs.medium,
                color: colors.text.subtle
              }}>
                Avg Length
              </span>
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.default,
                margin: 0
              }}>
                {analysis.writingStyle.avgLength} words
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Posting Patterns */}
      {analysis?.postingPatterns && (
        <div style={sectionStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
            <Calendar size={16} color={colors.icon.default} />
            <span style={{
              ...textStyles.sm.semibold,
              color: colors.text.default
            }}>
              Posting Patterns
            </span>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: spacing.spacing[8] 
          }}>
            <div>
              <span style={{
                ...textStyles.xs.medium,
                color: colors.text.subtle
              }}>
                Frequency
              </span>
              <p style={{
                ...textStyles.sm.normal,
                color: colors.text.default,
                margin: 0
              }}>
                {analysis.postingPatterns.frequency}
              </p>
            </div>
            <div>
              <span style={{
                ...textStyles.xs.medium,
                color: colors.text.subtle
              }}>
                Avg Engagement
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[4] }}>
                <TrendingUp size={14} color={colors.icon.success} />
                <span style={{
                  ...textStyles.sm.normal,
                  color: colors.text.default
                }}>
                  {analysis.postingPatterns.avgEngagement}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationAnalysisCard;
```

### Phase 5: New Onboarding Pages

#### 5.1 Enhanced LinkedIn Profile Step
```jsx
// File: src/pages/Onboarding/LinkedInProfileStep.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { ScrapingService } from '@/services/scrapingService';
import { OnboardingService } from '@/services/onboardingService';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';
import ScrapingProgressCard from '@/design-system/components/ScrapingProgressCard';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { ArrowLeft, ArrowRight, LinkedinIcon } from 'lucide-react';

const LinkedInProfileStep = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [scrapingJob, setScrapingJob] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUrlSubmit = async () => {
    if (!linkedinUrl.trim()) {
      toast.error('Please enter your LinkedIn profile URL');
      return;
    }

    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsLoading(true);

    try {
      // Start scraping job
      const { data: job, error } = await ScrapingService.startScrapingJob(
        user.id,
        linkedinUrl,
        'user_profile'
      );

      if (error) {
        toast.error(error);
        return;
      }

      setScrapingJob(job);
      
      // Save progress
      await OnboardingService.saveProgress(user.id, 'linkedin-profile', {
        linkedin_url: linkedinUrl,
        scraping_job_id: job.id
      });

    } catch (error) {
      console.error('Failed to start scraping:', error);
      toast.error('Failed to start profile analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapingComplete = (data) => {
    setProfileData(data);
    toast.success('Profile analysis complete!');
    
    // Auto-advance after showing results
    setTimeout(() => {
      OnboardingService.completeStep(user.id, 'linkedin-profile');
      navigate('/onboarding/inspirations');
    }, 3000);
  };

  const handleScrapingError = (error) => {
    console.error('Scraping failed:', error);
    toast.error('Profile analysis failed. You can continue manually.');
  };

  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    color: colors.text.default,
    margin: 0,
    textAlign: 'center'
  };

  const subtitleStyle = {
    ...textStyles.lg.normal,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
    textAlign: 'center',
    maxWidth: '600px'
  };

  const containerStyles = {
    minHeight: '100vh',
    backgroundColor: colors.bg.default,
    display: 'flex',
    flexDirection: 'column'
  };

  const contentStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spacing[40],
    gap: spacing.spacing[32]
  };

  const formStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[20],
    width: '100%',
    maxWidth: '500px'
  };

  return (
    <div style={containerStyles}>
      <TopNav />
      
      <div style={contentStyles}>
        <OnboardingProgressIndicator 
          currentStep={2} 
          totalSteps={7} 
          stepName="Your LinkedIn Profile"
        />

        <div style={{ textAlign: 'center' }}>
          <h1 style={titleStyle}>Let's analyze your LinkedIn</h1>
          <p style={subtitleStyle}>
            We'll analyze your profile and recent posts to understand your content style and create personalized recommendations.
          </p>
        </div>

        {!scrapingJob && !profileData && (
          <div style={formStyles}>
            <Input
              label="LinkedIn Profile URL"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              leadIcon={<LinkedinIcon size={16} />}
              helpText="We'll extract your public profile information and recent posts"
            />
            
            <Button
              label="Analyze My Profile"
              style="primary"
              size="lg"
              onClick={handleUrlSubmit}
              loading={isLoading}
              tailIcon={<ArrowRight size={16} />}
              disabled={!linkedinUrl.trim()}
            />
          </div>
        )}

        {scrapingJob && !profileData && (
          <ScrapingProgressCard
            jobId={scrapingJob.id}
            title="Analyzing Your LinkedIn Profile"
            onComplete={handleScrapingComplete}
            onError={handleScrapingError}
          />
        )}

        {profileData && (
          <div style={{
            backgroundColor: colors.bg.card.default,
            padding: spacing.spacing[24],
            borderRadius: '12px',
            border: `1px solid ${colors.border.default}`,
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h3 style={{
              ...textStyles.lg.semibold,
              color: colors.text.default,
              margin: 0,
              marginBottom: spacing.spacing[8]
            }}>
              Analysis Complete! ✨
            </h3>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0
            }}>
              We've analyzed your profile and {profileData.posts?.length || 0} recent posts. 
              Moving to the next step...
            </p>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '500px'
        }}>
          <Button
            label="Back"
            style="ghost"
            leadIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/onboarding/welcome')}
          />
          
          {profileData && (
            <Button
              label="Continue"
              style="primary"
              tailIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/onboarding/inspirations')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkedInProfileStep;
```

#### 5.2 Enhanced Inspirations Step
```jsx
// File: src/pages/Onboarding/InspirationsStep.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { ScrapingService } from '@/services/scrapingService';
import { OnboardingService } from '@/services/onboardingService';
import { InspirationsService } from '@/services/inspirationsService';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';
import ScrapingProgressCard from '@/design-system/components/ScrapingProgressCard';
import InspirationAnalysisCard from '@/design-system/components/InspirationAnalysisCard';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { ArrowLeft, ArrowRight, Plus, LinkedinIcon } from 'lucide-react';

const InspirationsStep = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  
  const [newInspirationUrl, setNewInspirationUrl] = useState('');
  const [inspirations, setInspirations] = useState([]);
  const [activeScrapingJobs, setActiveScrapingJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addInspiration = async () => {
    if (!newInspirationUrl.trim()) {
      toast.error('Please enter a LinkedIn profile URL');
      return;
    }

    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsLoading(true);

    try {
      // First, add to inspirations table
      const { data: inspiration, error: addError } = await InspirationsService.addInspiration(
        user.id,
        { linkedinUrl: newInspirationUrl }
      );

      if (addError) {
        toast.error(addError);
        return;
      }

      // Start scraping job for profile analysis
      const { data: profileJob, error: profileError } = await ScrapingService.startScrapingJob(
        user.id,
        newInspirationUrl,
        'inspiration_profile',
        inspiration.id
      );

      if (profileError) {
        toast.error('Failed to start profile analysis');
        return;
      }

      // Start scraping job for posts analysis
      const { data: postsJob, error: postsError } = await ScrapingService.startScrapingJob(
        user.id,
        newInspirationUrl,
        'inspiration_posts',
        inspiration.id
      );

      if (postsError) {
        console.warn('Failed to start posts analysis, continuing with profile only');
      }

      // Add to active jobs
      const jobs = [profileJob];
      if (postsJob) jobs.push(postsJob);
      
      setActiveScrapingJobs(prev => [...prev, ...jobs]);
      setNewInspirationUrl('');
      
      toast.success('Started analyzing inspiration profile');

    } catch (error) {
      console.error('Failed to add inspiration:', error);
      toast.error('Failed to add inspiration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapingComplete = async (jobId, data) => {
    // Remove completed job from active jobs
    setActiveScrapingJobs(prev => prev.filter(job => job.id !== jobId));
    
    // Reload inspirations to get updated data
    await loadInspirations();
  };

  const loadInspirations = async () => {
    if (!user) return;

    const { data, error } = await InspirationsService.loadUserInspirations(user.id);
    if (error) {
      console.error('Failed to load inspirations:', error);
      return;
    }

    setInspirations(data || []);
  };

  const handleContinue = async () => {
    if (inspirations.length === 0) {
      toast.error('Please add at least one inspiration profile');
      return;
    }

    // Save progress
    await OnboardingService.saveProgress(user.id, 'inspirations', {
      inspirations: inspirations.map(i => i.id)
    });

    await OnboardingService.completeStep(user.id, 'inspirations');
    navigate('/onboarding/content-strategy');
  };

  useEffect(() => {
    loadInspirations();
  }, [user]);

  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    color: colors.text.default,
    margin: 0,
    textAlign: 'center'
  };

  const subtitleStyle = {
    ...textStyles.lg.normal,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
    textAlign: 'center',
    maxWidth: '600px'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg.default,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <TopNav />
      
      <div style={{
        flex: 1,
        padding: spacing.spacing[40],
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <OnboardingProgressIndicator 
          currentStep={3} 
          totalSteps={7} 
          stepName="Content Inspirations"
        />

        <div style={{ 
          textAlign: 'center', 
          marginBottom: spacing.spacing[40] 
        }}>
          <h1 style={titleStyle}>Who inspires your content?</h1>
          <p style={subtitleStyle}>
            Add LinkedIn profiles of people whose content style you admire. 
            We'll analyze their posting patterns and help you develop your unique voice.
          </p>
        </div>

        {/* Add new inspiration */}
        <div style={{
          display: 'flex',
          gap: spacing.spacing[12],
          marginBottom: spacing.spacing[32],
          maxWidth: '600px',
          margin: `0 auto ${spacing.spacing[32]}px auto`
        }}>
          <Input
            placeholder="https://linkedin.com/in/inspiration-profile"
            value={newInspirationUrl}
            onChange={(e) => setNewInspirationUrl(e.target.value)}
            leadIcon={<LinkedinIcon size={16} />}
            style={{ flex: 1 }}
          />
          <Button
            label="Add"
            style="primary"
            leadIcon={<Plus size={16} />}
            onClick={addInspiration}
            loading={isLoading}
            disabled={!newInspirationUrl.trim()}
          />
        </div>

        {/* Active scraping jobs */}
        {activeScrapingJobs.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: spacing.spacing[20],
            marginBottom: spacing.spacing[32]
          }}>
            {activeScrapingJobs.map(job => (
              <ScrapingProgressCard
                key={job.id}
                jobId={job.id}
                title={`Analyzing ${job.target_type === 'inspiration_profile' ? 'Profile' : 'Posts'}`}
                onComplete={(data) => handleScrapingComplete(job.id, data)}
                onError={(error) => console.error('Scraping error:', error)}
              />
            ))}
          </div>
        )}

        {/* Completed inspirations */}
        {inspirations.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: spacing.spacing[20],
            marginBottom: spacing.spacing[40]
          }}>
            {inspirations.map(inspiration => (
              <InspirationAnalysisCard
                key={inspiration.id}
                inspiration={inspiration}
                analysis={inspiration.content_analysis}
              />
            ))}
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button
            label="Back"
            style="ghost"
            leadIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/onboarding/linkedin-profile')}
          />
          
          <div style={{
            ...textStyles.sm.medium,
            color: colors.text.subtle
          }}>
            {inspirations.length} inspiration{inspirations.length !== 1 ? 's' : ''} added
          </div>
          
          <Button
            label="Continue"
            style="primary"
            tailIcon={<ArrowRight size={16} />}
            onClick={handleContinue}
            disabled={inspirations.length === 0 && activeScrapingJobs.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default InspirationsStep;
```

### Phase 6: Update App Routing

#### 6.1 Update App.tsx
```jsx
// File: src/App.tsx
// Replace the existing onboarding routes with new ones

// Remove old imports
- import FirstThingsFirst from "./pages/Onboarding/FirstThingsFirst";
- import Inspirations from "./pages/Onboarding/Inspirations";

// Add new imports
+ import LinkedInProfileStep from "./pages/Onboarding/LinkedInProfileStep";
+ import InspirationsStep from "./pages/Onboarding/InspirationsStep";
+ import ContentStrategyStep from "./pages/Onboarding/ContentStrategyStep";
+ import GoalsPreferencesStep from "./pages/Onboarding/GoalsPreferencesStep";
+ import NotificationSetupStep from "./pages/Onboarding/NotificationSetupStep";

// Update routes
<Route path="/onboarding/welcome" element={<Welcome />} />
- <Route path="/onboarding/first-things-first" element={<FirstThingsFirst />} />
- <Route path="/onboarding/inspirations" element={<Inspirations />} />
- <Route path="/onboarding/goals" element={<Goals />} />
- <Route path="/onboarding/guides" element={<Guides />} />
- <Route path="/onboarding/content-pillars" element={<ContentPillars />} />
- <Route path="/onboarding/pacing" element={<Pacing />} />
- <Route path="/onboarding/contact" element={<Contact />} />
- <Route path="/onboarding/whatsapp-setup" element={<WhatsAppSetup />} />
+ <Route path="/onboarding/linkedin-profile" element={<LinkedInProfileStep />} />
+ <Route path="/onboarding/inspirations" element={<InspirationsStep />} />
+ <Route path="/onboarding/content-strategy" element={<ContentStrategyStep />} />
+ <Route path="/onboarding/goals-preferences" element={<GoalsPreferencesStep />} />
+ <Route path="/onboarding/notifications" element={<NotificationSetupStep />} />
<Route path="/onboarding/ready" element={<Ready />} />
```

## Testing Strategy

### 1. Database Migration Testing
```bash
# Test migration on local development
supabase db reset
supabase migration up

# Verify tables created correctly
psql -h localhost -p 54322 -U postgres -d postgres -c "\dt"
```

### 2. Edge Function Testing
```bash
# Test enhanced scraper locally
supabase functions serve enhanced-linkedin-scraper

# Test with curl
curl -X POST http://localhost:54321/functions/v1/enhanced-linkedin-scraper \
  -H "Content-Type: application/json" \
  -d '{"jobId":"test-123","linkedinUrl":"https://linkedin.com/in/test","userId":"test-user","targetType":"user_profile"}'
```

### 3. Frontend Component Testing
- Test ScrapingProgressCard with mock data
- Test real-time subscription functionality
- Test error handling scenarios
- Test progress percentage updates

### 4. End-to-End Flow Testing
1. Complete onboarding flow with real LinkedIn URLs
2. Verify data persistence in database
3. Test error scenarios (private profiles, invalid URLs)
4. Test progress saving and restoration

## Deployment Checklist

### 1. Pre-deployment
- [ ] Run database migration on staging
- [ ] Deploy edge functions to staging
- [ ] Test complete onboarding flow on staging
- [ ] Verify real-time subscriptions work
- [ ] Test error handling scenarios

### 2. Production Deployment
- [ ] Run database migration on production
- [ ] Deploy edge functions to production
- [ ] Deploy frontend changes
- [ ] Monitor error rates and performance
- [ ] Verify onboarding completion rates

### 3. Post-deployment Monitoring
- [ ] Monitor scraping job success rates
- [ ] Track onboarding completion metrics
- [ ] Monitor edge function performance
- [ ] Watch for database performance issues

## Rollback Plan

### If Issues Occur
1. **Database Issues**: Revert migration using backup
2. **Edge Function Issues**: Revert to previous function version
3. **Frontend Issues**: Deploy previous frontend version
4. **Data Corruption**: Restore from database backup

### Emergency Contacts
- Database: Check RLS policies and table permissions
- Edge Functions: Check function logs in Supabase dashboard
- Frontend: Check browser console for JavaScript errors

## Future Enhancements

### Phase 2 Features
1. **Bulk Inspiration Import**: CSV upload for multiple LinkedIn URLs
2. **Content Recommendations**: AI-generated content suggestions based on analysis
3. **Competitive Analysis**: Compare user's content against inspirations
4. **Scheduling Integration**: Auto-schedule posts based on optimal times

### Performance Optimizations
1. **Caching**: Implement Redis for frequently accessed data
2. **CDN**: Use CDN for profile images and cached content
3. **Parallel Processing**: Process multiple inspirations simultaneously
4. **Background Jobs**: Move heavy analysis to background workers

This implementation will transform your onboarding from a static form-filling experience into an engaging, interactive process that builds user trust and collects rich data for personalization.