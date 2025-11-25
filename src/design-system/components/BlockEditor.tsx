import React, { useEffect, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';

interface BlockEditorProps {
  initialContent?: string; // Markdown content
  onChange?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export default function BlockEditor({
  initialContent,
  onChange,
  readOnly = false,
  placeholder = "Start typing...",
}: BlockEditorProps) {
  const { colors, isDark } = useTheme();
  
  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent: initialContent 
      ? [{
          // Simple conversion for now, BlockNote handles markdown import via blocksToMarkdown
          // But initialContent expects PartialBlock[], so we might need to parse it first
          // or use editor.tryParseMarkdownToBlocks if available in this version.
          // For simplicity in this first pass, we'll let it be empty or handle it in useEffect.
        }] 
      : undefined,
  });

  // Load initial markdown content
  useEffect(() => {
    if (editor && initialContent) {
      const loadContent = async () => {
        const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      };
      loadContent();
    }
  }, [editor, initialContent]);

  // Handle changes
  const handleChange = async () => {
    if (onChange) {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      onChange(markdown);
    }
  };

  // Custom theme styles to match app design system
  const editorTheme = {
    // We can override CSS variables here or use a custom theme object if supported
    // For now, we'll rely on the wrapper div for basic styling
  };

  return (
    <div 
      style={{
        backgroundColor: colors.bg.card.default,
        borderRadius: cornerRadius.borderRadius.md,
        border: `1px solid ${colors.border.default}`,
        minHeight: '300px',
        padding: spacing.spacing[16],
        color: colors.text.default,
      }}
      className={isDark ? 'bn-dark-theme' : 'bn-light-theme'}
    >
      <BlockNoteView 
        editor={editor} 
        editable={!readOnly}
        onChange={handleChange}
        theme={isDark ? "dark" : "light"}
      />
    </div>
  );
}
