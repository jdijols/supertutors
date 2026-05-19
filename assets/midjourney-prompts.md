# Midjourney Prompts — SuperSlice Pizza

> Asset generation workflow for the Freddy Fractions world.
> Uses the modern midjourney.com web editor (NOT Discord).

## Workflow overview

The MJ web editor has three persistent layers that compose on every prompt:

1. **Moodboard** — uploaded reference images (pizza, ovens, chefs, etc.). Auto-applied to all prompts when set as default.
2. **Style** — a reusable aesthetic created in Style Creator. Auto-applied when active.
3. **Per-asset prompt** — short, subject-focused description of what to generate.

This means **per-asset prompts no longer need style suffixes or moodboard references** — those are inherited. Each prompt only describes the *subject + composition + aspect ratio*.

## Step 1 — Create the style in Style Creator

In Midjourney left nav → **Style Creator** → paste this prompt → hit **Start** → MJ generates a sheet of images → pick the ones that match the SuperSlice vibe → MJ evolves into a saved style → set as default for the project.

### Style Creator prompt (paste this)

```
Kid-friendly illustrated 2D style. Bold rounded shapes with clean thick outlines, no thin lines. Warm Italian-American palette (terracotta, mozzarella cream, tomato red, basil green, oven-glow yellow). Soft volumetric lighting. Joyful expressive mood. Painterly textures with confident shapes. In the spirit of Duolingo character art meets modern Pixar shorts. Designed to delight a 9-year-old. Never grim, never cartoonish-mean.
```

**When picking from the Style Creator results, favor images that show:**
- Bold rounded shapes (no thin spindly lines)
- Warm terracotta / mozzarella / tomato palette
- Friendly characters with expressive faces
- Soft lighting (not harsh shadows or grim mood)

Avoid picking gritty, photoreal, dark-fantasy, or anime variants — those will drag the style in wrong directions.

## Step 2 — Set Moodboard as default

You already built one (pizzeria, oven, pepperoni, chefs, Italian flag). In Moodboards → your moodboard → **Set as Default**. Now every prompt auto-references it without typing `--mref`.

## Step 3 — Per-asset prompts

These are short and subject-focused. Style + Moodboard are inherited. Add `--ar [ratio] --v 7` only.

### Asset destination paths

When you drag a generated PNG into the repo, save it at the path below. (`.gitkeep` files exist so the folders are tracked.)

| File path (from project root) | Aspect | Asset |
|---|---|---|
| `public/images/backgrounds/superslice-interior.png` | 16:9 | Restaurant scene |
| `public/images/characters/freddy/facing-student-closed.png` | 1:1 | Freddy front, mouth closed |
| `public/images/characters/freddy/facing-student-open.png` | 1:1 | Freddy front, mouth open |
| `public/images/characters/freddy/facing-guest-closed.png` | 1:1 | Freddy back, mouth closed |
| `public/images/characters/freddy/facing-guest-open.png` | 1:1 | Freddy back, mouth open |
| `public/images/landing/cta-hero.png` | 4:3 | SuperTutors landing CTA |

### Prompt 1 — Restaurant scene background

**Destination:** `public/images/backgrounds/superslice-interior.png`

```
Interior of a small Italian-American pizza shop called SuperSlice, chef's POV looking forward from BEHIND the counter, wood-grain counter top stretching across the foreground with ample empty workspace, brick wood-fired pizza oven on the LEFT with glowing fire visible inside, hanging string lights overhead, fresh basil plants on shelves, checkered terracotta tile floor visible past the counter, warm late-afternoon light, no people, no signage, no text --ar 16:9 --v 7
```

### Prompt 2 — Freddy base (facing student, mouth closed)

**Destination:** `public/images/characters/freddy/facing-student-closed.png`

This is the canonical Freddy generation. Pick the best result, upload it, grab its URL — use as `--cref [url]` on prompts 3, 4, 5 for character consistency across poses.

```
Friendly Italian-American pizza chef character named Freddy Fractions, full body or 3/4 view, standing behind a pizza counter looking forward toward the viewer with a warm welcoming expression, mouth closed in a slight smile, classic white chef's hat slightly tilted, white apron over checkered red-and-white shirt, dark moustache, friendly bright eyes, one hand gesturing in a warm greeting, Super Mario meets Jersey Shore confidence — never cartoonish-mean, isolated on plain white or transparent background, no text --ar 1:1 --v 7
```

### Prompt 3 — Freddy facing student, mouth OPEN (speaking)

**Destination:** `public/images/characters/freddy/facing-student-open.png`

Use `--cref [prompt-2-image-url]` for consistency.

```
Same character Freddy Fractions, same 3/4 front view facing the viewer, but with mouth OPEN as if speaking mid-word with enthusiasm, eyes bright, slightly more animated posture, same hat outfit moustache and styling, isolated on plain white or transparent background, no text --cref [PROMPT2_URL] --ar 1:1 --v 7
```

### Prompt 4 — Freddy facing guest (back to student), mouth closed

**Destination:** `public/images/characters/freddy/facing-guest-closed.png`

```
Same character Freddy Fractions viewed from behind, 3/4 back angle, his back is to the viewer as he turns to face an unseen customer in front of him, hand gesturing toward the customer position, mouth closed in resting position, same hat outfit moustache and styling visible from the back, isolated on plain white or transparent background, no text --cref [PROMPT2_URL] --ar 1:1 --v 7
```

### Prompt 5 — Freddy facing guest, mouth OPEN

**Destination:** `public/images/characters/freddy/facing-guest-open.png`

```
Same character Freddy Fractions, same 3/4 back view as above with his back to the viewer, mouth OPEN as if speaking to the customer, slightly more animated posture, same outfit and styling, isolated on plain white or transparent background, no text --cref [PROMPT2_URL] --ar 1:1 --v 7
```

### Prompt 6 — SuperTutors landing CTA hero

**Destination:** `public/images/landing/cta-hero.png`

```
Vibrant scene of Freddy Fractions standing in front of his SuperSlice Pizza shop, holding a freshly cut pizza with one slice raised to the viewer, warm welcoming gesture, hanging string lights and a glowing brick oven behind him, joyful mood, no text, no signage --cref [PROMPT2_URL] --ar 4:3 --v 7
```

## Post-generation cleanup

For Freddy character images (prompts 2–5), MJ rarely produces clean alpha. After picking the best variant:

1. Drop into **remove.bg** (free for one image) or **photoroom.com**
2. Save as PNG with transparency
3. Drag into the destination path above

Restaurant scene (prompt 1) keeps its full background — don't strip.

## v1 priority order

| Priority | Asset | Why first |
|---|---|---|
| P0 | Prompt 1 — Restaurant scene | Locks the world look; everything else lives inside it |
| P0 | Prompt 2 — Freddy base | Locks the character; gates prompts 3, 4, 5 via `--cref` |
| P1 | Prompts 3, 4, 5 — Freddy variations | Onboarding (3) + Instruct (4, 5) need them |
| P2 | Prompt 6 — CTA hero | Polish for the SuperTutors landing page |

## Phase 2 (stretch — only if Rhubarb lip-sync is adopted)

Additional Freddy mouth shapes for phoneme sync (~4 extra prompts per pose):

- `facing-student-ah.png` — A / O mouth shape
- `facing-student-ee.png` — E / I wide shape
- `facing-student-oo.png` — OO / U small-O shape
- `facing-student-mb.png` — M / B / P pressed shape

(Same expansion for `facing-guest-*` if we want full lip-sync from both angles.)

## Guest characters (P4 — drafted later)

Will generate ~3 distinct guests × 3 expressions (neutral, frown, smile) = ~9 images. Same `--cref` workflow per-guest. Will draft prompts when we reach the Instruct phase build.
