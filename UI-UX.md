# Matchmaker Dashboard — UI/UX Design System

Design system for the TDC matchmaker dashboard. It borrows proven patterns from Indian matrimony platforms (Shaadi.com in particular) and adapts them for an **internal tool used by matchmakers**, not a consumer app.

---

## 1. Who we are designing for

The user is a **matchmaker**, not a person looking for a partner. They:

- Manage 20–60 clients at once and switch between them all day.
- Need to scan biodata fast, compare candidates, and act (send, note, update status).
- Talk to clients on calls and need to jot notes mid-conversation.
- Still care deeply about the people behind the profiles. The UI should feel warm and respectful, never like a CRM for "leads".

**Design principles**

1. **Warm, not sugary.** Romantic accents for moments that matter (a high-potential match, a sent match). Calm neutrals everywhere else.
2. **Trust is visible.** Verification, data completeness and AI reasoning are always shown, never hidden.
3. **Scan first, detail on demand.** Lists show the 5 facts that matter; everything else is one click away.
4. **Explain every suggestion.** No score without a reason.
5. **Fast hands.** Common actions in one click, keyboard-friendly, no dead ends.

---

## 2. What we borrow from Shaadi.com, and what we change

| Shaadi pattern | Keep? | Adaptation for our tool |
|---|---|---|
| Card-based profiles on a light grey canvas | Keep | Profile and match cards on a warm off-white canvas |
| Verified badge in a cyan accent | Keep | Slate-blue verified badge with tooltip ("ID and phone verified") |
| Match percentage on cards | Keep | Score ring + AI tier badge + reasons |
| Pink/red primary CTA | Change | Deep emerald primary for "Send Match"; no pink anywhere |
| Deep navy for headers and text | Adapt | Ink navy for sidebar and headings |
| "Tap over type" tile selection | Keep | Tile selectors for preferences (religion, diet, relocation) |
| Progressive disclosure | Keep | Tabs on the client page; collapsible biodata sections |
| Connect / Decline consumer buttons | Change | Matchmaker actions: Send Match, Skip, Save for later |
| Online status dots | Drop | Not relevant; show "last contacted" instead |
| Premium promo banners (right column) | Drop | Right column becomes the match suggestions panel |
| Bottom sticky nav on mobile | Keep | Mobile bottom nav: Clients, Analytics, Settings |

**Rule:** Don't copy Shaadi's colours or logo-like elements. A reviewer at a matchmaking company will recognise a cloned competitor palette immediately, and rose-pink is the default for the whole category. We keep the *emotional pairing* (trustworthy deep blue + warm celebratory accent) but express it as **emerald and gold on ivory**, the colours of a traditional Indian wedding invitation. Premium and warm, never cute.

**Visual references:** Attio (CRM layout, tables, record pages), Linear (calm density, status tags, keyboard flow), Hinge (editorial restraint, photos carry the emotion), The League (premium matchmaking tone).

---

## 3. Colour tokens

**Emerald, gold and ink on ivory.** Emerald is the single action colour, gold is reserved for celebration (High Potential, Matched), ink navy anchors the chrome, and the ivory canvas keeps everything warm. Pink is not used anywhere.

Usage ratio to aim for: ~80% neutrals (ivory, white, ink text), ~15% emerald, ~5% gold. Gold loses its meaning if it's everywhere.

### 3.1 Light mode

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#1F5C4A` | Deep emerald. Primary CTA ("Send Match"), active nav, links, selected states |
| `--primary-hover` | `#174838` | Hover/pressed |
| `--primary-soft` | `#E6F0EC` | Emerald tinted backgrounds (selected tile, sent match) |
| `--primary-fg` | `#FFFFFF` | Text and icons **on** `--primary` (8.6:1). Never hardcode `#fff` — see the rule below |
| `--ink` | `#0F1B2D` | Midnight navy. Sidebar background, headings |
| `--accent` | `#B8912F` | Antique gold **fill only** — stars, score ring, icons, borders. Passes 3:1 for non-text. Never use as text |
| `--accent-text` | `#6E5313` | Dark gold for *text* on `--accent-soft` or white (7.2:1). Use for "High Potential" labels |
| `--accent-soft` | `#F7F0DC` | Gold tinted backgrounds |
| `--verified` | `#2F6690` | Slate blue. Verified badge, focus rings, toggles |
| `--verified-soft` | `#E6EEF5` | Slate tinted backgrounds |
| `--bg` | `#F6F3EE` | App canvas (warm ivory, not cold grey) |
| `--surface` | `#FFFFFF` | Cards, panels, dialogs |
| `--surface-muted` | `#FAF8F4` | Table zebra rows, inset sections |
| `--border` | `#E5DFD5` | Hairline borders |
| `--text` | `#14171F` | Primary text |
| `--text-muted` | `#5F6470` | Labels, secondary text (6.4:1) |
| `--text-subtle` | `#6E7480` | Timestamps, "Not specified", placeholders (4.9:1). Darkened from `#9095A0`, which failed at 3.1:1 |
| `--success` | `#2E7D4F` | Accepted, saved (5.0:1) |
| `--warning` | `#B7791F` | Amber **fill only** — warning icons, dots, bars. Never use as text |
| `--warning-text` | `#8A5A14` | Amber for *text* — the match-concern line, "needs attention" copy (5.1:1) |
| `--danger` | `#B5523B` | Declined, destructive actions, errors (terracotta, not alarm red) (5.0:1) |

### 3.2 Dark mode

| Token | Hex |
|---|---|
| `--primary` | `#5FB79A` |
| `--primary-hover` | `#7CC8AE` |
| `--primary-soft` | `#16302A` |
| `--primary-fg` | `#0A1220` |
| `--ink` | `#0A1220` |
| `--accent` | `#D9B65A` |
| `--accent-text` | `#E8CC7E` |
| `--accent-soft` | `#33291A` |
| `--verified` | `#6FA3CC` |
| `--verified-soft` | `#172636` |
| `--bg` | `#101318` |
| `--surface` | `#171B22` |
| `--surface-muted` | `#1D222A` |
| `--border` | `#2A303A` |
| `--text` | `#EEF0F3` |
| `--text-muted` | `#A7ADB8` |
| `--text-subtle` | `#8B919C` |
| `--success` | `#5DB37E` |
| `--warning` | `#E0A54A` |
| `--warning-text` | `#E8B968` |
| `--danger` | `#E07A62` |

### 3.3 Semantic mappings

**Pipeline status tags** (soft background + dark text of same hue):

| Status | Background | Text |
|---|---|---|
| New | `#EEF0F4` | `#0F1B2D` |
| Verified | `--verified-soft` | `#1F4A6B` |
| Shortlisting | `#EEEBF6` | `#4A3D7A` |
| Match Sent | `--primary-soft` | `#154236` |
| Meeting Scheduled | `#FBEEE6` | `#8A4B1F` |
| On Hold | `#F1EEE8` | `#5F6470` |
| Matched | `--accent-soft` | `#6E5313` |
| Closed | `#F0F0F0` | `#555B66` |

**AI match tiers:**

| Tier | Style |
|---|---|
| High Potential | `--accent-soft` fill, `--accent-text` label, star icon in `--accent`, gold score ring |
| Good | Emerald soft fill, dark emerald text, thumbs-up icon, emerald score ring |
| Worth Exploring | Neutral soft fill, muted text, compass icon, slate score ring |
| Low | Not shown by default (filtered out, toggle to reveal) |

**Rule:** Colour never carries meaning alone. Every status/tier has a text label, and tiers also have an icon.

**Rule: pair every fill with its foreground.** Dark mode inverts `--primary` from deep emerald to light mint, so a button that hardcodes white text drops to **2.2:1** there — invisible in practice. `--primary-fg` flips with it (white on emerald, ink on mint) and is the only correct foreground for anything sitting on `--primary`. The same logic applies to any future solid fill: ship the pairing, not a literal colour.

**Rule: fill vs text.** `--accent` and `--warning` are tuned for *fills* — they clear the 3:1 bar for icons, rings, bars and borders, but land near 3:1 as text, which fails WCAG AA. Every place they would be rendered as a glyph, use `--accent-text` / `--warning-text` instead. The pairs are deliberately the same hue family, so the design reads as one colour even though two values ship.

**Contrast baseline.** Every token above states its measured ratio against `--surface` (`#FFFFFF`). Text tokens clear 4.5:1; fill-only tokens clear 3:1. Re-verify after any palette change — do not treat the ratios as decorative.

---

## 4. Typography

| Role | Font | Why |
|---|---|---|
| UI text | **Plus Jakarta Sans** (Google Fonts) | Friendly, highly legible at small sizes, modern |
| Display names and page titles | **Fraunces** (Google Fonts), 500 weight | A soft serif adds warmth to people's names; used sparingly |
| Numbers (scores, income, tables) | Plus Jakarta Sans with `font-variant-numeric: tabular-nums` | Aligned columns |

Load via `next/font/google` (self-hosted, no layout shift).

**Type scale**

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 28 / 36 | Fraunces 500 | Client name on detail page |
| `h1` | 24 / 32 | 600 | Page titles ("Your clients") |
| `h2` | 18 / 26 | 600 | Section titles, card names |
| `h3` | 16 / 24 | 600 | Sub-sections ("Education & career") |
| `body` | 14 / 22 | 400 | Default text, biodata values |
| `label` | 13 / 20 | 500 | Field labels, table headers |
| `caption` | 12 / 18 | 400 | Timestamps, helper text |

Biodata labels use `label` in `--text-muted`; values use `body` in `--text`.

---

## 5. Spacing, shape, elevation, motion

**Spacing:** 4px base. Use 4, 8, 12, 16, 20, 24, 32, 40, 48. Card padding 20 (desktop) / 16 (mobile). Section gap 24.

**Radius**

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Inputs, small badges |
| `--radius-md` | 10px | Buttons, tiles |
| `--radius-lg` | 16px | Cards, dialogs |
| `--radius-full` | 999px | Pills, avatars, primary CTA |

**Elevation:** Cards sit on the canvas with a 1px border and a very soft shadow: `0 1px 2px rgba(30, 42, 74, 0.06)`. On hover, `0 4px 16px rgba(30, 42, 74, 0.08)`. Dialogs: `0 12px 40px rgba(30, 42, 74, 0.18)`. No heavy shadows.

**Motion**

- Duration: 150 ms (hover/focus), 200 ms (dialogs, tabs), 400 ms (score ring fill).
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Match sent: a brief heart pulse on the button and a toast. One moment of delight, not confetti.
- Wrap all non-essential animation in `@media (prefers-reduced-motion: no-preference)`.

**Focus state** (matches the slate-blue verified accent):

```css
:where(input, select, textarea, button, a, [tabindex]):focus-visible {
  outline: none;
  border-color: var(--verified);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--verified) 25%, transparent);
}
```

---

## 6. Layout and breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Single column, bottom nav, list as cards, detail tabs as a horizontal scroll strip, dialogs become full-screen sheets |
| Tablet | 768–1279px | Collapsed icon sidebar, two-column match grid, detail page stacks profile header above tabs |
| Desktop | ≥ 1280px | Full sidebar (240px), list as table, detail page in three zones (below) |

**App shell (desktop)**

```
┌──────────┬──────────────────────────────────────────────┐
│          │ Topbar: search clients · matchmaker avatar   │
│ Sidebar  ├──────────────────────────────────────────────┤
│ (ink)    │                                              │
│ Clients  │              Page content                    │
│ Analytics│              max-width 1320px                │
│ Settings │                                              │
└──────────┴──────────────────────────────────────────────┘
```

**Client detail page (desktop)**

```
┌───────────────┬─────────────────────────────┬──────────────────┐
│ Profile panel │ Tabs: Biodata · Matches ·   │ Quick actions    │
│ (sticky)      │       Notes · Activity      │ (sticky)         │
│               │                             │                  │
│ Photo 4:5     │ Tab content                 │ Status select    │
│ Name, age     │                             │ Add note         │
│ City, job     │                             │ Last contacted   │
│ Status tag    │                             │ Top 3 matches    │
│ Verified      │                             │ preview          │
│ Key prefs     │                             │                  │
└───────────────┴─────────────────────────────┴──────────────────┘
   280px              flexible                     300px
```

The right column replaces Shaadi's promo banners with something useful.

---

## 7. Screens

### 7.1 Login

- Split layout on desktop: left half is a full-bleed warm photograph (a couple's hands, marigold garland, or soft wedding detail; no faces needed) with a short line of copy; right half is the form.
- On mobile: image becomes a short header strip.
- Form: email, password (with show/hide), "Sign in" primary button, inline error under the form ("Email or password is incorrect"). No "forgot password" link that goes nowhere; omit it or show "Contact your admin".
- Demo credentials shown in a subtle info box (helpful for reviewers).

### 7.2 Client list

**Header:** "Your clients" + count, search box (name, city), "Filters" button.

**Status chips row:** All · New · Verified · Shortlisting · Match Sent · Meeting Scheduled · On Hold · Matched. Each with a count. Click to filter.

**Filters panel:** gender, age range slider, city multi-select, marital status, "needs attention" toggle (no contact in 14+ days).

**Desktop table columns:** Avatar + Name (with verified badge) · Age · City · Marital status · Status tag · Last contacted · Matches sent · chevron.

- Row click opens the client.
- Zebra rows with `--surface-muted`, sticky header, 56px row height.
- "Needs attention" rows show a small warning dot next to last contacted.

**Mobile:** each client is a card: avatar left, name/age/city, status tag, last contacted caption.

### 7.3 Client detail — Biodata tab

Collapsible sections in this order (most decision-relevant first):

1. **Basics:** gender, DOB + age, height (ft/in with cm in caption), marital status, profile created by
2. **Location:** city, state, country, open to relocate
3. **Education & career:** college, degree, highest education, company, designation, annual income (₹ lakhs)
4. **Family:** family type, family values, father's and mother's occupation, brothers, sisters
5. **Religion & community:** religion, caste, sub-caste, gotra, mother tongue, manglik, languages known
6. **Lifestyle:** diet, smoking, drinking, open to pets
7. **Intentions:** want kids, open to relocate
8. **Partner preferences:** shown as tile chips, with an "Edit preferences" button
9. **Contact:** email and phone with copy buttons, masked until "Reveal" is clicked (a nice privacy touch)

Each section is a two-column grid of label/value pairs on desktop, one column on mobile. Empty values show "Not specified" in `--text-subtle`, never a blank.

### 7.4 Client detail — Matches tab

**Header:** "Suggested matches" + "Refresh" button + tier filter (High Potential / Good / Worth Exploring) + sort (score, age, newest).

**Match card** (grid: 3 columns desktop, 2 tablet, 1 mobile):

```
┌────────────────────────────────┐
│ ┌──────────┐                   │
│ │  Photo   │  ★ High Potential │
│ │   4:5    │                   │
│ └──────────┘        (  86  )   │  ← score ring
│ Ananya, 27  ✓                  │
│ 5'4" · Product Manager · Pune  │
│ M.B.A · Marathi · Vegetarian   │
│                                │
│ Why this match                 │
│ • Both want children           │
│ • Shared moderate family values│
│                                │
│ ⚠ She prefers to stay in Pune  │
│                                │
│ [Skip] [Save] [ ♥ Send Match ] │
└────────────────────────────────┘
```

- Score ring: 48px, stroke in tier colour, number in the centre, animates on mount.
- "Why this match": AI reasons. "Concern" line in `--warning-text` with an icon tinted `--warning`, so it reads as honest rather than alarming.
- "See score breakdown" link expands the rule factors as small horizontal bars (age, height, values…). This is where the explainability shines for reviewers.
- **Skip** is terminal — the candidate never reappears for this client. Confirm nothing, but show an undo toast ("Skipped Ananya · Undo") for 8 seconds, since the action is irreversible after that.
- **Save for later** pins the card to the top of the list with a bookmark pill. Saved cards *are* re-scored on refresh, so the score can change.
- Already-sent matches show a "Sent 2 days ago" pill and a disabled button.
- While AI is loading: rule-based cards render first, with a shimmering skeleton line in place of reasons.

### 7.5 Send Match dialog

- Left: candidate summary card (photo, name, age, city, profession, tier).
- Right: email preview with editable subject and body (AI-generated), "Regenerate" link, character count.
- Footer: "Cancel" and "Send match" (primary).
- On success: dialog closes, toast "Match sent to Priya", card updates to "Sent just now".
- Mobile: full-screen sheet, summary card on top, email below.

### 7.6 Notes tab

- Composer at the top: type selector as three tiles (Call · Meeting · Note), textarea with placeholder "What did you discuss?", "Save note" button. `Cmd/Ctrl + Enter` saves.
- List below: type icon, body, author, relative time ("2 hours ago", exact time on hover).

### 7.7 Activity tab

Vertical timeline. Each entry: icon in a soft-coloured circle, a human sentence, relative time.

- "Harshit moved Priya from Verified to Shortlisting"
- "Harshit sent Rohan's profile to Priya · High Potential"
- "Harshit added a call note"

### 7.8 Analytics

- **KPI cards (4):** Active clients · Matches sent this week · Meetings scheduled · Acceptance rate. Each with a small delta vs last week.
- **Pipeline funnel:** horizontal bars per status in status colours.
- **Matches sent over time:** line chart, last 8 weeks.
- **Tier distribution:** donut of sent matches by tier.
- **Needs attention:** list of clients with no contact in 14+ days, each linking to the client.

---

## 8. Component inventory

Built on shadcn/ui primitives; custom ones listed with their purpose.

| Component | Base | Notes |
|---|---|---|
| `Button` | shadcn | Variants: `primary` (pill, emerald), `secondary` (outline), `ghost`, `destructive` |
| `Avatar` | custom | Photo with 4:5 or circle crop; initials fallback on tinted background |
| `VerifiedBadge` | custom | Slate-blue check icon + tooltip |
| `StatusBadge` | custom | Uses status mapping from 3.3 |
| `TierBadge` | custom | Icon + label per tier |
| `MatchActions` | custom | Skip (with undo toast) · Save for later · Send Match |
| `ScoreRing` | custom SVG | Animated arc, accessible label "Match score 86 out of 100" |
| `ProfileCard` | custom | List/mobile card |
| `MatchCard` | custom | See 7.4 |
| `FactorBreakdown` | custom | Bars per scoring factor with reason text |
| `TileSelect` | custom | "Tap over type" option grid, single or multi select |
| `Tabs` | shadcn | Client detail tabs, scrollable on mobile |
| `DataTable` | shadcn + TanStack Table | Client list |
| `Dialog` / `Sheet` | shadcn | Dialog on desktop, sheet on mobile |
| `Toast` | sonner | Bottom-right desktop, top on mobile |
| `Skeleton` | shadcn | Every loading state |
| `EmptyState` | custom | Illustration + one line + one action |
| `Timeline` | custom | Activity feed |

**Primary button**

```css
.btn-primary {
  background: var(--primary);
  color: var(--primary-fg); /* NOT #fff — breaks in dark mode */
  font-weight: 600;
  border-radius: var(--radius-full);
  padding: 10px 22px;
  min-height: 40px;
  transition: background 150ms ease, transform 150ms ease;
}
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:active { transform: scale(0.98); }
```

---

## 9. Images

Photos make this product feel human. Handle them properly.

**Sourcing**

- Use **AI-generated portraits** or **properly licensed stock photos** of Indian people. Never scrape real people's photos from matrimony sites or social media; that's a privacy problem and a bad look for a matchmaking company.
- Generate ~60–80 portraits per gender, assign them across profiles (reuse is fine for a demo), store in `public/images/avatars/` as WebP, ~600×750px.
- Keep a fallback: if `photoUrl` is null, show an initials avatar on a soft tinted background (tint chosen deterministically from the name).

**Treatment**

- Aspect ratio **4:5** for profile and match cards (portrait, like matrimony apps). Circle crop only for small avatars (table rows, timeline).
- `next/image` with `sizes`, `placeholder="blur"` and fixed dimensions, so there is no layout shift.
- Subtle `--radius-lg` corners on card photos, `object-fit: cover`, faces centred (`object-position: center 30%`).

**Decorative imagery**

- Login hero: one warm photograph (hands, garland, mehendi detail, soft light).
- Empty states: simple line illustrations in `--primary` and `--accent` (e.g. two interlocking rings for "No matches yet").
- Keep decoration out of working screens; biodata and match lists stay clean.

---

## 10. Microcopy and tone

Warm, respectful, plain. Talk about people, not records.

| Context | Use | Avoid |
|---|---|---|
| Page title | "Your clients" | "Customer records" |
| Match list | "Suggested matches for Priya" | "Results" |
| Empty matches | "No matches yet. Adjust Priya's preferences to widen the pool." | "0 results found" |
| Send success | "Match sent to Priya" | "Email queued successfully" |
| AI fallback | "Showing rule-based ranking while AI insights load." | "LLM error" |
| Concern | "She prefers to stay in Pune" | "Incompatibility detected" |
| Skip | "Skip for now" | "Reject" |
| Needs attention | "No contact in 16 days" | "Overdue" |

Numbers: income as "₹18 L / year", height as "5′ 6″" with cm in a tooltip, dates as "12 Oct 2026", relative time for recent events.

---

## 11. Accessibility

- Text contrast ≥ 4.5:1 (all tokens above are chosen to pass on their intended backgrounds; verify with a checker after implementation).
- Every interactive element reachable by keyboard; visible focus ring (section 5).
- Status and tier always include text, not just colour.
- `ScoreRing` and charts have `aria-label`s describing the value.
- Dialogs trap focus and close on `Esc` (shadcn handles this).
- Touch targets ≥ 44×44px on mobile.
- Images have meaningful `alt` ("Photo of Ananya"), decorative images use `alt=""`.
- Respect `prefers-reduced-motion`.

---

## 12. Implementation tokens

`src/app/globals.css` (Tailwind v4):

> **Note on radii.** `--radius-*` *is* a Tailwind v4 theme namespace, so writing
> `--radius-sm: var(--radius-sm)` inside `@theme inline` is self-referential and
> resolves to nothing. Radii are therefore declared **once, directly in `@theme`**
> with literal values — no `:root` copy, no alias. Colours are safe to alias because
> the theme namespace (`--color-*`) differs from the raw variable name.

```css
@import "tailwindcss";

/* Raw palette. Light mode is the default; .dark overrides only what changes. */
:root {
  --primary: #1F5C4A;
  --primary-hover: #174838;
  --primary-soft: #E6F0EC;
  --primary-fg: #FFFFFF;    /* on --primary */
  --ink: #0F1B2D;
  --accent: #B8912F;        /* fill only */
  --accent-text: #6E5313;   /* text on light */
  --accent-soft: #F7F0DC;
  --verified: #2F6690;
  --verified-soft: #E6EEF5;
  --bg: #F6F3EE;
  --surface: #FFFFFF;
  --surface-muted: #FAF8F4;
  --border: #E5DFD5;
  --text: #14171F;
  --text-muted: #5F6470;
  --text-subtle: #6E7480;
  --success: #2E7D4F;
  --warning: #B7791F;       /* fill only */
  --warning-text: #8A5A14;  /* text on light */
  --danger: #B5523B;
}

.dark {
  --primary: #5FB79A;
  --primary-hover: #7CC8AE;
  --primary-soft: #16302A;
  --primary-fg: #0A1220;    /* on --primary */
  --ink: #0A1220;
  --accent: #D9B65A;
  --accent-text: #E8CC7E;
  --accent-soft: #33291A;
  --verified: #6FA3CC;
  --verified-soft: #172636;
  --bg: #101318;
  --surface: #171B22;
  --surface-muted: #1D222A;
  --border: #2A303A;
  --text: #EEF0F3;
  --text-muted: #A7ADB8;
  --text-subtle: #8B919C;
  --success: #5DB37E;
  --warning: #E0A54A;
  --warning-text: #E8B968;
  --danger: #E07A62;
}

@theme inline {
  /* Colours: alias is safe — --color-* namespace differs from the raw name. */
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-soft: var(--primary-soft);
  --color-primary-fg: var(--primary-fg);
  --color-ink: var(--ink);
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --color-accent-soft: var(--accent-soft);
  --color-verified: var(--verified);
  --color-verified-soft: var(--verified-soft);
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-border: var(--border);
  --color-fg: var(--text);
  --color-fg-muted: var(--text-muted);
  --color-fg-subtle: var(--text-subtle);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-warning-text: var(--warning-text);
  --color-danger: var(--danger);

  --font-sans: var(--font-jakarta), system-ui, sans-serif;
  --font-display: var(--font-fraunces), Georgia, serif;
}

@theme {
  /* Radii: literal values, declared once. Do NOT mirror these in :root. */
  --radius-sm: 6px;    /* inputs, small badges */
  --radius-md: 10px;   /* buttons, tiles */
  --radius-lg: 16px;   /* cards, dialogs */
  --radius-full: 999px; /* pills, avatars, primary CTA */
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
}
```

`src/app/layout.tsx` fonts:

```tsx
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" })
const fraunces = Fraunces({ subsets: ["latin"], weight: ["500"], variable: "--font-fraunces" })
```

---

## 13. UI quality checklist

- [ ] Every data route has a skeleton `loading.tsx`
- [ ] Every list has an empty state with a next action
- [ ] Every mutation shows a toast and updates the UI without a full reload
- [ ] Every AI output has a visible fallback
- [ ] Mobile tested at 375px: no horizontal scroll, bottom nav, sheets instead of dialogs
- [ ] Dark mode checked on every screen
- [ ] Contrast re-verified after any palette change: text tokens ≥ 4.5:1, fill-only tokens ≥ 3:1
- [ ] `--accent` / `--warning` never used as text — `--accent-text` / `--warning-text` instead
- [ ] No hardcoded `#fff` on a coloured fill — use the paired `-fg` token so dark mode stays legible
- [ ] Keyboard-only pass: login → open client → send match
- [ ] All photos 4:5, no layout shift, initials fallback works
