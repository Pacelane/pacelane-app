import React from 'react';
import { useTheme } from '../../services/theme-context.jsx';
import { useTranslation } from '../../services/i18n-context.jsx';
import { useIsMobile } from '../../hooks/use-mobile.tsx';
import { spacing } from '../tokens/spacing.js';
import { stroke } from '../tokens/stroke.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import Button from './Button.jsx';
import InlineEditInput from './InlineEditInput.jsx';
import { ArrowLeft, FloppyDisk as Save } from '@phosphor-icons/react';

/**
 * EditorNav component - Navigation bar for editor interfaces
 * 
 * Features:
 * - Go Back button on the left with arrow icon
 * - Inline editable title in center
 * - Save Draft button on the right
 * - 64px height with proper spacing and theme-aware design
 * 
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.title] - Title text to display
 * @param {Function} [props.onGoBack] - Callback for go back button click
 * @param {Function} [props.onTitleChange] - Callback for title change (new title as parameter)
 * @param {Function} [props.onSaveDraft] - Callback for save draft button click
 * @param {boolean} [props.canSave] - Whether the save button should be enabled
 */
const EditorNav = ({ 
  className = '',
  title = 'Untitled Document',
  onGoBack,
  onTitleChange,
  onSaveDraft,
  canSave = true,
  ...rest 
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Handle go back button click
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      // Default back action - could use router history, etc.
      console.log('Go back requested');
    }
  };

  // Handle title change
  const handleTitleChange = (newTitle) => {
    if (onTitleChange) {
      onTitleChange(newTitle);
    } else {
      // Default title change action
      console.log('Title changed to:', newTitle);
    }
  };

  // Handle save draft button click
  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft();
    } else {
      // Default save action
      console.log('Save draft requested');
    }
  };

  // Container styles - responsive
  const containerStyles = {
    backgroundColor: colors.bg.default,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    paddingLeft: isMobile ? spacing.spacing[16] : spacing.spacing[40],
    paddingRight: isMobile ? spacing.spacing[16] : spacing.spacing[40],
    paddingTop: spacing.spacing[16],
    paddingBottom: spacing.spacing[16],
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
    zIndex: 10,
    boxSizing: 'border-box',
  };

  // Title container styles - responsive
  const titleContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
    position: isMobile ? 'static' : 'absolute',
    left: isMobile ? 'auto' : '50%',
    transform: isMobile ? 'none' : 'translateX(-50%)',
    flex: isMobile ? 1 : 'none',
    marginLeft: isMobile ? spacing.spacing[12] : 0,
    marginRight: isMobile ? spacing.spacing[12] : 0,
  };

  // Title text styles
  const titleTextStyles = {
    ...textStyles.md.medium,
    color: colors.text.default,
    margin: 0,
    userSelect: 'none',
  };

  return (
    <nav
      style={containerStyles}
      className={className}
      role="navigation"
      aria-label="Editor navigation"
      {...rest}
    >
      {/* Go Back button on the left */}
      <Button
        style="dashed"
        size="xs"
        leadIcon={<ArrowLeft size={16} />}
        label={t('contentEditor.nav.goBack')}
        onClick={handleGoBack}
        aria-label={t('contentEditor.nav.goBack')}
      />
      
      {/* Title in center with inline editing */}
      <div style={titleContainerStyles}>
        <InlineEditInput
          value={title}
          onSave={handleTitleChange}
          placeholder={t('contentEditor.sidebar.recentPosts.untitled')}
          size="lg"
        />
      </div>
      
      {/* Save Draft button on the right */}
      <Button
        style="primary"
        size="xs"
        leadIcon={<Save size={16} />}
        label={t('contentEditor.nav.saveDraft')}
        onClick={handleSaveDraft}
        disabled={!canSave}
        aria-label={t('contentEditor.nav.saveDraft')}
      />
    </nav>
  );
};

export default EditorNav;