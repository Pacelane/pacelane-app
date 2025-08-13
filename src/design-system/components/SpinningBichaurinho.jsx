import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/services/theme-context';
import { typography } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';
import Bichaurinho from '@/design-system/components/Bichaurinho';

const SpinningBichaurinho = ({
  variant = 16,
  size = 64,
  title = "Loading...",
  titleSize = 'lg',
  titleWeight = 'semibold',
  duration = 2,
  gap = spacing.spacing[24],
  className,
  ...rest
}) => {
  const { colors } = useTheme();

  // Container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  };

  // Title styles using Awesome Serif font
  const titleStyles = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size[titleSize],
    fontWeight: typography.desktop.weight[titleWeight],
    lineHeight: typography.desktop.lineHeight[titleSize] || typography.desktop.lineHeight.md,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
    marginTop: gap,
  };

  return (
    <div style={containerStyles} className={className} {...rest}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Bichaurinho variant={variant} size={size} />
      </motion.div>
      
      {title && (
        <h1 style={titleStyles}>
          {title}
        </h1>
      )}
    </div>
  );
};

export default SpinningBichaurinho;
