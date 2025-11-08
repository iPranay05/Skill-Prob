# 🎨 Color System Guide

## Overview
This project uses a centralized color system defined in `src/app/globals.css`. Always use these semantic color names instead of hardcoded hex values.

## Brand Colors

### Primary (Purple)
- **Usage**: Main brand color, primary buttons, links, highlights
- **Classes**: 
  - `bg-primary` / `text-primary` / `border-primary`
  - `bg-primary-light` / `text-primary-light` / `border-primary-light`
  - `bg-primary-dark` / `text-primary-dark` / `border-primary-dark`
- **Hex Values**: 
  - Primary: `#5e17eb`
  - Light: `#7c3aed`
  - Dark: `#4c0db0`

### Secondary (Green)
- **Usage**: Success states, secondary actions, positive feedback
- **Classes**: 
  - `bg-secondary` / `text-secondary` / `border-secondary`
  - `bg-secondary-light` / `text-secondary-light` / `border-secondary-light`
  - `bg-secondary-dark` / `text-secondary-dark` / `border-secondary-dark`
- **Hex Values**: 
  - Secondary: `#10b981`
  - Light: `#34d399`
  - Dark: `#059669`

### Accent (Orange)
- **Usage**: Call-to-action, highlights, special features
- **Classes**: 
  - `bg-accent` / `text-accent` / `border-accent`
  - `bg-accent-light` / `text-accent-light` / `border-accent-light`
  - `bg-accent-dark` / `text-accent-dark` / `border-accent-dark`
- **Hex Values**: 
  - Accent: `#f59e0b`
  - Light: `#fbbf24`
  - Dark: `#d97706`

## Neutral Colors

### Background & Foreground
- **Background**: `bg-background` - Main page background
- **Foreground**: `text-foreground` - Main text color
- **Muted**: `bg-muted` - Subtle backgrounds
- **Muted Foreground**: `text-muted-foreground` - Secondary text
- **Border**: `border-border` - Default borders

## Status Colors

### Success
- **Usage**: Success messages, completed states
- **Class**: `bg-success` / `text-success`
- **Hex**: `#10b981`

### Warning
- **Usage**: Warning messages, caution states
- **Class**: `bg-warning` / `text-warning`
- **Hex**: `#f59e0b`

### Error
- **Usage**: Error messages, destructive actions
- **Class**: `bg-error` / `text-error`
- **Hex**: `#ef4444`

### Info
- **Usage**: Informational messages, tips
- **Class**: `bg-info` / `text-info`
- **Hex**: `#3b82f6`

## Usage Examples

### ❌ **DON'T** - Hardcoded Colors
```tsx
<button className="bg-[#5e17eb] text-white">
  Click Me
</button>

<div className="text-[#10b981]">
  Success!
</div>
```

### ✅ **DO** - Semantic Colors
```tsx
<button className="bg-primary text-white hover:bg-primary-dark">
  Click Me
</button>

<div className="text-secondary">
  Success!
</div>
```

## Common Patterns

### Primary Button
```tsx
<button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
  Primary Action
</button>
```

### Secondary Button
```tsx
<button className="bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-lg">
  Secondary Action
</button>
```

### Success Message
```tsx
<div className="bg-success/10 border border-success text-success p-4 rounded-lg">
  Operation successful!
</div>
```

### Error Message
```tsx
<div className="bg-error/10 border border-error text-error p-4 rounded-lg">
  Something went wrong!
</div>
```

### Card with Border
```tsx
<div className="bg-background border border-border rounded-lg p-6">
  Card content
</div>
```

### Muted Section
```tsx
<section className="bg-muted py-16">
  <p className="text-muted-foreground">
    Secondary information
  </p>
</section>
```

## Benefits

1. **Consistency**: All components use the same colors
2. **Maintainability**: Change colors in one place
3. **Dark Mode**: Automatic dark mode support
4. **Accessibility**: Semantic naming improves code readability
5. **Theming**: Easy to create different themes

## Migration Guide

To migrate existing code:

1. Find hardcoded colors: Search for `#` or `rgb(` in className
2. Replace with semantic names:
   - `#5e17eb` → `primary`
   - `#10b981` → `secondary`
   - `#f59e0b` → `accent`
   - `#ef4444` → `error`
   - `#10b981` → `success`
3. Update hover states: `hover:bg-primary-dark` instead of `hover:bg-[#4c0db0]`

## Questions?

If you need a color that doesn't exist in the system, discuss with the team before adding it to maintain consistency.
