import React, { useState, useRef } from 'react';
import { X, Download, Check, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CarouselSlide, SlideType } from './CarouselSlide';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<string[]>([
    'intro',
    'pace',
    'reactions',
    'formats',
    'podium',
    'analysis',
    'distance',
  ]);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Define available selectable slides (contracapa é fixa e não aparece aqui)
  const slides: SlideConfig[] = [
    { id: 'intro', type: 'intro', label: 'Capa', data: wrappedData },
    { id: 'pace', type: 'pace', label: 'Seu Pace', data: wrappedData },
    { id: 'reactions', type: 'reactions', label: 'Reações', data: wrappedData },
    // Formats slide - shows content type breakdown
    { 
      id: 'formats', 
      type: 'formats' as SlideType, 
      label: 'Formatos', 
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

  const toggleSlide = (id: string) => {
    setSelectedSlides(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Exportar para PDF</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          <p style={{ marginBottom: '24px', color: '#666' }}>
            Selecione os slides que deseja incluir no seu carrossel PDF.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '24px'
          }}>
            {slides.map((slide, index) => {
              const isSelected = selectedSlides.includes(slide.id);
              return (
                <div 
                  key={slide.id}
                  onClick={() => toggleSlide(slide.id)}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: `3px solid ${isSelected ? '#0A66C2' : 'transparent'}`,
                    transition: 'all 0.2s ease',
                    opacity: isSelected ? 1 : 0.6
                  }}
                >
                  {/* Preview (scaled down) */}
                  <div style={{ 
                    width: '100%', 
                    paddingBottom: '125%', // 4:5 aspect ratio
                    position: 'relative',
                    backgroundColor: '#f3f2ef'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      color: '#666',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <span style={{ fontWeight: 600 }}>{slide.label}</span>
                      {/* We could render a mini version here, but for complexity, just a placeholder or simplified view is safer for now */}
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
                    backgroundColor: isSelected ? '#0A66C2' : 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                  }}>
                    {isSelected && <Check size={14} color="white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={generatePDF}
            disabled={isGenerating || selectedSlides.length === 0}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              backgroundColor: '#0A66C2',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              cursor: isGenerating || selectedSlides.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isGenerating || selectedSlides.length === 0 ? 0.7 : 1
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download size={20} />
                Baixar PDF
              </>
            )}
          </button>
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
