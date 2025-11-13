import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../services/theme-context.jsx';
import { useTranslation } from '../../services/i18n-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { stroke } from '../tokens/stroke.js';

import Input from './Input.jsx';
import Divider from './Divider.jsx';
import downloadIcon from '../../assets/icons/download--T.svg';

const FileUpload = forwardRef(({
  // Core props
  onFileSelect,
  onUrlSubmit,
  accept = '*/*',
  multiple = true,
  maxFiles = 10,
  maxTotalSize = 100 * 1024 * 1024, // 100MB in bytes
  
  // URL input props
  urlValue = '',
  onUrlChange,
  urlPlaceholder = 'Paste a website URL here',
  
  // State props
  disabled = false,
  uploading = false, // New prop to show uploading state
  className,
  ...rest
}, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      if (fileInputRef.current && !disabled) {
        fileInputRef.current.click();
      }
    }
  }));
  
  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      console.log('FileUpload: Files dropped:', files.length);
      onFileSelect?.(files);
    }
  };
  
  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };
  
  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  // Handle click to browse with smart target detection
  const handleBrowseClick = (e) => {
    // Don't trigger file browser if click is on URL section or its children
    const clickedElement = e.target;
    const isUrlSection = clickedElement.closest('[data-upload-section="url"]');
    const isInputElement = clickedElement.tagName === 'INPUT' || 
                          clickedElement.tagName === 'BUTTON' ||
                          clickedElement.closest('form');
    
    // Only trigger file browser for clicks on designated upload areas
    if (!disabled && !isUrlSection && !isInputElement && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      console.log('FileUpload: Files selected via input:', files.length);
      onFileSelect?.(files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };
  
  // Handle URL submission
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlValue.trim()) {
      onUrlSubmit?.(urlValue.trim());
    }
  };
  
  // Get background color based on state
  const getBackgroundColor = () => {
    if (disabled || uploading) return colors.bg.state.secondary;
    if (isDragOver) return colors.bg.state.primaryHover;
    if (isHovered) return colors.bg.state.secondaryHover;
    return colors.bg.state.secondary;
  };
  
  // Get border color based on state
  const getBorderColor = () => {
    if (isDragOver) return colors.border.highlight;
    return colors.border.darker;
  };
  
  // Get box shadow based on state
  const getBoxShadow = () => {
    if (disabled || uploading) return 'none';
    if (isHovered || isDragOver) return 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
    return 'none';
  };
  
  // Download icon component
  const DownloadIcon = () => (
    <img
      src={downloadIcon}
      alt="Download"
      width="40"
      height="40"
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
      }}
    />
  );
  

  
  return (
    <div className={className} {...rest}>
      {/* Main upload area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `${spacing.spacing[32]} ${spacing.spacing[24]}`,
          borderRadius: cornerRadius.borderRadius.sm,
          backgroundColor: getBackgroundColor(),
          border: `${stroke.DEFAULT} dashed ${getBorderColor()}`,
          boxShadow: getBoxShadow(),
          cursor: (disabled || uploading) ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          alignItems: 'center',
          textAlign: 'center',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => !disabled && !uploading && setIsHovered(true)}
        onMouseLeave={() => !disabled && !uploading && setIsHovered(false)}
        onClick={handleBrowseClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />
        
        {/* Inner content with motion */}
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[12],
            alignItems: 'center',
            width: '100%',
          }}
          animate={{ scale: !disabled && !uploading && (isHovered || isDragOver) ? 0.97 : 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
        
        {/* Upload icon */}
        <DownloadIcon />
        
        {/* Main upload text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[4],
            alignItems: 'center',
          }}
        >
          <div style={{ ...textStyles.sm.medium }}>
            <span style={{ color: (disabled || uploading) ? colors.text.hint : colors.text.default }}>
              {uploading ? t('components.fileUpload.uploadingFiles') : t('components.fileUpload.dropOrClick')}{uploading ? '' : ' '}
            </span>
            {!uploading && (
              <span style={{ color: (disabled || uploading) ? colors.text.hint : colors.text.informative }}>
                {t('components.fileUpload.clickToBrowse')}
              </span>
            )}
          </div>
          
          <div
            style={{
              ...textStyles.xs.normal,
              color: (disabled || uploading) ? colors.text.hint : colors.text.muted,
            }}
          >
            {uploading 
              ? t('components.fileUpload.pleaseWait')
              : `${t('components.fileUpload.filesLimit').replace('{size}', Math.round(maxTotalSize / (1024 * 1024)))}`
            }
          </div>
        </div>
        
        {/* Divider */}
        <Divider maxWidth={400} />
        
        {/* URL section header */}
        {!uploading && (
          <div
            data-upload-section="url"
            style={{
              ...textStyles.sm.medium,
              color: disabled ? colors.text.hint : colors.text.default,
            }}
          >
            {t('components.fileUpload.dropLinkHere')}
          </div>
        )}
        
        {/* URL input */}
        {!uploading && (
          <div data-upload-section="url" style={{ width: '100%', maxWidth: 400 }}>
            <form onSubmit={handleUrlSubmit}>
              <Input
                size="sm"
                style="add-on"
                addOnPrefix="https://"
                value={urlValue}
                onChange={(e) => onUrlChange?.(e.target.value)}
                placeholder={urlPlaceholder || t('components.fileUpload.urlPlaceholder')}
                disabled={disabled}
                type="url"
              />
            </form>
          </div>
        )}
        </motion.div>
      </div>
    </div>
  );
});

// Add display name for better debugging
FileUpload.displayName = 'FileUpload';

export default FileUpload;