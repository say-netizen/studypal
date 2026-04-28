---
name: StudyPal
colors:
  primary: "#58CC02"
  secondary: "#1CB0F6"
  accent: "#FF6B6B"
  background: "#0F1B2D"
  surface: "#1E3150"
  text: "#FFFFFF"
  muted: "rgba(255,255,255,0.5)"
typography:
  heading:
    fontFamily: Space Grotesk
    fontWeight: 700
  body:
    fontFamily: Nunito
    fontWeight: 600
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
rounded:
  sm: 8px
  md: 16px
  lg: 100px
---

# StudyPal Design System

## Philosophy
"Duolingo meets Linear" — Fun but not childish.
Confident but not corporate.
Target: Japanese elementary to middle school students.

---

## NEVER do this (AI slop)
- NO Inter/Roboto/Arial fonts
- NO purple gradients on white
- NO generic card grids
- NO solid white backgrounds
- NO cookie-cutter SaaS layouts

---

## Color System

### Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#58CC02` | Correct answers, achievements, success states |
| `secondary` | `#1CB0F6` | AI features, CTAs, interactive elements |
| `accent` | `#FF6B6B` | Errors, hearts, alerts |
| `background` | `#0F1B2D` | Page background (deep navy) |
| `surface` | `#1E3150` | Cards, panels, elevated surfaces |
| `text` | `#FFFFFF` | Primary text on dark backgrounds |
| `muted` | `rgba(255,255,255,0.5)` | Secondary text, placeholders |

### Semantic Colors
```css
--color-xp-gold:    #FFD900;   /* XP, coins, stars */
--color-streak:     #FF9600;   /* Streak flame */
--color-heart:      #FF4B4B;   /* Lives */
--color-brand-purple: #9B5DE5; /* Levels, badges, premium */
--color-accent-teal:  #00C9A7; /* Supplemental accent */
```

### Color Rules
- **Green (#58CC02)** → ONLY for success/correct/achievement moments
- **Blue (#1CB0F6)** → Primary actions, AI features, interactive elements
- **Gold (#FFD900)** → XP and stars ONLY — do not overuse
- **Backgrounds** → Dark navy base; colorful accents only

---

## Typography

### Font Stack
```css
/* Headings — rounded, friendly, bold */
--font-display: 'Space Grotesk', 'Nunito', 'M PLUS Rounded 1c', sans-serif;

/* Body — highly readable, clean */
--font-body: 'Nunito', 'Noto Sans JP', system-ui, sans-serif;

/* Code / formulas */
--font-mono: 'JetBrains Mono', 'Noto Sans Mono', monospace;
```

### Type Scale
```css
--text-xs:   12px;   /* Labels, badges */
--text-sm:   14px;   /* Captions, supporting text */
--text-base: 16px;   /* Body text */
--text-lg:   18px;   /* Card headings */
--text-xl:   20px;   /* Section headings */
--text-2xl:  24px;   /* Page headings */
--text-3xl:  30px;   /* Hero headings */
--text-4xl:  36px;   /* Landing large headings */
--text-5xl:  48px;   /* LP main copy */
```

### Typography Rules
- **Headings** → `Space Grotesk`, weight `700`, line-height `1.2`
- **Body** → `Nunito`, weight `600`, line-height `1.6`
- **Minimum size** → `16px` for body, `18px` for learning content
- **Japanese** → `font-feature-settings: "palt" 1` for proportional kana

---

## Spacing

```css
--space-xs:  4px;
--space-sm:  8px;
--space-md:  16px;   /* base unit */
--space-lg:  32px;
--space-xl:  64px;

/* Extended scale */
--space-3:   12px;
--space-5:   20px;
--space-6:   24px;
--space-10:  40px;
--space-12:  48px;
--space-20:  80px;
--space-24:  96px;
```

---

## Border Radius

```css
--radius-sm:   8px;    /* Inputs, tags */
--radius-md:   16px;   /* Cards, panels */
--radius-lg:   100px;  /* Buttons, badges (pill) */
--radius-full: 50%;    /* Avatars, icons */
```

---

## Shadows & Elevation

```css
/* Dark-theme optimized shadows */
--shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
--shadow-md:  0 4px 12px rgba(0,0,0,0.5);
--shadow-lg:  0 10px 30px rgba(0,0,0,0.6);
--shadow-xl:  0 20px 50px rgba(0,0,0,0.7);

/* Brand glow shadows */
--shadow-green:  0 4px 20px rgba(88, 204, 2, 0.4);
--shadow-blue:   0 4px 20px rgba(28, 176, 246, 0.4);
--shadow-purple: 0 4px 20px rgba(155, 93, 229, 0.4);
--shadow-gold:   0 4px 20px rgba(255, 217, 0, 0.4);
```

---

## Motion

### Easing
```css
--ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-spring:   cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-out:      cubic-bezier(0, 0, 0.2, 1);
```

### Duration
```css
--duration-fast:      120ms;
--duration-normal:    200ms;
--duration-slow:      350ms;
--duration-xp:        600ms;
--duration-celebrate: 800ms;
```

### Motion Patterns
- **Page load**: staggered `fadeUp` — elements rise with `100ms` delay each
- **Scroll**: `IntersectionObserver` + `fadeUp` (`translateY(24px→0) + opacity(0→1)`)
- **Hover cards**: `translateY(-4px)` + `shadow-lg`, `200ms ease`
- **CTA button**: subtle `pulse` animation (`scale: 1 → 1.04 → 1`, `2s infinite`)
- **Correct answer**: `scale(1.05→1)` + green glow → XP float-up
- **Wrong answer**: `shake` (`translateX: -8px → 8px → -4px → 0`, `400ms`)
- **Level up**: confetti fullscreen overlay + badge `scale(0→1.2→1)` spring
- **Modal open**: `scale(0.95→1) + opacity(0→1)`, `200ms ease-out`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Components

### Buttons
```
Primary (pill style):
  background:    #1CB0F6
  border-radius: 100px
  padding:       12px 28px
  font:          Nunito, 700, 16px
  hover:         translateY(-2px) + shadow-blue
  active:        translateY(1px), no shadow

Success:
  background:    #58CC02
  → Correct/complete/next actions ONLY

Ghost:
  background:    transparent
  border:        2px solid rgba(255,255,255,0.2)
  → Cancel, skip, secondary actions
```

### Cards
```
Surface Card:
  background:    #1E3150
  border:        1px solid rgba(255,255,255,0.08)
  border-radius: 16px
  padding:       24px
  hover:         translateY(-4px) + shadow-lg

Achievement Card:
  background:    brand gradient
  border-radius: 16px
  shadow:        brand glow shadow
```

### Progress Bar (XP)
```
Track:   background #0F1B2D, height 12px, radius pill
Fill:    linear-gradient(90deg, #58CC02, #89E219)
         transition: width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Status Badges
```
In Progress: bg rgba(28,176,246,0.15), text #1CB0F6
Completed:   bg rgba(88,204,2,0.15),   text #58CC02
Locked:      bg rgba(255,255,255,0.08), text rgba(255,255,255,0.4)
New:         bg rgba(255,150,0,0.15),   text #FF9600
font:        Nunito, 600, 12px, uppercase, letter-spacing 0.05em
border-radius: 100px
```

---

## Layout

### Grid
```css
--grid-max-width: 1280px;
--grid-gutter:    24px;

/* Columns */
sm: 1  |  md: 2  |  lg: 3  |  xl: 4
```

### Bento Grid (LP Hero)
```
┌──────────────────────┬────────────┐
│  Main copy + CTA      │  App mock  │
│  (col-span-2)         │            │
├───────────┬───────────┤            │
│  Feature1 │  Feature2 │            │
└───────────┴───────────┴────────────┘
```

---

## Gamification UI

### XP System
- XP bar always visible in header
- `+N XP` float-up on correct: `color #FFD900, font Space Grotesk 800`
- Bar fill with bounce easing

### Streak
- Flame icon `#FF9600` with `pulse` animation when active
- Shake + warning color when at risk

### Level Badges
| Range | Theme | Color |
|-------|-------|-------|
| 1–10  | Bronze | `#CD7F32` |
| 11–20 | Silver | `#C0C0C0` |
| 21–30 | Gold | `#FFD700` |
| 31+   | Diamond | `#1CB0F6` |

---

## AI Features

### Chat UI
```
User bubble:  right-aligned, bg #1CB0F6, text white
AI bubble:    left-aligned,  bg #1E3150, text white
Typing:       3-dot bounce animation
```

### AI Badge
```
"✨ AI生成" chip
background: linear-gradient(135deg, #9B5DE5, #1CB0F6)
text: white, Nunito 600, 12px
border-radius: 100px
```

---

## Accessibility

- **Contrast**: WCAG AA minimum (4.5:1 text, 3:1 large text)
- **Focus ring**: `outline: 3px solid #1CB0F6`, `outline-offset: 2px`
- **Touch targets**: minimum `44×44px`
- **Font size**: body min `16px`, learning content min `18px`
- **Screen readers**: `aria-label` required on badges and progress elements

---

*Single source of design truth for StudyPal. Reference before any UI implementation.*
