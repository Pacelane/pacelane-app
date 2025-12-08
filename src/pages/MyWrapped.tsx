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
import Button from '@/design-system/components/Button';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import { ArrowRight } from 'lucide-react';
import { PDFExportModal } from '@/components/PDFExportModal';
import type { PostsWrappedData } from '@/types/wrapped';

const MyWrapped: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State
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
        const client = supabase as any;
        let { data: lead, error: leadError } = await client
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
          const { data: leadByEmail, error: emailError } = await client
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
            const { error: updateError } = await client
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

          // Fallback: create placeholder lead for existing users without a lead record
          if (user.email) {
            const { data: newLead, error: insertError } = await client
              .from('leads')
              .insert({
                email: user.email,
                converted_to_user_id: user.id,
                converted_at: new Date().toISOString(),
                lead_source: 'linkedin_wrapped',
              })
              .select('*')
              .maybeSingle();

            if (insertError) {
              console.error('MyWrapped: Error creating placeholder lead:', insertError);
            } else if (newLead) {
              console.log('MyWrapped: Placeholder lead created for existing user', newLead.id);
              setLeadId(newLead.id);
            }
          }

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
    let totalWords = 0;
    const hashtagCounts: Record<string, number> = {};
    const monthlyData: Record<string, { posts: number; engagement: number }> = {};

    const countWords = (text: string | undefined) => {
      if (!text) return 0;
      return text.trim().split(/\s+/).filter(Boolean).length;
    };

    yearPosts.forEach((post: any) => {
      const engagement = post.engagement || {};
      totalLikes += engagement.likes || 0;
      totalComments += engagement.comments || 0;
      totalShares += engagement.shares || 0;
      totalLength += post.content?.length || 0;
      totalWords += countWords(post.content);

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
      totalWords,
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
    } as PostsWrappedData;
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
  const geistFont = Array.isArray(typography.fontFamily?.inter)
    ? typography.fontFamily.inter.join(', ')
    : typography.fontFamily?.inter || 'Geist, sans-serif';

  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-default, #18181B)',
    display: 'flex',
    flexDirection: 'column',
    color: '#FFFFFF',
    fontFamily: geistFont,
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
    color: '#FFFFFF',
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: '#22232a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: getResponsivePadding(isMobile, 'card'),
    marginBottom: spacing.spacing[24],
    color: '#FFFFFF',
    fontFamily: geistFont,
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: geistFont,
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: '#FFFFFF',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: 'rgba(255,255,255,0.78)',
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  const listStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: 'rgba(255,255,255,0.82)',
    margin: 0,
    paddingLeft: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
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

  // Render Wrapped Results (single fold: share instructions + buttons)
  const renderWrappedResults = () => {
    if (!wrappedData) return null;

    return (
      <div style={{ marginTop: spacing.spacing[24] }}>
        <div style={{ textAlign: 'center', marginBottom: spacing.spacing[32] }}>
          <h2 style={{ ...titleStyle, fontSize: typography.desktop.size['4xl'] }}>
            Seu carrossel está pronto para o LinkedIn
          </h2>
          <p style={subtitleStyle}>
            Baixe o PDF, abra o LinkedIn, publique em carrossel e compartilhe seus melhores momentos.
          </p>
        </div>

        <div style={{ ...cardStyles, padding: spacing.spacing[24], display: 'flex', flexDirection: 'column', gap: spacing.spacing[16] }}>
          <h3 style={{ ...textStyles.lg.semibold, color: '#FFFFFF', margin: 0 }}>
            Como compartilhar
          </h3>
          <div style={listStyle}>
            <span>1. Clique em “Exportar PDF” para baixar o carrossel.</span>
            <span>2. No LinkedIn, crie um post em “Documento” e faça upload do PDF.</span>
            <span>3. Escreva uma legenda curta e publique.</span>
          </div>
          {error && (
            <div style={{
              padding: spacing.spacing[12],
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: cornerRadius.borderRadius.md,
            }}>
              <p style={{ ...textStyles.sm.medium, color: '#FFC2C2', margin: 0 }}>
                {error}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: spacing.spacing[12], flexWrap: 'wrap', marginTop: spacing.spacing[8] }}>
            <Button
              label="Exportar PDF"
              style="primary"
              size="md"
              onClick={() => setIsExportModalOpen(true)}
              styleOverrides={{
                backgroundColor: (colors as any).bg?.state?.success || (colors as any).text?.success || (colors as any).bg?.state?.primary,
                color: colors.text.white?.default || '#FFFFFF',
                borderColor: (colors as any).bg?.state?.success || (colors as any).text?.success || (colors as any).bg?.state?.primary,
              }}
            />
            <Button
              label="Conhecer o Pacelane"
              style="secondary"
              size="sm"
              tailIcon={<ArrowRight size={16} />}
              onClick={handleGoToPacelane}
            />
          </div>
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
                styleOverrides={{
                  color: colors.text.white?.default || '#FFFFFF',
                }}
              />
            </div>
          )}
        </div>

        {/* Main Card */}
        <div style={cardStyles}>
          {/* Show loading while checking for existing wrapped */}
          {isLoadingLead || isProcessing ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.spacing[48],
              gap: spacing.spacing[16],
            }}>
              <SubtleLoadingSpinner 
                title={isProcessing ? "Gerando seu Wrapped..." : "Carregando seu Wrapped..."}
                size={16}
              />
            </div>
          ) : (hasScrapedData && wrappedData) ? (
            renderWrappedResults()
          ) : (
            <>
              <h1 style={titleStyle}>Você ainda não gerou seu Wrapped</h1>
              <p style={subtitleStyle}>
                Volte para a página de cadastro para gerar seu carrossel em PDF e compartilhar no LinkedIn.
              </p>
              <div style={{ display: 'flex', gap: spacing.spacing[12], flexWrap: 'wrap', marginTop: spacing.spacing[24] }}>
                <Button
                  label="Ir para LinkedIn Wrapped"
                  style="primary"
                  size="md"
                  onClick={() => navigate('/linkedin-wrapped')}
                />
              </div>
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
            color: '#FFFFFF',
            fontFamily: geistFont,
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

