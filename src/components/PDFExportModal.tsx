import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, Download, Check, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from '@/services/theme-context';
import { CarouselSlide, SlideType } from '@/components/CarouselSlide';
import Button from '@/design-system/components/Button';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wrappedData: any; // Using any for flexibility, but should match LinkedInWrappedData
  userName: string;
  userImage?: string;
}

interface SlideConfig {
  id: string;
  type: SlideType;
  label: string;
  data?: any;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  wrappedData,
  userName,
  userImage
}) => {
  const { colors } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<string[]>([
    'intro',
    'pace',
    'reactions',
    'timeline',
    'podium',
    'analysis',
    'distance',
  ]);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  const previewData = useMemo(() => {
    const sampleMonthly = [
      { month: 'janeiro', posts: 6, totalEngagement: 120 },
      { month: 'fevereiro', posts: 12, totalEngagement: 260 },
      { month: 'março', posts: 4, totalEngagement: 80 },
      { month: 'abril', posts: 10, totalEngagement: 210 },
      { month: 'maio', posts: 7, totalEngagement: 140 },
      { month: 'junho', posts: 18, totalEngagement: 420 },
      { month: 'julho', posts: 12, totalEngagement: 260 },
      { month: 'agosto', posts: 15, totalEngagement: 310 },
      { month: 'setembro', posts: 5, totalEngagement: 90 },
      { month: 'outubro', posts: 14, totalEngagement: 280 },
      { month: 'novembro', posts: 8, totalEngagement: 150 },
      { month: 'dezembro', posts: 2, totalEngagement: 40 },
    ];

    return {
      totalPosts: 88,
      totalEngagement: 2200,
      engagementStats: {
        totalLikes: 1500,
        totalComments: 500,
        totalShares: 200,
      },
      reactionsData: {
        reactionTypes: {
          like: 900,
          celebrate: 180,
          support: 90,
          love: 220,
          insight: 180,
          funny: 30,
        },
      },
      postingFrequency: {
        postsPerMonth: 7.3,
        mostActiveMonth: 'junho',
        leastActiveMonth: 'dezembro',
      },
      contentInsights: {
        averagePostLength: 1200,
        mostUsedHashtags: ['#growth', '#startup', '#product', '#ai'],
      },
      topPosts: [
        {
          content: 'Como crescemos 3x em 6 meses usando conteúdo.',
          engagement: { likes: 320, comments: 90, shares: 40 },
        },
        {
          content: 'Template de planejamento semanal para times de produto.',
          engagement: { likes: 260, comments: 70, shares: 20 },
        },
        {
          content: 'Aprendizados de 30 dias publicando diariamente.',
          engagement: { likes: 180, comments: 50, shares: 10 },
        },
      ],
      yearInReview: {
        year: new Date().getFullYear(),
        monthlyBreakdown: sampleMonthly,
      },
      posts: [
        {
          content: 'Como crescemos 3x em 6 meses usando conteúdo.',
          engagement: { likes: 320, comments: 90, shares: 40 },
          publishedAt: `${new Date().getFullYear()}-06-15`,
        },
        {
          content: 'Template de planejamento semanal para times de produto.',
          engagement: { likes: 260, comments: 70, shares: 20 },
          publishedAt: `${new Date().getFullYear()}-08-02`,
        },
      ],
      totalWords: 82000,
      topicClassification: {
        categoryName: 'Conteúdo Estratégico',
        summary: 'Você foca em lições práticas de crescimento e liderança de produto.',
      },
    };
  }, []);

  // Define available selectable slides (contracapa é fixa e não aparece aqui)
  const slides: SlideConfig[] = [
    { id: 'intro', type: 'intro', label: 'Capa', data: wrappedData },
    { id: 'pace', type: 'pace', label: 'Seu Pace', data: wrappedData },
    { id: 'reactions', type: 'reactions', label: 'Reações', data: wrappedData },
    {
      id: 'timeline',
      type: 'timeline' as SlideType,
      label: 'Linha do Tempo',
      data: wrappedData
    },
    {
      id: 'podium',
      type: 'podium' as SlideType,
      label: 'Pódio',
      data: wrappedData
    },
    {
      id: 'analysis',
      type: 'analysis' as SlideType,
      label: 'Análise',
      data: wrappedData
    },
    {
      id: 'distance',
      type: 'distance' as SlideType,
      label: 'Distância',
      data: wrappedData
    },
  ];

  if (!isOpen) return null;

  const SlidePreview: React.FC<{
    slide: SlideConfig;
    isSelected: boolean;
    onToggle: () => void;
    previewIndex: number;
  }> = ({ slide, isSelected, onToggle, previewIndex }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useEffect(() => {
      const updateScale = () => {
        const el = cardRef.current;
        if (!el) return;
        const { clientWidth, clientHeight } = el;
        const innerW = 1080;
        const innerH = 1350;
        const nextScale = Math.min(clientWidth / innerW, clientHeight / innerH);
        if (Number.isFinite(nextScale) && nextScale > 0) {
          setScale(nextScale);
        }
      };

      updateScale();

      const resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScale)
        : null;

      if (resizeObserver && cardRef.current) {
        resizeObserver.observe(cardRef.current);
      } else {
        window.addEventListener('resize', updateScale);
      }

      return () => {
        if (resizeObserver && cardRef.current) {
          resizeObserver.unobserve(cardRef.current);
          resizeObserver.disconnect();
        } else {
          window.removeEventListener('resize', updateScale);
        }
      };
    }, []);

    return (
      <div 
        ref={cardRef}
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          position: 'relative',
          borderRadius: cornerRadius.borderRadius.lg,
          overflow: 'hidden',
          border: `3px solid ${isSelected ? successColor : colors.border.default}`,
          transition: 'all 0.2s ease',
          opacity: isSelected ? 1 : 0.75,
          backgroundColor: colors.bg.card.subtle,
        }}
      >
        <div style={{ 
          width: '100%', 
          paddingBottom: '125%', // 4:5 aspect ratio
          position: 'relative',
          backgroundColor: colors.bg.card.default,
        }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1080,
              height: 1350,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          >
            <CarouselSlide
              type={slide.type}
              data={previewData}
              index={previewIndex}
              totalSlides={slides.length + 1}
              userName={'Você'}
              year={previewData?.yearInReview?.year}
            />
          </div>
        </div>

        {/* Checkbox Overlay */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isSelected ? successColor : colors.bg.state.soft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${colors.text.white?.default || '#FFFFFF'}`
        }}>
          {isSelected && <Check size={14} color={colors.text.white?.default || 'white'} />}
        </div>
      </div>
    );
  };

  const toggleSlide = (id: string) => {
    setSelectedSlides(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const successColor =
    (colors as any)?.bg?.state?.success ||
    (colors as any)?.text?.success ||
    (colors as any)?.bg?.state?.primary;

  const generatePDF = async () => {
    if (selectedSlides.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1080, 1350] // Match slide dimensions
      });

      const container = hiddenContainerRef.current;
      if (!container) throw new Error('Container not found');

      // Get selected slide configs in order (contracapa será adicionada ao final)
      const slidesToRender = slides.filter(s => selectedSlides.includes(s.id));

      const slidesWithTail = [...slidesToRender, { id: 'contracapa', type: 'contracapa' as SlideType, label: 'Contracapa' }];

      for (let i = 0; i < slidesWithTail.length; i++) {
        const slideConfig = slidesWithTail[i];
        const element = container.querySelector(`[data-slide-id="${slideConfig.id}"]`) as HTMLElement;
        
        if (element) {
          // Wait for images to load before capturing
          const images = element.querySelectorAll('img');
          await Promise.all(
            Array.from(images).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails
                setTimeout(resolve, 2000); // Timeout after 2s
              });
            })
          );
          
          // Additional small delay to ensure rendering is complete
          await new Promise(resolve => setTimeout(resolve, 200));

          const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true, // Allow loading cross-origin images (like profile pic)
            allowTaint: true, // Allow images from different origins
            logging: false,
            width: 1080,
            height: 1350,
            windowWidth: 1080,
            windowHeight: 1350,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG

          if (i > 0) {
            pdf.addPage([1080, 1350]);
          }

          pdf.addImage(imgData, 'JPEG', 0, 0, 1080, 1350);
        }
      }

      const year = wrappedData?.yearInReview?.year || new Date().getFullYear();
      pdf.save(`linkedin-wrapped-${year}-${userName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      onClose();
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Falha ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: spacing.spacing[20],
    }}>
      <div style={{
        backgroundColor: colors.bg.card.default,
        borderRadius: cornerRadius.borderRadius['2xl'],
        width: '100%',
        maxWidth: '980px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `1px solid ${colors.border.default}`,
        boxShadow: colors.bg.card?.default ? '0 20px 80px rgba(0,0,0,0.45)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          padding: spacing.spacing[24],
          borderBottom: `1px solid ${colors.border.default}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ ...textStyles.xl.semibold, color: colors.text.default, margin: 0 }}>Exportar para PDF</h2>
          <Button
            style="ghost"
            variant="iconOnly"
            size="sm"
            leadIcon={<X size={18} />}
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div style={{
          padding: spacing.spacing[24],
          overflowY: 'auto',
          flex: 1,
          backgroundColor: colors.bg.subtle,
        }}>
          <p style={{ ...textStyles.sm.medium, marginBottom: spacing.spacing[16], color: colors.text.subtle }}>
            Selecione os slides que deseja incluir no seu carrossel PDF.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: spacing.spacing[16]
          }}>
            {slides.map((slide, index) => {
              const isSelected = selectedSlides.includes(slide.id);
              return (
                <SlidePreview
                  key={slide.id}
                  slide={slide}
                  isSelected={isSelected}
                  onToggle={() => toggleSlide(slide.id)}
                  previewIndex={index}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: spacing.spacing[20],
          borderTop: `1px solid ${colors.border.default}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.spacing[12]
        }}>
          <Button
            label="Cancelar"
            style="ghost"
            size="md"
            onClick={onClose}
          />
          <Button
            label={isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
            style="primary"
            size="md"
            leadIcon={<Download size={18} />}
            onClick={generatePDF}
            loading={isGenerating}
            disabled={isGenerating || selectedSlides.length === 0}
            styleOverrides={{
              backgroundColor: successColor,
              borderColor: successColor,
              color: colors.text.white?.default || '#FFFFFF',
              opacity: isGenerating || selectedSlides.length === 0 ? 0.7 : 1,
            }}
          />
        </div>
      </div>

      {/* Hidden Container for Rendering Slides */}
      <div 
        ref={hiddenContainerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1080px', // Fixed width for rendering
          // We don't set height here, let it flow, but each slide has fixed height
        }}
      >
        {[...slides, { id: 'contracapa', type: 'contracapa' as SlideType, label: 'Contracapa' }].map((slide) => {
          // Calculate the index relative to selected slides for the footer "X / Y"
          const selectedIndex = selectedSlides.indexOf(slide.id);
          const isSelected = slide.id === 'contracapa' ? true : selectedIndex !== -1;
          
          // Render all slides so they're ready when toggled
          // Performance impact is minimal since they're hidden off-screen
          return (
            <div key={slide.id} data-slide-id={slide.id} style={{ marginBottom: '50px' }}>
              <CarouselSlide
                type={slide.type}
                data={slide.data}
                index={
                  slide.id === 'contracapa'
                    ? selectedSlides.length
                    : isSelected
                    ? selectedIndex
                    : undefined
                }
                totalSlides={selectedSlides.length + 1}
                userName={userName}
                userImage={userImage}
                year={wrappedData?.yearInReview?.year || new Date().getFullYear()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
