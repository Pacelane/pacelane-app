import React from 'react';
import { LinkedInPost } from '../types'; // Assuming types are in a shared file or I might need to define them
import { Heart, MessageCircle, Share2, Calendar, Award, TrendingUp, Hash } from 'lucide-react';

// Define types locally if not available globally yet, or import them.
// For now, I'll define the props interface.

export type SlideType = 'intro' | 'summary' | 'top-post' | 'posting-habits' | 'outro';

interface CarouselSlideProps {
  type: SlideType;
  data: any; // Flexible data prop depending on type
  index?: number;
  totalSlides?: number;
  userName?: string;
  userImage?: string;
}

const colors = {
  primary: '#0A66C2', // LinkedIn Blue
  background: '#F3F2EF',
  text: '#000000',
  textSecondary: '#666666',
  white: '#FFFFFF',
  accent: '#FFD700', // Gold for awards/highlights
};

export const CarouselSlide: React.FC<CarouselSlideProps> = ({ type, data, index, totalSlides, userName, userImage }) => {
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
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', marginBottom: '40px', border: `8px solid ${colors.primary}` }}>
              {userImage ? (
                <img src={userImage} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: colors.background }} />
              )}
            </div>
            <h1 style={{ fontSize: '80px', fontWeight: 800, color: colors.primary, marginBottom: '20px', lineHeight: 1.1 }}>
              MY 2025<br />LINKEDIN<br />WRAPPED
            </h1>
            <p style={{ fontSize: '40px', color: colors.textSecondary, marginTop: '20px' }}>
              Um resumo do meu ano profissional
            </p>
          </div>
        );

      case 'summary':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '60px' }}>
            <h2 style={{ fontSize: '60px', fontWeight: 700, color: colors.text, marginBottom: '40px' }}>
              O Ano em Números
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <StatBox icon={<Calendar size={60} />} value={data.totalPosts} label="Posts Publicados" />
              <StatBox icon={<Heart size={60} />} value={data.totalEngagement.likes} label="Curtidas" />
              <StatBox icon={<MessageCircle size={60} />} value={data.totalEngagement.comments} label="Comentários" />
              <StatBox icon={<Share2 size={60} />} value={data.totalEngagement.shares} label="Compartilhamentos" />
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
                {data.content}
              </p>
              
              <div style={{ marginTop: 'auto', display: 'flex', gap: '40px', borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '40px' }}>
                <EngagementPill icon={<Heart size={40} />} value={data.likes} label="Curtidas" />
                <EngagementPill icon={<MessageCircle size={40} />} value={data.comments} label="Comentários" />
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
              <div style={{ padding: '40px', backgroundColor: '#E8F3FF', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
                  <TrendingUp size={50} color={colors.primary} />
                  <h3 style={{ fontSize: '40px', fontWeight: 600, margin: 0 }}>Dia Mais Ativo</h3>
                </div>
                <p style={{ fontSize: '50px', fontWeight: 800, color: colors.primary, margin: 0 }}>
                  {data.activeDay}
                </p>
              </div>

              {data.topHashtags && data.topHashtags.length > 0 && (
                <div style={{ padding: '40px', backgroundColor: '#FFF8E1', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
                    <Hash size={50} color="#F59E0B" />
                    <h3 style={{ fontSize: '40px', fontWeight: 600, margin: 0 }}>Top Hashtags</h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {data.topHashtags.slice(0, 3).map((tag: any, i: number) => (
                      <span key={i} style={{ fontSize: '36px', color: '#F59E0B', fontWeight: 600 }}>
                        #{tag.tag}
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
              Que venha 2026! 🚀
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

  return (
    <div style={slideStyle} className="carousel-slide">
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>
          in
        </div>
        <span style={{ fontSize: '30px', fontWeight: 600, color: colors.textSecondary }}>
          {userName} • 2025 Wrapped
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
