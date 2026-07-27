# Hail Cafe project-specific direction

This file overrides generic recommendations in `MASTER.md` whenever they
conflict.

## Subject and job

Hail Cafe is a full-service restaurant and cafe inside Irbid City Center. The
customer surface must help a guest choose and send a real order in under two
minutes. The staff surfaces must make table, kitchen, service, and bill state
legible at a glance.

## Visual system

- Hail clay: `#E33B24` - the official wordmark color and the only loud accent.
- Storm ink: `#172026` - operational UI, headings, and high-contrast text.
- Mineral ice: `#DCEBE8` - cool counterpoint drawn from the menu's blue plates.
- Paper: `#F7F5EF` - a quiet neutral, not a sepia luxury treatment.
- Serving steel: `#A7B1B2` - dividers and secondary controls.
- Success: `#247A58`; warning: `#A85A18`; danger: `#B32929`.

Typography uses Alexandria for expressive Arabic display copy and IBM Plex Sans
Arabic for body and operations. This deliberately rejects the generic
cream-plus-serif restaurant look and stays closer to the geometric official
wordmark.

## Layout and signature

The memorable device is the **serving hatch**: a circular crop and low arch that
holds real menu photography, paired with a double-diamond seam derived from the
official Hail logo. It appears once in the hero and then becomes the progress
rail for order/service states. Customer cards stay bright and tactile; kitchen
and operations panels switch to storm ink for fast scanning.

Motion is limited to pressed states, drawers, and state changes. There are no
scroll-jacking effects, parallax, infinite decorative animation, or nested
scroll regions.

## UX constraints

- RTL first; English is an optional reading mode.
- All primary targets are at least 44px; fixed mobile controls respect safe
  areas.
- Order state is always conveyed by text and icon, never color alone.
- Customer drafts may be kept locally, but orders, sessions, service requests,
  prices, status history, and staff edits are authoritative in D1.
- Polling is used for near-live updates. Each new order is announced at most once
  per browser session and sound requires an explicit enable action.
