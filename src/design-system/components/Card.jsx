import React from 'react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { shadows, getShadow } from '../tokens/shadows.js';

const Card = ({
  children,
  className = '',
  elevated = false,
  ...rest
}) => {
  const { colors } = useTheme();

  const cardStyles = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: elevated 
      ? getShadow('regular.modalMd', colors, { withBorder: true })
      : getShadow('regular.card', colors),
    overflow: 'hidden',
    ...rest.style
  };

  return (
    <div
      className={className}
      style={cardStyles}
      {...rest}
    >
      {children}
    </div>
  );
};

const CardHeader = ({
  children,
  className = '',
  ...rest
}) => {
  const headerStyles = {
    padding: `${spacing.spacing[24]}px ${spacing.spacing[24]}px ${spacing.spacing[16]}px ${spacing.spacing[24]}px`,
    ...rest.style
  };

  return (
    <div
      className={className}
      style={headerStyles}
      {...rest}
    >
      {children}
    </div>
  );
};

const CardTitle = ({
  children,
  className = '',
  ...rest
}) => {
  const { colors } = useTheme();

  const titleStyles = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
    ...rest.style
  };

  return (
    <h3
      className={className}
      style={titleStyles}
      {...rest}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({
  children,
  className = '',
  ...rest
}) => {
  const { colors } = useTheme();

  const descriptionStyles = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: `${spacing.spacing[8]}px 0 0 0`,
    ...rest.style
  };

  return (
    <p
      className={className}
      style={descriptionStyles}
      {...rest}
    >
      {children}
    </p>
  );
};

const CardContent = ({
  children,
  className = '',
  ...rest
}) => {
  const contentStyles = {
    padding: `0 ${spacing.spacing[24]}px ${spacing.spacing[24]}px ${spacing.spacing[24]}px`,
    ...rest.style
  };

  return (
    <div
      className={className}
      style={contentStyles}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
export { CardHeader, CardTitle, CardDescription, CardContent };
