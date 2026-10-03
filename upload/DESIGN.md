---
name: Interstate Freight Dispatch
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#44474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#495f82'
  primary: '#001026'
  on-primary: '#ffffff'
  primary-container: '#0b2545'
  on-primary-container: '#778db2'
  inverse-primary: '#b1c7f0'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#000c34'
  on-tertiary: '#ffffff'
  tertiary-container: '#001e63'
  on-tertiary-container: '#7088dc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b1c7f0'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#314769'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b6c4ff'
  on-tertiary-fixed: '#00164e'
  on-tertiary-fixed-variant: '#264191'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-metric:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
  data-metric-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
  code-tabular:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-lg: 2rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style
The design system establishes a high-precision, mission-critical workspace for interstate long-haul commercial motor vehicle (CMV) operators and fleet dispatchers operating under US FMCSA 49 CFR Part 395 rules. The aesthetic blends the programmatic clarity of modern digital freight brokerages with the utilitarian resilience of commercial telematics interfaces.

The emotional core is professional calm, unwavering compliance, and navigational authority. Long-haul workflows demand zero visual noise: high contrast, absolute legibility in varying in-cab light environments, and immediate glanceability for Hours of Service (HOS) clocks, cycle limits, and route telematics. Visual styling adheres to a modern industrial standard—structured, compact, tabular, and structurally anchored by sharp border dividers and functional color signaling rather than decorative flourishes.

## Colors
The palette leverages functional semantic contrast to separate regulatory state changes, map telemetry, and administrative trip actions.

- **Primary (`#0B2545` - Deep Navy):** Anchors headers, primary brand elements, active log headers, and structural UI chrome.
- **Secondary (`#F59E0B` - Highway Amber):** Denotes warnings, approaching HOS thresholds (e.g., 30-minute rest break required, under 1 hour remaining on drive clock), and caution states.
- **Tertiary (`#1E3A8A` - Steel Blue):** Signifies interactive data states, active route segments, link selections, and secondary actions.
- **Success (`#10B981` - Green):** Active driving status ("Drive"), compliant log audits, on-time arrivals, and available cycle hours.
- **Warning / Violation (`#DC2626` - Red):** HOS violations (11-hour driving, 14-hour duty window, or 70-hour/8-day ceiling breaches), hard braking events, and missed check-ins.
- **Background Slate (`#F8FAFC`):** Low-strain canvas reducing glare during prolonged terminal/tablet viewing.
- **Card Surface (`#FFFFFF`):** High-contrast base for technical grids, duty status graphs, and shipment itineraries.
- **Border Grayscale:** Neutral borders rely on `#E2E8F0` for interior module divisions and `#CBD5E1` for actionable container boundaries.

## Typography
Inter serves as the sole typeface across display, interface, and tabular structures. 

For all numeric fields—including 24-hour log rulers, odometers, fuel burn calculations, split-sleeper berth calculations, and GPS coordinates—`font-feature-settings: "tnum" 1` (tabular figures) is mandatory. This ensures characters align across multi-row logistics spreadsheets and 24-block standard grid representations without visual drift. Micro-labels, inspection flags, and duty status indicators require uppercase treatment with increased letter spacing (`0.05em`) for quick scan recognition at distance on mounted in-cab hardware.

## Layout & Spacing
The layout follows a dense 12-column desktop grid optimized for continuous telemetry display, shifting to a 6-column grid on tablet, and a single vertical stack on mobile viewport sizes.

- **Desktop (1280px+):** Fixed 260px collapsible command rail, 12-column dynamic work area with 16px (`gutter`) gutters, 32px canvas margins (`margin-lg`). Accommodates side-by-side interactive leaf-let routing maps and continuous FMCSA timeline grids.
- **Tablet (768px - 1279px):** 6-column grid with 16px margins; panels stack into two horizontal functional modules (Map/Route top, Duty Status/Timelines bottom).
- **Mobile (< 768px):** Single-column layout, edge-to-edge container margins (`16px`), vertical card stacks with sticky bottom regulatory status controls.

Vertical rhythm prioritizes dense data density. Standard data tables, log sheet events, and manifest items utilize compact vertical padding (`space-sm` = 8px) to reduce vertical scrolling and show complete 24-hour schedules within typical viewport heights.

## Elevation & Depth
Depth is produced via subtle borders and minimal, structured elevation to prevent optical fatigue during night shifts and sunlight bounce.

- **Level 0 (Canvas):** `#F8FAFC` flat surface.
- **Level 1 (Panels & Metric Cards):** Pure white `#FFFFFF` surface bounded by a crisp 1px solid `#E2E8F0` border. Shadow: `0 1px 3px 0 rgba(11, 37, 69, 0.04), 0 1px 2px -1px rgba(11, 37, 69, 0.03)`.
- **Level 2 (Dropdowns, Overlays & Sticky Bars):** Pure white surface, 1px solid `#CBD5E1`. Shadow: `0 4px 6px -1px rgba(11, 37, 69, 0.08), 0 2px 4px -2px rgba(11, 37, 69, 0.05)`.
- **Level 3 (Modal Dialogs & Violation Alerts):** Pure white surface with a prominent high-contrast border accent. Shadow: `0 20px 25px -5px rgba(11, 37, 69, 0.12), 0 8px 10px -6px rgba(11, 37, 69, 0.06)`.
- **Interactive Focus/Active Tonal Layers:** Hovered table rows adopt `#F1F5F9`; active/selected table rows and timeline slices shift to `#EFF6FF` with a 2px left border accent in Steel Blue (`#1E3A8A`).

## Shapes
The design system utilizes deliberate, restrained corner radiuses to reinforce its technical and institutional reliability:

- **Cards & Data Containers:** Strict `10px` border-radius to preserve structural density while avoiding boxy visual fatigue.
- **Buttons, Form Inputs & Select Controls:** Strict `8px` border-radius, presenting an actionable, modern touch/click boundary.
- **Badges, Status Chips, Tags & Duty Abbreviations:** Tight `4px` border-radius, maintaining a compact architectural aesthetic reminiscent of physical paper-log stamps and highway signage.
- **Segmented Duty Selectors:** Outer boundary `8px`, with internal segmented items at `4px` for nested geometric harmony.

## Components

### Buttons
- **Primary:** Solid Deep Navy (`#0B2545`) background, `#FFFFFF` text, `8px` radius, `height: 36px` (desktop) / `44px` (touch/mobile), font size `13px`, font weight `600`. Hover: `#1E3A8A`. Active: `#061629`.
- **Secondary:** White background with 1px solid border `#CBD5E1`, text `#0B2545`. Hover: `#F8FAFC` and border `#94A3B8`.
- **Danger (Violations/Emergency Stop):** Background `#DC2626`, text `#FFFFFF`. Hover: `#B91C1C`.
- **Warning (Certify Logs):** Amber outline or secondary tinted fill (`#FEF3C7`), text `#B45309`, border `#FCD34D`.

### Form Inputs & Dropdowns
- Height: `36px` (desktop), `44px` (in-cab touch target). 
- Border: `1px solid #CBD5E1`, radius: `8px`, background: `#FFFFFF`, text: `#0B2545`. 
- Focus state: Border color `#1E3A8A`, outline ring `2px solid rgba(30, 58, 138, 0.15)`.
- Numeric input: strictly configured with tabular digits (`font-variant-numeric: tabular-nums`).

### Cards & Panels
- Background: `#FFFFFF`, border: `1px solid #E2E8F0`, radius: `10px`. 
- Card headers feature an internal height of `48px`, horizontal divider line `1px solid #F1F5F9`, title in `headline-sm`, and right-aligned quick-action slots.

### Status Chips & Badges
- Boundary: `4px` radius. Padding: `2px 6px` for micro-tags, `4px 8px` for standard badges.
- **Off Duty:** Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.
- **Sleeper Berth:** Background `#EDE9FE`, text `#5B21B6`, border `1px solid #DDD6FE`.
- **Driving:** Background `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`.
- **On Duty (Not Driving):** Background `#FEF3C7`, text `#92400E`, border `1px solid #FDE68A`.

### Data Tables & Log Grids
- Row height: `40px` compact; header row `32px` (`label-sm` uppercase, text `#64748B`, background `#F8FAFC`).
- Grid lines: Subtle horizontal border `1px solid #F1F5F9`.
- Dynamic duty timeline: 24-hour horizontal linear scale with four continuous horizontal lines (Off Duty, Sleeper, Driving, On Duty) connected by vertical transition segments, bordered by a precise `1px solid #CBD5E1` ruler divided into 15-minute tick marks.

### Checkboxes & Segmented Controls
- Checkboxes: `16px x 16px`, `4px` radius, border `#94A3B8`, active check `#0B2545`.
- Segmented Cycle Switchers (e.g., 70hr/8day vs 60hr/7day): Background `#F1F5F9`, padding `2px`, inner active item radius `6px` in `#FFFFFF` with drop shadow `0 1px 2px rgba(0,0,0,0.05)`.