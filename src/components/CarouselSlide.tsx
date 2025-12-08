import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { Heart, MessageCircle, Share2, Calendar, Award, TrendingUp, Hash } from 'lucide-react';
// Import SVGs as raw string for placeholder replacement
import capaSvgRaw from '@/assets/capa.svg?raw';
import paceSvgRaw from '@/assets/pace.svg?raw';
import reacoesSvgRaw from '@/assets/reacoes.svg?raw';
import distanciaSvgRaw from '@/assets/distancia.svg?raw';
import podioSvgRaw from '@/assets/podio.svg?raw';
import analiseSvgRaw from '@/assets/analise.svg?raw';
import contracapaSvgRaw from '@/assets/contracapa.svg?raw';
import { getDistanceRoute } from '@/utils/wrapped/routes';

// Define types locally if not available globally yet, or import them.
// For now, I'll define the props interface.

export type SlideType =
  | 'intro'
  | 'pace'
  | 'reactions'
  | 'timeline'
  | 'distance'
  | 'podium'
  | 'analysis'
  | 'contracapa';

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

      case 'timeline':
        return <TimelineSlide data={data} />;

      case 'distance':
        return <DistanceSlide data={data} />;

      case 'podium':
        return <PodiumSlide data={data} />;

      case 'analysis':
        return <AnalysisSlide data={data} />;

      case 'contracapa':
        return <ContracapaSlide />;

      default:
        return null;
    }
  };

  // For template slides, render without header/footer to match PDF template exactly
  if (
    type === 'intro' ||
    type === 'pace' ||
    type === 'reactions' ||
    type === 'distance' ||
    type === 'timeline' ||
    type === 'podium' ||
    type === 'analysis' ||
    type === 'contracapa'
  ) {
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
    // First, try to fetch the image as a blob (works when CORS is allowed)
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Image fetch failed');
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  } catch (error) {
    // Fallback: attempt canvas conversion; if it fails, return placeholder
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      return await new Promise((resolve, reject) => {
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
        img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
      });
    } catch (err) {
      console.error('Error converting image to base64:', err);
      return DEFAULT_PROFILE_IMAGE;
    }
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
    const displayName =
      data?.profileName ||
      data?.userName ||
      data?.linkedinName ||
      userName ||
      'Usuário';
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
    const postsPerWeek =
      totalPosts === 0
        ? '0'
        : postsPerWeekNum < 1
          ? '< 1'
          : postsPerWeekNum.toFixed(1).replace('.', ',');
    
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
    const streakWeeksNum = Math.max(0, Math.min(totalPosts, longestStreak * 4));
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

// Distance Slide Component - uses SVG template with placeholder replacement
const DistanceSlide: React.FC<{ data: any }> = ({ data }) => {
  const processedSvg = useMemo(() => {
    const totalWords =
      data?.totalWords ??
      (Array.isArray(data?.posts)
        ? data.posts.reduce((acc: number, post: any) => {
            const content = post?.content || '';
            const words = content.trim().split(/\s+/).filter(Boolean).length;
            return acc + words;
          }, 0)
        : 0);

    const route = getDistanceRoute(totalWords || 0);

    let svg = distanciaSvgRaw;
    svg = svg.replace(/\{\{total_words\}\}/g, route.totalWords.toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{from_code\}\}/g, route.from_code);
    svg = svg.replace(/\{\{from_city\}\}/g, route.from_city);
    svg = svg.replace(/\{\{to_code\}\}/g, route.to_code);
    svg = svg.replace(/\{\{to_city\}\}/g, route.to_city);
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

// Podium Slide Component - top 3 posts by reactions+comments (and shares as reaction)
const PodiumSlide: React.FC<{ data: any }> = ({ data }) => {
  const processedSvg = useMemo(() => {
    const wrapLines = (text: string, maxLine = 28, maxChars = 110, maxLines = 4, minWords = 2) => {
      if (!text) return ['Sem dados'];
      const trimmed = text.trim();
      const limited = trimmed.length > maxChars ? trimmed.slice(0, maxChars - 1) + '…' : trimmed;
      const words = limited.split(/\s+/);
      const lines: string[] = [];
      let current = '';
      words.forEach((w) => {
        const candidate = current ? `${current} ${w}` : w;
        if (candidate.length > maxLine) {
          if (current) lines.push(current);
          current = w;
        } else {
          current = candidate;
        }
      });
      if (current) lines.push(current);
      // Garantir mínimo de palavras por linha (evitar linha de 1 palavra estourando largura)
      const adjusted = lines.map((line, idx) => {
        const next = lines[idx + 1];
        if (!next) return line;
        const wordsInLine = line.split(/\s+/);
        if (wordsInLine.length < minWords && next) {
          return line + ' ' + next.split(/\s+/)[0];
        }
        return line;
      });
      const finalLines = adjusted.filter(Boolean);
      if (finalLines.length > maxLines) {
        const sliced = finalLines.slice(0, maxLines);
        sliced[maxLines - 1] = sliced[maxLines - 1] + '…';
        return sliced;
      }
      return finalLines;
    };

    const buildTspans = (lines: string[], x: number, y: number, dy = 18) => {
      return lines
        .map((line, idx) => {
          if (idx === 0) {
            return `<tspan x="${x}" y="${y}">${line}</tspan>`;
          }
          return `<tspan x="${x}" dy="${dy}">${line}</tspan>`;
        })
        .join('');
    };

    const posts = Array.isArray(data?.posts) ? data.posts : data?.topPosts || [];
    const scored = posts
      .map((p: any) => {
        const likes = p?.engagement?.likes || 0;
        const comments = p?.engagement?.comments || 0;
        const shares = p?.engagement?.shares || 0;
        const reactions = likes + shares;
        const score = reactions + comments; // soma de reações e comentários
        return {
          content: p?.content || '',
          reactions,
          comments,
          score,
        };
      })
      .filter((p: any) => p.content && (p.reactions + p.comments) > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);

    const pad = (arr: any[], size: number) => {
      const clone = [...arr];
      while (clone.length < size) {
        clone.push({ content: 'Sem dados', reactions: 0, comments: 0, score: 0 });
      }
      return clone;
    };

    const [p1, p2, p3] = pad(scored, 3);

    let svg = podioSvgRaw;
    svg = svg.replace(
      /<tspan x="421\.012" y="397\.68">\{\{P1_TEXT\}\}<\/tspan>/,
      buildTspans(wrapLines(p1.content), 421.012, 397.68)
    );
    svg = svg.replace(/\{\{P1_REACTIONS\}\}/g, (p1.reactions || 0).toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{P1_COMMENTS\}\}/g, `${(p1.comments || 0).toLocaleString('pt-BR')} Comentários`);

    svg = svg.replace(
      /<tspan x="112" y="519\.68">\{\{P2_TEXT\}\}<\/tspan>/,
      buildTspans(wrapLines(p2.content), 112, 519.68)
    );
    svg = svg.replace(/\{\{P2_REACTIONS\}\}/g, (p2.reactions || 0).toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{P2_COMMENTS\}\}/g, `${(p2.comments || 0).toLocaleString('pt-BR')} Comentários`);

    svg = svg.replace(
      /<tspan x="728\.938" y="580\.68">\{\{P3_TEXT\}\}<\/tspan>/,
      buildTspans(wrapLines(p3.content), 728.938, 580.68)
    );
    svg = svg.replace(/\{\{P3_REACTIONS\}\}/g, (p3.reactions || 0).toLocaleString('pt-BR'));
    svg = svg.replace(/\{\{P3_COMMENTS\}\}/g, `${(p3.comments || 0).toLocaleString('pt-BR')} Comentários`);

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

// Analysis Slide Component - classifies top posts via edge function
const AnalysisSlide: React.FC<{ data: any }> = ({ data }) => {
  const [result, setResult] = useState<{
    categoryName: string;
    summary: string;
  } | null>(data?.topicClassification || null);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchClassification = async () => {
      if (result) return;
      const topPosts = (data?.topPosts || []).slice(0, 5);
      if (!topPosts.length) return;
      setIsLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        const response = await fetch(`${supabaseUrl}/functions/v1/classify-top-posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            posts: topPosts,
          }),
        });
        const json = await response.json();
        if (!response.ok || json.error) {
          console.error('Analysis classification error:', json.error || response.statusText);
          setIsLoading(false);
          return;
        }
        setResult({
          categoryName: json.categoryName,
          summary: json.summary,
        });
      } catch (err) {
        console.error('Analysis classification exception:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassification();
  }, [data, result]);

  const processedSvg = useMemo(() => {
    if (!result) return analiseSvgRaw;
    const title = result.categoryName || 'Tema';
    const summary = result.summary || 'Análise do seu tema mais presente';

    const wrapLines = (
      text: string,
      xCenter: number,
      yStart: number,
      dy: number,
      maxLineChars: number,
      maxLines: number,
      idPrefix: string
    ) => {
      let content = text.trim();
      const lines: string[] = [];
      const words = content.split(/\s+/);
      let current = '';
      for (const w of words) {
        if ((current + (current ? ' ' : '') + w).length <= maxLineChars) {
          current = current ? `${current} ${w}` : w;
        } else {
          if (current) lines.push(current);
          current = w;
        }
      }
      if (current) lines.push(current);

      const finalLines = lines.slice(0, maxLines);
      if (lines.length > maxLines) {
        const last = finalLines[finalLines.length - 1] || '';
        finalLines[finalLines.length - 1] = `${last.slice(0, Math.max(0, maxLineChars - 3))}...`;
      }

      return finalLines
        .map((line, idx) => {
          return `<tspan x="${xCenter}" y="${yStart + idx * dy}" id="${idPrefix}_${idx}" text-anchor="middle">${line}</tspan>`;
        })
        .join('');
    };

    const cleanText = (value: string) =>
      value
        .replace(/["“”‘’]/g, '') // remove qualquer tipo de aspas
        .trim();

    const cleanedTitle = cleanText(title);
    const cleanedSummary = cleanText(summary);

    // Centered title and summary bounds (allow a bit more text in summary)
    const titleWrapped = wrapLines(cleanedTitle, 540, 564.74, 90, 22, 2, 'ANALYSIS_TITLE');
    const summaryWrapped = wrapLines(cleanedSummary, 540, 716.1, 26, 64, 4, 'ANALYSIS_SUMMARY');

    let svg = analiseSvgRaw;
    svg = svg.replace(/\{\{CATEGORY_NAME\}\}/g, titleWrapped);
    svg = svg.replace(/\{\{SUMMARY\}\}/g, summaryWrapped);
    return svg;
  }, [result]);

  if (isLoading || !result) {
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
          backgroundColor: colors.bg.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.default,
          fontFamily: 'Geist, sans-serif',
        }}
      >
        Carregando análise...
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

// Contracapa Slide Component - static
const ContracapaSlide: React.FC = () => {
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
      dangerouslySetInnerHTML={{ __html: contracapaSvgRaw }}
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

const TimelineSlide: React.FC<{ data: any }> = ({ data }) => {
  const processedSvg = useMemo(() => {
    const monthsOrder = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];

    const monthsLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyBreakdown = Array.isArray(data?.yearInReview?.monthlyBreakdown)
      ? data.yearInReview.monthlyBreakdown
      : [];

    const postsByMonth: Record<string, number> = {};
    monthlyBreakdown.forEach((item: any) => {
      const key = (item?.month || '').toString().toLowerCase();
      postsByMonth[key] = item?.posts ?? 0;
    });

    const monthData = monthsOrder.map((key, index) => {
      const posts = postsByMonth[key] ?? 0;
      return { key, label: monthsLabel[index], posts };
    });

    const maxPosts = Math.max(...monthData.map((m) => m.posts), 0);
    const maxBarHeight = 663; // aligns with template tallest bar
    const baselineY = 1162;
    const barWidth = 59.3333;
    const barStep = 75.3333; // distance between bar starts
    const startX = 96;
    const minBarHeight = 12; // keep visible even with 0 posts as requested

    const barsSvg = monthData
      .map((month, idx) => {
        const scaled =
          maxPosts > 0 ? Math.round((month.posts / maxPosts) * maxBarHeight) : minBarHeight;
        const height = Math.max(minBarHeight, scaled);
        const y = baselineY - height;
        const numberY = Math.max(220, y - 24); // prevent going off-canvas
        const x = startX + idx * barStep;
        const value = (month.posts || 0).toLocaleString('pt-BR');

        return `
          <text transform="translate(${x} ${numberY})" fill="white" style="white-space: pre" font-family="Geist" font-size="20" font-weight="bold" letter-spacing="-2px"><tspan x="17.3464" y="15.1">${value}</tspan></text>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="#53D2BE"/>
          <text transform="translate(${x} 1194)" fill="white" style="white-space: pre" font-family="Geist" font-size="20" font-weight="bold" letter-spacing="-2px"><tspan x="12" y="15.1">${month.label}</tspan></text>
        `;
      })
      .join('');

    const svg = `
      <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="1350" fill="#18181B"/>
        <text fill="white" style="white-space: pre" font-family="Geist" font-size="70" font-weight="bold" letter-spacing="-2px"><tspan x="96" y="174.829">Sua evolução</tspan><tspan x="96" y="230.829">durante o ano</tspan></text>
        <text fill="white" fill-opacity="0.7" style="white-space: pre" font-family="Geist" font-size="24" letter-spacing="0px"><tspan x="96" y="298.02">Quantos posts foram feitos por mês</tspan></text>
        ${barsSvg}
        <text fill="white" style="white-space: pre" font-family="Geist" font-size="24" font-weight="300" letter-spacing="0px"><tspan x="753" y="1285.1">pacelane.ai/wrapped</tspan></text>
      </svg>
    `;

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
