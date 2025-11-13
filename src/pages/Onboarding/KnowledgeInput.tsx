import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import StatusBadge from '@/design-system/components/StatusBadge';
import FileUpload from '@/design-system/components/FileUpload';
import { X } from '@phosphor-icons/react';

// File icon imports
import FileIconCode from '@/assets/icons/file-code.svg';
import FileIconPDF from '@/assets/icons/file-pdf.svg';
import FileIconVideo from '@/assets/icons/file-video.svg';
import FileIconImage from '@/assets/icons/file-image.svg';
import FileIconAudio from '@/assets/icons/file-audio.svg';
import FileIconLink from '@/assets/icons/file-link.svg';
import FileIconZip from '@/assets/icons/file-zip.svg';
import FileIconDefault from '@/assets/icons/file-default.svg';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'uploaded' | 'error';
}

const KnowledgeInput = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [urlValue, setUrlValue] = useState('');

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      status: 'uploading',
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload process
    newFiles.forEach((file) => {
      setTimeout(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: 'uploaded' as const } : f
          )
        );
      }, 2000);
    });
  };

  // Handle URL submit
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlValue.trim()) {
      const urlFile: UploadedFile = {
        id: `url-${Date.now()}`,
        name: urlValue,
        size: 0,
        status: 'uploading',
      };

      setUploadedFiles((prev) => [...prev, urlFile]);
      setUrlValue('');

      // Simulate upload
      setTimeout(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === urlFile.id ? { ...f, status: 'uploaded' as const } : f
          )
        );
      }, 2000);
    }
  };

  // Handle file removal
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Get file icon based on file type
  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Check if it's a URL (no size = URL)
    if (!extension || fileName.startsWith('http')) return FileIconLink;
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(extension)) {
      return FileIconCode;
    }
    
    // PDFs
    if (extension === 'pdf') return FileIconPDF;
    
    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(extension)) {
      return FileIconVideo;
    }
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return FileIconImage;
    }
    
    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) {
      return FileIconAudio;
    }
    
    // Zip/Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return FileIconZip;
    }
    
    return FileIconDefault;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return 'URL';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get status color and text
  const getStatusDisplay = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return { text: t('onboarding.knowledge.uploadStatus.uploading'), color: colors.text.informative };
      case 'uploaded':
        return { text: t('onboarding.knowledge.uploadStatus.uploaded'), color: colors.text.success };
      case 'error':
        return { text: t('onboarding.knowledge.uploadStatus.error'), color: colors.text.destructive };
    }
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/writing-format');
  };

  const handleContinue = () => {
    // Navigate to Ready page
    console.log('Uploaded Files:', uploadedFiles);
    navigate('/onboarding/ready');
  };

  // Page container styles
  const pageContainerStyles = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  // Main content container styles (below TopNav)
  const mainContentStyles = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spacing[24],
  };

  // Main card container styles
  const mainCardStyles = {
    width: '580px',
    height: '480px',
    backgroundColor: 'transparent',
    borderRadius: cornerRadius.borderRadius.lg,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'row' as const,
    overflow: 'hidden',
  };

  // Main container (left side) styles
  const mainContainerStyles = {
    flex: 1,
    backgroundColor: colors.bg.card.default,
    borderRight: `${stroke.DEFAULT} solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Content container styles (top part of main container)
  const contentContainerStyles = {
    flex: 1,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    paddingTop: spacing.spacing[36],
    paddingBottom: spacing.spacing[24],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[16],
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${colors.border.default} transparent`,
  };

  // Text container styles
  const textContainerStyles = {
    width: '100%',
    height: '140px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Title styles using Instrument Serif
  const titleStyles = {
    fontFamily: typography.fontFamily['instrument-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle styles
  const subtitleStyles = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // File card styles
  const fileCardStyles = {
    width: '100%',
    maxWidth: '100%',
    paddingTop: spacing.spacing[8],
    paddingBottom: spacing.spacing[8],
    paddingLeft: spacing.spacing[8],
    paddingRight: spacing.spacing[16],
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[12],
    boxSizing: 'border-box' as const,
  };

  // File info container styles
  const fileInfoContainerStyles = {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[4],
  };

  // File name styles
  const fileNameStyles = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '160px',
  };

  // File meta row styles
  const fileMetaRowStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[8],
    alignItems: 'center',
  };

  // File size styles
  const fileSizeStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // File status styles
  const fileStatusStyles = {
    ...textStyles.xs.medium,
    margin: 0,
  };

  // Remove button styles
  const removeButtonStyles = {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };

  // Button container styles (bottom part of main container)
  const buttonContainerStyles = {
    paddingTop: spacing.spacing[20],
    paddingBottom: spacing.spacing[20],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[4],
  };

  // Accuracy bar (right side) styles
  const accuracyBarStyles = {
    width: '200px',
    backgroundColor: colors.bg.subtle,
    paddingTop: spacing.spacing[16],
    paddingBottom: spacing.spacing[16],
    paddingLeft: spacing.spacing[16],
    paddingRight: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Bar container styles
  const barContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    width: '100%',
  };

  // Lines bar container styles
  const linesBarContainerStyles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2px',
  };

  // Individual line bar styles (4 red, 12 orange, 6 emerald)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: 
      index < 4 
        ? primitiveColors.red[500] 
        : index < 16 
        ? primitiveColors.orange[500]
        : index < 22
        ? primitiveColors.emerald[500]
        : primitiveColors.transparentDark[10],
    borderRadius: cornerRadius.borderRadius['2xs'],
  });

  // Divider styles
  const dividerStyles = {
    width: '100%',
    height: '1px',
    backgroundColor: colors.border.default,
  };

  // Steps container styles
  const stepsContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[6],
  };

  // Step item styles
  const stepItemStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  // Step text styles
  const stepTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
    flex: 1,
  };

  // Label text styles
  const labelTextStyles = {
    ...textStyles.xs.semibold,
    color: colors.text.muted,
    margin: 0,
  };

  // Info text styles
  const infoTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Steps list
  const steps = [
    { label: t('onboarding.progress.steps.linkedIn'), active: true },
    { label: t('onboarding.progress.steps.whatsapp'), active: true },
    { label: t('onboarding.progress.steps.pacing'), active: true },
    { label: t('onboarding.progress.steps.goals'), active: true },
    { label: t('onboarding.progress.steps.pillars'), active: true },
    { label: t('onboarding.progress.steps.format'), active: true },
    { label: t('onboarding.progress.steps.knowledge'), active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .knowledge-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .knowledge-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .knowledge-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 3px;
        }
        .knowledge-content-container::-webkit-scrollbar-thumb:hover {
          background-color: ${colors.border.darker};
        }
      `}</style>

      {/* TopNav Bar - Stuck to the top */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <TopNav />
      </div>

      {/* Main content container */}
      <div style={mainContentStyles}>
        {/* Main card container */}
        <div style={mainCardStyles}>
          {/* Main container (left side) */}
          <div style={mainContainerStyles}>
            {/* Content container */}
            <div className="knowledge-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>{t('onboarding.knowledge.title')}</h1>
                <p style={subtitleStyles}>
                  {t('onboarding.knowledge.subtitle')}
                </p>
              </div>

              {/* File Upload Area */}
              <FileUpload
                onFileSelect={handleFileSelect}
                onUrlSubmit={handleUrlSubmit}
                urlValue={urlValue}
                onUrlChange={setUrlValue}
                multiple={true}
                maxFiles={10}
              />

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8], width: '100%', maxWidth: '100%' }}>
                  {uploadedFiles.map((file) => {
                    const statusDisplay = getStatusDisplay(file.status);
                    
                    return (
                      <div key={file.id} style={fileCardStyles}>
                        {/* File Icon */}
                        <div style={{ flexShrink: 0, width: '24px', height: '24px' }}>
                          <img
                            src={getFileIcon(file.name)}
                            alt="file icon"
                            style={{ width: '24px', height: '24px' }}
                          />
                        </div>

                        {/* File Info */}
                        <div style={fileInfoContainerStyles}>
                          <p style={fileNameStyles}>{file.name}</p>
                          <div style={fileMetaRowStyles}>
                            <p style={fileSizeStyles}>{formatFileSize(file.size)}</p>
                            <p style={{ ...fileStatusStyles, color: statusDisplay.color }}>
                              {statusDisplay.text}
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div
                          style={{ ...removeButtonStyles, flexShrink: 0 }}
                          onClick={() => handleRemoveFile(file.id)}
                        >
                          <X size={16} color={colors.icon.muted} weight="bold" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label={t('onboarding.knowledge.backButton')}
                  onClick={handleGoBack}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={t('onboarding.knowledge.continueButton')}
                  onClick={handleContinue}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>{t('onboarding.progress.accuracyLabel')}</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>70% {t('onboarding.progress.completed')}</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                {t('onboarding.progress.infoText')}
              </p>
            </div>

            {/* Steps container */}
            <div style={stepsContainerStyles}>
              <div style={dividerStyles} />
              {steps.map((step) => (
                <React.Fragment key={step.label}>
                  <div style={stepItemStyles}>
                    <StatusBadge active={step.active} />
                    <p style={stepTextStyles}>{step.label}</p>
                  </div>
                  <div style={dividerStyles} />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeInput;

