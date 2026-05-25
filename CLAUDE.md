# SuperTutors — Project Conventions

This is the SuperTutors monorepo: a lesson-server platform for
kid-facing AI tutors plus three workstreams (one shipped lesson, two
long-term opportunities). See [README.md](README.md) for the product
overview and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the
lesson-server pattern.

Conventions cascade: `~/.claude/CLAUDE.md` (global) → this file
(SuperTutors monorepo) → per-workstream `CLAUDE.md` files. When they
disagree, the most specific wins.

## Monorepo layout

```
SuperTutors/
├── src/platform/                 ← lesson server: registry, SDK, host, shared UI
├── src/lessons/{slug}/           ← per-lesson code (freddy-fractions, acutis, asl)
├── public/lessons/{slug}/        ← per-lesson runtime assets
├── docs/                         ← cross-project architectural docs
├── api/                          ← cross-lesson ElevenLabs voice proxy
├── e2e/                          ← Playwright end-to-end tests
│
├── Freddy-Fractions/             ← Workstream #1 (shipped) — PRD/TASKS/journals
├── Acutis-Institute/             ← Workstream #2 (long-term) — Brainlift + research
└── ASL-ComputerVision/           ← Workstream #3 (long-term) — research + scoping
```

Each workstream folder owns its own planning artifacts; the platform
code in `src/` references them. Nothing duplicated.

## Where session logs go

Use `/log-chat` to capture chats. **All new logs write to `Logs/` at the
repo root**, regardless of which workstream was touched. Single source of
truth — chronological, searchable, no per-workstream routing decisions to
make.

Older per-workstream folders are **archived** from previous work — leave
them in place for history but do not add new entries:
- `Acutis-Institute/Logs/` — historical Acutis sessions
- `Freddy-Fractions/journals/` — historical Freddy build journals

## Custom project-level skills

Available only when running from this repo (live in `.claude/skills/`):

- **`/log-chat`** — workstream-aware session journaling (see above)
- **`/update-docs`** — sync project planning docs (PRD, TASKS, README, ARCHITECTURE) with the latest decisions from recent chats and today's journal entries

## Skill ecosystems available everywhere

All four are installed at **user scope** — they work from this repo and
from any other project. Full catalogs in `~/.claude/CLAUDE.md`:

- **[gstack](https://github.com/garrytan/gstack)** (~50 skills) —
  business + design + ops: `/browse`, `/qa`, `/ship`, `/plan-ceo-review`,
  `/design-review`, `/cso`, `/health`, `/retro`, `/codex`, `/investigate`,
  iOS toolchain, and more. **Browser rule:** always use `/browse`, never
  `mcp__claude-in-chrome__*` or `mcp__Claude_in_Chrome__*` directly.
- **[compound-engineering](https://github.com/everyinc/compound-engineering-plugin)**
  (Every.io) — `/ce-strategy`, `/ce-ideate`, `/ce-brainstorm`, `/ce-plan`,
  `/ce-work`, `/ce-code-review`, `/ce-compound`, 30+ more.
- **[superpowers](https://github.com/obra/superpowers)** (obra) — TDD,
  systematic debugging, parallel-agent dispatch, plan writing, code
  review, finishing a development branch.
- **[Matt Pocock skills](https://github.com/mattpocock/skills)** — engineering
  workflow skills: `/diagnose`, `/tdd`, `/triage`, `/to-prd`, `/to-issues`,
  `/zoom-out`, `/grill-me`, `/grill-with-docs`, `/handoff`, `/caveman`,
  `/prototype`, `/improve-codebase-architecture`, `/write-a-skill`,
  `/setup-matt-pocock-skills`. Installed via the
  [`skills` CLI](https://www.npmjs.com/package/skills); upgrade with
  `npx skills@latest update -g`.

## Most-useful skills for this monorepo

- `/log-chat` at the end of meaningful sessions — keeps the chronological
  record per workstream.
- `/update-docs` after any decision that contradicts an existing PRD/TASKS line.
- `/browse` for any web inspection, screenshots, or live-site QA.
- `/ship` when ready to bump VERSION + push + open PR.
- `/qa` or `/qa-only` on the Vercel preview after a feature lands.
- `/plan-ceo-review` before committing to a new workstream or sub-product.
- `/diagnose` (Pocock) or `/investigate` (gstack) for bug hunts — both
  enforce a "reproduce before fixing" loop.
- `/tdd` (Pocock or superpowers) for new lesson features where the
  contract is clear.
- `/ce-frontend-design` for new lesson UI before coding.

## Design System

Always read [DESIGN.md](DESIGN.md) before making any visual or UI decision.
All font choices, colors, spacing, radii, motion tokens, and component patterns
are defined there. Do not deviate without explicit user approval. In QA mode,
flag any code that contradicts a token in DESIGN.md.

Key rules from DESIGN.md:
- `font-mono` (Geist Mono) for all labels, chrome, headings — never `font-display` or `font-body`
- `font-sans` (Inter) for prose, speech bubble text, and form inputs
- `active = dark` rule: active/ON state → `bg-sb-ink text-white`; rest state → `bg-sb-paper text-sb-ink`
- Chrome shadows: always `shadow-sb-accent-deep/25` (never `shadow-black`)
- Focus rings: always `focus-visible:ring-2 focus-visible:ring-sb-accent` (not `focus:ring-*`)
- Viewport: always `h-[100dvh]` (not `h-screen` or `h-[100vh]`)
- **Do not use** `portal.*`, `tomato.*`, `Fredoka`, or `Nunito` — they are deprecated/unused

## Repo-specific gotchas

- **Lesson stubs vs. shipped lessons.** `src/lessons/acutis/` and
  `src/lessons/asl/` are `ComingSoonMount` placeholders — don't add
  feature code to them; the planning lives in their `*/` workstream
  folders at the repo root.
- **Audio assets are big.** `public/lessons/freddy-fractions/` has 72 MP3s.
  Don't `git add -A` blindly; use specific paths.
- **`.env.local` holds the ElevenLabs key.** Never commit it; never log it.
- **Playwright e2e tests run against the Vite dev server.** Start with
  `npm run dev` first if running locally.
