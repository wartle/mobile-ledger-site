# Enhanced landing page — drop-in files

Copy these over your `mobile-ledger-site` checkout. Nothing else in the repo changes.

## Files

| File | Action |
| --- | --- |
| `index.html` | **Replaces** the existing landing page |
| `motion-fx.js` | **New** — the motion layer (IntersectionObserver + CSS transitions, no build step) |
| `images/play/lago-play-01..07.png` | **New** — the Play Store exports from `design/export/`, moved to a web path |
| `images/icons/GetItOnGooglePlay_Badge_Web_color_English.svg` | **Replaces** — see note below |

`styles.css`, `support.html`, `privacy.html`, `terms.html` and `account-deletion.html` are untouched. The new
`index.html` no longer links `styles.css` (its styles are self-contained), so the other pages keep using it as-is.

## Google Play badge fix

The badge SVG relied on a `<style>` block inside `<defs>` to color the wordmark and logo. That block is stripped
by some pipelines (and by this project's asset import), leaving a plain black rectangle. The replacement carries the
same colors as inline `fill` attributes instead, so it renders identically everywhere.

## What changed on the page

Kept verbatim: all existing headings, subheads, feature copy, CTA copy and footer text.

Added:
- page-load stagger, the ledger line drawing itself in, and a floating "+$2,310" chip
- hero parallax across three phone screens
- a stats band with counters that count up on entry
- scroll-reveal on every section
- a sticky phone that swaps through six screens as you scroll, with tappable steps
- a horizontal drag gallery of the seven Play Store exports
- a privacy explainer, an FAQ accordion, and a final download CTA band
- a scroll-progress bar and a header that condenses on scroll
- magnetic hover on the store badges, buttons and feature cards

The reviews section is written but commented out in `index.html` — uncomment it when you have real reviews.

Everything above is disabled under `prefers-reduced-motion: reduce`.
