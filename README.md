<div align="center">
  <h1>See Me Travel</h1>
  <p>Build a globe of everywhere you have been, and share it with one link.</p>
</div>

This is **v2**, a rebuild on Next.js. The original Create React App version is kept
under [`legacy/`](./legacy) for reference. The direction, audit and roadmap live in
[`DESIGN_PLAN.md`](./DESIGN_PLAN.md).

## Running it locally

Requires **Node 24**. The repo carries an `.nvmrc`, so:

```sh
nvm use          # or: nvm install 24
npm install
npm run setup    # generates the country data and seeds the example globe
npm run dev
```

Then open <http://localhost:3000>.

No accounts, database or Docker are needed. Phase 1 keeps drafts in `localStorage`
and published globes as JSON files under `.data/` (gitignored).

### What to look at

| Route | What it is |
|---|---|
| `/` | Landing hero with a live globe |
| `/build` | The editor. Click countries or search for them, then publish |
| `/g/wander` | The seeded example globe |
| `/g/wander/opengraph-image` | The generated share card, as a PNG |

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run setup` | Regenerates country data and seeds the example globe |
| `npm run countries` | Rebuilds country data from `data/countries.raw.geojson` |
| `npm run seed` | Seeds the example globe only |
| `npm run test:countries` | Tests the country data layer |
| `npm run typecheck` | Types only, no build |

## How it is put together

```
app/                  routes (App Router)
  build/              the editor
  g/[id]/             a published globe, plus its generated OG image
  api/globes/         publish endpoint
components/
  globe/GlobeView     the globe. A client leaf owning its own WebGL lifecycle
  editor/             picker, stats, editor shell
lib/
  countries.ts        country lookup, keyed on ADM0_A3
  stats.ts            the numbers on the share card
  store/              persistence behind a swappable interface
data/                 raw dataset in, generated metadata out
scripts/              data preparation and seeding
```

### Two things worth knowing

**Countries are keyed on `ADM0_A3`, not ISO alpha-2.** The Natural Earth dataset
stores `"-99"` for Norway, Northern Cyprus and Somaliland, which is why clicking
Norway crashed v1. `ADM0_A3` is the only field in the dataset that is both complete
and unique across all 177 countries. `npm run test:countries` guards this.

**Persistence is behind an interface.** `lib/store/types.ts` defines `GlobeStore`;
Phase 1 implements it with local JSON files so the app runs with no setup. Phase 2
adds a Supabase implementation of the same interface without changing any UI code.
