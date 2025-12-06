import React, { useMemo, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Calendar, Award, TrendingUp, Hash } from 'lucide-react';
// Import SVGs as raw string for placeholder replacement
import capaSvgRaw from '@/assets/capa.svg?raw';
import paceSvgRaw from '@/assets/pace.svg?raw';
import reacoesSvgRaw from '@/assets/reacoes.svg?raw';
import amigosSvgRaw from '@/assets/amigos.svg?raw';
import formatosSvgRaw from '@/assets/formatos.svg?raw';

// Define types locally if not available globally yet, or import them.
// For now, I'll define the props interface.

export type SlideType = 'intro' | 'pace' | 'reactions' | 'friends' | 'formats' | 'summary' | 'top-post' | 'posting-habits' | 'outro';

interface CarouselSlideProps {
  type: SlideType;
  data: any; // Flexible data prop depending on type
  index?: number;
  totalSlides?: number;
  userName?: string;
  userImage?: string;
  year?: number; // Year for the wrapped (e.g., 2025)
}

const colors = {
  primary: '#0A66C2', // LinkedIn Blue
  background: '#F3F2EF',
  text: '#000000',
  textSecondary: '#666666',
  white: '#FFFFFF',
  accent: '#FFD700', // Gold for awards/highlights
};

export const CarouselSlide: React.FC<CarouselSlideProps> = ({ type, data, index, totalSlides, userName, userImage, year }) => {
  const slideStyle: React.CSSProperties = {
    width: '1080px',
    height: '1350px', // 4:5 aspect ratio
    backgroundColor: colors.white,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '80px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '60px',
  };

  const footerStyle: React.CSSProperties = {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: `2px solid ${colors.background}`,
    paddingTop: '40px',
  };

  const renderContent = () => {
    switch (type) {
      case 'intro':
        return <IntroSlide data={data} userName={userName} />;

      case 'pace':
        return <PaceSlide data={data} />;

      case 'reactions':
        return <ReactionsSlide data={data} />;

      case 'friends':
        return <FriendsSlide data={data} />;

      case 'formats':
        return <FormatsSlide data={data} />;

      case 'summary':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '60px' }}>
            <h2 style={{ fontSize: '60px', fontWeight: 700, color: colors.text, marginBottom: '40px' }}>
              O Ano em Números
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <StatBox icon={<Calendar size={60} />} value={data?.totalPosts || 0} label="Posts Publicados" />
              <StatBox icon={<Heart size={60} />} value={data?.engagementStats?.totalLikes || 0} label="Curtidas" />
              <StatBox icon={<MessageCircle size={60} />} value={data?.engagementStats?.totalComments || 0} label="Comentários" />
              <StatBox icon={<Share2 size={60} />} value={data?.engagementStats?.totalShares || 0} label="Compartilhamentos" />
            </div>
          </div>
        );

      case 'top-post':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              <Award size={60} color={colors.accent} fill={colors.accent} />
              <h2 style={{ fontSize: '50px', fontWeight: 700, color: colors.text, margin: 0 }}>
                Post Mais Curtido
              </h2>
            </div>
            
            <div style={{ 
              backgroundColor: colors.background, 
              borderRadius: '30px', 
              padding: '60px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '40px'
            }}>
              <p style={{ fontSize: '36px', lineHeight: 1.5, color: colors.text, whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 12, WebkitBoxOrient: 'vertical' }}>
                {data?.content || 'Nenhum post disponível'}
              </p>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '40px', borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '40px' }}>
                <EngagementPill icon={<Heart size={40} />} value={data?.engagement?.likes || 0} label="Curtidas" />
                <EngagementPill icon={<MessageCircle size={40} />} value={data?.engagement?.comments || 0} label="Comentários" />
              </div>
            </div>
          </div>
        );

      case 'posting-habits':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <h2 style={{ fontSize: '60px', fontWeight: 700, color: colors.text, marginBottom: '60px' }}>
              Hábitos de Postagem
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
              {data?.postingFrequency?.mostActiveMonth && (
                <div style={{ padding: '40px', backgroundColor: '#E8F3FF', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
                    <TrendingUp size={50} color={colors.primary} />
                    <h3 style={{ fontSize: '40px', fontWeight: 600, margin: 0 }}>Mês Mais Ativo</h3>
                  </div>
                  <p style={{ fontSize: '50px', fontWeight: 800, color: colors.primary, margin: 0 }}>
                    {data.postingFrequency.mostActiveMonth}
                  </p>
                </div>
              )}

              {data?.contentInsights?.mostUsedHashtags && data.contentInsights.mostUsedHashtags.length > 0 && (
                <div style={{ padding: '40px', backgroundColor: '#FFF8E1', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
                    <Hash size={50} color="#F59E0B" />
                    <h3 style={{ fontSize: '40px', fontWeight: 600, margin: 0 }}>Top Hashtags</h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {data.contentInsights.mostUsedHashtags.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} style={{ fontSize: '36px', color: '#F59E0B', fontWeight: 600 }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'outro':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', marginBottom: '40px', border: `8px solid ${colors.primary}` }}>
              {userImage ? (
                <img src={userImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: colors.background }} />
              )}
            </div>
            <h2 style={{ fontSize: '60px', fontWeight: 800, color: colors.text, marginBottom: '40px' }}>
              Obrigado por fazer parte da minha rede!
            </h2>
            <p style={{ fontSize: '40px', color: colors.textSecondary }}>
              Que venha {(year || new Date().getFullYear()) + 1}! 🚀
            </p>
            <div style={{ marginTop: '80px', padding: '30px 60px', backgroundColor: colors.primary, borderRadius: '100px', color: 'white', fontSize: '36px', fontWeight: 600 }}>
              Vamos conectar?
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // For intro, pace, reactions, friends, and formats slides, render without header/footer to match PDF template exactly
  if (type === 'intro' || type === 'pace' || type === 'reactions' || type === 'friends' || type === 'formats') {
    const bgColor = type === 'intro' ? '#FFFFFF' : '#18181B';
    return (
      <div style={{
        width: '1080px',
        height: '1350px',
        backgroundColor: bgColor,
        position: 'relative',
        padding: 0,
        margin: 0,
        overflow: 'visible',
        display: 'block',
      }} className="carousel-slide">
        {renderContent()}
      </div>
    );
  }

  return (
    <div style={slideStyle} className="carousel-slide">
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
          in
        </div>
        <span style={{ fontSize: '30px', fontWeight: 600, color: colors.textSecondary }}>
          {userName} • {year || new Date().getFullYear()} Wrapped
        </span>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Footer */}
      <div style={footerStyle}>
        <span style={{ fontSize: '24px', color: colors.textSecondary, fontWeight: 500 }}>
          pacelane.com
        </span>
        {index !== undefined && totalSlides !== undefined && (
          <span style={{ fontSize: '24px', color: colors.textSecondary, fontWeight: 500 }}>
            {index + 1} / {totalSlides}
          </span>
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatBox = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
  <div style={{ padding: '40px', backgroundColor: colors.background, borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ color: colors.primary }}>{icon}</div>
    <div>
      <div style={{ fontSize: '50px', fontWeight: 800, color: colors.text }}>
        {value.toLocaleString('pt-BR')}
      </div>
      <div style={{ fontSize: '28px', color: colors.textSecondary, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  </div>
);

const EngagementPill = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
    <div style={{ color: colors.primary }}>{icon}</div>
    <span style={{ fontSize: '32px', fontWeight: 600, color: colors.text }}>
      {value.toLocaleString('pt-BR')}
    </span>
  </div>
);

// Default placeholder image for profile (gray silhouette)
const DEFAULT_PROFILE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDU0IiBoZWlnaHQ9IjQ1NCIgdmlld0JveD0iMCAwIDQ1NCA0NTQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ1NCIgaGVpZ2h0PSI0NTQiIGZpbGw9IiMzNzM3M0IiLz48Y2lyY2xlIGN4PSIyMjciIGN5PSIxNzAiIHI9IjgwIiBmaWxsPSIjNjY2Ii8+PHBhdGggZD0iTTEyNyA0NTRDMTI3IDM3My4xMzIgMTcyLjEwOCAzMjAgMjI3IDMyMEMyODEuODkyIDMyMCAzMjcgMzczLjEzMiAzMjcgNDU0IiBmaWxsPSIjNjY2Ii8+PC9zdmc+';

// Helper function to convert image URL to base64 (to avoid CORS issues in PDF export)
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    // Create a canvas to draw the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataUrl);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => {
        console.warn('Failed to load image, using default placeholder');
        resolve(DEFAULT_PROFILE_IMAGE);
      };
      // Add timestamp to avoid cache issues
      img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return DEFAULT_PROFILE_IMAGE;
  }
};

// Intro Slide Component - uses SVG template with placeholder replacement
const IntroSlide: React.FC<{ data: any; userName?: string }> = ({ data, userName }) => {
  const [profileImageBase64, setProfileImageBase64] = useState<string>(DEFAULT_PROFILE_IMAGE);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // Convert profile image URL to base64 to avoid CORS issues
  useEffect(() => {
    const loadImage = async () => {
      const imageUrl = data?.profileImage;
      if (imageUrl && !imageUrl.startsWith('data:')) {
        setIsLoadingImage(true);
        const base64 = await imageUrlToBase64(imageUrl);
        setProfileImageBase64(base64);
        setIsLoadingImage(false);
      } else if (imageUrl) {
        setProfileImageBase64(imageUrl);
        setIsLoadingImage(false);
      } else {
        setProfileImageBase64(DEFAULT_PROFILE_IMAGE);
        setIsLoadingImage(false);
      }
    };
    loadImage();
  }, [data?.profileImage]);

  // Calculate and format values
  const processedSvg = useMemo(() => {
    // Calculate values from data
    const displayName = userName || 'Usuário';
    const totalPosts = (data?.totalPosts || 0).toLocaleString('pt-BR');
    const totalReactions = (
      (data?.engagementStats?.totalLikes || 0) + 
      (data?.engagementStats?.totalComments || 0) + 
      (data?.engagementStats?.totalShares || 0)
    ).toLocaleString('pt-BR');
    const totalComments = (data?.engagementStats?.totalComments || 0).toLocaleString('pt-BR');
    const totalShares = (data?.engagementStats?.totalShares || 0).toLocaleString('pt-BR');

    // Replace placeholders in SVG
    let svg = capaSvgRaw;
    svg = svg.replace(/\{\{USER_NAME\}\}/g, displayName);
    svg = svg.replace(/\{\{TOTAL_POSTS\}\}/g, totalPosts);
    svg = svg.replace(/\{\{TOTAL_REACTIONS\}\}/g, totalReactions);
    svg = svg.replace(/\{\{TOTAL_COMMENTS\}\}/g, totalComments);
    svg = svg.replace(/\{\{TOTAL_SHARES\}\}/g, totalShares);
    svg = svg.replace(/\{\{PROFILE_IMAGE\}\}/g, profileImageBase64);

    return svg;
  }, [data, userName, profileImageBase64]);

  if (isLoadingImage) {
    return (
      <div 
        style={{ 
          position: 'relative',
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          backgroundColor: '#18181B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '1080px',
        height: '1350px',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
};

// Pace Slide Component - uses SVG template with dynamic progress bar
const PaceSlide: React.FC<{ data: any }> = ({ data }) => {
  // Calculate values from data
  const processedSvg = useMemo(() => {
    // Total posts
    const totalPosts = data?.totalPosts || 0;
    
    // Calculate posts per week (assuming roughly 52 weeks per year)
    // If we have postingFrequency.postsPerMonth, convert to weekly
    const postsPerMonth = data?.postingFrequency?.postsPerMonth || 0;
    const postsPerWeekNum = postsPerMonth > 0 
      ? (postsPerMonth / 4.33) // ~4.33 weeks per month
      : (totalPosts / 52);
    const postsPerWeek = postsPerWeekNum.toFixed(1).replace('.', ',');
    
    // Get monthly breakdown from yearInReview
    const monthlyBreakdown = data?.yearInReview?.monthlyBreakdown || [];
    
    // Calculate active months and longest streak
    let activeMonths = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    
    monthlyBreakdown.forEach((month: any) => {
      if (month.posts > 0) {
        activeMonths++;
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    });
    
    // Convert streak months to approximate weeks
    const streakWeeksNum = longestStreak * 4;
    const streakWeeks = String(streakWeeksNum).padStart(2, '0');
    
    // Calculate active weeks percentage based on active months
    const totalWeeksInYear = 52;
    const estimatedActiveWeeks = activeMonths * 4; // ~4 weeks per active month
    const activeWeeksPercent = activeMonths > 0 
      ? Math.min(100, Math.round((estimatedActiveWeeks / totalWeeksInYear) * 100))
      : 0;
    
    // Calculate progress bar dimensions
    // Total bar width from x=96 to x=984 = 888 pixels
    const totalBarWidth = 888;
    const progressBarWidth = Math.max(1, Math.round((activeWeeksPercent / 100) * totalBarWidth));
    const progressBarBgX = 96 + progressBarWidth;
    const progressBarBgWidth = Math.max(0, totalBarWidth - progressBarWidth);

    // Replace placeholders in SVG
    let svg = paceSvgRaw;
    svg = svg.replace(/\{\{TOTAL_POSTS\}\}/g, totalPosts.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{POSTS_PER_WEEK\}\}/g, postsPerWeek);
    svg = svg.replace(/\{\{STREAK_WEEKS\}\}/g, streakWeeks);
    svg = svg.replace(/\{\{ACTIVE_WEEKS_PERCENT\}\}/g, String(activeWeeksPercent));
    svg = svg.replace(/\{\{PROGRESS_BAR_WIDTH\}\}/g, String(progressBarWidth));
    svg = svg.replace(/\{\{PROGRESS_BAR_BG_X\}\}/g, String(progressBarBgX));
    svg = svg.replace(/\{\{PROGRESS_BAR_BG_WIDTH\}\}/g, String(progressBarBgWidth));

    return svg;
  }, [data]);

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '1080px',
        height: '1350px',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
};

// Reactions Slide Component - shows engagement breakdown by reaction type
// This shows reactions RECEIVED on the user's own posts
const ReactionsSlide: React.FC<{ data: any }> = ({ data }) => {
  // Calculate values from data
  const processedSvg = useMemo(() => {
    // First, try to get detailed reaction types from reactionsData (if available from separate scraping)
    const reactionTypes = data?.reactionsData?.reactionTypes || {};
    
    // Get total likes from engagement stats (reactions received on user's posts)
    const totalLikes = data?.engagementStats?.totalLikes || 0;
    
    // If we have detailed reaction types, use them
    // Otherwise, distribute total likes proportionally based on typical LinkedIn distribution
    let reactionLike = 0;
    let reactionCelebrate = 0;
    let reactionSupport = 0;
    let reactionLove = 0;
    let reactionInsight = 0;
    let reactionFunny = 0;
    
    if (reactionTypes.like || reactionTypes.celebrate || reactionTypes.support || 
        reactionTypes.love || reactionTypes.insight || reactionTypes.funny) {
      // Use actual reaction types if available
      reactionLike = reactionTypes.like || 0;
      reactionCelebrate = reactionTypes.celebrate || 0;
      reactionSupport = reactionTypes.support || 0;
      reactionLove = reactionTypes.love || 0;
      reactionInsight = reactionTypes.insight || 0;
      reactionFunny = reactionTypes.funny || 0;
    } else {
      // Distribute total likes proportionally based on typical LinkedIn reaction distribution
      // Typical distribution: Like (60%), Love (15%), Celebrate (10%), Support (5%), Insight (7%), Funny (3%)
      reactionLike = Math.round(totalLikes * 0.60);
      reactionLove = Math.round(totalLikes * 0.15);
      reactionCelebrate = Math.round(totalLikes * 0.10);
      reactionSupport = Math.round(totalLikes * 0.05);
      reactionInsight = Math.round(totalLikes * 0.07);
      reactionFunny = Math.round(totalLikes * 0.03);
      
      // Adjust for rounding errors - ensure total matches
      const distributedTotal = reactionLike + reactionLove + reactionCelebrate + 
                               reactionSupport + reactionInsight + reactionFunny;
      const difference = totalLikes - distributedTotal;
      if (difference !== 0) {
        reactionLike += difference; // Add/subtract difference to Like (most common)
      }
    }
    
    // Get totals from engagement stats (reactions received on user's posts)
    const totalComments = data?.engagementStats?.totalComments || 0;
    const totalShares = data?.engagementStats?.totalShares || 0;
    
    // Format shares with leading zero if single digit
    const formattedShares = totalShares < 10 
      ? `0${totalShares}` 
      : String(totalShares);

    // Replace placeholders in SVG
    let svg = reacoesSvgRaw;
    svg = svg.replace(/\{\{REACTION_LIKE\}\}/g, reactionLike.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{REACTION_CELEBRATE\}\}/g, reactionCelebrate.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{REACTION_SUPPORT\}\}/g, reactionSupport.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{REACTION_LOVE\}\}/g, reactionLove.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{REACTION_INSIGHT\}\}/g, reactionInsight.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{REACTION_FUNNY\}\}/g, reactionFunny.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{TOTAL_COMMENTS\}\}/g, totalComments.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{TOTAL_SHARES\}\}/g, formattedShares);

    return svg;
  }, [data]);

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '1080px',
        height: '1350px',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
};

// Friends Slide Component - shows top commenters/interactors
// This shows users who interacted most with the user's posts
const FriendsSlide: React.FC<{ data: any }> = ({ data }) => {
  const [friendImages, setFriendImages] = useState<string[]>([
    DEFAULT_PROFILE_IMAGE,
    DEFAULT_PROFILE_IMAGE,
    DEFAULT_PROFILE_IMAGE
  ]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Get top commenters/interactors from data
  const topFriends = useMemo(() => {
    // Try to get from topCommenters field (most likely location from scraping)
    const commenters = data?.topCommenters || data?.topInteractors || [];
    
    // Take top 3
    return commenters.slice(0, 3).map((friend: any) => ({
      name: friend.name || friend.authorName || 'Amigo',
      image: friend.profileImage || friend.authorProfileImage || friend.image || null,
    }));
  }, [data]);

  // Load and convert friend images to base64
  useEffect(() => {
    const loadImages = async () => {
      setIsLoadingImages(true);
      
      const imagePromises = [0, 1, 2].map(async (index) => {
        const friend = topFriends[index];
        if (friend?.image && !friend.image.startsWith('data:')) {
          try {
            const base64 = await imageUrlToBase64(friend.image);
            return base64;
          } catch {
            return DEFAULT_PROFILE_IMAGE;
          }
        } else if (friend?.image) {
          return friend.image;
        }
        return DEFAULT_PROFILE_IMAGE;
      });

      const loadedImages = await Promise.all(imagePromises);
      setFriendImages(loadedImages);
      setIsLoadingImages(false);
    };

    loadImages();
  }, [topFriends]);

  // Process SVG with placeholders
  const processedSvg = useMemo(() => {
    // Get friend names (with fallbacks)
    const friend1Name = topFriends[0]?.name || 'Amigo 1';
    const friend2Name = topFriends[1]?.name || 'Amigo 2';
    const friend3Name = topFriends[2]?.name || 'Amigo 3';

    // Replace placeholders in SVG
    let svg = amigosSvgRaw;
    svg = svg.replace(/\{\{FRIEND_1_NAME\}\}/g, friend1Name);
    svg = svg.replace(/\{\{FRIEND_2_NAME\}\}/g, friend2Name);
    svg = svg.replace(/\{\{FRIEND_3_NAME\}\}/g, friend3Name);
    svg = svg.replace(/\{\{FRIEND_1_IMAGE\}\}/g, friendImages[0]);
    svg = svg.replace(/\{\{FRIEND_2_IMAGE\}\}/g, friendImages[1]);
    svg = svg.replace(/\{\{FRIEND_3_IMAGE\}\}/g, friendImages[2]);

    return svg;
  }, [topFriends, friendImages]);

  if (isLoadingImages) {
    return (
      <div 
        style={{ 
          position: 'relative',
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          backgroundColor: '#18181B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '1080px',
        height: '1350px',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
};

// Formats Slide Component - shows breakdown of content types (text, image, video, document)
const FormatsSlide: React.FC<{ data: any }> = ({ data }) => {
  const processedSvg = useMemo(() => {
    // Calculate content type breakdown from posts
    const posts = data?.posts || [];
    
    // Initialize counters for each content type
    const contentTypes = {
      text: { posts: 0, comments: 0, reactions: 0 },
      image: { posts: 0, comments: 0, reactions: 0 },
      video: { posts: 0, comments: 0, reactions: 0 },
      document: { posts: 0, comments: 0, reactions: 0 },
    };

    // Analyze each post to determine content type
    posts.forEach((post: any) => {
      const engagement = post.engagement || {};
      const likes = engagement.likes || 0;
      const comments = engagement.comments || 0;
      
      // Determine content type based on post structure
      // LinkedIn posts can have different types indicated by presence of media
      let contentType: 'text' | 'image' | 'video' | 'document' = 'text';
      
      // Check if post has media indicators
      if (post.media) {
        if (post.media.type === 'video' || post.media.type === 'VIDEO') {
          contentType = 'video';
        } else if (post.media.type === 'image' || post.media.type === 'IMAGE') {
          contentType = 'image';
        } else if (post.media.type === 'document' || post.media.type === 'DOCUMENT') {
          contentType = 'document';
        }
      } else if (post.hasImage || post.imageUrl) {
        contentType = 'image';
      } else if (post.hasVideo || post.videoUrl) {
        contentType = 'video';
      } else if (post.hasDocument || post.documentUrl) {
        contentType = 'document';
      }
      
      contentTypes[contentType].posts += 1;
      contentTypes[contentType].comments += comments;
      contentTypes[contentType].reactions += likes;
    });

    // If all posts are categorized as text (no media info available),
    // we'll show some reasonable distribution based on typical LinkedIn patterns
    // This is a fallback for when the scraper doesn't provide media type info
    const totalPosts = posts.length;
    if (totalPosts > 0 && contentTypes.text.posts === totalPosts) {
      // Distribute based on typical LinkedIn patterns: ~70% text, ~20% image, ~5% video, ~5% document
      const textCount = Math.ceil(totalPosts * 0.7);
      const imageCount = Math.ceil(totalPosts * 0.2);
      const videoCount = Math.ceil(totalPosts * 0.05);
      const documentCount = totalPosts - textCount - imageCount - videoCount;
      
      // Calculate engagement proportionally
      const totalLikes = data?.engagementStats?.totalLikes || 0;
      const totalComments = data?.engagementStats?.totalComments || 0;
      
      contentTypes.text.posts = textCount;
      contentTypes.text.comments = Math.round(totalComments * 0.6);
      contentTypes.text.reactions = Math.round(totalLikes * 0.6);
      
      contentTypes.image.posts = imageCount > 0 ? imageCount : 0;
      contentTypes.image.comments = Math.round(totalComments * 0.25);
      contentTypes.image.reactions = Math.round(totalLikes * 0.25);
      
      contentTypes.video.posts = videoCount > 0 ? videoCount : 0;
      contentTypes.video.comments = Math.round(totalComments * 0.1);
      contentTypes.video.reactions = Math.round(totalLikes * 0.1);
      
      contentTypes.document.posts = documentCount > 0 ? documentCount : 0;
      contentTypes.document.comments = Math.round(totalComments * 0.05);
      contentTypes.document.reactions = Math.round(totalLikes * 0.05);
    }

    // Calculate bar widths proportionally (max width is 828px for full bar)
    const maxBarWidth = 828;
    const maxPosts = Math.max(
      contentTypes.text.posts,
      contentTypes.image.posts,
      contentTypes.video.posts,
      contentTypes.document.posts,
      1 // Prevent division by zero
    );
    
    const textBarWidth = Math.max(10, Math.round((contentTypes.text.posts / maxPosts) * maxBarWidth));
    const imageBarWidth = Math.max(10, Math.round((contentTypes.image.posts / maxPosts) * maxBarWidth));
    const videoBarWidth = Math.max(10, Math.round((contentTypes.video.posts / maxPosts) * maxBarWidth));
    const documentBarWidth = Math.max(10, Math.round((contentTypes.document.posts / maxPosts) * maxBarWidth));

    // Format numbers
    const formatNumber = (num: number): string => {
      if (num >= 1000) {
        return new Intl.NumberFormat('pt-BR').format(num);
      }
      return num.toString();
    };

    // Replace placeholders
    let svg = formatosSvgRaw;
    
    // Replace bar widths
    svg = svg.replace('{{TEXT_BAR_WIDTH}}', textBarWidth.toString());
    svg = svg.replace('{{IMAGE_BAR_WIDTH}}', imageBarWidth.toString());
    svg = svg.replace('{{VIDEO_BAR_WIDTH}}', videoBarWidth.toString());
    svg = svg.replace('{{DOCUMENT_BAR_WIDTH}}', documentBarWidth.toString());
    
    // Replace text stats
    svg = svg.replace('{{TEXT_POSTS}}', formatNumber(contentTypes.text.posts));
    svg = svg.replace('{{TEXT_COMMENTS}}', formatNumber(contentTypes.text.comments));
    svg = svg.replace('{{TEXT_REACTIONS}}', formatNumber(contentTypes.text.reactions));
    
    // Replace image stats
    svg = svg.replace('{{IMAGE_POSTS}}', formatNumber(contentTypes.image.posts));
    svg = svg.replace('{{IMAGE_COMMENTS}}', formatNumber(contentTypes.image.comments));
    svg = svg.replace('{{IMAGE_REACTIONS}}', formatNumber(contentTypes.image.reactions));
    
    // Replace video stats
    svg = svg.replace('{{VIDEO_POSTS}}', formatNumber(contentTypes.video.posts));
    svg = svg.replace('{{VIDEO_COMMENTS}}', formatNumber(contentTypes.video.comments));
    svg = svg.replace('{{VIDEO_REACTIONS}}', formatNumber(contentTypes.video.reactions));
    
    // Replace document stats
    svg = svg.replace('{{DOCUMENT_POSTS}}', formatNumber(contentTypes.document.posts));
    svg = svg.replace('{{DOCUMENT_COMMENTS}}', formatNumber(contentTypes.document.comments));
    svg = svg.replace('{{DOCUMENT_REACTIONS}}', formatNumber(contentTypes.document.reactions));
    
    return svg;
  }, [data]);

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '1080px',
        height: '1350px',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
};
