# See Me Travel v2 - Design Plan

Living document. Update it whenever a decision changes; do not let it drift from the code.

- Status: draft 1
- Last updated: 2026-09-08
- Owner: Abay Kappas

---

## 0. Design read

> Reading this as: a **mobile-first** consumer SaaS landing plus product surface for design-conscious travelers, with a night-cartography language, leaning toward Next.js + Tailwind v4 + Geist, restrained motion, and the 3D globe as the single hero asset.

**Mobile is the primary target, decided 2026-09-09.** Phones are where people keep their
photos and where a shared link is opened, so every screen is designed at 390px first and
widened afterwards. Concretely this means:

- Design and review each screen at 390x844 before looking at it on a desktop.
- The globe gets its own box on a phone rather than sitting behind a panel; a sphere half
  hidden under a sheet is the failure mode to avoid.
- Camera framing is derived from the container's aspect ratio, never a fixed altitude, or
  the globe crops badly in portrait. See `fitAltitude` in `components/globe/GlobeView.tsx`.
- Primary actions stay reachable without scrolling a sheet to its end (sticky footer), and
  respect `env(safe-area-inset-bottom)`.
- Tap targets are at least 44px. Hover can never be the only way to reach information.
- Copy avoids "click".

Redesign mode: **overhaul**. Content and concept survive; the visual language, IA, data model and stack are rebuilt.

Dials (from the skill's redesign-overhaul rule, measured off v1 at roughly 2 / 4 / 3):

| Dial | Value | Reason |
|---|---|---|
| `DESIGN_VARIANCE` | 7 | v1 is dead-center everything. Asymmetric split hero, mixed tile sizes. Not chaos: the globe is the star and needs calm around it. |
| `MOTION_INTENSITY` | 6 | The globe already supplies continuous motion. Layer scroll-reveals and CTA physics, do not add marquees or scroll hijacks on top of a rotating sphere. |
| `VISUAL_DENSITY` | 3 | Airy. The product is one big object in space; crowding it is the failure mode. Exception: the stats panel runs tighter with mono numerals. |

---

## 1. Where v1 stands (audit)

### 1.1 What v1 does
Anonymous visitor picks countries from a list or by clicking the globe, uploads one photo per country, hits "Create My Earth", and receives a 5-character URL to share. Three routes: `/` (marketing overlay on a spinning globe), `/create` (the editor), `/:id` (the read-only shared globe).

### 1.2 What works and must survive
- **The globe is genuinely good.** Clicking a country to raise its polygon is the product. Keep it.
- **No signup before value.** You can build an earth in 60 seconds with zero friction. v2 must not gate this behind auth.
- **The short URL.** 5 characters is a nice, sharable artifact.
- **The 3-step onboarding dialog** with GIFs. Crude, but it teaches the mental model. Keep the idea, redo the execution.

### 1.3 Idea-level problems
| # | Problem | Consequence |
|---|---|---|
| 1 | Create-once, never edit. No account. | The shared URL is stale after the next trip. Zero retention by construction. |
| 2 | The shared page is a dead end: no CTA, no OG image. | The only viral surface converts nobody, and links preview as bare text in every messenger. |
| 3 | Country granularity only. | Commodity. Been, Visited and Nomad List already own the country-checkbox map. |
| 4 | Nothing worth paying for. | No path to revenue as designed. |
| 5 | No stats layer. | The screenshot people actually post ("37 countries, 16% of the world") does not exist. |
| 6 | Photos are weakly attached: one per country, no caption, no date. | The "story" in "share your travel story" is not represented in the data. |
| 7 | Viewing someone's earth teaches you nothing about them. | No names, no dates, no ordering, no narrative. |

### 1.4 Appearance-level problems
- **No landing page exists.** `/` is an absolutely-positioned overlay on a `<Canvas>` with a headline, a Saint Augustine quote and a green button. No scroll, no sections, no pricing, no proof, no footer.
- **Five visual languages in one app:** Bootstrap 5 CDN, FontAwesome CDN, MUI, styled-components, emotion, plus stock react-select and reactjs-popup CSS.
- **Incoherent palette:** `#292d3e` panels, `#e5e8ec` text, `#27b927` CTA, `green` polygons, `red` markers, `gray` unvisited.
- **Type:** Rubik via render-blocking `@import` in `App.css`, and only one weight scale in practice.
- **Assets off third-party CDNs at runtime:** globe and sky textures pull from `unpkg.com` on every load.
- **No mobile design.** `body { overflow: hidden }`, a desktop-shaped sidebar, and raw `<input type="file">` per country.
- **No loading, empty or error states.** A bad short URL logs to console and renders an empty globe.
- **Accessibility:** icon-only buttons with no accessible name, no visible focus states, no alt text on the helper GIFs, non-semantic dialog content.

### 1.5 Correctness and security defects (carry into the v2 backlog)
| Severity | Defect | Location |
|---|---|---|
| High | Clicking **Norway** (also Northern Cyprus, Somaliland) crashes the app. Those features carry `ISO_A2: "-99"` in the bundled Natural Earth 110m set, so `byCountry.get("-99")` is undefined and `.latitude` throws. | `src/components/world/index.jsx`, `public/datasets/countries.geojson` |
| High | Any client can write any document. Firestore writes are unauthenticated and IDs are 5 guessable characters, so earths can be overwritten or squatted. | `src/components/world/index.jsx`, Firestore rules |
| Medium | `generateUserId` reassigns `const id` and `const docSnap` inside the `while` loop, so the ID-collision path throws. | `src/components/world/index.jsx` |
| Medium | `uploadImage` writes state inside a non-awaited `.then()`. "Create My Earth" can submit before upload URLs resolve. | `src/components/world/index.jsx` |
| Low | Photos are read back into a `Map` keyed by country, so only the last photo per country survives regardless of how many were uploaded. | `src/components/userWorld/index.jsx` |
| Low | `server/` is dead code: an in-memory array, never called by the client. | `server/index.js` |
| Low | Roughly 10 unused dependencies (`d3`, `confetti-js`, `react-toastify`, `reactjs-popup`, `latitude-longitude`, `react-custom-scroll`, `@fortawesome/fontawesome` v1, and others). | `package.json` |

---

## 2. Product thesis for v2

> **Your globe is your travel identity page.** One living URL that shows everywhere you have been, gets richer each trip, and is worth sending to someone.

Three layers, in build order:

1. **Identity (the spine).** A permanent, editable globe at a claimed handle: `seemetravel.com/abay`. This is what you put in an Instagram bio.
2. **Stats (the hook).** Counts, percentages, continents, a first-and-latest timeline, and a yearly recap. This is the screenshot that travels.
3. **Trips (the depth).** Countries group into named trips with dates and photos, so the globe tells a sequence instead of a set.

Deliberately **not** building: a full trip journal with GPS tracking (Polarsteps owns it and it is a much larger product), a social feed, or messaging.

### 2.1 What changes from v1
| v1 | v2 |
|---|---|
| Anonymous, create-once | Anonymous draft, then claim it with an account to keep and edit it |
| Random 5-char URL | Chosen handle, with the short ID kept as a permanent redirect |
| Countries only | Countries plus optional place pins and trips |
| One photo per country | Multiple photos per trip or country, with captions and dates |
| No stats | Stats panel and a shareable year-in-review card |
| Share page is a dead end | Share page has an OG image, a viewer CTA, and a "compare with your globe" hook |
| Free, no ceiling | Free tier with limits, paid tier for vanity, privacy, unlimited media and exports |

### 2.2 The conversion loop (design the product around this)
```
someone travels  ->  edits their globe  ->  shares the link
        ^                                        |
        |                                        v
   claims a handle  <-  "make yours"  <-  friend opens it and sees
                                          a real OG preview card
```
Every design decision on the share page is judged against this loop. The share page is the marketing page that matters most, not `/`.

---

## 3. Visual design direction

### 3.1 Theme lock
**Dark, page-wide, locked.** A night earth against a lit page looks wrong, and the product is literally a night sky. No section inverts to light mid-scroll. No light mode in v2; revisit only if the marketing site is split from the app.

### 3.2 Color

One accent, used identically everywhere. Rejecting the two defaults: green-for-visited is what every travel map already does, and AI-purple is banned. The accent is **ember**, borrowed from the city lights on the night-earth texture, so the UI and the globe share a palette.

```css
/* tokens.css */
--bg:            #070A12;  /* deep space navy-black, never #000 */
--surface:       #0F1522;  /* panels, cards */
--surface-hi:    #18202F;  /* hover, elevated */
--border:        #212C3E;
--text:          #E7ECF3;
--text-muted:    #93A0B4;  /* passes AA on --bg and --surface */
--accent:        #F0A13B;  /* ember: CTAs, visited territory, focus rings */
--accent-hi:     #FFB859;  /* hover only */
--accent-ink:    #1A1206;  /* text on accent fills, AA verified */
--danger:        #E5644B;  /* destructive only, never decorative */
```

Globe mapping:
- Visited cap: one of **nine tints of the ember accent**, raised altitude 0.06.
- Unvisited cap: `#141C29`, altitude 0.005.
- Side walls: `#5C3A10`, a dark bronze, so each raised country reads as its own block.
- Stroke: `--bg` (`#070A12`), drawn as a seam between neighbours.
- Place pins: `--accent-hi`, never red.

**Why nine tints and not one.** A single flat fill made any cluster of neighbouring
countries merge into one amber blob: western Europe read as a single shape rather than
thirteen countries, which destroys the whole point of the map. The fix uses Natural Earth's
`MAPCOLOR9` field, which guarantees no two countries sharing a border carry the same value.
That index selects from a ramp spanning only 50% to 68% lightness at a fixed hue and
saturation, so adjacent countries always separate while the globe still reads as one colour.
This does not violate the one-accent rule: it is one hue, nine values.

Rules: max one accent on the page; no neon glows; shadows tinted `rgba(7,10,18,...)`, never pure black.

### 3.3 Typography

**Geist** (display and body) plus **Geist Mono** for numerals. Self-hosted through `next/font`, never a Google Fonts `<link>`. Inter is avoided as a default; no serif anywhere, since nothing here is editorial or heritage.

| Role | Spec |
|---|---|
| Display / H1 | `text-5xl md:text-6xl tracking-tighter leading-[1.05]` |
| Section H2 | `text-3xl md:text-4xl tracking-tight` |
| Body | `text-base leading-relaxed text-[--text-muted] max-w-[62ch]` |
| Stat numerals | Geist Mono, `tabular-nums`, `text-4xl` |
| UI label | `text-sm font-medium` |

Emphasis inside a headline uses italic or weight of the same family. Never a second family.

### 3.4 Shape and material
One radius system, documented and followed everywhere:
- Buttons: full pill (`rounded-full`)
- Cards and panels: `rounded-2xl` (16px)
- Inputs and chips: `rounded-lg` (8px)

Cards only where elevation carries real hierarchy. Elsewhere group with `border-t` and negative space. Glass is used in exactly one place, the floating globe control bar, with a solid fallback under `prefers-reduced-transparency`.

### 3.5 Motion (`MOTION_INTENSITY: 6`)
Every animation must justify itself in one sentence.

| Motion | Justification |
|---|---|
| Globe idle auto-rotate, stops on interaction | Signals the object is live and draggable |
| Country polygon rises on select, spring | Feedback for the core action |
| Camera eases to a country when picked from the list | Connects the list to the sphere |
| Section scroll-reveal stagger on the landing page | Sequencing, not decoration |
| CTA press `scale-[0.98]` | Tactile feedback |

Banned here: marquees, scroll hijacks, parallax, custom cursors, infinite loops on cards. The globe is the motion budget.

Implementation: Motion (`motion/react`) with `useReducedMotion`. All continuous values through `useMotionValue` / `useTransform`, never `useState`. No `window.addEventListener("scroll")`. No GSAP: nothing here needs pinning, and GSAP must never share a tree with the three.js canvas.

### 3.6 Imagery
The globe is the hero asset, so it must render server-fast: textures self-hosted in `/public`, not `unpkg`. Beyond the globe, the landing page needs real photography for the trips and stats sections. Placeholders are marked explicitly in code (`{/* TODO: real photo, 1200x900 */}`) and listed in section 9 rather than faked with div rectangles or hand-drawn SVG.

**No fake product screenshots built from divs.** Where the landing page shows the editor, it embeds a real, reduced instance of the actual globe component.

---

## 4. Information architecture

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/pricing` | Plans | Public |
| `/@handle` | Someone's globe (the share surface) | Public, or unlisted/private per owner |
| `/build` | Anonymous draft editor, no signup | Public |
| `/app` | Signed-in editor for your own globe | Required |
| `/app/trips` | Trip management | Required |
| `/app/settings` | Handle, privacy, billing | Required |
| `/:id` | **Legacy v1 short URLs.** 301 to the migrated `/@handle`, or render read-only. Never break these. | Public |

`/:id` compatibility is non-negotiable. Every link anyone has ever shared uses that shape.

### 4.1 Landing page section plan
Layout families are deliberately varied; no family repeats, and no three consecutive image-plus-text splits.

| # | Section | Layout family | Notes |
|---|---|---|---|
| 1 | Hero | Asymmetric split: copy left, live globe right | Headline max 2 lines, subtext under 20 words, one primary CTA plus one secondary. `pt-24` max. |
| 2 | Live demo | Full-bleed interactive strip | The real globe, clickable, no signup. Show, do not tell. |
| 3 | Stats | Bento, 5 cells for 5 items, mixed sizes | At least two cells carry a real visual, not text on flat surface. |
| 4 | Trips | Horizontal scroll-snap cards | Breaks the vertical rhythm. |
| 5 | Sharing | Centered single moment | Shows the actual OG card the product generates. |
| 6 | Pricing | Two-column comparison | Free and Passport only. Two plans, no matrix. |
| 7 | Footer | Utility grid | |

Eyebrow budget: 7 sections means at most 2 eyebrows on the whole page, hero included. No section numbering, no scroll cues, no locale strips, no version labels, no decorative dots.

Nav: one line at desktop, 64px tall. Logo, Pricing, Sign in, and one primary CTA.

### 4.2 CTA language lock
One label per intent, used everywhere on the site:
- Primary signup intent: **"Build your globe"** (nav, hero, footer, share page)
- Secondary: **"See an example"** (deep-links to a real public globe)

No "Get started", no "Try it free", no "Begin". One label.

---

## 5. Data model (v2)

Concept sketch, storage-agnostic.

```
user
  id, handle (unique, reserved-word list), display_name, avatar_url
  plan: 'free' | 'passport'
  created_at

globe                       # one per user
  user_id, visibility: 'public' | 'unlisted' | 'private'
  theme, legacy_short_id    # preserves the v1 URL
  updated_at

visit                       # a country on the globe
  globe_id, country_code (ISO 3166-1 alpha-3), first_visited_on?, trip_id?

place                       # optional finer pin
  globe_id, lat, lng, label, country_code, trip_id?

trip
  globe_id, title, started_on, ended_on, cover_photo_id, order

photo
  globe_id, trip_id?, country_code?, storage_path, caption?, taken_on?, order
```

Two model decisions carried from the audit:

1. **Key countries on `ADM0_A3`, not `ISO_A2`.** The v1 crash comes from `ISO_A2: "-99"` on Norway, Northern Cyprus and Somaliland. Checked every candidate field in the bundled dataset: `ISO_A3` and `ISO_A3_EH` are worse (5 gaps, adding France and Kosovo) and `ISO_N3` has 4. **`ADM0_A3` is the only field that is complete and unique across all 177 features**, so it is the internal key. It already returns correct ISO alpha-3 for France (`FRA`) and Norway (`NOR`); only Kosovo, Northern Cyprus and Somaliland are non-ISO entities and need an explicit override map if true ISO codes are ever required externally. Ship a test asserting all 177 features resolve to a distinct key.
   Knock-on: `country-coords` and `iso-3166-1-alpha-2` both key on alpha-2 and get replaced. Take centroids from the geojson geometry instead of a second package.
2. **Photos belong to trips or countries as a list, never a map.** v1 collapses to one photo per country on read.

---

## 5.1 Photos and media

Not built yet. Phase 4. v1 had one photo per country, uploaded straight from a file input to
Firebase Storage, opened in a lightbox. v2 keeps the idea and fixes the mechanics.

**Storage: Supabase Storage.** Same project and same auth as the database, so a single row
level security policy covers both the row and the file. Vercel Blob is the alternative and
has nicer DX, but it is a second service with a second access model for no real gain here.

**Upload path: signed URL, straight from the browser to storage.** Never proxy the bytes
through a Next.js route: Vercel caps a function request body at 4.5MB, and a phone photo is
routinely bigger than that. The route issues a signed upload URL, the browser uploads
directly, then the client records the row.

**Process on the client before uploading:**
1. **Downscale** to roughly 2000px on the long edge. A 12MB HEIC becomes a few hundred KB,
   which is the difference between a usable and a painful upload on mobile data.
2. **Read the EXIF capture date first**, then **strip all remaining EXIF**. Both halves
   matter. The capture date is what lets trips date themselves and order a timeline without
   the user typing anything. The rest, GPS above all, must not survive: these pages are
   public, and a holiday album that leaks the coordinates of someone's home is a serious
   privacy failure, not a nice-to-have.
3. Convert HEIC to JPEG or WebP, since Safari exports HEIC and other browsers cannot show it.

**Where photos surface:**
- Editor: attach to a country now, to a trip once trips exist. On mobile the entry point is
  the native multi-select picker, which is the whole reason mobile leads.
- Share page: tapping a lit country opens a sheet with that country's photos. Countries that
  have photos get a subtle marker on the globe so there is a reason to tap.
- **OG card: use the best photo as the background.** The card is currently typographic. A
  real photograph behind the stats would make shared links far more clickable, and it costs
  nothing extra once photos exist.

**Limits are the paid tier.** Storage and egress are the main variable costs of the product,
which is exactly why the free tier caps photos (12) and Passport does not. See section 6.

---

## 6. Monetization

Freemium. The free tier has to stay genuinely good, because free globes are the marketing.

**Free**
- Unlimited countries, editable forever
- Auto-assigned handle
- Up to 12 photos, up to 3 trips
- Public globe with the standard OG card

**Passport (paid, target 4 USD per month or 29 USD per year)**
- Custom handle plus custom domain
- Unlimited photos and trips
- Private and unlisted globes, optional password
- Globe themes, including a daylight and a topographic style
- **Poster export:** print-resolution PNG or PDF of your globe. This is the strongest single reason to pay; travel map prints are a proven market.
- **Recap video export:** a short vertical clip of the globe filling in, sized for Instagram and TikTok. Doubles as an acquisition channel.
- No footer badge

One-off purchase worth testing later: a physical printed poster, fulfilled by a print-on-demand partner.

**Payments provider: Stripe.** Resolved 2026-09-08. The owner is UK-based, so Stripe is available directly and there is no need for a merchant of record. Use Stripe Checkout plus the customer portal for plan management, and a webhook to sync subscription state onto `user.plan`. Note that Stripe is not a merchant of record, so VAT and sales-tax handling is on us; enable **Stripe Tax** when revenue makes it worth it.

---

## 7. Technical direction

### 7.1 Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15, App Router, TypeScript** | The share page needs server-rendered meta and a generated OG image. `next/og` is the reason to move; CRA cannot do this at all, and the OG card is the whole viral loop. |
| Styling | **Tailwind v4** with CSS-variable tokens | Replaces Bootstrap plus MUI plus emotion plus styled-components with one system. |
| Motion | **Motion (`motion/react`)** | Isolated in `'use client'` leaves. |
| Icons | **Phosphor (`@phosphor-icons/react`)**, `weight="regular"` everywhere | Replaces two FontAwesome packages and one CDN link. No hand-rolled SVG. |
| Globe | **globe.gl** (vanilla) in a client leaf | Changed from react-globe.gl during Phase 0: the React wrapper has no React 19 support, and the vanilla build avoids the peer-dependency fight entirely while rendering identically. Lazy-loaded, so three.js stays out of the shared bundle. |
| Auth + DB + storage | **Supabase** (recommended) | Postgres makes the stats layer trivial, Row Level Security fixes the "anyone can overwrite any globe" hole declaratively, and auth and storage come in the same box. |
| Payments | Paddle, Lemon Squeezy or Polar | Merchant of record; see 6 and 10. |
| Hosting | Vercel | Already there. |

**On leaving Firebase:** the alternative is keeping Firebase and writing security rules plus Firebase Auth, which is a smaller migration. The reason to move is the stats layer: "countries per continent, first and latest visit, percent of world" is one SQL query in Postgres and a pile of client-side reduction in Firestore. Existing v1 documents are a one-time export script into `globe` and `visit` rows, keyed by `legacy_short_id`. Flagged as an open decision in section 10.

### 7.2 Migration approach
Rebuild in a new Next.js app in this repository rather than converting CRA in place. v1 has around 900 lines of component code, most of which is being replaced anyway. Keep and port: the geojson dataset, the globe interaction logic, and the texture assets.

Delete on the way: `server/`, the Bootstrap and FontAwesome CDN links, and every unused dependency.

### 7.3 Performance budget
- LCP under 2.5s. The globe is lazy and below the fold's first paint; hero text and layout render first with a static globe still frame as the poster.
- CLS under 0.1. Reserve the globe canvas box.
- The three.js bundle never loads on `/pricing` or `/app/settings`.
- Textures self-hosted, compressed, and served with far-future cache headers.

### 7.4 Accessibility floor
- Every icon-only button gets an accessible name.
- Visible focus rings in `--accent` on all interactive elements.
- The globe is not the only way to add a country. The searchable country list is a fully keyboard-operable equivalent path.
- WCAG AA on all text, checked against `--bg` and `--surface`.
- All motion honors `prefers-reduced-motion`, including globe auto-rotate.

---

## 8. Phased roadmap

**Phase 0 - Foundations (done)**
Next.js 15, TypeScript, Tailwind v4 with the token system, Geist, Phosphor, the globe as a client leaf, country data keyed on `ADM0_A3` with 7 tests covering all 177 features.

**Phase 1 - The share loop (mostly done)**
Done: `/build` anonymous editor with localStorage drafts, `/g/[id]` read-only globe, generated OG image, viewer CTA, publish API, local file store behind `GlobeStore`.
Outstanding: `/:id` legacy redirects (needs the v1 Firestore export, so it lands with Phase 2), and handles (needs auth).

**Phase 2 - Accounts**
Supabase auth, claim-your-draft flow, handle reservation, persistent editable globe, Row Level Security. Closes the two High-severity defects.

**Phase 3 - Landing page**
The full 7-section page per 4.1, pricing page, SEO and metadata.

**Phase 4 - Depth**
Trips, multi-photo with captions and dates, the stats panel.

**Phase 5 - Money**
Merchant-of-record checkout, plan gating, poster export.

**Phase 6 - Growth**
Recap video export, year in review.

---

## 9. Assets still needed
- Wordmark and logo, redrawn. The current `smt-logo-readme.png` is not a usable brand mark at nav scale.
- 4 to 6 real travel photographs for the trips and stats sections.
- Globe textures, self-hosted: day, night, and one topographic variant for the paid theme.
- A generated OG card template, 1200x630.

---

## 10. Open decisions
| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| 1 | Supabase or stay on Firebase | Supabase, for the stats layer and RLS | Phase 2 |
| 2 | ~~Payments provider~~ | **Resolved 2026-09-08: Stripe.** Owner is UK-based. | closed |
| 3 | Do we ship place pins, or countries only | Countries in v2.0, pins in v2.1 | Phase 4 |
| 4 | ~~Domain~~ | **Resolved: `seemetravel.kz` is already owned and attached to the Vercel project.** | closed |
| 5 | Migrate existing v1 globes, or let them expire | Migrate. They are the only existing users. | Phase 2 |

### 10.1 Deployment constraints

**The Phase 1 file store is local-only. It cannot run on Vercel.** `lib/store/fileStore.ts`
writes to `.data/globes/` under `process.cwd()`, and Vercel Functions have a read-only
filesystem apart from `/tmp`, which is neither shared between invocations nor durable.
Publishing a globe would fail there. This is by design: the store exists so the MVP runs
locally with no accounts. **Phase 2 (Supabase) is therefore a hard prerequisite for the
first real deploy**, not an optional upgrade.

**Live project state** (Vercel project `travel`, team `kappassovs-projects`, Hobby plan,
read 2026-09-08):

| Setting | Value | Status |
|---|---|---|
| Node.js version | 24.x | fixed 2026-09-08, was the discontinued 16.x |
| Framework preset | Next.js | fixed 2026-09-08, was create-react-app |
| Last successful production deploy | January 2023, commit `f01c50d` | |
| Domains | `seemetravel.kz`, `www.seemetravel.kz`, `smtrvl.vercel.app` | |
| Plan | Hobby | must be Pro before Phase 5 |

**What was blocking every build, now resolved.** The deploy was rejected before a single
command ran:

```
Found invalid or discontinued Node.js Version: "16.x".
Please set Node.js Version to 24.x in your Project Settings to use Node.js 24.
```

Vercel dropped Node 16 builds, which blocked **every** branch including `main`. Production
could not be redeployed at all, and the live site kept working only because it serves a
January 2023 build. Both this and the framework preset were corrected on 2026-09-08.

**First successful deploy: 2026-09-08**, commit `e48bbab`, at
`travel-git-worktree-v2-design-plan-kappassovs-projects.vercel.app`. Landing and editor both
render with the globe and no console errors.

**Confirmed on that deploy, as predicted:** `POST /api/globes` returns **HTTP 500** because
the file store cannot write on Vercel's read-only filesystem, and `/g/wander` returns 404
because the seeded example lives in gitignored local state. Publishing and sharing therefore
do not work in any deployment until Phase 2 replaces the store. Local development is
unaffected.

**Separately, v1 also cannot compile under CI even once Node is fixed.** Vercel sets
`CI=true`, and `react-scripts build` treats every ESLint warning as fatal; v1 has around 30.
Confirmed by reproducing the build locally. This is latent rather than the current cause,
and not worth fixing, since the root becomes a Next.js app in v2.

**Hobby plan blocks the paid tier.** Vercel's Hobby plan does not permit commercial use, so
Phase 5 requires upgrading to Pro alongside the Stripe work.

**Domain decision is already closed:** `seemetravel.kz` is owned and attached to the project.

### 10.2 Known traps
- **globe.gl ships an inconsistent three.js tree.** In 2.46.2, `three-globe` pins three 0.171 while `three-render-objects` uses 0.186. Objects built by one are passed to the other, which calls `intersectsFrustum`, a method only 0.186 has, and the globe fails to render with a blank canvas. Fixed with an `overrides: { "three": "0.186.0" }` in `package.json`. **Do not remove that override**, and re-check it whenever globe.gl is upgraded.
- **Satori, which renders the OG card, supports a flexbox subset only.** Any element with more than one child needs an explicit `display`, and an expression next to bare text counts as two children. Keep interpolations in single template literals.
- **The design textures are gone on purpose.** The globe is a matte sphere plus polygons, not a photographic earth. That removes the `unpkg` runtime dependency v1 had and makes the ember countries the only thing competing for attention.

### 10.3 Local development
- Node 24 via nvm. The machine defaults to Node 17, which no current tooling supports, so the repo carries an `.nvmrc` and `nvm use` is required once per shell.
- Phase 1 runs with **no external accounts and no Docker**: drafts live in `localStorage`, published globes in a local JSON file store behind a `GlobeStore` interface. Supabase implements the same interface in Phase 2 without touching UI code.

---

## 11. Change log
| Date | Change |
|---|---|
| 2026-09-08 | Initial plan. Audit of v1, v2 thesis, visual direction, stack, roadmap. |
| 2026-09-08 | Owner relocated to the UK. Payments decision closed: Stripe direct, no merchant of record. Added local-development constraints. |
| 2026-09-08 | Phase 0 and most of Phase 1 built. Globe switched from react-globe.gl to vanilla globe.gl. Country key settled on `ADM0_A3`. Known traps recorded in 10.2. |
| 2026-09-08 | Recorded deployment constraints (10.1) after a Vercel preview build failed. First diagnosis (`CI=true` plus ESLint) was wrong: the real cause, from the Vercel build log, is that the project is pinned to the discontinued Node 16.x, so builds are rejected before running. Also noted that the Phase 1 file store cannot run on Vercel, that Hobby blocks commercial use, and closed the domain decision. |
| 2026-09-08 | Node set to 24.x and preset to Next.js, giving the first successful deploy since January 2023. Fixed a `.gitignore` carried from CRA whose bare `build/` pattern silently excluded `app/build/`, so the editor route was missing from the repo and 404ed on the deploy while working locally. |
| 2026-09-09 | Mobile promoted to the primary target (section 0). Editor restructured so the globe owns its own box on phones, camera framing derived from aspect ratio, sticky primary action. Visited countries now use nine tints of the accent via `MAPCOLOR9` so neighbours stop merging into one blob. Hover label no longer says "visited". Added section 5.1 on photos. |
