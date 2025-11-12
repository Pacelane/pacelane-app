import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { PencilSimple as Edit2, Check, X } from '@phosphor-icons/react';
import Button from './Button';

const InlineEditInput = ({
  value,
  onSave,
  onCancel,
  placeholder = "Enter text...",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) => {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle click outside to cancel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    if (!disabled) {
      handleEdit();
    }
  };

  // Size configurations
  const sizeConfigs = {
    sm: {
      fontSize: textStyles.sm.medium.fontSize,
      fontWeight: textStyles.sm.medium.fontWeight,
      lineHeight: textStyles.sm.medium.lineHeight,
      padding: spacing.spacing[4],
      iconSize: 12
    },
    md: {
      fontSize: textStyles.md.medium.fontSize,
      fontWeight: textStyles.md.medium.fontWeight,
      lineHeight: textStyles.md.medium.lineHeight,
      padding: spacing.spacing[6],
      iconSize: 14
    },
    lg: {
      fontSize: textStyles.lg.medium.fontSize,
      fontWeight: textStyles.lg.medium.fontWeight,
      lineHeight: textStyles.lg.medium.lineHeight,
      padding: spacing.spacing[8],
      iconSize: 16
    },
    xl: {
      fontSize: textStyles.xl.medium.fontSize,
      fontWeight: textStyles.xl.medium.fontWeight,
      lineHeight: textStyles.xl.medium.lineHeight,
      padding: spacing.spacing[10],
      iconSize: 18
    }
  };

  const config = sizeConfigs[size];

  const containerStyles = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.spacing[4],
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };

  const displayStyles = {
    fontSize: config.fontSize,
    fontWeight: config.fontWeight,
    lineHeight: config.lineHeight,
    color: colors.text.default,
    padding: config.padding,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '300px',
  };

  const inputStyles = {
    fontSize: config.fontSize,
    fontWeight: config.fontWeight,
    lineHeight: config.lineHeight,
    color: colors.text.default,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    padding: config.padding,
    minWidth: '200px',
    maxWidth: '400px',
  };

  const actionsStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[2],
  };

  if (isEditing) {
    return (
      <div ref={containerRef} style={containerStyles} className={className}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={inputStyles}
          {...props}
        />
        <div style={actionsStyles}>
          <Button
            label=""
            style="primary"
            size="xs"
            leadIcon={<Check size={config.iconSize} />}
            onClick={handleSave}
          />
          <Button
            label=""
            style="secondary"
            size="xs"
            leadIcon={<X size={config.iconSize} />}
            onClick={handleCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={containerStyles}
      className={className}
      onClick={handleEdit}
      onDoubleClick={handleDoubleClick}
    >
      <div style={displayStyles}>
        {value || placeholder}
      </div>
      {!disabled && (
        <Button
          label=""
          style="ghost"
          size="xs"
          leadIcon={<Edit2 size={config.iconSize} />}
          onClick={handleEdit}
        />
      )}
    </div>
  );
};

export default InlineEditInput;
