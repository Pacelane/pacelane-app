import React, { useRef, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';

/**
 * LinkedInPostEditor - A component that mimics LinkedIn's post layout for inline text editing
 * 
 * Features:
 * - LinkedIn-style post card appearance with border
 * - User profile picture and info display
 * - Inline text editing without visible focus states
 * - Contenteditable div for natural text flow
 * - Auto-expanding content area
 * - Theme-aware styling
 */
const LinkedInPostEditor = ({
  value = '',
  onChange,
  placeholder = 'What do you want to talk about?',
  className = '',
  disabled = false,
  user = null,
  profile = null,
  ...props
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const contentRef = useRef(null);

  // Update content when value prop changes
  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== value) {
      contentRef.current.textContent = value;
    }
  }, [value]);

  // Handle content changes
  const handleInput = (e) => {
    const newContent = e.target.textContent || '';
    if (onChange) {
      onChange({ target: { value: newContent } });
    }
  };

  // Handle paste events to maintain plain text
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  // Handle key events
  const handleKeyDown = (e) => {
    // Allow normal text editing shortcuts
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow shift+enter for line breaks
      return;
    }
  };

  // LinkedIn-style post card container with prominent border
  const postCardStyles = {
    backgroundColor: colors.bg.card.default,
    border: `2px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    overflow: 'hidden',
    width: '100%',
    maxWidth: '680px', // LinkedIn post width
    margin: '0 auto',
    transition: 'border-color 0.2s ease-in-out',
  };

  // Post header (mimics LinkedIn user info area)
  const postHeaderStyles = {
    padding: spacing.spacing[16],
    borderBottom: `${stroke.default} solid ${colors.border.default}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
  };

  // Get user display information
  const getUserDisplayInfo = () => {
    const displayName = profile?.display_name || 
                       profile?.linkedin_name || 
                       user?.user_metadata?.full_name || 
                       user?.user_metadata?.name || 
                       user?.email?.split('@')[0] || 
                       'User';
    
    const company = profile?.linkedin_company || 
                   profile?.company_linkedin || 
                   'Professional';
    
    // Get initials from display name
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    };
    
    return {
      displayName,
      company,
      initials: getInitials(displayName)
    };
  };

  const { displayName, company, initials } = getUserDisplayInfo();

  // Profile picture with user initials
  const avatarStyles = {
    width: '48px',
    height: '48px',
    borderRadius: cornerRadius.borderRadius.full,
    backgroundColor: colors.bg.state.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: `2px solid ${colors.border.default}`,
  };

  // User info area
  const userInfoStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[2],
  };

  // Content area styles
  const contentAreaStyles = {
    padding: spacing.spacing[20],
    minHeight: '200px',
    maxHeight: '800px',
    overflow: 'auto',
  };

  // Editable content styles
  const editableContentStyles = {
    ...textStyles.md.normal,
    color: colors.text.default,
    lineHeight: '1.6',
    fontFamily: typography.fontFamily.body,
    outline: 'none',
    border: 'none',
    background: 'transparent',
    width: '100%',
    minHeight: '120px',
    resize: 'none',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    cursor: 'text',
  };

  // Placeholder styles
  const placeholderStyles = {
    ...textStyles.md.normal,
    color: colors.text.muted,
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  // Show placeholder when content is empty
  const showPlaceholder = !value || value.trim() === '';

  return (
    <div style={postCardStyles} className={className} {...props}>
      {/* Post Header */}
      <div style={postHeaderStyles}>
        <div style={avatarStyles}>
          <span style={{ 
            ...textStyles.md.bold, 
            color: 'white',
            fontSize: '16px',
            letterSpacing: '0.5px'
          }}>
            {initials}
          </span>
        </div>
        <div style={userInfoStyles}>
          <span style={{ 
            ...textStyles.sm.semibold, 
            color: colors.text.default 
          }}>
            {displayName}
          </span>
          <span style={{ 
            ...textStyles.xs.normal, 
            color: colors.text.muted 
          }}>
            {company} • Rascunho
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div style={contentAreaStyles}>
        <div style={{ position: 'relative' }}>
          {/* Placeholder */}
          {showPlaceholder && (
            <div style={placeholderStyles}>
              {placeholder}
            </div>
          )}
          
          {/* Editable Content */}
          <div
            ref={contentRef}
            contentEditable={!disabled}
            suppressContentEditableWarning={true}
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            style={editableContentStyles}
            role="textbox"
            aria-label="Post content"
            aria-multiline="true"
            data-placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
};

export default LinkedInPostEditor;
