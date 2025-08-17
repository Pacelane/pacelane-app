import React, { useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { getShadow } from '@/design-system/tokens/shadows';

// Design System Components
import Modal from '@/design-system/components/Modal';
import Button from '@/design-system/components/Button';
import TextArea from '@/design-system/components/TextArea';
import InlineTip from '@/design-system/components/InlineTip';

// Icons
import { FileText, Copy, CheckCircle, AlertCircle, X } from 'lucide-react';

const TranscriptPasteModal = ({ isOpen, onClose, onTranscriptSubmit, loading = false }) => {
  const { colors } = useTheme();
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState('');

  // Clear form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setTitle('');
      setValidationError('');
    }
  }, [isOpen]);

  // Validate transcript content
  const validateTranscript = (text) => {
    if (!text.trim()) {
      return 'Please paste a meeting transcript';
    }

    if (text.trim().length < 100) {
      return 'Transcript seems too short. Please paste a complete meeting transcript (at least 100 characters)';
    }

    if (text.trim().length > 50000) {
      return 'Transcript is too long. Please paste a transcript under 50,000 characters';
    }

    return null;
  };

  const handleTranscriptChange = (value) => {
    setTranscript(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = () => {
    const error = validateTranscript(transcript);
    if (error) {
      setValidationError(error);
      return;
    }

    // Auto-generate title if not provided
    const finalTitle = title.trim() || generateTitleFromTranscript(transcript);

    onTranscriptSubmit({
      title: finalTitle,
      transcript: transcript.trim(),
      source: 'manual_paste'
    });
  };

  // Generate a title from the first few lines of transcript
  const generateTitleFromTranscript = (text) => {
    const lines = text.trim().split('\n');
    const firstMeaningfulLine = lines.find(line => 
      line.trim().length > 10 && 
      !line.includes('transcript') && 
      !line.includes('meeting') &&
      !line.toLowerCase().includes('recording')
    );

    if (firstMeaningfulLine) {
      // Take first 50 characters and add "Meeting"
      const excerpt = firstMeaningfulLine.trim().substring(0, 50);
      return `Meeting: ${excerpt}${excerpt.length === 50 ? '...' : ''}`;
    }

    return 'Meeting Transcript';
  };

  // Example transcript formats
  const exampleFormats = [
    {
      tool: 'Fireflies.ai',
      format: 'Speaker Name: Transcript text here...'
    },
    {
      tool: 'Fathom',
      format: '[Timestamp] Speaker: What they said...'
    },
    {
      tool: 'Otter.ai',
      format: 'Speaker Name (Time): Transcript content...'
    },
    {
      tool: 'Zoom',
      format: 'Speaker Name: Transcript text here...'
    }
  ];

  const modalContent = (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.spacing[24],
      width: '100%',
      maxWidth: '600px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
          <FileText size={24} color={colors.icon.default} />
          <h2 style={{
            fontFamily: typography.fontFamily['awesome-serif'],
            fontSize: typography.desktop.size['2xl'],
            fontWeight: typography.desktop.weight.semibold,
            lineHeight: typography.desktop.lineHeight.leading7,
            color: colors.text.default,
            margin: 0,
          }}>
            Paste Meeting Transcript
          </h2>
        </div>
        <p style={{
          ...textStyles.sm.medium,
          color: colors.text.subtle,
          margin: 0,
        }}>
          Paste your meeting transcript from Fireflies, Fathom, Otter.ai, Zoom, or any other transcription tool
        </p>
      </div>

      {/* Title Input (Optional) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
        <label style={{
          ...textStyles.sm.medium,
          color: colors.text.default,
        }}>
          Meeting Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Weekly Team Standup, Client Strategy Meeting..."
          style={{
            padding: spacing.spacing[12],
            borderRadius: cornerRadius.borderRadius.md,
            border: `1px solid ${colors.border.default}`,
            backgroundColor: colors.bg.input.default,
            color: colors.text.default,
            fontSize: textStyles.sm.medium.fontSize,
            fontFamily: textStyles.sm.medium.fontFamily,
            outline: 'none',
            transition: 'all 0.2s ease',
            '&:focus': {
              borderColor: colors.border.highlight,
              boxShadow: getShadow('', colors, { focusType: 'input' }),
            }
          }}
        />
        <p style={{
          ...textStyles.xs.normal,
          color: colors.text.muted,
          margin: 0,
        }}>
          If left blank, we'll generate a title from your transcript content
        </p>
      </div>

      {/* Transcript Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
        <label style={{
          ...textStyles.sm.medium,
          color: colors.text.default,
        }}>
          Meeting Transcript *
        </label>
        <TextArea
          value={transcript}
          onChange={handleTranscriptChange}
          placeholder="Paste your meeting transcript here...

Example formats we support:
• Speaker Name: What they said during the meeting
• [10:30] John: Discussion about project timeline  
• Jane Doe (15:45): Let's review the quarterly goals"
          rows={12}
          style={{ 
            fontFamily: typography.fontFamily.jetbrains,
            fontSize: textStyles.sm.normal.fontSize,
            lineHeight: '1.5'
          }}
        />
        
        {/* Character count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{
            ...textStyles.xs.normal,
            color: colors.text.muted,
            margin: 0,
          }}>
            {transcript.length > 0 ? `${transcript.length.toLocaleString()} characters` : 'Minimum 100 characters required'}
          </p>
          
          {transcript.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[4] }}>
              {transcript.length >= 100 ? (
                <>
                  <CheckCircle size={12} color={colors.icon.success} />
                  <span style={{
                    ...textStyles.xs.medium,
                    color: colors.text.success,
                  }}>
                    Ready to process
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={12} color={colors.icon.warning} />
                  <span style={{
                    ...textStyles.xs.medium,
                    color: colors.text.warning,
                  }}>
                    Need {100 - transcript.length} more characters
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div style={{
            padding: spacing.spacing[12],
            backgroundColor: colors.bg.state.destructive + '10',
            border: `1px solid ${colors.border.destructive}`,
            borderRadius: cornerRadius.borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.spacing[8],
          }}>
            <AlertCircle size={16} color={colors.icon.destructive} />
            <p style={{
              ...textStyles.sm.medium,
              color: colors.text.destructive,
              margin: 0,
            }}>
              {validationError}
            </p>
          </div>
        )}
      </div>

      {/* Supported Formats Help */}
      <InlineTip
        icon={<FileText size={16} />}
        title="Supported Transcript Formats"
        description="We support transcripts from all major tools including:"
        items={exampleFormats.map(format => `${format.tool}: ${format.format}`)}
        variant="informative"
      />

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: spacing.spacing[12],
        paddingTop: spacing.spacing[8],
        borderTop: `1px solid ${colors.border.default}`
      }}>
        <Button
          label="Cancel"
          style="ghost"
          size="md"
          onClick={onClose}
          disabled={loading}
        />
        <Button
          label={loading ? "Processing..." : "Create Content from Transcript"}
          style="primary"
          size="md"
          onClick={handleSubmit}
          disabled={loading || transcript.trim().length < 100}
          loading={loading}
          leadIcon={loading ? undefined : <Copy size={16} />}
        />
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      content={modalContent}
      showCloseButton={true}
      closeOnOverlayClick={!loading}
    />
  );
};

export default TranscriptPasteModal;
