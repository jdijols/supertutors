# AI Asset Prompts — SuperSlice Pizza

> Asset generation workflow for the Freddy Fractions world.
> **Dual-tool approach:** ChatGPT (gpt-image-1) for character + scene art; Midjourney for the CTA hero illustration (if needed).

## Why two tools

We started Midjourney-only, but the Style Creator + Moodboard workflow couldn't reliably produce kid-friendly cartoon-mascot style — MJ kept drifting to gallery art or photoreal restaurant interiors. Switched to ChatGPT for character work and it nailed the Pixar/Duolingo aesthetic on the first generation.

**Tool selection by asset:**

| Asset | Tool | Why |
|---|---|---|
| Freddy character + variations | **ChatGPT (gpt-image-1)** | Reliable on "Pixar / Duolingo cartoon mascot" prompts; conversational iteration; character consistency in a single thread |
| Restaurant scene background | **ChatGPT (gpt-image-1)** | Same thread as Freddy = inherits the cartoon style; better composition control ("counter fills bottom half" actually lands); 1536×1024 landscape fits iPad better than 16:9 |
| Guest characters (P4) | **ChatGPT (gpt-image-1)** | Same character-consistency reasons |
| Landing CTA hero (P2) | **Either** | Try ChatGPT first; MJ is fine as fallback since it's a single one-off polish piece |

## The critical workflow rule

**Generate all SuperSlice-world assets in ONE ChatGPT thread.** The model maintains character + style consistency through thread context. Starting a new chat resets the visual continuity and the next Freddy comes out different.

## Step 1 — Create the style in Style Creator

### How Style Creator actually works (revised understanding)

Style Creator does **not** generate images from your prompt directly. It shows a grid of **pre-cached images** from existing SREF (style reference) codes — Midjourney picks which family of pre-cached images to show based on your prompt. Your selections (and the ones you skip) push and pull through Midjourney's style space to create a **new** custom SREF code.

The Style Creator UI has **TWO input fields**, not one:

1. **Main prompt** — a SIMPLE subject. Just describes what kind of image you want to see in the grid. No style language. (e.g. "a friendly pizza chef")
2. **Starting style description** — hidden behind an "Add starting style" button. THIS is where the broad style language goes. Biases the initial grid toward your target style. (e.g. "cartoon mascot illustration, Pixar style")

Cramming style language into field 1 doesn't work — MJ ignores the style words and just picks portrait-family pre-cached images at random.

### What to paste

**Field 1 — Main prompt (keep this simple):**
```
a friendly pizza chef
```
Aspect ratio (in the param panel): `3:4` (portrait — matches how characters will be displayed in the world).

**Field 2 — Starting style description (click "Add starting style" first):**
```
cartoon mascot illustration, Pixar and Duolingo style, flat colors with soft cel-shading, warm welcoming mood
```

Keep the style description broad (per the video tutorial: "typing in a broad style works best here"). Don't list every constraint — pick the 4–5 most defining style anchors.

### Settings before you start

- **Relax mode ON** (Account → Settings) — Style Creator burns fast hours quickly. Relax mode generates more slowly but doesn't eat your quota. You can scroll/select while jobs queue.
- **Hotkeys ON** — number keys to select, arrows to scroll. Way faster than mouse clicks.

### Iteration strategy (the key insight from the tutorial)

When working toward a SPECIFIC style, **break it into components** and pick images that move toward each component, even if no single image hits all of them:

| Target component | What to look for |
|---|---|
| Cartoon-mascot character | Round forms, big expressive eyes, simple features |
| Cel-shaded coloring | Flat color fills with soft gradient shadows (NOT brushstrokes) |
| Warm welcoming palette | Reds, yellows, oranges, greens dominant |
| Kid-friendly tone | Approachable, never grim or gritty |

You may select a cartoon style that's in the wrong colors, OR a warm-palette style that's a bit too sketchy — that's expected. Pick across the components and MJ converges over rounds.

### Per-round process

1. **Hover the heart** on any image to see its **full SREF grid** before selecting — sometimes the one image shown isn't the best representation of what that style can do. Some SREFs are flexible (can produce both photographic and illustrated outputs).
2. **Select 2–3 images per round** that move toward your target. Pick across components, not all the same.
3. **Skip aggressively** — non-selections also influence the result. Don't waste selections on "kinda nice" images that aren't moving you toward the target.
4. **Click again to deselect** if you change your mind before the round completes.
5. **Side-likes**: anything you love but isn't relevant — click the heart icon to save to your Style Explorer Likes for later. Don't use it as a Style Creator selection.

**Round count target: 8–10 rounds** for a specific style like ours (more than the 5-round minimum). The first few rounds have wide variation; convergence kicks in around round 5–6.

### Reviewing convergence

After ~5 rounds, hop to the **Create** page (left nav). You'll see:
- The **OG / baseline** job (your prompt with zero style influence) — ignore this
- The output of each completed round

Watch for the rounds to **narrow** — earlier rounds show variation; later rounds should look more consistent in style. When the style feels locked, **click the style tag** on the round you like best → adds the new custom SREF code to your prompt bar → that's your saved style. Set it as default for the project.

### What to FAVOR when selecting

- Cartoon-mascot faces — round forms, big expressive eyes
- Cel-shaded coloring — flat fills + soft shadows (not visible brushstrokes)
- Warm pizzeria-adjacent palettes — reds, yellows, oranges, greens
- Anything that looks like "from a kids' app or animated film"

### What to SKIP (and don't accidentally side-like into your selection)

- Painterly portraits (watercolor / oil-painting types)
- Hyper-realistic faces
- Anime / manga (large feature sets, screen-tone shading)
- High-contrast dark backgrounds
- Pure line-art with no color

### Session controls

- **Reset session** — keeps the same prompt, clears selections and starts fresh
- **End session** — clears everything; use this if you want to change the main prompt or style description

### Lessons from v1 (kept for future reference)

The original prompt attempt failed because it lumped style language into the main prompt field. Even with the right vocabulary (cel-shading, cartoon mascot, etc.), MJ ignored most of it and showed gallery-art pre-cached images. The fix is structural — TWO fields, simple subject + broad style description — not a different word choice.

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

## Guest characters (Beats 4–5 — drafted 2026-05-20)

Three customer characters who visit the counter during the Instruct phase.
Each is generated with 3 expressions (neutral / frown / smile) for a total of
9 PNGs. Same single-thread ChatGPT workflow as Freddy — paste these one
after another in the existing Freddy thread for style + composition
continuity.

### Staging notes (read once before prompting)

Guests stand IN FRONT of the counter facing Freddy / the student. The
RestaurantScene composes them between the background and the counter mask
(z-10), so only the **head, shoulders, and upper torso** need to be in
frame — the counter visually cuts them at waist height. Same crop as
Freddy. Plain white or transparent background, no environment behind them.

Asset directory: `public/images/characters/guests/`. Filename convention:
`<guest-id>-<expression>.png`. Square 1:1.

### Asset destination paths

| File path | Guest | Expression |
|---|---|---|
| `public/images/characters/guests/maya-neutral.png` | Maya | Neutral |
| `public/images/characters/guests/maya-frown.png` | Maya | Frown |
| `public/images/characters/guests/maya-smile.png` | Maya | Smile |
| `public/images/characters/guests/theo-neutral.png` | Theo | Neutral |
| `public/images/characters/guests/theo-frown.png` | Theo | Frown |
| `public/images/characters/guests/theo-smile.png` | Theo | Smile |
| `public/images/characters/guests/nonna-neutral.png` | Nonna Lucia | Neutral |
| `public/images/characters/guests/nonna-frown.png` | Nonna Lucia | Frown |
| `public/images/characters/guests/nonna-smile.png` | Nonna Lucia | Smile |

### Persona one-liners

Pasted at the top of each guest's first prompt so the thread "locks" the
character before iterating expressions.

- **Maya** — A curious 9-year-old girl, light-brown skin, twin braids, bright
  yellow t-shirt with a tiny pizza-slice logo on the chest, big round eyes,
  freckles across the nose.
- **Theo** — A friendly 7-year-old boy, pale skin, dark messy hair, round
  glasses (no glare), striped blue-and-white shirt, slight gap between his
  front teeth when he smiles.
- **Nonna Lucia** — A warm Italian grandmother, mid-60s, silver hair pulled
  into a low bun, soft laugh lines around her eyes, a knitted dusty-rose
  cardigan over a cream blouse, a small gold cross on a chain.

### Guest 1 — Maya

#### Prompt 7 — Maya, neutral

```
A new customer named Maya walks up to Freddy's counter: a curious
9-year-old girl with light-brown skin, twin braids, freckles across the
nose, big round eyes, wearing a bright yellow t-shirt with a tiny
pizza-slice logo on the chest. 3/4 front view facing forward toward the
counter (and Freddy/the camera). Crop: head, shoulders, upper torso only —
waist and below are out of frame. Neutral anticipating expression — eyes
looking forward, slight curiosity in her brows, mouth in a soft resting
line, hands visible at chest height (one resting on the counter, the
other holding a small folded paper menu). Same Pixar/Duolingo cartoon-
mascot style as Freddy — flat colors with soft cel-shading, warm
welcoming mood. Isolated on a plain white or transparent background. No
text, no signage.
```

#### Prompt 8 — Maya, smile

```
Same character Maya, identical hair / outfit / freckles / age / 3/4 front
view crop — head, shoulders, upper torso only. Mouth OPEN in a wide
delighted smile showing front teeth, eyes scrunched up in joy (slight
"happy" curve), one hand raised in a small celebratory fist, the menu now
out of frame. Same Pixar/Duolingo cartoon style as Freddy, soft cel-
shading, warm lighting. Isolated on plain white or transparent background.
No text.
```

#### Prompt 9 — Maya, frown

```
Same character Maya, identical hair / outfit / freckles / age / 3/4 front
view crop — head, shoulders, upper torso only. Disappointed expression —
brows drawn slightly down and together, mouth in a small frown (not
crying, just sad-confused, "hm, that's not quite what I wanted"), one
finger touching her chin in a thinking pose. Same Pixar/Duolingo
cartoon-mascot style as Freddy, soft cel-shading, warm lighting (never
grim or dark — kid-friendly disappointment). Isolated on plain white or
transparent background. No text.
```

### Guest 2 — Theo

#### Prompt 10 — Theo, neutral

```
A second customer named Theo walks up to Freddy's counter: a friendly
7-year-old boy with pale skin, dark messy hair, round wire-frame glasses
(no glare on the lenses), wearing a striped blue-and-white shirt. 3/4
front view facing forward toward the counter. Crop: head, shoulders,
upper torso only — waist and below are out of frame. Neutral anticipating
expression — looking forward, mouth in a slight smile (he's a generally
happy kid even at rest), one hand on the counter, the other holding a
slip of paper with an order on it. Same Pixar/Duolingo cartoon-mascot
style as Freddy — flat colors with soft cel-shading, warm welcoming
mood. Isolated on a plain white or transparent background. No text.
```

#### Prompt 11 — Theo, smile

```
Same character Theo, identical hair / glasses / outfit / age / 3/4 front
view crop — head, shoulders, upper torso only. Mouth OPEN in an excited
gap-toothed smile (small visible gap between his front teeth), eyes
sparkling, both hands raised slightly with palms up in a "yes!" gesture.
Same Pixar/Duolingo cartoon style as Freddy, soft cel-shading, warm
lighting. Isolated on plain white or transparent background. No text.
```

#### Prompt 12 — Theo, frown

```
Same character Theo, identical hair / glasses / outfit / age / 3/4 front
view crop — head, shoulders, upper torso only. Disappointed expression —
glasses adjusted slightly downward as he peers at what he was given,
mouth in a small frown, brows knit in confusion (not angry, just
puzzled), one hand still resting on the counter. Same Pixar/Duolingo
cartoon-mascot style as Freddy, soft cel-shading, warm lighting (kid-
friendly disappointment, never harsh). Isolated on plain white or
transparent background. No text.
```

### Guest 3 — Nonna Lucia

#### Prompt 13 — Nonna, neutral

```
A third customer named Nonna Lucia walks up to Freddy's counter: a warm
Italian grandmother in her mid-60s, silver hair pulled into a low bun,
soft laugh lines around her eyes, wearing a knitted dusty-rose cardigan
over a cream blouse with a small gold cross necklace. 3/4 front view
facing forward toward the counter. Crop: head, shoulders, upper torso
only — waist and below are out of frame. Neutral expression with a gentle
patience — eyes looking forward, mouth in a soft Mona-Lisa half-smile
(grandmothers always look kind even at rest), one hand on the counter,
the other holding a small fabric coin purse. Same Pixar/Duolingo cartoon-
mascot style as Freddy — flat colors with soft cel-shading, warm
welcoming mood. Isolated on a plain white or transparent background. No
text.
```

#### Prompt 14 — Nonna, smile

```
Same character Nonna Lucia, identical hair / cardigan / blouse / age /
3/4 front view crop — head, shoulders, upper torso only. Mouth OPEN in a
delighted grandmother smile — laugh lines around the eyes crinkle up
warmly, one hand raised to her cheek in a "bellissimo!" gesture, eyes
half-closed in joy. Same Pixar/Duolingo cartoon style as Freddy, soft
cel-shading, warm lighting. Isolated on plain white or transparent
background. No text.
```

#### Prompt 15 — Nonna, frown

```
Same character Nonna Lucia, identical hair / cardigan / blouse / age /
3/4 front view crop — head, shoulders, upper torso only. Disappointed
expression — eyes soft and a little sad, mouth in a gentle small frown,
one hand to her chest in a "oh dear" gesture (the opposite of the
"bellissimo" cheek-touch in the smile variant). Same Pixar/Duolingo
cartoon-mascot style as Freddy, soft cel-shading, warm lighting (her
disappointment must still feel safe and loving — never cold or harsh,
this is a grandmother gently sad about a wrong order, not an angry
customer). Isolated on plain white or transparent background. No text.
```

### Post-generation cleanup (guests)

Same as Freddy: drop each generation into remove.bg / photoroom.com to
strip any white background; save as PNG with transparency to the path in
the table above.

### Quick-iterate prompts (if a generation drifts off-model)

If ChatGPT loses character continuity mid-thread (e.g. Theo's glasses
disappear, Maya's freckles vanish):

```
That's drifting — the [feature, e.g. "glasses"] disappeared. Please
re-generate using the same character description from prompt N, keeping
the [feature] visible and in the same Pixar/Duolingo cartoon-mascot
style. Same crop, same expression brief, same plain background.
```

Most drifts are fixed by one corrective prompt before regenerating.
