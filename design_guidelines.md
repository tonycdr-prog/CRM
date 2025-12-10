# Design Guidelines: Airflow Reading Visualisation Tool

## Design Approach

**Selected System:** Material Design with technical/engineering focus
**Justification:** This is a utility-focused professional tool requiring clear data entry, precise visualisation, and reliable export functionality. Material Design provides excellent patterns for data-dense interfaces while maintaining mobile responsiveness for field use.

**Key Design Principles:**
- Precision and clarity over decorative elements
- Single-page interface optimised for quick field testing workflow
- Touch-friendly controls for on-site use
- Professional appearance suitable for compliance documentation

## Core Design Elements

### A. Typography

**Font Family:** Inter (primary), Roboto Mono (numeric values)
- **Headings:** Inter, 600 weight
  - H1 (App Title): 24px
  - H2 (Section Labels): 18px
  - H3 (Field Labels): 14px
- **Body Text:** Inter, 400 weight, 14px
- **Numeric Readings:** Roboto Mono, 500 weight, 16px (ensures clear digit distinction)
- **Average Result:** Roboto Mono, 700 weight, 24px (prominent display)

### B. Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Container padding: p-4 on mobile, p-6 on tablet+
- Section spacing: space-y-6 for vertical flow
- Input field spacing: gap-4 in grid layouts
- Component internal padding: p-4

**Grid Structure:**
- Single column on mobile (< 768px)
- Maximum width: max-w-4xl centered on larger screens
- Input grid: 2×4 grid (grid-cols-2) for the 8 reading positions

### C. Component Library

#### 1. Header Section
- App title with icon (measurement/gauge icon from Material Icons)
- Optional test metadata fields (Date, Location, Tester Name) - collapsible on mobile
- Spacing: pb-6 border-b

#### 2. Data Entry Panel
**Reading Input Cards:**
- 8 numbered input fields arranged in 2×4 grid
- Each card contains:
  - Position label (bold, e.g., "Position 1 - Top Left")
  - Input field with suffix "m/s"
  - Type: number, step="0.01" for decimal precision
  - Border treatment to distinguish empty vs filled states
- Card styling: p-4, rounded-lg border
- Focus state: prominent border highlight

#### 3. Damper Visualisation Canvas
**Interactive Diagram:**
- Central visualisation showing smoke control damper schematic
- Rectangular representation (landscape orientation)
- 8 position markers mapped to input grid:
  - Top row: 4 positions (left to right)
  - Bottom row: 4 positions (left to right)
- Each marker displays:
  - Position number in circle
  - Reading value (when entered) in Roboto Mono
  - Visual indicator (checkmark icon) when value entered
- Responsive sizing: Minimum height of 300px, scales with viewport
- Margin: my-8

#### 4. Results Display
**Average Calculation Panel:**
- Prominent card with enhanced border
- Large average value display (Roboto Mono, 700 weight, 32px)
- Label "Average Airflow Velocity"
- Unit display "m/s"
- Auto-updates as readings are entered
- Conditional display: Only show when at least 1 reading entered
- Background treatment to distinguish from input area
- Padding: p-6

#### 5. Action Buttons
**Save to Image Button:**
- Full-width on mobile, auto-width centered on desktop
- Icon: download/save icon from Material Icons
- Text: "Save to Images"
- Position: Fixed to bottom on mobile for thumb accessibility, static below results on desktop
- Disabled state when no readings entered
- Size: Comfortable touch target (min-h-12)

**Clear All Button:**
- Secondary style, positioned next to Save button on desktop
- Text only, no icon needed
- Confirmation dialog before clearing

#### 6. Supporting Components
**Input Field Specifications:**
- Border radius: rounded-md
- Height: h-12 for comfortable mobile input
- Padding: px-4
- Border width: border-2 for visibility
- Large touch targets for field access
- Numeric keyboard trigger on mobile

**Status Indicators:**
- Progress display: "X of 8 readings entered"
- Position: Below data entry grid, above visualisation
- Small text, 12px, medium weight

## D. Animations

**Minimal Animation Strategy:**
- Input field focus: Smooth border transition (150ms)
- Average value update: Subtle fade-in (200ms) when recalculated
- Marker population: Brief scale animation (100ms) when reading entered
- No scroll animations, parallax, or decorative motion

## Images

**Damper Diagram Base:**
While the visualisation will be code-generated, consider including a technical diagram reference:
- Optional background image: Subtle outline of a standard smoke control damper
- Placement: Within visualisation canvas, at 10% opacity
- Purpose: Provides technical context for non-specialists
- Format: Simple line drawing showing damper mechanism

**No hero image required** - this is a focused utility tool.

## Mobile-First Considerations

- All touch targets minimum 44×44px
- Numeric keyboard auto-triggers for input fields
- Save button positioned in thumb-reach zone on mobile
- Canvas zooming disabled (user-scalable=no for this tool)
- Horizontal scrolling prevented on visualisation

## Export Functionality Requirements

When "Save to Image" is triggered:
- Capture entire interface including all readings and average
- Include timestamp and optional metadata in image
- Generate high-resolution PNG suitable for documentation
- Optimise for portrait orientation (typical report format)