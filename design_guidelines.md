# Design Guidelines: Life Safety Ops

## Design Philosophy

**Style:** Modern Minimal
**Inspiration:** Linear, Vercel, Stripe Dashboard
**Principle:** Clean, confident, professional - let the content speak

### Core Principles
1. **Generous whitespace** - Elements breathe, information hierarchy is clear
2. **Subtle boundaries** - Thin borders over shadows, barely-there dividers
3. **Restrained colour** - Neutral palette with one purposeful accent
4. **Typography-driven hierarchy** - Weight and size over colour
5. **Functional elegance** - Every element earns its place

## Colour System

### Philosophy
Near-monochromatic grey scale with a single sophisticated accent. The interface recedes; content advances.

### Light Mode
- **Background:** Cool off-white (subtle warmth to avoid clinical feel)
- **Cards/Surfaces:** Pure white or barely elevated grey
- **Borders:** Very subtle, 1px, low contrast
- **Text:** Near-black for primary, graduated greys for secondary/tertiary
- **Accent:** Teal-blue (sophisticated, professional, not generic)

### Dark Mode
- **Background:** Deep charcoal (not pure black - easier on eyes)
- **Cards/Surfaces:** Slightly elevated grey
- **Borders:** Subtle, darker grey
- **Text:** Off-white for primary, graduated greys for secondary
- **Accent:** Same teal-blue, slightly brighter for dark backgrounds

### Accent Colour Usage
- Primary actions (main CTA buttons)
- Active/selected states
- Key status indicators
- Links on hover
- **Never:** Decorative backgrounds, excessive highlights

## Typography

### Font Stack
- **Primary:** Inter (clean, highly legible, modern)
- **Monospace:** JetBrains Mono or Roboto Mono (technical data)

### Scale
| Use | Size | Weight | Tracking |
|-----|------|--------|----------|
| Page title | 24px | 600 | -0.02em |
| Section heading | 18px | 600 | -0.01em |
| Card title | 16px | 500 | normal |
| Body | 14px | 400 | normal |
| Small/caption | 12px | 400 | 0.01em |
| Numeric data | 14px mono | 500 | normal |

### Text Colour Hierarchy
1. **Primary:** Default foreground - headings, important content
2. **Secondary:** Muted foreground - supporting text, descriptions
3. **Tertiary:** Even more muted - timestamps, metadata, hints

## Spacing System

### Base Unit: 4px
| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Tight gaps, inline spacing |
| sm | 8px | Related elements |
| md | 16px | Component padding, standard gaps |
| lg | 24px | Section spacing |
| xl | 32px | Major section breaks |
| 2xl | 48px | Page-level spacing |

### Component Padding
- Cards: 16px (p-4) or 20px (p-5) for larger cards
- Sidebar items: 12px horizontal, 8px vertical
- Buttons: Built-in sizing, don't override
- Form fields: 12px horizontal padding

## Components

### Cards
- Background: bg-card (very subtle elevation from background)
- Border: 1px, barely visible (border-border)
- Radius: 8px (rounded-lg)
- Shadow: None or extremely subtle (shadow-2xs)
- Padding: p-4 to p-6

### Buttons
- Use built-in shadcn variants
- Primary: Accent colour, used sparingly
- Secondary: Subtle grey, most common
- Ghost: Transparent, for toolbars/actions
- Icon buttons: size="icon", consistent sizing

### Tables
- Minimal borders - only horizontal dividers
- Generous row height (48px minimum)
- Subtle hover state
- Header: Smaller, muted, uppercase or semi-bold

### Sidebar
- Background: Slightly different from main (creates separation)
- Items: Ghost button style, no borders
- Active item: Subtle background tint
- Icons: 18-20px, consistent stroke weight

### Form Fields
- Clean borders (1px)
- Focus: Subtle ring, accent colour
- Labels: Above field, semi-bold, 12-14px
- Helper text: Below, muted, 12px

## Interaction States

### Hover
- Very subtle - use built-in hover-elevate
- No dramatic colour changes
- Cursor indicates interactivity

### Active/Pressed
- Slightly darker than hover
- Brief, responsive feel

### Focus
- Subtle ring (ring-2 ring-ring)
- No disruptive outlines

### Selected
- Subtle background tint
- Possible left border accent for lists

## Layout

### Sidebar + Main
- Sidebar: Fixed width, 256px default
- Main content: Fluid, max-width for readability
- No decorative borders between - let background do the work

### Content Width
- Form containers: max-w-2xl
- Tables: Full width within container
- Cards: Responsive grid, consistent gaps

### Mobile
- Sidebar collapses to drawer
- Touch targets: Minimum 44px
- Stack cards vertically
- Generous touch spacing

## Icons

- Library: Lucide React
- Size: 16px (small), 18-20px (default), 24px (large)
- Stroke: 1.5-2px (consistent)
- Colour: currentColor (inherits text)

## Do's and Don'ts

### Do
- Use whitespace generously
- Let typography create hierarchy
- Keep interactions subtle
- Maintain consistent spacing
- Use accent colour purposefully

### Don't
- Add decorative elements
- Use multiple accent colours
- Create busy interfaces
- Add shadows everywhere
- Use bright/saturated colours for UI chrome
