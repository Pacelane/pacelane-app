import React from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { stroke } from '@/design-system/tokens/stroke';
import { getShadow } from '@/design-system/tokens/shadows';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import Button from '@/design-system/components/Button';
import { Check, X } from '@phosphor-icons/react';

/**
 * InlineDiffView - GitHub-style diff display for inline edits
 * Shows removed lines with strikethrough and added lines highlighted
 */
const InlineDiffView = ({ 
  originalText, 
  suggestedText,
  onAccept, 
  onReject,
  loading = false 
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  console.log('InlineDiffView rendering:', { originalText, suggestedText });

  // Simple line-by-line diff (you can enhance this with a proper diff library)
  const renderDiff = () => {
    const originalLines = originalText.split('\n');
    const suggestedLines = suggestedText.split('\n');

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: spacing.spacing[2]
      }}>
        {/* Show removed lines */}
        {originalLines.map((line, index) => (
          <div
            key={`removed-${index}`}
            style={{
              ...textStyles.sm.normal,
              fontFamily: typography.fontFamily.body,
              color: colors.text.destructive,
              backgroundColor: `${colors.bg.state?.destructive || '#fee'}22`,
              padding: `${spacing.spacing[4]} ${spacing.spacing[8]}`,
              borderRadius: cornerRadius.borderRadius.sm,
              textDecoration: 'line-through',
              opacity: 0.7,
            }}
          >
            {line || '\u00A0'}
          </div>
        ))}
        
        {/* Show added lines */}
        {suggestedLines.map((line, index) => (
          <div
            key={`added-${index}`}
            style={{
              ...textStyles.sm.normal,
              fontFamily: typography.fontFamily.body,
              color: colors.text.success,
              backgroundColor: `${colors.bg.state?.success || '#efe'}22`,
              padding: `${spacing.spacing[4]} ${spacing.spacing[8]}`,
              borderRadius: cornerRadius.borderRadius.sm,
            }}
          >
            {line || '\u00A0'}
          </div>
        ))}
      </div>
    );
  };

  const containerStyles = {
    backgroundColor: colors.bg.card.default,
    border: `${stroke.default} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    overflow: 'hidden',
    marginTop: spacing.spacing[24],
    marginBottom: spacing.spacing[24],
    position: 'relative',
    zIndex: 10,
  };

  const headerStyles = {
    padding: spacing.spacing[12],
    borderBottom: `${stroke.default} solid ${colors.border.default}`,
    backgroundColor: colors.bg.subtle,
  };

  const contentStyles = {
    padding: spacing.spacing[16],
    maxHeight: '300px',
    overflow: 'auto',
  };

  const actionsStyles = {
    padding: spacing.spacing[12],
    borderTop: `${stroke.default} solid ${colors.border.default}`,
    display: 'flex',
    gap: spacing.spacing[8],
    justifyContent: 'flex-end',
  };

  return (
    <div style={containerStyles} data-inline-diff>
      <div style={headerStyles}>
        <span style={{ ...textStyles.xs.semibold, color: colors.text.muted }}>
          ✨ Alterações Sugeridas pela IA
        </span>
      </div>
      
      <div style={contentStyles}>
        {renderDiff()}
      </div>
      
      <div style={actionsStyles}>
        <Button
          label={t('contentEditor.inlineEdit.reject')}
          style="secondary"
          size="sm"
          leadIcon={<X size={16} />}
          onClick={onReject}
          disabled={loading}
        />
        <Button
          label={t('contentEditor.inlineEdit.accept')}
          style="primary"
          size="sm"
          leadIcon={<Check size={16} />}
          onClick={onAccept}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default InlineDiffView;
