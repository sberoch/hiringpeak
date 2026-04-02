# HiringPeak Brandbook

## Logo

**Wordmark:** `HiringPeak`

- Font: Plus Jakarta Sans (display weight)
- Size: 20-24px
- Text "HiringPeak" in ink color

---

## Color Palette

### Primary

| Name          | Hex       | Usage                  |
| ------------- | --------- | ---------------------- |
| Canvas        | `#fafbfc` | Primary background     |
| Surface       | `#ffffff` | Cards, containers      |
| Ink           | `#0a0f1c` | Headings, primary text |
| Ink Light     | `#1a2332` | Footer background      |
| Electric Blue | `#0066ff` | Primary accent, CTAs   |

### Secondary

| Name         | Hex       | Usage                  |
| ------------ | --------- | ---------------------- |
| Accent Light | `#3385ff` | Hover states           |
| Accent Dark  | `#0052cc` | Active/pressed states  |
| Teal         | `#0d9488` | Secondary accent       |
| Slate        | `#64748b` | Body text              |
| Muted        | `#94a3b8` | Captions, placeholders |

### Borders

| Name         | Hex       | Usage                  |
| ------------ | --------- | ---------------------- |
| Border       | `#e2e8f0` | Card borders, dividers |
| Border Light | `#f1f5f9` | Subtle separators      |

### Opacity Variants

Used for glows, overlays, and backgrounds: `accent/5`, `accent/10`, `accent/15`, `teal/5`, `teal/10`

---

## Typography

### Display / Headings

- **Font:** Plus Jakarta Sans
- **Weights:** 600, 700, 800
- **Styles:** Regular
- **Sizes:**
  - Hero: 60-84px (text-5xl to text-7xl)
  - Section titles: 36-60px (text-4xl to text-6xl)
  - Card titles: 20-30px (text-xl to text-2xl)
- **Line height:** 0.95-1.1 (tight)
- **Letter spacing:** tight (-0.025em)

### Body / UI

- **Font:** Plus Jakarta Sans
- **Weights:** 400, 500, 600
- **Sizes:**
  - Labels: 14px (text-sm)
  - Body: 16-18px (text-base to text-lg)
  - Lead: 20px (text-xl)
- **Line height:** relaxed (1.625)

### Labels & Tags

- Transform: uppercase
- Letter-spacing: wide (0.1em)
- Size: 14px
- Weight: 600 (semibold)
- Color: accent (Electric Blue)

---

## Spacing

| Element           | Value                    |
| ----------------- | ------------------------ |
| Section padding   | 128px (py-32)            |
| Content max-width | 1280px (max-w-7xl)       |
| Container padding | 24-32px (px-6 lg:px-8)   |
| Grid gaps         | 24-32px (gap-6 to gap-8) |
| Card padding      | 32-40px (p-8 to p-10)    |

---

## Components

### Primary Button (CTA)

```
Background: #0066ff (Electric Blue)
Text: #ffffff (white)
Padding: 16px 32px (py-4 px-8)
Border-radius: 12px (rounded-xl)
Font-weight: 600 (semibold)
Font-size: 16px (text-base)
Hover: #3385ff (accent-light)
Hover transform: translateY(-2px)
Hover shadow: 0 12px 32px -8px rgba(0, 102, 255, 0.4)
Transition: cubic-bezier(0.16, 1, 0.3, 1)
```

### Secondary Button

```
Background: #ffffff (surface)
Border: 2px solid #e2e8f0 (border)
Text: #0a0f1c (ink)
Padding: 16px 32px (py-4 px-8)
Border-radius: 12px (rounded-xl)
Hover border: #0066ff (accent)
Hover background: rgba(0, 102, 255, 0.05)
```

### Cards / Feature Cards

```
Border-radius: 16px (rounded-2xl)
Background: #ffffff (surface)
Border: 1px solid #e2e8f0 (border)
Padding: 32px (p-8)
Hover transform: translateY(-4px)
Hover border: rgba(0, 102, 255, 0.2)
Transition: cubic-bezier(0.16, 1, 0.3, 1)
```

### Product Frame (Browser Mockup)

```
Border-radius: 16px (rounded-xl)
Background: #ffffff (surface)
Border: 1px solid #e2e8f0 (border)
Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 24px 48px -12px rgba(0, 0, 0, 0.1)
Hover border: rgba(0, 102, 255, 0.3)
Hover shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.15)
```

### Form Inputs

```
Background: #fafbfc (canvas)
Border: 1px solid #e2e8f0 (border)
Border-radius: 12px (rounded-xl)
Padding: 14px 16px (py-3.5 px-4)
Text: #0a0f1c (ink)
Placeholder: #94a3b8 (muted)
Focus border: #0066ff (accent)
Focus shadow: 0 0 0 4px rgba(0, 102, 255, 0.1)
```

---

## Iconography

- Style: Stroke
- Stroke width: 1.5-2px
- Size: 20-28px (w-5 to w-7)
- Background: Accent with rounded-xl, 14x14 size
- Color accent: white on accent background
- Color neutral: slate `#64748b`
- Checkmarks: white on accent rounded-lg background

---

## Effects & Textures

### Noise Texture Overlay

```
Type: SVG noise filter (fractalNoise)
Base frequency: 0.8
Octaves: 4
Opacity: 2%
Position: absolute, full coverage
Pointer-events: none
```

### Floating Elements

```
Animation: float 8s ease-in-out infinite
Keyframes: translateY(0) → translateY(-20px) rotate(2deg) → translateY(0)
Delay variants: 0s, 2s offset
```

### Gradient Backgrounds

| Type        | Value                             |
| ----------- | --------------------------------- |
| Hero        | from-canvas via-surface to-canvas |
| Card inner  | from-border-light to-canvas       |
| Accent glow | bg-accent/5 rounded-full blur-3xl |

### Blur Orbs

```
Color: accent at 5% opacity
Blur: 48px (blur-3xl)
Sizes: 400-600px diameter
Animation: float 8s ease-in-out infinite
```

---

## Animation

### Easing

```
cubic-bezier(0.16, 1, 0.3, 1)
```

### Timing

| Animation        | Duration  | Delay             |
| ---------------- | --------- | ----------------- |
| Fade up          | 800ms     | 100-500ms stagger |
| Reveal on scroll | 900ms     | —                 |
| Hover states     | 300-400ms | —                 |
| Float            | 8s        | 0-2s offset       |

### Fade Up Animation

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Borders & Dividers

- Primary: `#e2e8f0` (border)
- Light: `#f1f5f9` (border-light)
- Thickness: 1-2px
- Hover accent: `rgba(0, 102, 255, 0.2)` or `rgba(0, 102, 255, 0.3)`

---

## Browser Mockup Dots

```
Colors:
  - Close: bg-red-400
  - Minimize: bg-amber-400
  - Maximize: bg-green-400
Size: 12px (w-3 h-3)
Gap: 6px (gap-1.5)
Bar background: bg-border-light/50
Bar padding: 12px 16px (py-3 px-4)
Bar border: border-b border-border/50
```

---

## Navigation

### Light Style (Default)

```
Background: rgba(255, 255, 255, 0.8)
Backdrop: blur-xl
Border: 1px solid rgba(226, 232, 240, 0.5)
Logo: accent background, white letter
Text: slate → ink on hover
CTA: accent background, white text
```

### Colored Style (Optional)

```
Background: accent (Electric Blue)
Border: 1px solid rgba(255, 255, 255, 0.1)
Logo: white/15 background, white letter
Text: white/80 → white on hover
CTA: white background, accent text
```

---

## Scrollbar

```
Width: 8px
Track: #fafbfc (canvas)
Thumb: #0066ff (accent)
Thumb radius: 4px
```

---

## Dark Sections (Stats, CTA)

```
Background: #0a0f1c (ink)
Overlay: accent/5
Accent lines: 1px bg-accent/30
Text primary: white
Text secondary: white/60 to white/80
Glow orbs: accent/5 and teal/5 with blur-3xl
```
