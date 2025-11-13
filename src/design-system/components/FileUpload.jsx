import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { Upload } from 'lucide-react';

const FileUpload = forwardRef(({
  onFileSelect,
  accept = '*/*',
  multiple = true,
  maxFiles = 10,
  maxTotalSize,
  uploading = false,
  disabled = false,
}, ref) => {
  const { colors } = useTheme();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      fileInputRef.current?.click();
    },
  }));

  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0 && onFileSelect) {
      let filesToUpload = files;
      if (maxFiles && files.length > maxFiles) {
        filesToUpload = files.slice(0, maxFiles);
      }
      
      if (maxTotalSize) {
        let totalSize = 0;
        filesToUpload = filesToUpload.filter(file => {
          if (totalSize + file.size <= maxTotalSize) {
            totalSize += file.size;
            return true;
          }
          return false;
        });
      }

      if (filesToUpload.length > 0) {
        onFileSelect(filesToUpload);
      }
    }
  }, [disabled, uploading, onFileSelect, maxFiles, maxTotalSize]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
  };

  const dropZoneStyle = {
    border: `2px dashed ${isDragging ? colors.border.teal : colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    backgroundColor: isDragging ? colors.bg.badge.teal : colors.bg.card.subtle,
    padding: spacing.spacing[24],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.spacing[12],
    cursor: disabled || uploading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled || uploading ? 0.5 : 1,
    minHeight: '120px',
  };

  const iconStyle = {
    color: isDragging ? colors.bg.basic.teal.strong : colors.icon.default,
  };

  return (
    <div style={containerStyle}>
      <div
        style={dropZoneStyle}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        
        <Upload size={32} style={iconStyle} />
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ ...textStyles.sm.medium, color: colors.text.default, margin: 0 }}>
            {uploading ? 'Uploading...' : 'Drag and drop files here'}
          </p>
          <p style={{ ...textStyles.xs.normal, color: colors.text.muted, margin: 0, marginTop: spacing.spacing[4] }}>
            or click to browse
          </p>
          {maxFiles && (
            <p style={{ ...textStyles.xs.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[4] }}>
              Max {maxFiles} file{maxFiles > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;
