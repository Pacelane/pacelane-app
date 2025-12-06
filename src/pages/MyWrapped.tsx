import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
import { useToast } from '@/design-system/components/Toast';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { getResponsivePadding } from '@/design-system/utils/responsive';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
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
  ArrowRight
} from 'lucide-react';
import { PDFExportModal } from '@/components/PDFExportModal';
import type { PostsWrappedData } from '@/types/wrapped';
import type { LinkedInWrappedFormData } from '@/types/leads';

const MyWrapped: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [wrappedData, setWrappedData] = useState<PostsWrappedData | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [hasScrapedData, setHasScrapedData] = useState(false);
  const [error, setError] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [linkedinError, setLinkedinError] = useState('');

  // Check if user already has a wrapped
  useEffect(() => {
    const checkExistingWrapped = async () => {
      if (!user) {
        console.log('MyWrapped: No user, skipping check');
        return;
      }

      console.log('MyWrapped: Checking for existing wrapped for user:', user.id);
      setIsLoadingLead(true);
      try {
        // First, try to find lead with converted_to_user_id matching current user
        let { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('converted_to_user_id', user.id)
          .eq('lead_source', 'linkedin_wrapped')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // If no lead found by converted_to_user_id, try to find by email
        // This handles cases where the lead was created before user signup
        if (!lead && user.email) {
          console.log('MyWrapped: No lead found by user_id, trying to find by email:', user.email);
          const { data: leadByEmail, error: emailError } = await supabase
            .from('leads')
            .select('*')
            .eq('email', user.email)
            .eq('lead_source', 'linkedin_wrapped')
            .is('converted_to_user_id', null) // Only get leads not yet converted
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (emailError) {
            console.error('MyWrapped: Error fetching lead by email:', emailError);
          } else if (leadByEmail) {
            // Update the lead to link it to the current user
            console.log('MyWrapped: Found lead by email, updating converted_to_user_id');
            const { error: updateError } = await supabase
              .from('leads')
              .update({ 
                converted_to_user_id: user.id,
                converted_at: new Date().toISOString()
              })
              .eq('id', leadByEmail.id);

            if (updateError) {
              console.error('MyWrapped: Error updating lead:', updateError);
            } else {
              lead = leadByEmail;
              lead.converted_to_user_id = user.id;
              lead.converted_at = new Date().toISOString();
            }
          }
        }

        if (leadError) {
          console.error('MyWrapped: Error fetching lead:', leadError);
          setIsLoadingLead(false);
          return;
        }

        console.log('MyWrapped: Lead query result:', { 
          hasLead: !!lead, 
          leadId: lead?.id,
          hasScrapedData: !!(lead?.scraped_data),
          scrapedDataKeys: lead?.scraped_data ? Object.keys(lead.scraped_data) : []
        });

        if (lead) {
          setLeadId(lead.id);
          // Check if we have scraped_data
          if (lead.scraped_data) {
            console.log('MyWrapped: Found scraped_data, processing...');
            
            // Parse scraped_data if it's a string
            let parsedData: any = lead.scraped_data;
            if (typeof lead.scraped_data === 'string') {
              try {
                parsedData = JSON.parse(lead.scraped_data);
              } catch (e) {
                console.error('MyWrapped: Error parsing scraped_data:', e);
                setHasScrapedData(false);
                return;
              }
            }
            
            // Check if parsed data has content
            if (parsedData && (parsedData.posts || Object.keys(parsedData).length > 0)) {
              console.log('MyWrapped: Valid scraped_data found, processing...');
              setHasScrapedData(true);
              
              let wrappedDataFromLead: PostsWrappedData;
              
              // Check if data is already processed (has totalPosts, totalEngagement, etc.)
              if (parsedData.totalPosts !== undefined && parsedData.totalEngagement !== undefined) {
                // Data is already processed
                console.log('MyWrapped: Data is already processed');
                wrappedDataFromLead = parsedData as PostsWrappedData;
              } else if (parsedData.posts && Array.isArray(parsedData.posts)) {
                // Data is raw posts, need to process
                console.log('MyWrapped: Data is raw posts, processing...');
                wrappedDataFromLead = processPostsToWrappedData(parsedData.posts);
              } else {
                // Try to use as-is
                wrappedDataFromLead = parsedData as PostsWrappedData;
              }
              
              // Merge reactions_data if available
              if (lead.reactions_data) {
                let parsedReactions = lead.reactions_data;
                if (typeof lead.reactions_data === 'string') {
                  try {
                    parsedReactions = JSON.parse(lead.reactions_data);
                  } catch (e) {
                    console.error('MyWrapped: Error parsing reactions_data:', e);
                  }
                }
                wrappedDataFromLead.reactionsData = parsedReactions;
              }
              
              setWrappedData(wrappedDataFromLead);
              console.log('MyWrapped: Wrapped data set:', { 
                hasData: !!wrappedDataFromLead,
                keys: Object.keys(wrappedDataFromLead || {}),
                hasTotalEngagement: !!wrappedDataFromLead.totalEngagement,
                hasTotalPosts: !!wrappedDataFromLead.totalPosts
              });
            } else {
              console.log('MyWrapped: scraped_data is empty or invalid');
              setHasScrapedData(false);
            }
          } else {
            console.log('MyWrapped: No scraped_data found in lead');
            setHasScrapedData(false);
          }
        } else {
          console.log('MyWrapped: No lead found for user');
          setHasScrapedData(false);
        }
      } catch (err: any) {
        console.error('MyWrapped: Error checking for existing wrapped:', err);
      } finally {
        setIsLoadingLead(false);
        console.log('MyWrapped: Finished loading check', { 
          isLoadingLead: false,
          hasScrapedData,
          hasWrappedData: !!wrappedData,
          hasLeadId: !!leadId
        });
      }
    };

    checkExistingWrapped();
  }, [user]);

  // Helper function to process raw posts into WrappedData
  const processPostsToWrappedData = (posts: any[]): PostsWrappedData => {
    const currentYear = new Date().getFullYear();
    
    // Filter posts from current year
    const yearPosts = posts.filter((post: any) => {
      if (post.publishedAt) {
        const postYear = new Date(post.publishedAt).getFullYear();
        return postYear === currentYear;
      }
      return false;
    });

    // Calculate engagement stats
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalLength = 0;
    const hashtagCounts: Record<string, number> = {};
    const monthlyData: Record<string, { posts: number; engagement: number }> = {};

    yearPosts.forEach((post: any) => {
      const engagement = post.engagement || {};
      totalLikes += engagement.likes || 0;
      totalComments += engagement.comments || 0;
      totalShares += engagement.shares || 0;
      totalLength += post.content?.length || 0;

      // Extract hashtags
      const hashtags = post.content?.match(/#\w+/g) || [];
      hashtags.forEach((tag: string) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });

      // Monthly breakdown
      if (post.publishedAt) {
        const month = new Date(post.publishedAt).toLocaleString('pt-BR', { month: 'long' });
        if (!monthlyData[month]) {
          monthlyData[month] = { posts: 0, engagement: 0 };
        }
        monthlyData[month].posts++;
        monthlyData[month].engagement += (engagement.likes || 0) + 
                                          (engagement.comments || 0) + 
                                          (engagement.shares || 0);
      }
    });

    const totalPosts = yearPosts.length;
    const totalEngagement = totalLikes + totalComments + totalShares;

    // Get top posts by engagement
    const topPosts = [...yearPosts]
      .sort((a, b) => {
        const engagementA = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) + (a.engagement?.shares || 0);
        const engagementB = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) + (b.engagement?.shares || 0);
        return engagementB - engagementA;
      })
      .slice(0, 10)
      .map((post: any) => ({
        id: post.id || '',
        content: post.content || '',
        publishedAt: post.publishedAt || '',
        engagement: {
          likes: post.engagement?.likes || 0,
          comments: post.engagement?.comments || 0,
          shares: post.engagement?.shares || 0,
        },
        url: post.url || '',
      }));

    // Monthly breakdown
    const monthlyBreakdown = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        posts: data.posts,
        totalEngagement: data.engagement,
      }))
      .sort((a, b) => {
        const monthOrder = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });

    // Find most and least active months
    const sortedMonths = [...monthlyBreakdown].sort((a, b) => b.posts - a.posts);
    const mostActiveMonth = sortedMonths[0]?.month;
    const leastActiveMonth = sortedMonths[sortedMonths.length - 1]?.month;

    // Extract profile image from the first post if available
    const profileImage = posts.length > 0 && posts[0].author ? posts[0].author.imageUrl : undefined;

    return {
      totalPosts,
      totalEngagement,
      averageEngagementPerPost: totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0,
      topPosts,
      postingFrequency: {
        postsPerMonth: Math.round((totalPosts / 12) * 10) / 10,
        mostActiveMonth,
        leastActiveMonth,
      },
      engagementStats: {
        totalLikes,
        totalComments,
        totalShares,
        avgLikesPerPost: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
        avgCommentsPerPost: totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0,
        avgSharesPerPost: totalPosts > 0 ? Math.round(totalShares / totalPosts) : 0,
      },
      contentInsights: {
        averagePostLength: totalPosts > 0 ? Math.round(totalLength / totalPosts) : 0,
        mostUsedHashtags: Object.entries(hashtagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([tag]) => tag),
        topTopics: [],
      },
      yearInReview: {
        year: currentYear,
        monthlyBreakdown,
      },
      profileImage,
    };
  };

  const validateLinkedInUrl = () => {
    if (!linkedinUrl.trim()) {
      setLinkedinError('URL do perfil do LinkedIn é obrigatória');
      return false;
    } else if (!linkedinUrl.includes('linkedin.com/in/')) {
      setLinkedinError('Por favor, insira uma URL válida do LinkedIn (ex: https://linkedin.com/in/usuario)');
      return false;
    }
    setLinkedinError('');
    return true;
  };

  const handleGenerateWrapped = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent generating if already has a wrapped (double check)
    if (leadId || wrappedData) {
      toast.error('Você já gerou seu Wrapped. Não é possível gerar novamente.');
      return;
    }
    
    // Additional safety check: if we're still loading, don't allow generation
    if (isLoadingLead) {
      toast.error('Aguarde enquanto verificamos seus dados...');
      return;
    }
    
    setError('');
    setWrappedData(null);

    if (!validateLinkedInUrl()) {
      return;
    }

    if (!user || !profile) {
      toast.error('Você precisa estar logado para gerar o Wrapped');
      return;
    }

    setIsProcessing(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://plbgeabtrkdhbrnjonje.supabase.co";
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
      
      // Call the posts scraping function
      const response = await fetch(`${supabaseUrl}/functions/v1/scrape-lead-linkedin-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          name: profile.display_name || user.email || 'User',
          email: user.email || '',
          linkedinUrl: linkedinUrl.trim()
        } as LinkedInWrappedFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar o wrapped');
      }

      if (data.success && data.data) {
        setWrappedData(data.data);
        
        // Update or create lead with converted_to_user_id
        if (data.leadId) {
          const { error: updateError } = await supabase
            .from('leads')
            .update({ 
              converted_to_user_id: user.id,
              converted_at: new Date().toISOString()
            })
            .eq('id', data.leadId);

          if (updateError) {
            console.error('Error updating lead:', updateError);
          } else {
            setLeadId(data.leadId);
          }
        }
      } else {
        throw new Error('Nenhum dado recebido');
      }

    } catch (err: any) {
      console.error('Wrapped generation error:', err);
      setError(err.message || 'Falha ao gerar seu LinkedIn Wrapped. Por favor, tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToPacelane = () => {
    if (profile && (profile as any).is_onboarded) {
      navigate('/product-home');
    } else {
      navigate('/onboarding/welcome');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/linkedin-wrapped');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Falha ao fazer logout. Por favor, tente novamente.');
    }
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

  // Loading state
  if (isLoadingLead) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.muted,
      }}>
        <SubtleLoadingSpinner 
          title="Carregando seu Wrapped..."
          size={16}
        />
      </div>
    );
  }

  // Processing state
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
          title="Gerando seu LinkedIn Wrapped..."
          subtitle="Analisando suas publicações deste ano"
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
              Seu LinkedIn Wrapped {currentYear}
            </h2>
            <Sparkles size={28} color={colors.icon.default} />
          </div>
          <p style={subtitleStyle}>
            Uma retrospectiva da sua jornada de conteúdo este ano
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
            <p style={statLabelStyle}>Posts Publicados</p>
          </div>
          <div style={statCardStyles}>
            <TrendingUp size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{(wrappedData.totalEngagement || 0).toLocaleString()}</p>
            <p style={statLabelStyle}>Engajamento Total</p>
          </div>
          <div style={statCardStyles}>
            <Heart size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{wrappedData.engagementStats?.totalLikes?.toLocaleString() || 0}</p>
            <p style={statLabelStyle}>Curtidas Recebidas</p>
          </div>
          <div style={statCardStyles}>
            <MessageCircle size={24} color={colors.icon.default} />
            <p style={statNumberStyle}>{wrappedData.engagementStats?.totalComments?.toLocaleString() || 0}</p>
            <p style={statLabelStyle}>Comentários Recebidos</p>
          </div>
        </div>

        {/* Engagement Averages */}
        <div style={{
          ...cardStyles,
          padding: spacing.spacing[24],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
            <BarChart3 size={20} color={colors.icon.default} />
            <h3 style={sectionTitleStyle}>Média Por Post</h3>
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
              <p style={statLabelStyle}>Curtidas</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...statNumberStyle, fontSize: typography.desktop.size['2xl'] }}>
                {wrappedData.engagementStats?.avgCommentsPerPost || 0}
              </p>
              <p style={statLabelStyle}>Comentários</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...statNumberStyle, fontSize: typography.desktop.size['2xl'] }}>
                {wrappedData.engagementStats?.avgSharesPerPost || 0}
              </p>
              <p style={statLabelStyle}>Compartilhamentos</p>
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
              <h3 style={sectionTitleStyle}>Insights de Publicação</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
              <p style={{ ...textStyles.md.normal, color: colors.text.default, margin: 0 }}>
                📊 Você publicou uma média de <strong>{wrappedData.postingFrequency.postsPerMonth}</strong> posts por mês
              </p>
              <p style={{ ...textStyles.md.normal, color: colors.text.default, margin: 0 }}>
                🔥 Seu mês mais ativo foi <strong>{wrappedData.postingFrequency.mostActiveMonth}</strong>
              </p>
              {wrappedData.postingFrequency.leastActiveMonth && (
                <p style={{ ...textStyles.md.normal, color: colors.text.default, margin: 0 }}>
                  😴 Seu mês mais tranquilo foi <strong>{wrappedData.postingFrequency.leastActiveMonth}</strong>
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
              <h3 style={sectionTitleStyle}>Suas Principais Hashtags</h3>
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
              <h3 style={sectionTitleStyle}>Seus Posts com Mais Curtidas</h3>
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
                        return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' });
                      } catch {
                        return '';
                      }
                    })() : 'Sem data'}
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

        {/* Reactions Data - Top Reacted Posts */}
        {wrappedData.reactionsData && wrappedData.reactionsData.topReactedPosts && wrappedData.reactionsData.topReactedPosts.length > 0 && (
          <div style={{
            ...cardStyles,
            padding: spacing.spacing[24],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <Trophy size={20} color={colors.icon.default} />
              <h3 style={sectionTitleStyle}>Posts que Você Mais Reagiu</h3>
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
                    por {post.postAuthor}
                  </span>
                </div>
                <p style={postContentStyle}>{post.postContent}</p>
                <div style={engagementRowStyle}>
                  <span style={engagementItemStyle}>
                    <Heart size={14} /> {post.reactionCount} reações
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly Timeline */}
        {wrappedData.yearInReview?.monthlyBreakdown && wrappedData.yearInReview.monthlyBreakdown.length > 0 && (
          <div style={{
            ...cardStyles,
            padding: spacing.spacing[24],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8], marginBottom: spacing.spacing[16] }}>
              <Calendar size={20} color={colors.icon.default} />
              <h3 style={sectionTitleStyle}>Sua Linha do Tempo de Publicações</h3>
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
            label="Exportar PDF"
            style="secondary"
            size="md"
            onClick={() => setIsExportModalOpen(true)}
          />
          <Button
            label="Conhecer o Pacelane"
            style="primary"
            size="md"
            tailIcon={<ArrowRight size={16} />}
            onClick={handleGoToPacelane}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyles}>
      <div style={contentWrapperStyles}>
        {/* Logo and Logout Button */}
        <div style={{ 
          marginBottom: spacing.spacing[32], 
          textAlign: 'center',
          position: 'relative',
        }}>
          <Logo width={120} />
          {user && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
            }}>
              <Button
                label="Sair"
                style="ghost"
                size="sm"
                onClick={handleLogout}
              />
            </div>
          )}
        </div>

        {/* Main Card */}
        <div style={cardStyles}>
          {/* Show loading while checking for existing wrapped */}
          {isLoadingLead ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.spacing[48],
              gap: spacing.spacing[16],
            }}>
              <SubtleLoadingSpinner 
                title="Carregando seu Wrapped..."
                size={16}
              />
            </div>
          ) : (hasScrapedData && wrappedData) ? (
            /* User has scraped_data in leads table - show content */
            (() => {
              console.log('MyWrapped: Rendering wrapped results', { hasScrapedData, hasWrappedData: !!wrappedData });
              return renderWrappedResults();
            })()
          ) : (
            /* User doesn't have wrapped yet - show form */
            <>
              <h1 style={titleStyle}>Gerar seu LinkedIn Wrapped</h1>
              <p style={subtitleStyle}>
                Descubra sua retrospectiva do LinkedIn. Veja seus posts mais populares, 
                estatísticas de engajamento e insights de conteúdo do ano passado.
              </p>

              <form onSubmit={handleGenerateWrapped} style={{ marginTop: spacing.spacing[32] }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[20] }}>
                  {/* LinkedIn URL */}
                  <Input
                    type="text"
                    label="LinkedIn Profile URL"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={linkedinUrl}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      if (linkedinError) setLinkedinError('');
                    }}
                    required
                    size="lg"
                    failed={!!linkedinError}
                    caption={linkedinError}
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
                    label="Gerar meu Wrapped 2024"
                    style="primary"
                    size="lg"
                    onClick={handleGenerateWrapped}
                    fullWidth={true}
                    disabled={isProcessing}
                    loading={isProcessing}
                  />
                </div>
              </form>
            </>
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
            Esta é uma ferramenta gratuita do Pacelane. Seus dados são privados e armazenados com segurança.
          </p>
        </div>
      </div>

      {wrappedData && (
        <PDFExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          wrappedData={wrappedData}
          userName={profile?.display_name || user?.email || 'User'}
          userImage={wrappedData.profileImage} 
        />
      )}
    </div>
  );
};

export default MyWrapped;

