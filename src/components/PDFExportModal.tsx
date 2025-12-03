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
  const [selectedSlides, setSelectedSlides] = useState<string[]>(['intro', 'summary', 'top-post', 'posting-habits', 'outro']);
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Define available slides based on data
  const slides: SlideConfig[] = [
    { id: 'intro', type: 'intro', label: 'Capa' },
    { id: 'summary', type: 'summary', label: 'Resumo', data: wrappedData },
    // Only show top post if available
    ...(wrappedData.topPosts && wrappedData.topPosts.length > 0 ? [{
      id: 'top-post',
      type: 'top-post' as SlideType,
      label: 'Top Post',
      data: wrappedData.topPosts[0]
    }] : []),
    { id: 'posting-habits', type: 'posting-habits', label: 'Hábitos', data: wrappedData.postingHabits },
    { id: 'outro', type: 'outro', label: 'Encerramento' }
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

      // Get selected slide configs in order
      const slidesToRender = slides.filter(s => selectedSlides.includes(s.id));

      for (let i = 0; i < slidesToRender.length; i++) {
        const slideConfig = slidesToRender[i];
        const element = container.querySelector(`[data-slide-id="${slideConfig.id}"]`) as HTMLElement;
        
        if (element) {
          // Wait a bit for images to load/render if needed
          await new Promise(resolve => setTimeout(resolve, 100));

          const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true, // Allow loading cross-origin images (like profile pic)
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

      pdf.save(`linkedin-wrapped-2025-${userName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
        {slides.map((slide, index) => {
          // Calculate the index relative to selected slides for the footer "X / Y"
          const selectedIndex = selectedSlides.indexOf(slide.id);
          const isSelected = selectedIndex !== -1;
          
          // We render ALL slides but only capture selected ones. 
          // Actually, better to only render selected ones to save resources?
          // But if we toggle, we might want them ready.
          // Let's render all but only process selected.
          
          return (
            <div key={slide.id} data-slide-id={slide.id} style={{ marginBottom: '50px' }}>
              <CarouselSlide
                type={slide.type}
                data={slide.data}
                index={isSelected ? selectedIndex : undefined}
                totalSlides={selectedSlides.length}
                userName={userName}
                userImage={userImage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
