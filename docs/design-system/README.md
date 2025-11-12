# Design System Documentation

## 🎨 Overview

Pacelane's design system is a comprehensive, theme-aware component library built with modern design principles. It provides consistent, accessible, and beautiful UI components that automatically adapt to light and dark themes.

## 🏗️ Architecture

### Core Principles
- **Theme-Aware**: Automatic light/dark mode adaptation
- **Token-Based**: All styling uses design tokens, no hardcoded values
- **Component-First**: Reusable, composable components
- **Accessibility**: ARIA compliance and keyboard navigation
- **Motion**: Smooth animations and transitions

### File Structure
```
src/design-system/
├── tokens/           # Design tokens (colors, typography, spacing, etc.)
├── components/       # Reusable UI components
├── styles/          # Pre-defined style combinations
└── utils/           # Utility functions and helpers
```

## 🎨 Design Tokens

### Import Pattern
**CRITICAL**: Always use the `@/` alias for imports. NEVER use `src/` prefix or relative paths.

```javascript
// ✅ CORRECT - Always use @/ alias
import { tokens } from '@/design-system/tokens';
import { colors } from '@/design-system/tokens/primitive-colors';
import { useTheme } from '@/services/theme-context';

// ❌ WRONG - Never use src/ prefix or relative paths
import { tokens } from 'src/design-system/tokens';
import { colors } from '../design-system/tokens/primitive-colors';
```

### Token Categories

#### 1. Colors
```javascript
import { colors } from '@/design-system/tokens/primitive-colors';
import { useTheme } from '@/services/theme-context';

// Primitive colors (full color scales)
colors.gray[0-1000]        // White to black
colors.blue[50-950]         // Brand blue scale
colors.teal[50-950]         // Brand teal scale
colors.red[50-950]          // Destructive scale
colors.green[50-950]        // Success scale
colors.orange[50-950]       // Warning scale

// Transparent variants
colors.transparentDark[0-90]    // Dark overlays
colors.transparentLight[0-90]   // Light overlays
colors.transparentRed[10-90]    // Red overlays
colors.transparentBlue[10-90]   // Blue overlays
```

#### 2. Semantic Colors (Theme-Aware)
```javascript
const { colors } = useTheme(); // Gets current theme colors

// Text colors
colors.text.default           // Primary text
colors.text.subtle            // Secondary text
colors.text.muted             // Tertiary text
colors.text.hint              // Placeholder text
colors.text.destructive       // Error text
colors.text.success           // Success text
colors.text.warning           // Warning text
colors.text.informative       // Info text
colors.text.accent            // Teal accent

// Background colors
colors.bg.default             // Main background
colors.bg.subtle              // Subtle background
colors.bg.muted               // Muted background
colors.bg.inverted            // Inverted background
colors.bg.card.default        // Card background
colors.bg.card.subtle         // Subtle card background
colors.bg.input.default       // Input background
colors.bg.input.soft          // Soft input background

// Interactive states
colors.bg.state.primary       // Primary button background
colors.bg.state.primaryHover  // Primary hover state
colors.bg.state.secondary     // Secondary button background
colors.bg.state.soft          // Soft button background
colors.bg.state.destructive   // Destructive button background

// Border colors
colors.border.default          // Default borders
colors.border.darker           // Stronger borders
colors.border.destructive      // Error borders
colors.border.success          // Success borders
colors.border.warning          // Warning borders

// Icon colors
colors.icon.default            // Primary icon color
colors.icon.subtle             // Secondary icon color
colors.icon.muted              // Tertiary icon color
colors.icon.disabled           // Disabled icon color
```

#### 3. Typography
```javascript
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Font families
typography.fontFamily.geist               // ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif']
typography.fontFamily['instrument-serif'] // ['Instrument Serif', 'ui-serif', 'Georgia', 'serif']
typography.fontFamily['geist-mono']       // ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']

// Legacy aliases (maintained for backwards compatibility)
typography.fontFamily.inter               // Points to Geist
typography.fontFamily.fraunces            // Points to Instrument Serif
typography.fontFamily.jetbrains           // Points to Geist Mono
typography.fontFamily['awesome-serif']    // Points to Instrument Serif

// Semantic assignments
typography.fontFamily.headline        // Geist (default)
typography.fontFamily.body            // Geist (default)
typography.fontFamily.quote           // Instrument Serif
typography.fontFamily.code            // Geist Mono

// Desktop sizes
typography.desktop.size.xs            // 12px
typography.desktop.size.sm            // 14px
typography.desktop.size.md            // 16px
typography.desktop.size.lg            // 18px
typography.desktop.size.xl            // 20px
typography.desktop.size['2xl']        // 24px
typography.desktop.size['3xl']        // 30px
typography.desktop.size['4xl']        // 36px
typography.desktop.size['5xl']        // 48px
typography.desktop.size['6xl']        // 60px
typography.desktop.size['7xl']        // 72px
typography.desktop.size['8xl']        // 96px
typography.desktop.size['9xl']        // 128px

// Font weights
typography.desktop.weight.light       // 300
typography.desktop.weight.normal      // 400
typography.desktop.weight.medium      // 500
typography.desktop.weight.semibold    // 600
typography.desktop.weight.bold        // 700
typography.desktop.weight.extrabold   // 800
typography.desktop.weight.black       // 900

// Pre-defined text styles (RECOMMENDED)
textStyles.md.semibold               // 16px, 600 weight, proper line height
textStyles.xl.bold                   // 20px, 700 weight, proper line height
textStyles['2xl'].normal             // 24px, 400 weight, proper line height
textStyles.quote.normal              // Instrument Serif font for quotes
textStyles.code.normal               // Geist Mono for code
```

#### 4. Spacing
```javascript
import { spacing } from '@/design-system/tokens/spacing';

spacing.spacing.none         // 0px
spacing.spacing[4]           // 4px
spacing.spacing[8]           // 8px
spacing.spacing[12]          // 12px
spacing.spacing[16]          // 16px
spacing.spacing[20]          // 20px
spacing.spacing[24]          // 24px
spacing.spacing[32]          // 32px
spacing.spacing[40]          // 40px
spacing.spacing[48]          // 48px
spacing.spacing[56]          // 56px
spacing.spacing[64]          // 64px
spacing.spacing[80]          // 80px
spacing.spacing[96]          // 96px
// ... up to 384px
```

#### 5. Border Radius
```javascript
import { cornerRadius } from '@/design-system/tokens/corner-radius';

cornerRadius.borderRadius.none        // 0px
cornerRadius.borderRadius['2xs']      // 2px
cornerRadius.borderRadius.xs          // 4px
cornerRadius.borderRadius.sm          // 6px
cornerRadius.borderRadius.md          // 8px
cornerRadius.borderRadius.lg          // 12px
cornerRadius.borderRadius.xl          // 16px
cornerRadius.borderRadius['2xl']      // 24px
cornerRadius.borderRadius['3xl']      // 28px
cornerRadius.borderRadius.full        // 9999px
```

#### 6. Shadows
```javascript
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import { useTheme } from '@/services/theme-context';

const { colors } = useTheme();

// Regular shadows (elevated surfaces)
shadows.regular.card                  // Card shadow
shadows.regular.modalSm               // Small modal shadow
shadows.regular.modalMd               // Medium modal shadow
shadows.regular.modalLg               // Large modal shadow

// Component shadows (interactive elements)
shadows.component.default             // Default component shadow
shadows.component.switchHandle        // Switch handle shadow
shadows.component.focus               // Focus shadow (without rings)
shadows.component.destructiveFocus    // Destructive focus shadow

// Theme-aware shadows with borders
getShadow('regular.card', colors, { withBorder: true })
getShadow('regular.modalMd', colors, { withBorder: true })

// Focus rings
getShadow('', colors, { focusType: 'default' })      // Blue focus ring
getShadow('', colors, { focusType: 'destructive' }) // Red focus ring
getShadow('', colors, { focusType: 'input' })       // Input focus ring
getShadow('', colors, { focusType: 'misc' })        // General focus ring
```

#### 7. Stroke/Border Widths
```javascript
import { stroke } from '@/design-system/tokens/stroke';

stroke.sm                  // 0.5px
stroke.default             // 1px
stroke.md                  // 1.5px
stroke.lg                  // 2px
stroke.xl                  // 3px
stroke['2xl']              // 4px
```

## 🧩 Components

### Available Components

#### 1. Button Component
**ALWAYS use this component for ANY button needs. NEVER create custom buttons.**

```javascript
import Button from '@/design-system/components/Button';
import { Plus, MoreHorizontal } from 'lucide-react';

// Primary action button
<Button 
  label="Create Post"
  style="primary"
  size="lg"
  onClick={handleCreate}
  leadIcon={<Plus size={16} />}
/>

// Secondary button
<Button 
  label="Save Draft"
  style="secondary"
  size="md"
  onClick={handleSave}
/>

// Icon-only button
<Button 
  variant="iconOnly"
  style="ghost"
  leadIcon={<MoreHorizontal size={12} />}
  onClick={handleMenu}
/>

// Destructive button
<Button 
  label="Delete"
  style="destructive"
  size="sm"
  onClick={handleDelete}
/>
```

**Button Styles Available:**
- `primary` - Blue backgrounds, white text/icons, shadows
- `secondary` - Light backgrounds, default text, borders, shadows
- `dashed` - Same as secondary but with dashed borders
- `soft` - Soft colored backgrounds, muted text/icons
- `ghost` - Minimal backgrounds, default text
- `ghostMuted` - Same as ghost but with muted text
- `destructive` - Red backgrounds, white text/icons

**Button Sizes Available:**
- `2xs` - Extra small (24px height)
- `xs` - Small (28px height)
- `sm` - Small-medium (32px height)
- `md` - Medium (36px height)
- `lg` - Large (40px height)

#### 2. Other Design System Components
```javascript
import Bichaurinho from '@/design-system/components/Bichaurinho';
import Logo from '@/design-system/components/Logo';

// Mascot illustrations (32 variants)
<Bichaurinho variant={1} size={128} className="custom-class" />

// Auto-switching logo for light/dark themes
<Logo width={120} className="custom-class" alt="Custom alt text" />
```

### Component Patterns

#### Theme-Aware Components
```javascript
import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

const MyComponent = ({ children, elevated = false }) => {
  const { colors } = useTheme();
  
  return (
    <div
      style={{
        backgroundColor: colors.bg.card.default,
        color: colors.text.default,
        padding: spacing.spacing[16],
        borderRadius: cornerRadius.borderRadius.md,
        boxShadow: elevated 
          ? getShadow('regular.modalMd', colors, { withBorder: true })
          : getShadow('regular.card', colors, { withBorder: true }),
      }}
    >
      {children}
    </div>
  );
};
```

#### Typography Components
```javascript
import { textStyles } from '@/design-system/styles/typography/typography-styles';

const Heading = ({ level = 1, children }) => {
  const styles = {
    1: textStyles['4xl'].semibold,
    2: textStyles['3xl'].semibold,
    3: textStyles['2xl'].semibold,
    4: textStyles.xl.medium,
    5: textStyles.lg.medium,
    6: textStyles.md.medium,
  };
  
  return <h1 style={styles[level]}>{children}</h1>;
};
```

## 🎭 Theming

### Theme Context
```javascript
import { useTheme, ThemeProvider } from '@/services/theme-context';

// In your component
const MyComponent = () => {
  const { colors, currentTheme, toggleTheme } = useTheme();
  
  return (
    <div style={{ backgroundColor: colors.bg.default }}>
      <button onClick={toggleTheme}>
        Switch to {currentTheme === 'light' ? 'dark' : 'light'} mode
      </button>
    </div>
  );
};

// Wrap your app
<ThemeProvider>
  <App />
</ThemeProvider>
```

### Theme Switching
The design system automatically handles:
- Color scheme adaptation
- Component styling updates
- Icon and logo changes
- Shadow and border adjustments

## 🎯 Usage Guidelines

### DO's ✅
1. **Always use `@/` alias** for imports
2. **Use design tokens** instead of hardcoded values
3. **Use the Button component** for all button needs
4. **Use Lucide React icons** for all icon needs
5. **Use semantic colors** for theme compatibility
6. **Use `textStyles`** for typography
7. **Use `useTheme()` hook** for theme-aware components
8. **Use design system shadows** for all shadows

### DON'Ts ❌
1. **Never use `src/` prefix** in imports
2. **Never create custom buttons** - use Button component
3. **Never create custom SVG icons** - use Lucide React
4. **Never hardcode colors, fonts, or spacing**
5. **Never use CSS color names or hex values directly**
6. **Never use Tailwind shadow classes** - use design system shadows

### Examples

#### ❌ Wrong
```javascript
// Custom button with hardcoded values
<button 
  style={{ 
    backgroundColor: '#007bff', 
    color: 'white',
    padding: '12px 16px',
    borderRadius: '6px'
  }}
>
  Submit
</button>

// Hardcoded styling
<div style={{ 
  backgroundColor: '#f4f4f5', 
  color: '#18181b',
  padding: '16px',
  borderRadius: '8px'
}}>
```

#### ✅ Correct
```javascript
// Design system Button component
<Button 
  label="Submit"
  style="primary"
  size="lg"
  onClick={handleSubmit}
/>

// Theme-aware styling with tokens
const { colors } = useTheme();
<div style={{ 
  backgroundColor: colors.bg.subtle, 
  color: colors.text.default,
  padding: spacing.spacing[16],
  borderRadius: cornerRadius.borderRadius.md
}}>
```

## 🔧 Development

### Adding New Components
1. **Check existing components first** - don't duplicate functionality
2. **Use design tokens** for all styling
3. **Implement theme compatibility** with `useTheme()`
4. **Follow accessibility guidelines** with proper ARIA labels
5. **Include motion** for interactive elements
6. **Document props and usage** with clear examples

### Component Structure
```javascript
import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';

interface MyComponentProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

const MyComponent: React.FC<MyComponentProps> = ({ 
  children, 
  variant = 'default' 
}) => {
  const { colors } = useTheme();
  
  const containerStyles = {
    backgroundColor: colors.bg.card.default,
    color: colors.text.default,
    padding: spacing.spacing[16],
    borderRadius: cornerRadius.borderRadius.md,
    // Add other styles using tokens
  };
  
  return (
    <div style={containerStyles}>
      {children}
    </div>
  );
};

export default MyComponent;
```

## 📱 Responsive Design

### Responsive Utilities
```javascript
import { responsiveUtils } from '@/design-system/utils/responsive';

// Responsive breakpoints
responsiveUtils.breakpoints.sm    // 640px
responsiveUtils.breakpoints.md    // 768px
responsiveUtils.breakpoints.lg    // 1024px
responsiveUtils.breakpoints.xl    // 1280px
responsiveUtils.breakpoints['2xl'] // 1536px

// Responsive spacing
responsiveUtils.getSpacing(16, { sm: 24, lg: 32 })
// Returns 16px on mobile, 24px on small screens, 32px on large screens
```

## 🧪 Testing

### Component Testing
```javascript
// Test theme switching
const { result } = renderHook(() => useTheme());
act(() => {
  result.current.toggleTheme();
});
expect(result.current.currentTheme).toBe('dark');

// Test design token usage
const component = render(<MyComponent />);
expect(component.container.firstChild).toHaveStyle({
  padding: '16px', // spacing.spacing[16]
  borderRadius: '8px', // cornerRadius.borderRadius.md
});
```

## 🔗 Related Documentation

- [Service Layer](./../services/README.md) - Business logic and API integration
- [Supabase & Backend](./../supabase/README.md) - Backend architecture and edge functions
- [Architecture Overview](./../architecture/README.md) - Overall system design

---

*Last updated: December 2024*
*Design System version: 2.0*
*Components: 10+ reusable components*
*Design Tokens: 25+ token categories*
