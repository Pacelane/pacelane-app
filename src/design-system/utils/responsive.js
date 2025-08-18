// Responsive Utilities for Pacelane Design System
// Centralizes mobile/desktop responsive patterns to avoid manual updates across files

import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';

/**
 * Responsive utilities that provide consistent mobile/desktop patterns
 * Usage: Import and use these utilities instead of manual isMobile checks
 */

/**
 * Get responsive padding value
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @param {string} type - Type of padding ('container', 'card', 'button', 'content')
 * @returns {string} Padding value
 */
export const getResponsivePadding = (isMobile, type = 'container') => {
  const patterns = {
    // Main page containers
    container: isMobile ? spacing.spacing[24] : spacing.spacing[40],
    
    // Card interior padding  
    card: isMobile ? spacing.spacing[24] : spacing.spacing[36],
    
    // Button container padding
    button: isMobile ? spacing.spacing[24] : spacing.spacing[40],
    
    // Content wrapper padding (left/right)
    content: spacing.spacing[24], // Always 24px for consistency
    
    // Small padding for compact elements
    compact: isMobile ? spacing.spacing[16] : spacing.spacing[24],
  };
  
  return patterns[type] || patterns.container;
};

/**
 * Get responsive spacing value
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @param {string} size - Size category ('xs', 'sm', 'md', 'lg', 'xl')
 * @returns {string} Spacing value
 */
export const getResponsiveSpacing = (isMobile, size = 'md') => {
  const mobileSpacing = {
    xs: spacing.spacing[8],
    sm: spacing.spacing[12], 
    md: spacing.spacing[16],
    lg: spacing.spacing[24],
    xl: spacing.spacing[32],
  };
  
  const desktopSpacing = {
    xs: spacing.spacing[12],
    sm: spacing.spacing[16],
    md: spacing.spacing[24], 
    lg: spacing.spacing[32],
    xl: spacing.spacing[48],
  };
  
  return isMobile ? mobileSpacing[size] : desktopSpacing[size];
};

/**
 * Get responsive width/sizing
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @param {string} type - Type of width ('card', 'button', 'content', 'sidebar')
 * @returns {object} Width and maxWidth styles
 */
export const getResponsiveWidth = (isMobile, type = 'card') => {
  const patterns = {
    // Onboarding cards
    card: {
      width: isMobile ? '100%' : '400px',
      maxWidth: isMobile ? '320px' : '400px',
    },
    
    // Button containers
    button: {
      width: isMobile ? '100%' : '280px', 
      maxWidth: isMobile ? '320px' : '280px',
    },
    
    // Content areas
    content: {
      width: '100%',
      maxWidth: isMobile ? 'none' : '840px',
    },
    
    // Sidebar menu areas
    sidebar: {
      width: isMobile ? '100%' : '280px',
    },
    
    // Full width on mobile, auto on desktop
    fullMobile: {
      width: isMobile ? '100%' : 'auto',
    },
  };
  
  return patterns[type] || patterns.card;
};

/**
 * Get responsive flex properties
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @param {string} type - Type of flex behavior ('stack', 'fullWidth', 'auto')
 * @returns {object} Flex styles
 */
export const getResponsiveFlex = (isMobile, type = 'stack') => {
  const patterns = {
    // Stack vertically on mobile, row on desktop
    stack: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
    },
    
    // Full width on mobile, flex on desktop
    fullWidth: {
      flex: isMobile ? 'none' : 1,
      width: isMobile ? '100%' : 'auto',
    },
    
    // Auto sizing
    auto: {
      flex: isMobile ? 'none' : 'auto',
      width: isMobile ? '100%' : 'auto',
    },
  };
  
  return patterns[type] || patterns.stack;
};

/**
 * Get responsive typography size
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @param {string} size - Desktop size ('3xl', '4xl', '5xl', etc.)
 * @returns {string} Font size value
 */
export const getResponsiveFontSize = (isMobile, size) => {
  const mobileMap = {
    '5xl': typography.desktop.size['3xl'], // 48px → 30px
    '4xl': typography.desktop.size['2xl'], // 36px → 24px  
    '3xl': typography.desktop.size['xl'],  // 30px → 20px
    '2xl': typography.desktop.size['lg'],  // 24px → 18px
    'xl': typography.desktop.size['md'],   // 20px → 16px
  };
  
  return isMobile && mobileMap[size] ? mobileMap[size] : typography.desktop.size[size];
};

/**
 * Get responsive line height
 * @param {boolean} isMobile - Mobile state from useIsMobile hook  
 * @param {string} size - Desktop size ('3xl', '4xl', '5xl', etc.)
 * @returns {string} Line height value
 */
export const getResponsiveLineHeight = (isMobile, size) => {
  const mobileMap = {
    '5xl': typography.desktop.lineHeight['3xl'],
    '4xl': typography.desktop.lineHeight['2xl'],
    '3xl': typography.desktop.lineHeight['xl'], 
    '2xl': typography.desktop.lineHeight['lg'],
    'xl': typography.desktop.lineHeight['md'],
  };
  
  return isMobile && mobileMap[size] ? mobileMap[size] : typography.desktop.lineHeight[size];
};

/**
 * Get responsive container styles - combines common responsive patterns
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @param {string} type - Container type ('page', 'card', 'button')
 * @returns {object} Complete container styles
 */
export const getResponsiveContainer = (isMobile, type = 'page') => {
  const patterns = {
    // Main page containers
    page: {
      padding: getResponsivePadding(isMobile, 'container'),
      paddingBottom: isMobile ? '140px' : '160px', // Account for button container
    },
    
    // Card containers
    card: {
      ...getResponsiveWidth(isMobile, 'card'),
      padding: getResponsivePadding(isMobile, 'card'),
    },
    
    // Button containers (fixed at bottom)
    button: {
      ...getResponsiveWidth(isMobile, 'button'),
      height: isMobile ? '70px' : '80px',
      padding: getResponsivePadding(isMobile, 'button'),
    },
  };
  
  return patterns[type] || patterns.page;
};

/**
 * Common responsive layout patterns
 */
export const responsiveLayouts = {
  // Flex container that stacks on mobile
  stackOnMobile: (isMobile, gap = spacing.spacing[16]) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap,
  }),
  
  // Grid that becomes single column on mobile
  gridToColumn: (isMobile, gap = spacing.spacing[24]) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap,
  }),
  
  // Side menu that becomes horizontal tabs on mobile
  sideMenuToTabs: (isMobile, gap = spacing.spacing[8]) => ({
    display: 'flex',
    flexDirection: isMobile ? 'row' : 'column',
    gap,
    overflowX: isMobile ? 'auto' : 'visible',
    paddingBottom: isMobile ? spacing.spacing[8] : 0,
  }),
};

/**
 * Hook-like utility for responsive styles
 * Usage: const responsive = useResponsiveStyles(isMobile);
 * @param {boolean} isMobile - Mobile state from useIsMobile hook
 * @returns {object} Responsive utility functions
 */
export const useResponsiveStyles = (isMobile) => ({
  padding: (type) => getResponsivePadding(isMobile, type),
  spacing: (size) => getResponsiveSpacing(isMobile, size),
  width: (type) => getResponsiveWidth(isMobile, type),
  flex: (type) => getResponsiveFlex(isMobile, type),
  fontSize: (size) => getResponsiveFontSize(isMobile, size),
  lineHeight: (size) => getResponsiveLineHeight(isMobile, size),
  container: (type) => getResponsiveContainer(isMobile, type),
  layouts: responsiveLayouts,
});
