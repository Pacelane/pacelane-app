// Lead Magnets Type Definitions
// This file defines types for the lead magnet system

/**
 * Lead source types
 */
export type LeadSource = 'linkedin_analyzer' | 'linkedin_wrapped';

/**
 * Lead status types
 */
export type LeadStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Lead record from database
 */
export interface Lead {
  id: string;
  name: string;
  email: string;
  linkedin_url: string;
  lead_source: LeadSource;
  scraped_data: Record<string, any>;
  metadata: LeadMetadata;
  status: LeadStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
  converted_to_user_id?: string;
  converted_at?: string;
}

/**
 * Metadata stored with leads
 */
export interface LeadMetadata {
  goal?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  user_agent?: string;
  [key: string]: any;
}

/**
 * LinkedIn Profile data from Apify scraper
 */
export interface LinkedInProfileData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  profilePicture?: string;
  backgroundImage?: string;
  connections?: number;
  followers?: number;
  experience?: LinkedInExperience[];
  education?: LinkedInEducation[];
  skills?: string[];
  languages?: string[];
  certifications?: LinkedInCertification[];
  recommendations?: number;
  profileUrl?: string;
  [key: string]: any;
}

export interface LinkedInExperience {
  title: string;
  company: string;
  companyUrl?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrent?: boolean;
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface LinkedInCertification {
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

/**
 * LinkedIn Post data from Apify scraper
 */
export interface LinkedInPost {
  id: string;
  content: string;
  publishedAt: string;
  engagement: PostEngagement;
  url: string;
  mediaType?: 'text' | 'image' | 'video' | 'document' | 'article';
  mediaUrls?: string[];
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  reactions?: number;
}

/**
 * Author stats for LinkedIn Wrapped
 */
export interface AuthorStats {
  name: string;
  linkedinUrl: string;
  avatar?: string;
  info?: string;
  interactionCount: number;
  reactionTypes: Record<string, number>;
}

/**
 * LinkedIn Wrapped processed data (based on reactions/interactions)
 */
export interface LinkedInWrappedData {
  totalInteractions: number;
  reactionBreakdown: Record<string, number>;
  topAuthors: AuthorStats[];
  topTopics: { topic: string; count: number }[];
  interactionTimeline: { month: string; count: number }[];
  mostEngagedPost: {
    content: string;
    author: string;
    authorAvatar?: string;
    url: string;
    engagement: number;
  } | null;
  insights: {
    favoriteReactionType: string;
    averageInteractionsPerMonth: number;
    mostActiveMonth: string;
    totalAuthorsEngaged: number;
  };
  yearInReview: {
    year: number;
  };
}

export interface MonthlyStats {
  month: string;
  posts: number;
  totalEngagement: number;
  topPost?: LinkedInPost;
}

/**
 * LinkedIn Analyzer result
 */
export interface LinkedInAnalyzerResult {
  profileData: LinkedInProfileData;
  analysis: string;
  suggestions: string[];
  score?: number;
}

/**
 * Form data for LinkedIn Analyzer
 */
export interface LinkedInAnalyzerFormData {
  name: string;
  email: string;
  linkedinUrl: string;
  goal?: string;
}

/**
 * Form data for LinkedIn Wrapped
 */
export interface LinkedInWrappedFormData {
  name: string;
  email: string;
  linkedinUrl: string;
}

/**
 * API Response types
 */
export interface LeadMagnetResponse<T = any> {
  success: boolean;
  data?: T;
  leadId?: string;
  error?: string;
}

export interface LinkedInAnalyzerResponse extends LeadMagnetResponse<LinkedInAnalyzerResult> {}

export interface LinkedInWrappedResponse extends LeadMagnetResponse<LinkedInWrappedData> {}

