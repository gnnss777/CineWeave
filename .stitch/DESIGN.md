# CineWeave Design System

## Project Overview
CineWeave is a screenwriting platform that transforms voice recordings, documents, and mind maps into Hollywood-standard screenplays. It features 4 main tabs: Brainstorm (dashboard), Mind Map, Screenplay Editor, and Encyclopedia (character/location/object catalog).

## Tech Stack
- React 19 + Vite 8
- CSS Custom Properties (no Tailwind, no CSS-in-JS)
- Lucide React icons
- `@fontsource/outfit` (UI), `@fontsource/courier-prime` (script)

## Design Tokens

### Colors
| Token | Value | Usage |
|---|---|---|
| `--bg-darkest` | `#050505` | Main page background |
| `--bg-obsidian` | `#0a0a0a` | Drawers, modals |
| `--bg-card` | `rgba(20,20,20,0.75)` | Card backgrounds |
| `--bg-card-hover` | `rgba(30,30,30,0.9)` | Card hover state |
| `--bg-input` | `#151515` | Input fields |
| `--border-color` | `rgba(204,238,0,0.15)` | Default borders |
| `--border-color-active` | `rgba(204,238,0,0.5)` | Active/focused borders |
| `--primary-gold` | `#ccee00` | Primary accent (lime/yellow) |
| `--primary-gold-hover` | `#dbfa00` | Button hover |
| `--glow-gold` | `rgba(204,238,0,0.25)` | Subtle gold glow |
| `--glow-gold-intense` | `rgba(204,238,0,0.6)` | Strong gold glow |
| `--text-primary` | `#ffffff` | Main text |
| `--text-secondary` | `#a3a3a3` | Secondary text |
| `--text-muted` | `#737373` | Muted text |
| `--color-act` | `#3b82f6` | Act nodes (blue) |
| `--color-scene` | `#8b5cf6` | Scene nodes (purple) |
| `--color-character` | `#f59e0b` | Character nodes (amber) |
| `--color-location` | `#10b981` | Location nodes (green) |
| `--color-object` | `#ef4444` | Object nodes (red) |

### Typography
- **UI**: `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — weights 300-800
- **Script (screenplay)**: `'Courier Prime', Courier, monospace` — weights 400, 700
- **Base UI size**: 14-16px
- **Screenplay size**: 16px (12pt)

### Spacing
- **Card padding**: 1.25rem (20px)
- **Panel padding**: 1rem (16px)
- **Header height**: 60px
- **Gap grid**: 16px
- **Border radius**: 8-16px (cards), 10px (buttons), 20px (modals), 50% (avatars)

### Shadows & Effects
- **Glassmorphism**: `background: rgba(20,20,20,0.75); backdrop-filter: blur(12-20px); border: 1px solid rgba(204,238,0,0.15)`
- **Card hover**: `translateY(-2px to -4px); box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 24px rgba(204,238,0,0.1)`
- **Button glow**: `box-shadow: 0 4px 14px rgba(204,238,0,0.25)`
- **Gold glow**: `filter: drop-shadow(0 0 8px rgba(204,238,0,0.25))`
- **Modal shadow**: `box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 60px rgba(204,238,0,0.05)`

## Component Library

### Glass Card
Base card pattern used across all tabs:
- `background: var(--bg-card)` (semi-transparent dark)
- `backdrop-filter: blur(12-20px)`
- `border: 1px solid var(--border-color)`
- `border-radius: 12-16px`
- `.glass-interactive` adds hover: lift + glow + border highlight

### Buttons
1. **`.btn-primary`** — Gold gradient `linear-gradient(135deg, #ccee00, #b38542)`, dark text, hover glow
2. **`.btn-secondary`** — Ghost style, `rgba(255,255,255,0.04)` bg, border, hover brightens
3. **`.btn-icon`** — 40x40 square, icon-only, `.active` state with gold bg/glow
4. **`.action-btn`** — 32x32, for card actions, `.danger` variant red on hover
5. **Record button** — 88px circle, `linear-gradient(135deg, #ef4444, #dc2626)`, pulse animation when recording

### Form Elements
- **Input**: `background: #151515`, `border: 1px solid rgba(255,255,255,0.12)`, focus: gold border + 3px glow
- **Select**: Same as input
- **Textarea**: Same as input, `resize: vertical`, `line-height: 1.6`
- **Label**: `13px`, `color: var(--text-secondary)`, `font-weight: 600`
- **Form modal**: 95vw x 85vh, two-column grid at desktop, single column at mobile

### Navigation
- **Header bar**: `height: 60px`, `background: #111111`, `border-bottom: 2px solid rgba(204,238,0,0.4)`
- **Tabs**: Icon + label, `.active` state: gold text, gold bg, border glow
- **Project drawer**: Slide-down overlay, 500px max-width, glass effect

### Status Badges
- **pending**: muted gray
- **parsing/processing**: gold with spinner
- **parsed**: blue
- **processed**: green
- **error**: red

## Screen Layouts

### 1. Brainstorm Tab (4-panel dashboard)
- **Header**: Title + search bar + action buttons (grid/list toggle, process AI, record, import)
- **Category filter bar**: Chip-style buttons with color coding and counts
- **4-panel CSS Grid**: `grid-template-columns: 420px 1fr; grid-template-rows: 1fr 1fr`
  - Panel 1 (top-left): Voice recorder with circular button, timer, live transcript
  - Panel 2 (top-right): Imported documents with drag-drop zone, grid/list cards
  - Panel 3 (bottom-left): Manual notes textarea with word count, auto-save
  - Panel 4 (bottom-right): Extracted items with grid/list view, category filtering, search
- **Recording modal**: Full overlay, centered card with recorder + transcript + audio player
- **Document cards**: Grid (minmax 320px) or list view, status badges, expandable content
- **Item cards**: Color bar top border by category, title, description (clamped), tags, action buttons

### 2. Mind Map Tab (SVG Canvas)
- **Full-screen canvas**: Infinite scroll/zoom, SVG grid background
- **Nodes**: Circles colored by type (act=blue, scene=purple, character=amber, location=green, object=red)
- **Controls**: Floating bottom-left (zoom, center, reload, auto-arrange, history)
- **Sidebar**: Right panel with tabs for characters/locations/objects/acts
- **Links**: Curved paths with arrow markers, draggable connections
- **Ficha modal**: Edit form for any node type

### 3. Screenplay Tab (Hollywood Editor)
- **Toolbar**: Sticky top with compile, page/word count, theme toggle, file menu, zen mode
- **Paper workspace**: White or dark paper, Hollywood-standard margins
- **Script elements**: 6 types (scene-heading, action, character, parenthetical, dialogue, transition) — each with colored left border and format badge
- **ContentEditable blocks**: Inline autocomplete for characters/locations, block grip for contextual menu
- **Contextual menu**: Change type, AI continue/improve, duplicate, delete
- **Reference sidebar**: Scenes outline, characters, locations, objects, shortcuts
- **Zen mode**: Full-screen, hides chrome, toolbar auto-hides

### 4. Encyclopedia Tab (Card Catalog)
- **Tab bar**: Personagens / Locacoes / Objetos with active underline
- **Card grid**: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- **Character cards**: Avatar circle (first letter), name, role badge, description, traits
- **Location cards**: Name, type badge (INT./EXT.), description, time of day + mood
- **Object cards**: Name, significance, appearance description
- **Ficha form modal**: Two-column grid, contextual fields per type

## Responsive Breakpoints
- **Desktop (>1024px)**: Full layout with sidebars, multi-column grids
- **Tablet (768-1024px)**: Adjusted grids, simpler header
- **Mobile (<768px)**: Single column, compact header, hidden search, bottom-sheet modals, hidden icons in nav

## Animations
- `pulseGlow`: Gold shadow pulse (2s)
- `slideUp`: Modal entrance (0.3s cubic-bezier)
- `fadeIn`: Overlay entrance (0.2s)
- `expandIn`: Card expansion (0.2s)
- `recordPulse`: Recording button ripple (1.5s)
- `pulseDot`: Status indicator pulse (1s)
- `wave`: Audio visualization bars
- `spin`: Loading spinner (1s linear)
- `slideDown`: Banner entrance (0.3s)

## Common Patterns
- **Empty states**: Centered column with icon, title, description, action buttons
- **Dividers**: `rgba(255,255,255,0.04)` or `rgba(255,255,255,0.06)`
- **Scrollbar**: Custom thin (6px), dark track, gold thumb
- **Hover transitions**: `all 0.2s ease` or `0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- **Color bars**: 3px top border on cards, colored by category/status
