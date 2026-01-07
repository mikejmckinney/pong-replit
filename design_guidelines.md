# Retro Arcade Pong - Design Guidelines

## Design Approach
**Reference-Based: Retro Arcade Aesthetic**
Drawing inspiration from classic 1980s arcade cabinets and modern synthwave games like Neon Drive, Tron, and retro-inspired interfaces. The design emphasizes nostalgia with contemporary polish.

## Typography System

**Primary Font**: "Press Start 2P" or similar pixel/bitmap font via Google Fonts
**Fallback**: Monospace system fonts

**Hierarchy**:
- Game Title/Logo: 3rem (mobile), 4rem (tablet), 6rem (desktop)
- Menu Headers: 1.5rem (mobile), 2rem (desktop)
- Menu Items: 1rem (mobile), 1.25rem (desktop)
- HUD Score: 2.5rem (mobile), 3.5rem (desktop)
- Body/Instructions: 0.875rem (mobile), 1rem (desktop)
- Small Labels: 0.75rem

**Letter Spacing**: Increase by 0.05em for all text to enhance pixel font readability

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Button padding: px-8 py-4
- Menu item spacing: gap-4
- Section padding: p-6 (mobile), p-12 (desktop)
- HUD margins: m-4

**Game Canvas**:
- Full viewport height on mobile (with safe area adjustments)
- Max 800px width, centered on desktop
- Maintains 16:9 or 4:3 aspect ratio with letterboxing

**Menu Layouts**:
- Single column, centered vertically and horizontally
- Max-width: 90vw (mobile), 500px (desktop)
- Stack all menu items with consistent gap-6

## Component Library

### Main Menu Screen
- Centered logo with glow effect
- Vertical button stack (Play, Multiplayer, Settings, Leaderboard)
- Small credit text at bottom
- Scanline overlay covering entire viewport

### Game HUD (In-Game Overlay)
- Top corners: Player scores in large pixel font
- Top center: Game mode indicator, timer (if applicable)
- Bottom corners: Power-up indicators
- Pause button: Top-right, icon-only, 48px touch target

### Button Styles
- Rectangular with thick border (4px)
- Uppercase text, letter-spacing: 0.1em
- Minimum touch target: 48px height
- Width: Full width on mobile (max 400px), auto-fit on desktop
- Hover: Subtle glow intensification, no background change
- Active: Scale down slightly (transform: scale(0.98))

### Modal Overlays
- Semi-transparent backdrop (backdrop-blur-sm)
- Centered card with border
- Title at top, content in middle, actions at bottom
- Close button: Top-right corner, 40px × 40px

### Leaderboard Table
- Alternating row treatment for readability
- Columns: Rank, Name, Score, Mode, Date
- Highlight current player's row
- Scrollable container with max-height
- Sticky header row

### Game Room / Multiplayer Lobby
- Room code displayed prominently in monospace
- "Waiting for opponent..." status message
- Copy room code button
- Player list with ready indicators
- Start game button (host only)

### Settings Panel
- Toggle switches for sound, music, effects
- Slider for volume control (custom styled)
- Control scheme selector (radio buttons)
- Difficulty dropdown

### Power-Up Icons
- 64px × 64px icon containers
- Active power-ups: Pulsing glow effect
- Duration bar beneath icon
- Position: Bottom corners of game canvas

## Screen-Specific Layouts

### Title Screen
Full viewport layout with:
- Logo: Top third, centered
- Menu buttons: Middle third, stacked vertically with gap-6
- Footer info: Bottom, small text

### Game Screen
- Canvas: Full available space
- HUD overlays: Positioned absolutely over canvas
- Touch zones: Invisible, full-height on left/right 40% of screen

### Pause Menu
- Overlay centered on game screen
- Blurred game background visible behind
- Vertical menu: Resume, Restart, Settings, Quit
- Compact spacing (gap-3) to keep menu tight

### Game Over Screen
- Winner announcement: Large text, centered
- Final scores displayed prominently
- Replay button primary position
- Secondary actions: Main Menu, View Leaderboard

## Visual Effects (Minimal, Performance-First)

**Scanline Overlay**: Subtle repeating horizontal lines, opacity 0.1, CSS-only
**Glow Effects**: Box-shadow with blur, applied to text and borders selectively
**CRT Curvature**: Optional, CSS filter on game canvas only if performance allows
**Particle Effects**: Ball trail (5-7 particles maximum), power-up pickup sparkles

## Touch Controls

**Paddle Drag Areas**:
- Height: Full canvas height
- Width: 40% of canvas width from each edge
- Visual indicator: Subtle border on first touch
- Haptic feedback on paddle collision (if supported)

**Button Zones** (Alternative Control):
- Upper/Lower screen split (50/50)
- Tap detection: 200ms debounce
- Visual feedback: Brief highlight on tap zone

## Responsive Breakpoints

- Mobile: < 768px (portrait and landscape)
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Portrait**: Stack all UI, minimize HUD text size
**Mobile Landscape**: Game canvas maximized, HUD compressed
**Desktop**: Centered game with margin, larger menu elements

## Audio UI

- Mute toggle: Icon button in top-left corner
- Volume slider in settings only
- Visual indicator when sound is muted (icon state)

## Images

No hero images required. This is a game interface focused on the playfield and menus. All visual appeal comes from:
- Glow effects and synthwave styling
- Animated game elements (ball, paddles, power-ups)
- CSS-based retro effects (scanlines, CRT curvature)

Optional: Small 80s-style arcade cabinet icon for logo/branding (128px × 128px)