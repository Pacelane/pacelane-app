# Style Guideline - ProductHome Design System

## Overview
This document defines the design system based on the ProductHome page to ensure consistency across all pages in the application.

## Layout Structure

### Main Layout Pattern
```tsx
<SidebarProvider>
  <div className="flex min-h-screen w-full">
    <AppSidebar {...sidebarProps} />
    <SidebarInset>
      <header className="flex h-16 items-center gap-4 border-b bg-neutral-50 px-4">
        {/* Header content */}
      </header>
      <div className="flex-1 bg-gray-50">
        {/* Main content */}
      </div>
    </SidebarInset>
  </div>
</SidebarProvider>
```

## Color Palette

### Background Colors
- **Main background**: `bg-gray-50`
- **Header background**: `bg-neutral-50`
- **Sidebar background**: `bg-neutral-50`
- **Card/Content background**: `bg-white`
- **Hover states**: `hover:bg-gray-50`, `hover:bg-[rgba(39,39,42,0.05)]`

### Border Colors
- **Primary borders**: `border-[rgba(39,39,42,0.10)]`
- **Light borders**: `border-gray-200`, `border-gray-100`
- **Input borders**: `border-[rgba(39,39,42,0.15)]`

### Text Colors
- **Primary text**: `text-[#111115]`
- **Secondary text**: `text-[#4E4E55]`
- **Muted text**: `text-gray-600`, `text-gray-500`
- **Active state text**: `text-[#234E4A]`

### Accent Colors
- **Active selection**: `bg-[rgba(83,210,190,0.10)]` with `border-[rgba(83,210,190,0.50)]`
- **Purple accent**: `bg-purple-600` (used for icons/highlights)
- **Blue accent**: `bg-blue-600` (used for primary actions)

## Typography

### Fonts
- **Primary font**: Playfair Display (`font-playfair`)
- **Headings**: Use Playfair Display for main titles
- **Body text**: Default system fonts

### Font Weights & Sizes
- **Page titles**: `text-4xl font-bold font-playfair`
- **Section headers**: `text-2xl font-normal`
- **Body text**: `text-sm font-medium` or `text-sm font-normal`
- **Small text**: `text-xs`

## Component Patterns

### Header Pattern
```tsx
<header className="flex h-16 items-center gap-4 border-b bg-neutral-50 px-4">
  <SidebarTrigger />
  <div className="flex-1 flex items-center justify-between">
    {/* Search and actions */}
  </div>
</header>
```

### Search Input Pattern
```tsx
<div className="relative max-w-sm">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
  <Input
    type="text"
    placeholder="Search"
    className="pl-10 bg-white border-gray-200"
  />
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
    /
  </div>
</div>
```

### Card Pattern
```tsx
<Card className="border border-gray-200 shadow-sm rounded-lg">
  <CardContent className="p-0">
    {/* Card header with icon and title */}
    <div className="flex items-center gap-2 p-3 border-b border-gray-100">
      <div className="flex items-center justify-center w-6 h-6 bg-purple-600 rounded-full">
        <Icon className="h-3 w-3 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">Title</h3>
        <p className="text-xs text-gray-500">Subtitle</p>
      </div>
    </div>
    {/* Card content */}
  </CardContent>
</Card>
```

### Button Variants
- **Primary action**: `bg-blue-600 hover:bg-blue-700`
- **Secondary**: `variant="outline"` with `border-gray-300 hover:bg-gray-100`
- **Ghost**: `variant="ghost"` for subtle actions
- **Icon buttons**: `size="icon"` for icon-only buttons

## Shadows & Effects

### Box Shadows
- **Card shadows**: `shadow-sm`
- **Button shadows**: `shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)]`

### Border Radius
- **Standard**: `rounded-md` (6px)
- **Cards**: `rounded-lg` (8px)
- **Pills**: `rounded-full`

## Spacing

### Padding Standards
- **Page padding**: `p-4`, `p-8`
- **Card padding**: `p-3` for content, `p-0` for CardContent wrapper
- **Button padding**: `px-2 py-1` for small, `px-2.5 py-1.5` for medium
- **Section spacing**: `pt-8`, `mt-8`

### Gap Standards
- **Small gaps**: `gap-1`, `gap-1.5`, `gap-2`
- **Medium gaps**: `gap-3`, `gap-4`
- **Icon gaps**: `gap-1` for icon + text

## Icons

### Icon Sizes
- **Small icons**: `h-3 w-3` (12px)
- **Standard icons**: `h-4 w-4` (16px)
- **Medium icons**: `h-5 w-5` (20px)
- **Avatar/logo icons**: `h-6 w-6` (24px)

### Icon Colors
- **Default**: `text-gray-400`
- **Active**: Follow text color hierarchy
- **On colored backgrounds**: `text-white`

## State Management

### Active States
- **Navigation items**: `bg-[rgba(83,210,190,0.10)]` with green border
- **Text styling**: `text-[#234E4A] font-bold` for active items

### Hover States
- **Subtle hover**: `hover:bg-gray-50`
- **Interactive hover**: `hover:bg-[rgba(39,39,42,0.05)]`
- **Button hover**: Specific to button variant

## Content Layout

### Center Content Pattern
```tsx
<div className="w-full max-w-2xl mx-auto p-4">
  {/* Centered content with max width */}
</div>
```

### Full Height Layout
```tsx
<div className="flex flex-col min-h-[calc(100vh-4rem)]">
  {/* Content that fills remaining height */}
</div>
```

## Implementation Guidelines

1. **Always use semantic color tokens** from the design system
2. **Maintain consistent spacing** using the defined padding/margin standards
3. **Use the established component patterns** for new features
4. **Follow the layout structure** with SidebarProvider and SidebarInset
5. **Apply consistent typography** with proper font weights and sizes
6. **Use standardized shadows and borders** for visual consistency

## Page Template

Use this template for new pages:

```tsx
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

const NewPage = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar {...sidebarProps} />
        
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b bg-neutral-50 px-4">
            <SidebarTrigger />
            {/* Header content */}
          </header>
          
          <div className="flex-1 bg-gray-50">
            <div className="w-full max-w-2xl mx-auto p-4">
              {/* Page content */}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default NewPage;
```

This guideline ensures all pages maintain visual consistency with the ProductHome design system.