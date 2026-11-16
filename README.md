# Garaggio — web v1

Scan the cars you see, collect them, race them. This is the first version of
the Garaggio design, built as a web app so the whole loop can be played and
changed quickly before the React Native build starts.

The loop: **scan → card into the Collection → CarDex records the model → race
it over a quarter mile → put your best on a Showcase board → go find something
rarer.**

---

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The layout is a phone-width column, so a desktop
browser shows the same thing a phone will.

Camera capture needs a secure context: `localhost` works, any other host needs
HTTPS.

---

## What is real and what is a stand-in

| Part | State in v1 |
| --- | --- |
| Camera capture | Real. `getUserMedia`, live only — uploads are refused by design. |
| Car recognition | **Mock.** Returns a weighted-random catalog car. One module, `src/lib/game/recognition.ts`, swaps for Gemini. |
| VIN decoding | Real. NHTSA vPIC through `/api/vin`, free and keyless. VIN check digits are validated locally first. |
| Vehicle catalog | Real data, hand-entered: 48 cars across the six classes, in `src/lib/catalog/cars.ts`. |
| Quarter-mile times | Computed from power, weight and drivetrain — never stored, so mods change race outcomes. |
| Card artwork | Silhouette per class, tinted with the colour that was scanned. Per-model artwork is the next art job. |
| Opponents and leaderboards | Generated from a fixed seed (`src/lib/store/rivals.ts`) so boards are not empty on day one. |
| Accounts and sync | Real, via Supabase, once you configure a project. See below. |
| Friends, trading, head-to-head | Not built. Scoped out of v1. |
| Real-money purchases | Not built. Octane is earned in-game; the shop shows what the packs will be. |

### Swapping the mock recognizer for Gemini

`Recognizer` in `src/lib/game/recognition.ts` is one method: take a frame,
return a catalog car with a confidence. Implement it against Gemini (through a
route handler, so the key stays server-side), and keep the two behaviours the
mock already has — answer immediately, because people scan from moving cars,
and fall back to the base model when confidence is below
`SPECIFIC_TRIM_CONFIDENCE`.

---

## Supabase

The app runs either way:

- **No environment variables** → local mode. Player state lives in
  `localStorage` on that one device. Good for trying things; nothing is shared.
- **Variables set** → Supabase. Email accounts, and state synced per player.

To wire it up:

1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`. It is idempotent — safe
   to run again after edits.
3. Copy `.env.example` to `.env.local` and paste the project URL and the anon
   key from Project Settings → API.
4. Restart `npm run dev`.

Every table is protected by row level security and scoped to `auth.uid()`.
Profiles are publicly readable so leaderboards can show usernames and new
players can check whether a name is free; Showcase entries are public because
they are a leaderboard. Cards, CarDex and race history are private to their
owner.

**Known v1 simplification:** `savePlayer` writes the whole player state on
every change — upsert everything, delete what is gone. A player holds a few
hundred rows at most, so this is cheap and hard to get wrong, but it is the
first thing to replace with per-mutation writes when the game grows.

---

## How the code is laid out

```
src/
  app/                     routes (Next.js App Router, all client-rendered)
    welcome/               sign in, sign up, or play locally
    onboarding/            the six setup steps, ending with a first car
    play/                  the game: home, scan, collection, garage, cardex,
                           race, showcase, profile, shop, settings, events
    play/car/[cardId]/     one card: specs, mods, tags, scrap or release
    api/vin/               NHTSA vPIC proxy
  components/              Scanner, RaceGame, CarArt, CarCard, nav, UI bits
  lib/
    catalog/cars.ts        the vehicle catalog
    game/                  the rules, as pure functions
      performance.ts       quarter-mile model and run quality
      progression.ts       XP table, levels, level gates
      rules.ts             capacity, scrapping, merging
      showcase.ts          board scoring and eligibility
      badges.ts            the eight badges and their tiers
      recognition.ts       the scan interface and its mock
      vin.ts               VIN validation and catalog matching
      location.ts          city/country without a geocoding service
    i18n/                  en + zh dictionaries and the locale store
    store/                 one Store interface, two backings
  state/game.tsx           the player state and every action on it
supabase/schema.sql        tables, RLS, the leaderboard view
```

The rules live in `src/lib/game` as plain functions with no React in them, so
they port to React Native unchanged and can be tested on their own.

---

## Decisions worth knowing

Some of these answer open questions from the plan. They are choices, not
conclusions — change them in one place each.

- **Level gates are by class, not by named car.** Level 20 wants *a hypercar*,
  not a Bugatti, so a player who does not live near one can still get there by
  racing or trading. `LEVEL_GATES` in `progression.ts`.
- **CarDex shows completion only for hypercars and supercars.** Nobody is ever
  going to finish sports cars. `CATEGORY_META[...].showsCompletion`.
- **Collection boards are scored on breadth, not price.** At a car show
  hundreds of people scan the same hypercar; a price ranking would be one long
  tie. Garage boards use objective worth. `showcase.ts`.
- **Location is shown as city and country only, never coordinates, and garage
  cars show no location at all** — a VIN plus a home address is exactly what a
  thief wants. `location.ts`.
- **Age check at 13.** Real-money purchases, location history and racing
  strangers all carry extra obligations below that.
- **Performance parts are won, never sold.** The shop is cosmetic only, and
  `rollPartReward` is the only way to gain a part.
- **A full Collection never blocks a scan.** The XP and the CarDex entry land
  anyway; only the card waits for a free slot.

## Development escape hatch

When the camera is unavailable, the scanner offers "Simulate a scan". It is
compiled out of production builds (`process.env.NODE_ENV !== 'production'`), so
live capture stays the only way in for real players.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
