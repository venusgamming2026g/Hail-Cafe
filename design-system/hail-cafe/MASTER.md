# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Hail Cafe
**Generated:** 2026-07-26 22:02:06
**Category:** Bakery/Cafe
**Design Dials:** Variance 7/10 (Balanced / Modern) | Motion 2/10 (Subtle) | Density 6/10 (Standard)

---

## Global Rules

### Color Palette

Identity: **"رمل وطين" (Sand & Clay)** — warm, sunlit, earthen. No cool greys,
no blue-blacks, no metallic gold. See `PROJECT-BRIEF.md` for the full ramps.

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#c0462a` | `--clay-600` |
| On Primary | `#FFFFFF` | — |
| Brand terracotta | `#d1502f` | `--clay-500` |
| Secondary | `#6c7a49` | `--olive-600` |
| Accent/CTA | `#c0462a` | `--clay-600` |
| Warm band | `#c9a47c` | `--camel-500` |
| Background | `#faf3e7` | `--sand-50` |
| Raised surface | `#fffdf8` | `--sand-0` |
| Foreground | `#221d16` | `--ink-800` |
| Muted | `#6d6151` | `--muted` |
| Border | `#e4d9c5` | `--sand-300` |
| Success | `#3f7c4f` | `--success` |
| Warning | `#96650f` | `--warning` |
| Destructive | `#a32620` | `--danger` |
| Ring | `#c0462a` | `--focus` |

**Color Notes:** Warm sand ground + terracotta accent + sage olive counterpoint +
camel band. All pairings validated — body text ≥ 4.5:1, UI/focus ≥ 3:1.
`--clay-500` and `--olive-500` are large-text-only over white; step to `-600` for
body copy.

### Typography

- **Heading Font:** Alexandria (expressive Arabic display)
- **Body Font:** IBM Plex Sans Arabic (body and operations)
- **Mood:** arabic, geometric, warm, contemporary, RTL, readable
- **Loading:** self-hosted woff2 via `assets/css/fonts.css` (works offline), and
  `next/font/google` in `app/layout.tsx` for the Next.js surfaces.

**CSS variables:**
```css
--font-display: 'Alexandria', 'Plex Arabic', system-ui, sans-serif;
--font-body:    'Plex Arabic', 'Alexandria', system-ui, sans-serif;
```

### Spacing Variables

*Density: 6/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button — clay-600 carries white text at 5.06:1 */
.btn-primary {
  background: var(--clay-600);
  color: #fff;
  min-height: 44px;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 600;
  transition: background 200ms ease, transform 140ms ease;
  cursor: pointer;
}

.btn-primary:hover { background: var(--clay-700); }
.btn-primary:active { transform: scale(0.97); }

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--clay-700);
  border: 1.5px solid var(--clay-600);
  min-height: 44px;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 600;
  transition: background 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover { background: var(--clay-50); }
```

### Cards

```css
.card {
  background: var(--sand-0);
  border: 1px solid var(--sand-300);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease, transform 200ms ease;
}

.card-interactive { cursor: pointer; }
.card-interactive:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  min-height: 44px;
  padding: 12px 16px;
  background: var(--sand-0);
  border: 1px solid var(--sand-300);
  border-radius: var(--radius-sm);
  font-size: 16px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.input:focus {
  border-color: var(--clay-600);
  outline: none;
  box-shadow: 0 0 0 3px rgb(192 70 42 / 14%);
}
```

### Terrazzo ground

The signature texture. CSS-generated, never a raster asset.

```css
.terrazzo {
  background-color: var(--sand-50);
  background-image:
    radial-gradient(circle at 12% 22%, var(--clay-100) 0 5px, transparent 6px),
    radial-gradient(circle at 68% 14%, var(--olive-100) 0 4px, transparent 5px),
    radial-gradient(circle at 84% 62%, var(--camel-100) 0 6px, transparent 7px),
    radial-gradient(circle at 34% 78%, var(--clay-100) 0 4px, transparent 5px);
  background-size: 190px 190px;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Warm Earthen Hospitality (Sand & Clay)

**Keywords:** terracotta, sage olive, camel, warm sand, terrazzo, arabic geometric, RTL, tactile, matte, banded sections, rounded, sunlit, appetite-forward

**Best For:** Restaurant and cafe surfaces, menus and ordering flows, table service, and the operations screens that sit behind them.

**Key Effects:** Flat matte surfaces with warm hairlines; terrazzo speckle ground; double-diamond seam dividers; press scale 0.97; 200ms color transitions; short fade-and-lift on scroll entry (12px). Deliberately **excluded:** glassmorphism, backdrop blur, aurora blobs, metallic gradients, sheen sweeps, and any infinite decorative animation.

### Page Pattern

**Pattern Name:** Banded Hospitality Landing

- **Conversion Strategy:** Appetite first. Real photography, visible prices, and a booking form that is reachable without leaving the page.
- **CTA Placement:** Primary CTA in nav + in hero + the reservation band
- **Section Order:** 1. Hero (photography + booking CTA), 2. Featured dishes with prices, 3. Atmosphere band (camel), 4. Reservation panel (terrazzo ground + olive card), 5. Clay footer with hours and location

---

## Motion

**Scroll Reveal** (Subtle) — Trigger: scroll (viewport enter) | Duration: 300-400ms | Easing: `power1.out`

```js
gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
```

**Framework notes:** Requires the ScrollTrigger plugin registered once via gsap.registerPlugin(ScrollTrigger)

- ✅ Keep the y offset small (8-16px) so it reads as a fade, not a slide
- ❌ Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback
- ⚡ toggleActions 'play none none reverse' avoids re-triggering on every scroll direction change

---

## Anti-Patterns (Do NOT Use)

- ❌ Poor food photos
- ❌ Hidden hours
- ❌ **Cool greys and blue-blacks** — every neutral carries a warm bias
- ❌ **Metallic gold / copper gradients** — retired with the obsidian theme
- ❌ **Glassmorphism and backdrop blur** — surfaces are matte
- ❌ **`--clay-500` or `--olive-500` behind white body text** — step to `-600`
- ❌ **`--camel-500` as a border, icon, or text color on sand** — 2.10:1

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
