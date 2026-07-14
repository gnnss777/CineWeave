---
name: CineWeave Design System
description: >-
  Dark-themed cinematic screenwriting platform. Glassmorphism, lime-gold accent,
  monospace screenplay typography. Dark, moody, neon-cinematic atmosphere.

colors:
  bg-darkest: "#050505"
  bg-obsidian: "#0a0a0a"
  bg-card: "rgba(20,20,20,0.75)"
  bg-card-hover: "rgba(30,30,30,0.9)"
  bg-input: "#151515"
  border-color: "rgba(204,238,0,0.15)"
  border-color-active: "rgba(204,238,0,0.5)"
  primary-gold: "#ccee00"
  primary-gold-hover: "#dbfa00"
  glow-gold: "rgba(204,238,0,0.25)"
  glow-gold-intense: "rgba(204,238,0,0.6)"
  text-primary: "#ffffff"
  text-secondary: "#a3a3a3"
  text-muted: "#737373"
  color-act: "#3b82f6"
  color-scene: "#8b5cf6"
  color-character: "#f59e0b"
  color-location: "#10b981"
  color-object: "#ef4444"
  color-theme: "#ec4899"

typography:
  body-md:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  heading-lg:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 20px
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: -0.02em
  heading-md:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0em
  heading-sm:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.05em
  label-xs:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.05em
  script-body:
    fontFamily: "'Courier Prime', Courier, monospace"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  xxl: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px

components:
  glass-card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.lg}"
  glass-interactive:
    backgroundColor: "{colors.bg-card-hover}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.lg}"
  btn-primary:
    backgroundColor: "{colors.primary-gold}"
    textColor: "#1a1a1a"
    typography: "{typography.heading-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.lg}"
  btn-secondary:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm} {spacing.lg}"
  btn-icon:
    backgroundColor: "rgba(255,255,255,0.03)"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    size: 40px
  input-default:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
---
# CineWeave Design System

## Overview

CineWeave is a dark-themed, cinematic screenwriting platform. The visual identity is built around a **dark, moody, neon-cinematic atmosphere** with a lime-gold accent (`#ccee00`) as the primary brand color. Glassmorphism cards, subtle gold glows, and a Courier Prime monospace for screenplay editing define the experience.

The design language is intentionally dark (`#050505` background), using semi-transparent glass panels, gold borders, and luminous glows to create depth without breaking the dramatic tone.

## Colors

| Token | Value | Usage |
|---|---|---|
| `--bg-darkest` | `#050505` | Page background |
| `--bg-obsidian` | `#0a0a0a` | Drawers, modals |
| `--bg-card` | `rgba(20,20,20,0.75)` | Card backgrounds |
| `--bg-card-hover` | `rgba(30,30,30,0.9)` | Card hover state |
| `--bg-input` | `#151515` | Input fields |
| `--border-color` | `rgba(204,238,0,0.15)` | Default borders |
| `--border-color-active` | `rgba(204,238,0,0.5)` | Active borders |
| `--primary-gold` | `#ccee00` | Primary accent (lime-gold) |
| `--primary-gold-hover` | `#dbfa00` | Button hover |
| `--text-primary` | `#ffffff` | Main text |
| `--text-secondary` | `#a3a3a3` | Secondary text |
| `--text-muted` | `#737373` | Muted text |
| `--color-act` | `#3b82f6` | Act nodes (blue) |
| `--color-scene` | `#8b5cf6` | Scene nodes (purple) |
| `--color-character` | `#f59e0b` | Character nodes (amber) |
| `--color-location` | `#10b981` | Location nodes (green) |
| `--color-object` | `#ef4444` | Object nodes (red) |
| `--color-theme` | `#ec4899` | Theme nodes (pink) |

## Typography

| Token | Family | Size | Weight | Usage |
|---|---|---|---|---|
| `body-md` | Outfit, sans-serif | 14px | 400 | Body text, descriptions |
| `heading-lg` | Outfit, sans-serif | 20px | 800 | Section titles |
| `heading-md` | Outfit, sans-serif | 16px | 700 | Card titles, panel headers |
| `heading-sm` | Outfit, sans-serif | 12px | 600 | Labels, button text |
| `label-xs` | Outfit, sans-serif | 10px | 600 | Status badges, tags |
| `script-body` | Courier Prime, monospace | 16px | 400 | Screenplay editor |

## Layout & Spacing

- **Base unit**: 16px
- **Card padding**: 20px (1.25rem)
- **Panel padding**: 16px (1rem)
- **Header height**: 60px
- **Grid gap**: 16px
- **Max content width**: 1200px (encyclopedia)
- **Screenplay paper**: 816px (8.5in at 96dpi)

## Elevation & Depth

- **Glass cards**: `backdrop-filter: blur(12-20px)`, `border: 1px solid var(--border-color)`
- **Card hover**: `translateY(-2px to -4px)`, `box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 24px rgba(204,238,0,0.1)`
- **Button glow**: `box-shadow: 0 4px 14px rgba(204,238,0,0.25)`
- **Modal shadow**: `box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 60px rgba(204,238,0,0.05)`
- **Gold glow**: `filter: drop-shadow(0 0 8px rgba(204,238,0,0.25))`

## Shapes

| Level | Value | Usage |
|---|---|---|
| `xs` | 4px | small decorative elements |
| `sm` | 6px | block menus, autocomplete |
| `md` | 8px | inputs, project cards |
| `lg` | 10px | buttons |
| `xl` | 12px | doc cards, sidebar cards |
| `xxl` | 16px | glass cards, modals |
| `full` | 9999px | category chips, status badges |

## Components

### Glass Card
Base pattern across all tabs:
- `background: var(--bg-card)` (semi-transparent dark)
- `backdrop-filter: blur(12-20px)`
- `border: 1px solid var(--border-color)`
- `border-radius: 16px`
- Hover: lift + glow + border highlight (`.glass-interactive`)

### Buttons
1. **Primary** — Lime-gold gradient (`#ccee00` -> `#b38542`), dark text, hover glow
2. **Secondary** — Ghost, `rgba(255,255,255,0.04)` bg, border, hover brightens
3. **Icon** — 40x40, icon-only, active state with gold bg/glow
4. **Action** — 32x32, for card actions, danger variant red
5. **Record** — 88px circle, red gradient (`#ef4444` -> `#dc2626`), pulse when recording

### Form Elements
- **Input**: `background: #151515`, `border: 1px solid rgba(255,255,255,0.12)`, gold focus glow
- **Textarea**: Same as input, `resize: vertical`, `line-height: 1.6`
- **Labels**: `13px`, `color: var(--text-secondary)`, `font-weight: 600`
- **Form modal**: 95vw x 85vh, two-column grid at desktop

### Navigation
- **Header**: 60px, `background: #111111`, gold bottom border
- **Tabs**: Icon + label, active state: gold text, gold bg, border glow
- **Project drawer**: Slide-down overlay, 500px max-width, glass effect

### Modals
- **Overlay**: rgba(0,0,0,0.85), backdrop-filter blur(4px)
- **Content**: bg-obsidian, border-color-active, xxl radius, slideUp animation
- **Recording modal**: 560px max-width
- **Form modal**: 95vw x 85vh, two-column at 1024px+

## Do's and Don'ts

- **Do** use `--primary-gold` (#ccee00) as THE primary accent — not `rgba(212,163,89,...)` which is a legacy color
- **Do** use glassmorphism (`backdrop-filter: blur()`) for cards and panels
- **Do** use the Courier Prime font family for all screenplay-related elements
- **Do** apply gold borders, glows, and drop-shadows on interactive elements
- **Don't** mix different gold tones — use only `#ccee00` and its rgba variants
- **Don't** use inline styles in JSX when CSS classes exist
- **Don't** embed `<style>` tags in JSX — keep all CSS in `.css` files
- **Don't** duplicate CSS class definitions across files
- **Don't** hardcode colors outside the design token system
- **Do** use CSS custom properties (var(--token-name)) consistently
- **Do** maintain the dark theme — never introduce light backgrounds outside the screenplay paper
- **Do** use the semantic color tokens for mind map node types (act=blue, scene=purple, etc.)
