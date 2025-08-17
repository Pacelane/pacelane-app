# Responsive Utilities

Centralized responsive utilities for consistent mobile/desktop patterns across the Pacelane application.

## Problem Solved

Previously, responsive styles were manually implemented in each component:
```javascript
// ❌ Manual implementation (repeated everywhere)
padding: isMobile ? spacing.spacing[24] : spacing.spacing[40],
width: isMobile ? '100%' : '400px',
maxWidth: isMobile ? '320px' : '400px',
```

This led to:
- Inconsistent values across components
- Manual updates required in multiple files
- Potential for errors and missed updates

## Solution

Centralized responsive utilities that provide consistent patterns:
```javascript
// ✅ Utility-based implementation (consistent everywhere)
import { getResponsivePadding, getResponsiveWidth } from '@/design-system/utils/responsive';

padding: getResponsivePadding(isMobile, 'container'),
...getResponsiveWidth(isMobile, 'card'),
```

## Usage Examples

### Basic Responsive Padding
```javascript
import { getResponsivePadding } from '@/design-system/utils/responsive';
import { useIsMobile } from '@/hooks/use-mobile';

const MyComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div style={{
      padding: getResponsivePadding(isMobile, 'container'), // 24px mobile, 40px desktop
    }}>
      Content
    </div>
  );
};
```

### Responsive Container Patterns
```javascript
import { getResponsiveContainer } from '@/design-system/utils/responsive';

// Page container with proper padding and bottom spacing
<div style={{
  ...getResponsiveContainer(isMobile, 'page'),
  backgroundColor: colors.bg.default,
}}>

// Card container with responsive sizing
<div style={{
  ...getResponsiveContainer(isMobile, 'card'),
  backgroundColor: colors.bg.card.default,
}}>

// Button container with responsive sizing
<div style={{
  ...getResponsiveContainer(isMobile, 'button'),
  position: 'fixed',
  bottom: 0,
}}>
```

### Responsive Layout Patterns
```javascript
import { responsiveLayouts } from '@/design-system/utils/responsive';

// Flex row that stacks on mobile
<div style={responsiveLayouts.stackOnMobile(isMobile, spacing.spacing[16])}>

// Grid that becomes single column on mobile  
<div style={responsiveLayouts.gridToColumn(isMobile, spacing.spacing[24])}>

// Side menu that becomes horizontal tabs on mobile
<div style={responsiveLayouts.sideMenuToTabs(isMobile)}>
```

### Hook-Style Usage
```javascript
import { useResponsiveStyles } from '@/design-system/utils/responsive';

const MyComponent = () => {
  const isMobile = useIsMobile();
  const responsive = useResponsiveStyles(isMobile);
  
  return (
    <div style={{
      padding: responsive.padding('container'),
      ...responsive.width('card'),
      ...responsive.layouts.stackOnMobile(isMobile),
    }}>
      Content
    </div>
  );
};
```

## Available Utilities

### `getResponsivePadding(isMobile, type)`
- `'container'`: 24px mobile, 40px desktop
- `'card'`: 24px mobile, 36px desktop  
- `'button'`: 24px mobile, 40px desktop
- `'content'`: 24px always (for consistency)
- `'compact'`: 16px mobile, 24px desktop

### `getResponsiveWidth(isMobile, type)`
- `'card'`: 100%/320px mobile, 400px desktop
- `'button'`: 100%/320px mobile, 280px desktop
- `'content'`: 100% mobile, 840px max desktop
- `'sidebar'`: 100% mobile, 280px desktop
- `'fullMobile'`: 100% mobile, auto desktop

### `getResponsiveContainer(isMobile, type)`
- `'page'`: Complete page container styles
- `'card'`: Complete card container styles  
- `'button'`: Complete button container styles

### `responsiveLayouts`
- `stackOnMobile(isMobile, gap)`: Flex row → column
- `gridToColumn(isMobile, gap)`: Grid → single column
- `sideMenuToTabs(isMobile, gap)`: Vertical menu → horizontal tabs

## Migration Guide

### Before (Manual)
```javascript
const MyComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div style={{
      padding: isMobile ? spacing.spacing[24] : spacing.spacing[40],
      width: isMobile ? '100%' : '400px',
      maxWidth: isMobile ? '320px' : '400px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
  );
};
```

### After (Utilities)
```javascript
import { getResponsiveContainer, responsiveLayouts } from '@/design-system/utils/responsive';

const MyComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div style={{
      ...getResponsiveContainer(isMobile, 'page'),
      ...responsiveLayouts.stackOnMobile(isMobile),
    }}>
  );
};
```

## Benefits

- ✅ **Consistency**: All components use the same responsive patterns
- ✅ **Maintainability**: Update values in one place, apply everywhere
- ✅ **Developer Experience**: Simple, semantic utility functions
- ✅ **Type Safety**: Clear function signatures and documentation
- ✅ **Performance**: No runtime overhead, just style object generation
