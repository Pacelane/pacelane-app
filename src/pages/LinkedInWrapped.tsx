import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { getResponsivePadding } from '@/design-system/utils/responsive';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '@/design-system/components/Logo';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar,
  BarChart3,
  Hash,
  Trophy,
  Sparkles,
  FileText,
  Users,
  ThumbsUp,
  Smile,
  Lightbulb,
  PartyPopper
} from 'lucide-react';
import type { LinkedInWrappedFormData } from '@/types/leads';

// Posts-based Wrapped data interface
interface ReactionsData {
  totalReactions: number;
  topAuthors: Array<{
    name: string;
    linkedinUrl: string;
    info?: string;
    reactionCount: number;
  }>;
  reactionTypes: {
    like: number;
    love: number;
    support: number;
    celebrate: number;
    insight: number;
    funny: number;
  };
  monthlyReactions: Array<{
    month: string;
    reactions: number;
  }>;
  topReactedPosts: Array<{
    postContent: string;
    postAuthor: string;
    postUrl: string;
    reactionCount: number;
  }>;
}

interface PostsWrappedData {
  totalPosts: number;
  totalEngagement: number;
  averageEngagementPerPost: number;
  topPosts: Array<{
    id: string;
    content: string;
    publishedAt: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    url: string;
  }>;
  postingFrequency: {
    postsPerMonth: number;
    mostActiveMonth?: string;
    leastActiveMonth?: string;
  };
  engagementStats: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgLikesPerPost: number;
    avgCommentsPerPost: number;
    avgSharesPerPost: number;
  };
  contentInsights: {
    averagePostLength: number;
    mostUsedHashtags: string[];
    topTopics: string[];
  };
  yearInReview: {
    year: number;
    monthlyBreakdown: Array<{
      month: string;
      posts: number;
      totalEngagement: number;
    }>;
  };
  reactionsData?: ReactionsData;
}

const LinkedInWrapped: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [wrappedData, setWrappedData] = useState<PostsWrappedData | null>(null);
  const [error, setError] = useState('');

  // Validation
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    linkedinUrl: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      linkedinUrl: ''
    };

    let isValid = true;

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // LinkedIn URL validation
    if (!linkedinUrl.trim()) {
      newErrors.linkedinUrl = 'LinkedIn profile URL is required';
      isValid = false;
    } else if (!linkedinUrl.includes('linkedin.com/in/')) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setWrappedData(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://plbgeabtrkdhbrnjonje.supabase.co";
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
      
      // Call the lead-specific edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/scrape-lead-linkedin-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          linkedinUrl: linkedinUrl.trim()
        } as LinkedInWrappedFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate wrapped');
      }

      if (data.success && data.data) {
        setWrappedData(data.data);
      } else {
        throw new Error('No wrapped data received');
      }

    } catch (err: any) {
      console.error('Wrapped generation error:', err);
      setError(err.message || 'Failed to generate your LinkedIn Wrapped. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToThankYou = () => {
    navigate('/thank-you?source=linkedin-wrapped');
  };

  const handleCreateAnother = () => {
    setWrappedData(null);
    setName('');
    setEmail('');
    setLinkedinUrl('');
    setError('');
    setErrors({ name: '', email: '', linkedinUrl: '' });
  };

  // Styles
  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column',
  };

  const contentWrapperStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '840px',
    margin: '0 auto',
    paddingTop: spacing.spacing[40],
    paddingBottom: spacing.spacing[80],
    paddingLeft: spacing.spacing[24],
    paddingRight: spacing.spacing[24],
    boxSizing: 'border-box',
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: getResponsivePadding(isMobile, 'card'),
    marginBottom: spacing.spacing[24],
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: Array.isArray(typography.fontFamily['awesome-serif']) 
      ? typography.fontFamily['awesome-serif'].join(', ') 
      : typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.muted,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  const statCardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.muted,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[20],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  const statNumberStyle: React.CSSProperties = {
    fontFamily: Array.isArray(typography.fontFamily['awesome-serif']) 
      ? typography.fontFamily['awesome-serif'].join(', ') 
      : typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.bold,
    color: colors.text.default,
    margin: 0,
  };

  const statLabelStyle: React.CSSProperties = {
    ...textStyles.sm.medium,
    color: colors.text.muted,
    margin: 0,
    textAlign: 'center',
  };

  const sectionTitleStyle: React.CSSProperties = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
    marginBottom: spacing.spacing[16],
  };

  const topPostCardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.muted,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[16],
    marginBottom: spacing.spacing[12],
  };

  const postContentStyle: React.CSSProperties = {
    ...textStyles.sm.normal,
    color: colors.text.default,
    margin: 0,
    marginBottom: spacing.spacing[12],
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const engagementRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.spacing[16],
    alignItems: 'center',
  };

  const engagementItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[4],
    ...textStyles.xs.medium,
    color: colors.text.muted,
  };

  if (isProcessing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.muted,
      }}>
        <SubtleLoadingSpinner 
          title="Generating your LinkedIn Wrapped..."
          subtitle="Analyzing your posts from this year"
          size={16}
        />
      </div>
    );
  }

  // Render Wrapped Results
  const renderWrappedResults = () => {
    if (!wrappedData) return null;

    const currentYear = wrappedData.yearInReview?.year || new Date().getFullYear();

    return (
      <div style={{ marginTop: spacing.spacing[32] }}>
        {/* Year Header */}
        <div style={{ textAlign: 'center', marginBottom: spacing.spacing[32] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[8] }}>
            <Sparkles size={28} color={colors.icon.default} />
            <h2 style={{
              ...titleStyle,
              fontSize: typography.desktop.size['4xl'],
            }}>
              Your {currentYear} LinkedIn Wrapped
            </h2>
            <Sparkles size={28} color={colors.icon.default} />
          </div>
          <p style={subtitleStyle}>
            Here's a look back at your content journey this year
          </p>
        </div>

        {/* Main Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: spacing.spacing[16],
          marginBottom: spacing.spacing[32],
        }}>
          <div style={statCardStyles}>
            <FileText size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{wrappedData.totalPosts}</p>
            <p style={statLabelStyle}>Posts Published</p>
          </div>
          <div style={statCardStyles}>
            <TrendingUp size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{wrappedData.totalEngagement.toLocaleString()}</p>
            <p style={statLabelStyle}>Total Engagement</p>
          </div>
          <div style={statCardStyles}>
            <Heart size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{wrappedData.engagementStats?.totalLikes?.toLocaleString() || 0}</p>
            <p style={statLabelStyle}>Likes Received</p>
          </div>
          <div style={statCardStyles}>
            <MessageCircle size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{wrappedData.engagementStats?.totalComments?.toLocaleString() || 0}</p>
            <p style={statLabelStyle}>Comments Received</p>
          </div>
        </div>

        {/* Engagement Averages */}
        <div style={{
          ...cardStyles,
          padding: spacing.spacing[24],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
            <BarChart3 size={20} color={colors.icon.default} />
            <h3 style={sectionTitleStyle}>Average Per Post</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing.spacing[16],
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...statNumberStyle, fontSize: typography.desktop.size['2xl'] }}>
                {wrappedData.engagementStats?.avgLikesPerPost || 0}
              </p>
              <p style={statLabelStyle}>Likes</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...statNumberStyle, fontSize: typography.desktop.size['2xl'] }}>
                {wrappedData.engagementStats?.avgCommentsPerPost || 0}
              </p>
              <p style={statLabelStyle}>Comments</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...statNumberStyle, fontSize: typography.desktop.size['2xl'] }}>
                {wrappedData.engagementStats?.avgSharesPerPost || 0}
              </p>
              <p style={statLabelStyle}>Shares</p>
            </div>
          </div>
        </div>

        {/* Posting Frequency */}
        {wrappedData.postingFrequency?.mostActiveMonth && (
          <div style={{
            ...cardStyles,
            padding: spacing.spacing[24],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <Calendar size={20} color={colors.icon.default} />
              <h3 style={sectionTitleStyle}>Posting Insights</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
              <p style={{ ...textStyles.md.normal, color: colors.text.default, margin: 0 }}>
                📊 You posted an average of <strong>{wrappedData.postingFrequency.postsPerMonth}</strong> posts per month
              </p>
              <p style={{ ...textStyles.md.normal, color: colors.text.default, margin: 0 }}>
                🔥 Your most active month was <strong>{wrappedData.postingFrequency.mostActiveMonth}</strong>
              </p>
              {wrappedData.postingFrequency.leastActiveMonth && (
                <p style={{ ...textStyles.md.normal, color: colors.text.default, margin: 0 }}>
                  😴 Your quietest month was <strong>{wrappedData.postingFrequency.leastActiveMonth}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Top Hashtags */}
        {wrappedData.contentInsights?.mostUsedHashtags && wrappedData.contentInsights.mostUsedHashtags.length > 0 && (
          <div style={{
            ...cardStyles,
            padding: spacing.spacing[24],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <Hash size={20} color={colors.icon.default} />
              <h3 style={sectionTitleStyle}>Your Top Hashtags</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.spacing[8] }}>
              {wrappedData.contentInsights.mostUsedHashtags.slice(0, 8).map((tag, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: colors.bg.state.soft,
                    color: colors.text.default,
                    padding: `${spacing.spacing[4]} ${spacing.spacing[12]}`,
                    borderRadius: cornerRadius.borderRadius.full,
                    ...textStyles.sm.medium,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top Posts */}
        {wrappedData.topPosts && wrappedData.topPosts.length > 0 && (
          <div style={{
            ...cardStyles,
            padding: spacing.spacing[24],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <Trophy size={20} color={colors.icon.default} />
              <h3 style={sectionTitleStyle}>Your Top Performing Posts</h3>
            </div>
            {wrappedData.topPosts.slice(0, 3).map((post, index: number) => (
              <div key={post.id || index} style={topPostCardStyles}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[8] }}>
                  <span style={{
                    backgroundColor: colors.bg.state.primary,
                    color: colors.text.white?.default || '#fff',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...textStyles.xs.bold,
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ ...textStyles.xs.medium, color: colors.text.muted }}>
                    {post.publishedAt ? (() => {
                      try {
                        const date = new Date(post.publishedAt);
                        if (isNaN(date.getTime())) return '';
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      } catch {
                        return '';
                      }
                    })() : 'No date'}
                  </span>
                </div>
                <p style={postContentStyle}>{post.content}</p>
                <div style={engagementRowStyle}>
                  <span style={engagementItemStyle}>
                    <Heart size={14} /> {post.engagement?.likes || 0}
                  </span>
                  <span style={engagementItemStyle}>
                    <MessageCircle size={14} /> {post.engagement?.comments || 0}
                  </span>
                  <span style={engagementItemStyle}>
                    <Share2 size={14} /> {post.engagement?.shares || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reactions Data */}
        {wrappedData.reactionsData && wrappedData.reactionsData.totalReactions > 0 && (
          <>
            {/* Total Reactions */}
            <div style={{
              ...cardStyles,
              padding: spacing.spacing[24],
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
                <Heart size={20} color={colors.icon.default} />
                <h3 style={sectionTitleStyle}>Your Reactions</h3>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: spacing.spacing[16],
              }}>
                <div style={statCardStyles}>
                  <Heart size={24} color={colors.icon.default} />
                  <p style={statNumberStyle}>{wrappedData.reactionsData.totalReactions}</p>
                  <p style={statLabelStyle}>Total Reactions</p>
                </div>
                <div style={statCardStyles}>
                  <Users size={24} color={colors.icon.default} />
                  <p style={statNumberStyle}>{wrappedData.reactionsData.topAuthors.length}</p>
                  <p style={statLabelStyle}>People You Reacted To</p>
                </div>
              </div>
            </div>

            {/* Reaction Types */}
            {Object.values(wrappedData.reactionsData.reactionTypes).some(v => v > 0) && (
              <div style={{
                ...cardStyles,
                padding: spacing.spacing[24],
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
                  <BarChart3 size={20} color={colors.icon.default} />
                  <h3 style={sectionTitleStyle}>Your Reaction Types</h3>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: spacing.spacing[12],
                }}>
                  {wrappedData.reactionsData.reactionTypes.like > 0 && (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[12], backgroundColor: colors.bg.muted, borderRadius: cornerRadius.borderRadius.md }}>
                      <ThumbsUp size={20} color={colors.icon.default} style={{ margin: '0 auto', marginBottom: spacing.spacing[4] }} />
                      <p style={{ ...statNumberStyle, fontSize: typography.desktop.size.xl }}>{wrappedData.reactionsData.reactionTypes.like}</p>
                      <p style={statLabelStyle}>Likes</p>
                    </div>
                  )}
                  {wrappedData.reactionsData.reactionTypes.love > 0 && (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[12], backgroundColor: colors.bg.muted, borderRadius: cornerRadius.borderRadius.md }}>
                      <Heart size={20} color={colors.icon.default} style={{ margin: '0 auto', marginBottom: spacing.spacing[4] }} />
                      <p style={{ ...statNumberStyle, fontSize: typography.desktop.size.xl }}>{wrappedData.reactionsData.reactionTypes.love}</p>
                      <p style={statLabelStyle}>Love</p>
                    </div>
                  )}
                  {wrappedData.reactionsData.reactionTypes.celebrate > 0 && (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[12], backgroundColor: colors.bg.muted, borderRadius: cornerRadius.borderRadius.md }}>
                      <PartyPopper size={20} color={colors.icon.default} style={{ margin: '0 auto', marginBottom: spacing.spacing[4] }} />
                      <p style={{ ...statNumberStyle, fontSize: typography.desktop.size.xl }}>{wrappedData.reactionsData.reactionTypes.celebrate}</p>
                      <p style={statLabelStyle}>Celebrate</p>
                    </div>
                  )}
                  {wrappedData.reactionsData.reactionTypes.insight > 0 && (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[12], backgroundColor: colors.bg.muted, borderRadius: cornerRadius.borderRadius.md }}>
                      <Lightbulb size={20} color={colors.icon.default} style={{ margin: '0 auto', marginBottom: spacing.spacing[4] }} />
                      <p style={{ ...statNumberStyle, fontSize: typography.desktop.size.xl }}>{wrappedData.reactionsData.reactionTypes.insight}</p>
                      <p style={statLabelStyle}>Insightful</p>
                    </div>
                  )}
                  {wrappedData.reactionsData.reactionTypes.support > 0 && (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[12], backgroundColor: colors.bg.muted, borderRadius: cornerRadius.borderRadius.md }}>
                      <Heart size={20} color={colors.icon.default} style={{ margin: '0 auto', marginBottom: spacing.spacing[4] }} />
                      <p style={{ ...statNumberStyle, fontSize: typography.desktop.size.xl }}>{wrappedData.reactionsData.reactionTypes.support}</p>
                      <p style={statLabelStyle}>Support</p>
                    </div>
                  )}
                  {wrappedData.reactionsData.reactionTypes.funny > 0 && (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[12], backgroundColor: colors.bg.muted, borderRadius: cornerRadius.borderRadius.md }}>
                      <Smile size={20} color={colors.icon.default} style={{ margin: '0 auto', marginBottom: spacing.spacing[4] }} />
                      <p style={{ ...statNumberStyle, fontSize: typography.desktop.size.xl }}>{wrappedData.reactionsData.reactionTypes.funny}</p>
                      <p style={statLabelStyle}>Funny</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Top Authors You Reacted To */}
            {wrappedData.reactionsData.topAuthors && wrappedData.reactionsData.topAuthors.length > 0 && (
              <div style={{
                ...cardStyles,
                padding: spacing.spacing[24],
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
                  <Users size={20} color={colors.icon.default} />
                  <h3 style={sectionTitleStyle}>People You Reacted To Most</h3>
                </div>
                {wrappedData.reactionsData.topAuthors.slice(0, 5).map((author, index) => (
                  <div key={index} style={{
                    ...topPostCardStyles,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ ...textStyles.sm.semibold, color: colors.text.default, margin: 0, marginBottom: spacing.spacing[4] }}>
                        {author.name}
                      </p>
                      {author.info && (
                        <p style={{ ...textStyles.xs.normal, color: colors.text.muted, margin: 0 }}>
                          {author.info}
                        </p>
                      )}
                    </div>
                    <div style={{
                      backgroundColor: colors.bg.state.primary,
                      color: colors.text.white?.default || '#fff',
                      padding: `${spacing.spacing[4]} ${spacing.spacing[12]}`,
                      borderRadius: cornerRadius.borderRadius.full,
                      ...textStyles.sm.bold,
                    }}>
                      {author.reactionCount} reactions
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Top Posts You Reacted To */}
            {wrappedData.reactionsData.topReactedPosts && wrappedData.reactionsData.topReactedPosts.length > 0 && (
              <div style={{
                ...cardStyles,
                padding: spacing.spacing[24],
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
                  <Trophy size={20} color={colors.icon.default} />
                  <h3 style={sectionTitleStyle}>Posts You Reacted To Most</h3>
                </div>
                {wrappedData.reactionsData.topReactedPosts.slice(0, 3).map((post, index) => (
                  <div key={index} style={topPostCardStyles}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[8] }}>
                      <span style={{
                        backgroundColor: colors.bg.state.primary,
                        color: colors.text.white?.default || '#fff',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...textStyles.xs.bold,
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ ...textStyles.xs.medium, color: colors.text.muted }}>
                        by {post.postAuthor}
                      </span>
                    </div>
                    <p style={postContentStyle}>{post.postContent}</p>
                    <div style={engagementRowStyle}>
                      <span style={engagementItemStyle}>
                        <Heart size={14} /> {post.reactionCount} reactions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Monthly Timeline */}
        {wrappedData.yearInReview?.monthlyBreakdown && wrappedData.yearInReview.monthlyBreakdown.length > 0 && (
          <div style={{
            ...cardStyles,
            padding: spacing.spacing[24],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <Calendar size={20} color={colors.icon.default} />
              <h3 style={sectionTitleStyle}>Your Posting Timeline</h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: spacing.spacing[4],
              height: 120,
            }}>
              {wrappedData.yearInReview.monthlyBreakdown.map((item, index) => {
                const maxPosts = Math.max(...wrappedData.yearInReview.monthlyBreakdown.map(i => i.posts));
                const height = maxPosts > 0 ? (item.posts / maxPosts) * 100 : 0;
                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: spacing.spacing[4],
                    }}
                  >
                    <span style={{ ...textStyles.xs.bold, color: colors.text.default }}>
                      {item.posts}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(height, 4)}%`,
                        backgroundColor: colors.bg.state.primary,
                        borderRadius: cornerRadius.borderRadius.xs,
                        minHeight: 4,
                      }}
                    />
                    <span style={{ ...textStyles.xs.normal, color: colors.text.muted }}>
                      {item.month.substring(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: spacing.spacing[12], flexWrap: 'wrap', marginTop: spacing.spacing[32] }}>
          <Button
            label="Create Another Wrapped"
            style="secondary"
            size="md"
            onClick={handleCreateAnother}
          />
          <Button
            label="Done"
            style="primary"
            size="md"
            onClick={handleGoToThankYou}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyles}>
      <div style={contentWrapperStyles}>
        {/* Logo */}
        <div style={{ marginBottom: spacing.spacing[32], textAlign: 'center' }}>
          <Logo width={120} />
        </div>

        {/* Main Card */}
        <div style={cardStyles}>
          <h1 style={titleStyle}>LinkedIn Wrapped</h1>
          <p style={subtitleStyle}>
            Discover your LinkedIn year in review. See your top posts, 
            engagement stats, and content insights from the past year.
          </p>

          {!wrappedData ? (
            <form onSubmit={handleSubmit} style={{ marginTop: spacing.spacing[32] }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
                {/* Name */}
                <Input
                  type="text"
                  label="Your Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  required
                  size="lg"
                  failed={!!errors.name}
                  caption={errors.name}
                />

                {/* Email */}
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  required
                  size="lg"
                  failed={!!errors.email}
                  caption={errors.email}
                />

                {/* LinkedIn URL */}
                <Input
                  type="text"
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={linkedinUrl}
                  onChange={(e) => {
                    setLinkedinUrl(e.target.value);
                    if (errors.linkedinUrl) setErrors({ ...errors, linkedinUrl: '' });
                  }}
                  required
                  size="lg"
                  failed={!!errors.linkedinUrl}
                  caption={errors.linkedinUrl}
                />

                {/* Error Message */}
                {error && (
                  <div style={{
                    padding: spacing.spacing[12],
                    backgroundColor: colors.bg.critical?.subtle || colors.bg.muted,
                    border: `1px solid ${colors.border.critical}`,
                    borderRadius: cornerRadius.borderRadius.md,
                  }}>
                    <p style={{
                      ...textStyles.sm.medium,
                      color: colors.text.critical,
                      margin: 0,
                    }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  label="Generate My Wrapped"
                  style="primary"
                  size="lg"
                  onClick={handleSubmit}
                  fullWidth={true}
                  disabled={isProcessing}
                />
              </div>
            </form>
          ) : (
            renderWrappedResults()
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: spacing.spacing[24],
        }}>
          <p style={{
            ...textStyles.xs.normal,
            color: colors.text.hint,
          }}>
            This is a free tool by Pacelane. Your data is private and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LinkedInWrapped;
