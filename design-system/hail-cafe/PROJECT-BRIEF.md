# Hail Cafe project-specific direction

This file overrides generic recommendations in `MASTER.md` whenever they
conflict.

## Subject and job

Hail Cafe is a full-service restaurant and cafe inside Irbid City Center. The
customer surface must help a guest choose and send a real order in under two
minutes. The staff surfaces must make table, kitchen, service, and bill state
legible at a glance.

## Visual system — "رمل وطين" (Sand & Clay)

The identity is warm, sunlit, and earthen. Every neutral carries a warm bias;
there are no cool greys, no blue-blacks, and no metallic gold anywhere in the
product. The system is built from four families plus a warm charcoal.

### Clay — الطين

Terracotta. The official wordmark color and the only loud accent.

| Token | Hex | Use |
|---|---|---|
| `--clay-50` | `#fdf0ea` | tint backgrounds, selected rows |
| `--clay-100` | `#fadbcf` | chip fills, subtle borders |
| `--clay-300` | `#ff8163` | accents **on dark only** |
| `--clay-500` | `#d1502f` | brand terracotta; wordmark, decorative surfaces, large display text |
| `--clay-600` | `#c0462a` | interactive surfaces carrying white text — primary CTA, footer |
| `--clay-700` | `#9d3722` | prices and links on light, hover/press |

`--clay-500` does **not** carry white body text (4.29:1). Use `--clay-600` for
any filled control or surface with white copy.

### Olive — الزيتوني

Sage green. The calm secondary surface: reservation panel, quiet states, and the
warm counterpoint that replaces the old mineral-ice blue.

| Token | Hex | Use |
|---|---|---|
| `--olive-50` | `#eef1e2` | tint backgrounds |
| `--olive-100` | `#dde3c8` | chip fills |
| `--olive-300` | `#a6b27e` | accents on dark; occupied-table fills |
| `--olive-500` | `#7c8a55` | brand olive, decorative surfaces |
| `--olive-600` | `#6c7a49` | reservation card and other white-text surfaces |
| `--olive-700` | `#55613a` | olive text on light |

### Camel — الجملي

Tan. The warm mid-band that carries the atmosphere section and photography
mattes.

| Token | Hex | Use |
|---|---|---|
| `--camel-50` | `#f6ecdc` | soft band |
| `--camel-100` | `#ecdcc4` | photo mattes |
| `--camel-500` | `#c9a47c` | full-bleed warm band (ink text on it) |
| `--camel-600` | `#a68766` | borders on sand |
| `--camel-700` | `#7a6247` | camel text on light |

Camel is a **surface** color. Never use `--camel-500` for borders, icons, or
text on sand — it only reaches 2.10:1. Step down to `--camel-600` or `-700`.

### Sand — الرمل

The warm neutral ground. Replaces the old near-neutral paper.

| Token | Hex | Use |
|---|---|---|
| `--sand-0` | `#fffdf8` | raised cards |
| `--sand-50` | `#faf3e7` | page background |
| `--sand-100` | `#f3e9d8` | chips, table headers |
| `--sand-200` | `#efe3ce` | inset wells |
| `--sand-300` | `#e4d9c5` | hairlines and borders |

### Ink — الحبر

Warm charcoal, roasted-coffee bias. Operational UI, headings, and any dark
surface. This replaces both the old storm blue-black and the HAIL OS obsidian.

| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#16120d` | deepest surface, ops shell |
| `--ink-800` | `#221d16` | primary text on light; standard dark surface |
| `--ink-700` | `#322b21` | raised dark panels |
| `--ink-600` | `#443b2d` | dark dividers and controls |
| `--ink-fg` | `#f6eee0` | primary text on ink |
| `--ink-fg-soft` | `#c9bba4` | secondary text on ink |
| `--ink-fg-mute` | `#9c8e78` | tertiary text on ink |
| `--muted` | `#6d6151` | secondary text on sand |

### State colors

| Role | On light | On ink |
|---|---|---|
| Success | `#3f7c4f` | `#6bab79` |
| Warning | `#96650f` | `#e0a83f` |
| Danger | `#a32620` | `#f0776c` |
| Ember (reserved tables) | `#d4a82b` — always with ink text | `#d4a82b` |

Ember is the reserved-table gold from the floor map. It is a **state** color, not
a brand accent — it never appears as decoration, and it never returns as the
metallic gradient the old obsidian theme used.

### Contrast contract

Every pairing above is validated. Body text meets 4.5:1, UI components and focus
rings meet 3:1. Two pairs are deliberately large-text-only and are annotated as
such. When adding a color, validate before shipping it.

## Typography

Unchanged: **Alexandria** for expressive Arabic display copy, **IBM Plex Sans
Arabic** for body and operations. The geometric Arabic display stays close to the
official wordmark and holds up against the warmer palette.

## Layout and signature

Two devices carry the identity:

1. **Terrazzo.** A speckled sand ground — clay, olive, and camel chips scattered
   on `--sand-50`. It appears behind the reservation band and as the empty-state
   ground in ops. It is generated in CSS, never as a raster asset, and it stays
   under 6% opacity contribution so text on top keeps its measured contrast.

2. **The double-diamond seam.** Taken from the two diamonds inside the official
   wordmark. It is the section divider on the customer site and the progress rail
   for order and service states.

The page reads as warm bands stacked in sequence: sand ground → camel atmosphere
band → terrazzo + olive reservation panel → full-bleed clay footer. Customer
cards stay bright and tactile on `--sand-0`; kitchen and operations panels switch
to ink for fast scanning under glare.

Motion is limited to pressed states, drawers, and state changes. There are no
scroll-jacking effects, parallax, aurora blobs, sheen sweeps, infinite decorative
animation, or nested scroll regions.

## UX constraints

- RTL first; English is an optional reading mode.
- All primary targets are at least 44px; fixed mobile controls respect safe
  areas.
- Order state is always conveyed by text and icon, never color alone.
- Customer drafts may be kept locally, but orders, sessions, service requests,
  prices, status history, and staff edits are authoritative in D1.
- Polling is used for near-live updates. Each new order is announced at most once
  per browser session and sound requires an explicit enable action.
