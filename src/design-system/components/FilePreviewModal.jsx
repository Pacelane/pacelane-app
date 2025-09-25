import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import Button from '@/design-system/components/Button';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { X, Download, FileText, Image, Music, Video, File } from 'lucide-react';

// Services
import { supabase } from '@/integrations/supabase/client';

const FilePreviewModal = ({ 
  isOpen, 
  onClose, 
  file, // File object with { id, name, type, size, fileType }
  userId 
}) => {
  const { colors } = useTheme();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewType, setPreviewType] = useState('unsupported');
  const [error, setError] = useState(null);

  // Determine preview type based on file name and type
  const getPreviewType = (fileName, fileType) => {
    if (!fileName) return 'unsupported';
    const name = fileName.toLowerCase();
    
    if (name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return 'image';
    }
    if (name.match(/\.(mp4|webm|mov)$/i)) {
      return 'video';
    }
    if (name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      return 'audio';
    }
    if (name.match(/\.(txt|md|csv|json)$/i)) {
      return 'text';
    }
    if (name.match(/\.pdf$/i)) {
      return 'pdf';
    }
    
    return 'unsupported';
  };

  // Load file preview data
  const loadPreviewData = async () => {
    if (!file || !userId) return;
    
    console.log('FilePreviewModal: Loading preview for file:', file);
    
    setLoading(true);
    setError(null);
    
    try {
      const fileName = file.name || file.title || 'Unknown File';
      const type = getPreviewType(fileName, file.fileType);
      setPreviewType(type);
      
      console.log('FilePreviewModal: Determined preview type:', type, 'for file:', fileName);
      
      if (type === 'text') {
        // For text files, get the content directly
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
          body: {
            userId: userId,
            action: 'content',
            fileId: file.id
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error || !data.success) {
          throw new Error(data?.error || 'Failed to load file content');
        }

        setPreviewData({
          content: data.content,
          contentType: data.contentType
        });
      } else if (['image', 'video', 'audio', 'pdf'].includes(type)) {
        // For media files, use direct streaming to avoid base64 encoding issues
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('User not authenticated');
        }

        try {
          // Create a stream URL using the edge function
          const streamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-base-storage`;
          
          const response = await fetch(streamUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              action: 'stream',
              fileId: file.id
            })
          });

          if (!response.ok) {
            throw new Error(`Stream request failed: ${response.statusText}`);
          }

          // Get the content type from the response
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
          
          // Create blob from response
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          console.log('Successfully created blob URL using streaming method');

          setPreviewData({
            blobUrl,
            contentType,
            canPreview: true
          });
        } catch (streamError) {
          console.error('Streaming failed, falling back to download option:', streamError);
          setPreviewData({
            downloadOnly: true,
            message: 'Preview not available - click download to view this file',
            error: streamError.message
          });
        }
      }
      
    } catch (error) {
      console.error('Error loading preview:', error);
      const errorMessage = error?.message || 'Failed to load preview';
      setError(errorMessage);
      toast.error(errorMessage, {
        title: 'Preview Error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file download
  const handleDownload = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: userId,
          action: 'preview',
          fileId: file.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to generate download URL');
      }

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.url;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started', {
        title: 'File Download',
        duration: 3000
      });
      
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(error.message, {
        title: 'Download Error',
        duration: 5000
      });
    }
  };

  // Load preview when modal opens
  useEffect(() => {
    if (isOpen && file) {
      loadPreviewData();
    }
  }, [isOpen, file, userId]);

  // Reset state when modal closes and clean up blob URLs
  useEffect(() => {
    if (!isOpen) {
      // Clean up blob URL if it exists
      if (previewData?.blobUrl) {
        URL.revokeObjectURL(previewData.blobUrl);
      }
      setPreviewData(null);
      setPreviewType('unsupported');
      setError(null);
      setLoading(false);
    }
  }, [isOpen, previewData]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewData?.blobUrl) {
        URL.revokeObjectURL(previewData.blobUrl);
      }
    };
  }, [previewData]);

  if (!isOpen) return null;

  // Modal styles
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: spacing.spacing[16],
  };

  const modalStyles = {
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[24],
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: '800px',
    overflow: 'auto',
    border: `1px solid ${colors.border.default}`,
    boxShadow: getShadow('regular.modalLg', colors, { withBorder: true }),
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.spacing[20],
    gap: spacing.spacing[16],
  };

  const titleStyles = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
    flex: 1,
    wordBreak: 'break-word',
  };

  const subtitleStyles = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[4],
  };

  const contentStyles = {
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textPreviewStyles = {
    backgroundColor: colors.bg.subtle,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[16],
    maxHeight: '400px',
    overflow: 'auto',
    width: '100%',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    color: colors.text.default,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image size={48} color={colors.icon.muted} />;
      case 'video': return <Video size={48} color={colors.icon.muted} />;
      case 'audio': return <Music size={48} color={colors.icon.muted} />;
      case 'text': return <FileText size={48} color={colors.icon.muted} />;
      default: return <File size={48} color={colors.icon.muted} />;
    }
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div style={contentStyles}>
          <SubtleLoadingSpinner 
            title="Loading preview..."
            size={16}
          />
        </div>
      );
    }

    if (error) {
      return (
        <div style={contentStyles}>
          {getFileIcon(previewType)}
          <p style={{
            ...textStyles.md.normal,
            color: colors.text.subtle,
            textAlign: 'center',
            marginTop: spacing.spacing[16],
            margin: 0,
          }}>
            Failed to load preview
          </p>
          <p style={{
            ...textStyles.sm.normal,
            color: colors.text.muted,
            textAlign: 'center',
            marginTop: spacing.spacing[8],
            margin: 0,
          }}>
            {error}
          </p>
        </div>
      );
    }

    if (previewType === 'text' && previewData?.content) {
      return (
        <div style={{ width: '100%' }}>
          <h3 style={{
            ...textStyles.md.medium,
            color: colors.text.default,
            margin: 0,
            marginBottom: spacing.spacing[12],
          }}>
            File Content
          </h3>
          <div style={textPreviewStyles}>
            {previewData.content}
          </div>
        </div>
      );
    }

    if (previewType === 'image' && previewData?.blobUrl) {
      return (
        <div style={{ width: '100%' }}>
          <h3 style={{
            ...textStyles.md.medium,
            color: colors.text.default,
            margin: 0,
            marginBottom: spacing.spacing[12],
          }}>
            Image Preview
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg.subtle,
            borderRadius: cornerRadius.borderRadius.md,
            padding: spacing.spacing[16],
            maxHeight: '500px',
            overflow: 'hidden',
          }}>
            <img 
              src={previewData.blobUrl}
              alt={file?.name || file?.title || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
                borderRadius: cornerRadius.borderRadius.sm,
              }}
              onError={(e) => {
                console.error('Error loading image:', e);
                setError('Failed to load image preview');
              }}
            />
          </div>
        </div>
      );
    }

    if (previewType === 'pdf' && previewData?.blobUrl) {
      return (
        <div style={{ width: '100%' }}>
          <h3 style={{
            ...textStyles.md.medium,
            color: colors.text.default,
            margin: 0,
            marginBottom: spacing.spacing[12],
          }}>
            PDF Preview
          </h3>
          <div style={{
            backgroundColor: colors.bg.subtle,
            borderRadius: cornerRadius.borderRadius.md,
            overflow: 'hidden',
            height: '500px',
          }}>
            <iframe
              src={previewData.blobUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={`Preview of ${file?.name || file?.title || 'PDF'}`}
            />
          </div>
        </div>
      );
    }

    if (previewType === 'video' && previewData?.blobUrl) {
      return (
        <div style={{ width: '100%' }}>
          <h3 style={{
            ...textStyles.md.medium,
            color: colors.text.default,
            margin: 0,
            marginBottom: spacing.spacing[12],
          }}>
            Video Preview
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: colors.bg.subtle,
            borderRadius: cornerRadius.borderRadius.md,
            padding: spacing.spacing[16],
          }}>
            <video 
              src={previewData.blobUrl}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: cornerRadius.borderRadius.sm,
              }}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      );
    }

    if (previewType === 'audio' && previewData?.blobUrl) {
      return (
        <div style={{ width: '100%' }}>
          <h3 style={{
            ...textStyles.md.medium,
            color: colors.text.default,
            margin: 0,
            marginBottom: spacing.spacing[12],
          }}>
            Audio Preview
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: colors.bg.subtle,
            borderRadius: cornerRadius.borderRadius.md,
            padding: spacing.spacing[24],
          }}>
            <audio 
              src={previewData.blobUrl}
              controls
              style={{
                width: '100%',
                maxWidth: '400px',
              }}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        </div>
      );
    }

    if (previewType === 'unsupported') {
      return (
        <div style={contentStyles}>
          {getFileIcon(previewType)}
          <p style={{
            ...textStyles.md.normal,
            color: colors.text.subtle,
            textAlign: 'center',
            marginTop: spacing.spacing[16],
            margin: 0,
          }}>
            Preview not available
          </p>
          <p style={{
            ...textStyles.sm.normal,
            color: colors.text.muted,
            textAlign: 'center',
            marginTop: spacing.spacing[8],
            margin: 0,
          }}>
            This file type cannot be previewed in the browser
          </p>
        </div>
      );
    }

    // For files that couldn't be previewed - show download option
    return (
      <div style={contentStyles}>
        {getFileIcon(previewType)}
        <p style={{
          ...textStyles.md.normal,
          color: colors.text.subtle,
          textAlign: 'center',
          marginTop: spacing.spacing[16],
          margin: 0,
        }}>
          {previewData?.message || 'Preview not available'}
        </p>
        <p style={{
          ...textStyles.sm.normal,
          color: colors.text.muted,
          textAlign: 'center',
          marginTop: spacing.spacing[8],
          margin: 0,
        }}>
          Click the download button to view this file
        </p>
      </div>
    );
  };

  return (
    <div style={overlayStyles} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={{ flex: 1 }}>
            <h2 style={titleStyles}>{file?.name || 'File Preview'}</h2>
            <p style={subtitleStyles}>
              {file?.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {previewType}
            </p>
          </div>
          <Button
            variant="iconOnly"
            style="ghost"
            leadIcon={<X size={16} />}
            onClick={onClose}
            size="md"
          />
        </div>

        {/* Content */}
        {renderPreviewContent()}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.spacing[12],
          marginTop: spacing.spacing[24],
          paddingTop: spacing.spacing[16],
          borderTop: `1px solid ${colors.border.default}`,
        }}>
          <Button
            label="Download"
            style="secondary"
            size="md"
            leadIcon={<Download size={16} />}
            onClick={handleDownload}
          />
          <Button
            label="Close"
            style="primary"
            size="md"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
