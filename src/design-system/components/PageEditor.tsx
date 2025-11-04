import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import Button from '@/design-system/components/Button';
import { Save, Eye, Network } from 'lucide-react';
import type { KnowledgePage } from '@/types/knowledgeGraph';

interface PageEditorProps {
  page: KnowledgePage | null;
  onSave: (title: string, content: string) => Promise<void>;
  onToggleGraph: () => void;
  allPages: KnowledgePage[];
  saving?: boolean;
}

interface LinkSuggestion {
  page: KnowledgePage;
  matchIndex: number;
}

export default function PageEditor({
  page,
  onSave,
  onToggleGraph,
  allPages,
  saving = false,
}: PageEditorProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [linkQueryStart, setLinkQueryStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  // Update local state when page changes
  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content || '');
    }
  }, [page?.id]);

  // Handle link autocomplete
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setContent(newContent);

    // Check if user is typing a link [[
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const linkStart = textBeforeCursor.lastIndexOf('[[');
    const linkEnd = textBeforeCursor.lastIndexOf(']]');

    // User is typing inside [[...]]
    if (linkStart !== -1 && (linkEnd === -1 || linkEnd < linkStart)) {
      const query = textBeforeCursor.substring(linkStart + 2);
      
      // Filter pages by query
      const matches = allPages
        .filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map((p, idx) => ({ page: p, matchIndex: idx }));

      setSuggestions(matches);
      setLinkQueryStart(linkStart);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
      setLinkQueryStart(null);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedSuggestionIndex].page);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (selectedPage: KnowledgePage) => {
    if (linkQueryStart === null || !textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const beforeLink = content.substring(0, linkQueryStart);
    const afterCursor = content.substring(cursorPosition);
    
    const newContent = beforeLink + `[[${selectedPage.title}]]` + afterCursor;
    setContent(newContent);
    setShowSuggestions(false);
    setLinkQueryStart(null);

    // Move cursor after the inserted link
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = linkQueryStart + selectedPage.title.length + 4; // [[title]]
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSave = async () => {
    if (page) {
      await onSave(title, content);
    }
  };

  // Auto-save debounced
  useEffect(() => {
    if (!page) return;
    
    const timer = setTimeout(() => {
      if (title !== page.title || content !== (page.content || '')) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content]);

  // Empty state styles (must be defined before early return)
  const emptyStateContainerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.card.default,
  };

  const emptyStateTextStyles: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.muted,
  };

  if (!page) {
    return (
      <div style={emptyStateContainerStyles}>
        <div style={emptyStateTextStyles}>
          Select a page from the sidebar or create a new one
        </div>
      </div>
    );
  }

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.card.default,
    position: 'relative',
  };

  const headerStyles: React.CSSProperties = {
    padding: spacing.spacing[16],
    borderBottom: `1px solid ${colors.border.default}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.spacing[12],
  };

  const titleInputStyles: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.semibold,
    color: colors.text.default,
    padding: 0,
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.spacing[8],
  };

  const editorContainerStyles: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    padding: spacing.spacing[24],
    overflowY: 'auto',
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '500px',
    border: 'none',
    outline: 'none',
    resize: 'none',
    backgroundColor: 'transparent',
    fontFamily: typography.fontFamily.body,
    fontSize: typography.desktop.size.md,
    lineHeight: typography.desktop.lineHeight.leading7,
    color: colors.text.default,
  };

  const suggestionBoxStyles: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    minWidth: '250px',
  };

  const suggestionItemStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: spacing.spacing[12],
    cursor: 'pointer',
    backgroundColor: isSelected ? colors.bg.state.primaryHover : 'transparent',
    borderBottom: `1px solid ${colors.border.default}`,
    ...textStyles.sm.normal,
    color: colors.text.default,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
  });

  const statusTextStyles: React.CSSProperties = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title..."
          style={titleInputStyles}
        />
        
        <div style={actionsStyles}>
          <div style={statusTextStyles}>
            {saving ? 'Saving...' : 'Saved'}
          </div>
          
          <Button
            variant="iconOnly"
            style="secondary"
            size="sm"
            leadIcon={<Network size={16} />}
            onClick={onToggleGraph}
          />
          
          <Button
            variant="iconOnly"
            style="primary"
            size="sm"
            leadIcon={<Save size={16} />}
            onClick={handleSave}
            loading={saving}
          />
        </div>
      </div>

      {/* Editor */}
      <div style={editorContainerStyles}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing... Use [[page name]] to link to other pages"
          style={textareaStyles}
        />

        {/* Link Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && textareaRef.current && (
          <div
            ref={suggestionBoxRef}
            style={{
              ...suggestionBoxStyles,
              top: `${textareaRef.current.offsetTop + 100}px`,
              left: `${spacing.spacing[24]}`,
            }}
          >
            {suggestions.map((suggestion, idx) => (
              <div
                key={suggestion.page.id}
                style={suggestionItemStyles(idx === selectedSuggestionIndex)}
                onClick={() => selectSuggestion(suggestion.page)}
                onMouseEnter={() => setSelectedSuggestionIndex(idx)}
              >
                <span>{suggestion.page.icon || '📄'}</span>
                <span>{suggestion.page.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

