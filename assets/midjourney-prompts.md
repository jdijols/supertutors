# Midjourney Prompt Library — SuperSlice Pizza

> Asset generation prompts for the Freddy Fractions world. Generate these in
> Midjourney; drop the PNGs into `/public/images/` per the paths below.

## Style anchor (shared across all prompts)

Every prompt below ends with the same style suffix so the world stays
visually cohesive. Keep this consistent across every generation:

```
warm Italian-American palette (terracotta, mozzarella cream, tomato red, basil green, oven-glow yellow), bold rounded shapes, no thin lines, kid-friendly illustrated style, Duolingo meets Pixar aesthetic, soft lighting, joyful mood, no text, no signage, no people unless specified, --v 7 --style raw
```

## Character consistency technique

After generating the FIRST Freddy image you like, use it as a character
reference (`--cref <image-url>`) for every subsequent Freddy generation.
This keeps his face, hat, moustache, and outfit consistent across poses
and mouth states. Without `--cref`, each generation will drift visually.

Workflow:
1. Generate Freddy base (Prompt 2) → pick the best of the 4 variations
2. Upload that image to Midjourney → get its URL
3. Use that URL as `--cref` on Prompts 3, 4, 5

---

## Prompt 1 — Restaurant scene background

**File destination:** `public/images/backgrounds/superslice-interior.png`
**Aspect ratio:** 16:9 (landscape — fills the iPad in landscape mode)

```
Bright warm interior of a small Italian-American pizza shop called SuperSlice Pizza, viewed from BEHIND the pizza counter (chef's POV looking forward toward where customers approach), wood-grain counter top stretching across the foreground with ample empty space for placing pizzas, brick wood-fired pizza oven on the LEFT with glowing fire visible inside, hanging string lights overhead, fresh basil plants on shelves, checkered terracotta tile floor visible past the counter, warm late-afternoon light, no people, no signage, ample empty workspace, warm Italian-American palette (terracotta, mozzarella cream, tomato red, basil green, oven-glow yellow), bold rounded shapes, no thin lines, kid-friendly illustrated style, Duolingo meets Pixar aesthetic, soft lighting, joyful mood, --ar 16:9 --v 7 --style raw
```

---

## Prompt 2 — Freddy character base (facing student, mouth closed)

**File destination:** `public/images/characters/freddy/facing-student-closed.png`
**Aspect ratio:** 1:1 (transparent background — see "Background removal" note below)

```
Freddy Fractions, a friendly Italian-American pizza chef character, full body or 3/4 view, standing behind a pizza counter looking forward toward the viewer with a warm welcoming expression, mouth closed in a slight smile, classic white chef's hat slightly tilted, white apron over a checkered red-and-white shirt, dark moustache, friendly bright eyes, one hand gesturing in a warm greeting, Super Mario meets Jersey Shore vibe — confident, expressive, lovable, never cartoonish-mean, isolated on plain white or transparent background, warm Italian-American palette (terracotta, mozzarella cream, tomato red, basil green, oven-glow yellow), bold rounded shapes, no thin lines, kid-friendly illustrated style, Duolingo meets Pixar character aesthetic, --ar 1:1 --v 7 --style raw
```

**After picking the best variant, upload it and grab its URL for `--cref` on the next 3 prompts.**

---

## Prompt 3 — Freddy facing student, mouth open (speaking)

**File destination:** `public/images/characters/freddy/facing-student-open.png`

```
[--cref FREDDY_BASE_URL] Same character (Freddy Fractions, Italian-American chef), same 3/4 front view facing the viewer, but now with mouth OPEN as if speaking enthusiastically mid-word, eyes bright with excitement, slightly animated expression, same hat outfit moustache and styling, isolated on plain white or transparent background, warm Italian-American palette, bold rounded shapes, kid-friendly illustrated style, Duolingo meets Pixar aesthetic, --ar 1:1 --v 7 --style raw
```

---

## Prompt 4 — Freddy facing guest (back to student), mouth closed

**File destination:** `public/images/characters/freddy/facing-guest-closed.png`

```
[--cref FREDDY_BASE_URL] Same character (Freddy Fractions, Italian-American chef), now viewed from behind / 3/4 back angle, his back is to the viewer (the student) as he turns to face an unseen customer in front of him, hand gesturing toward the customer position, mouth closed in a resting position, same hat outfit moustache and styling visible from the back, isolated on plain white or transparent background, warm Italian-American palette, bold rounded shapes, kid-friendly illustrated style, Duolingo meets Pixar aesthetic, --ar 1:1 --v 7 --style raw
```

---

## Prompt 5 — Freddy facing guest (back to student), mouth open

**File destination:** `public/images/characters/freddy/facing-guest-open.png`

```
[--cref FREDDY_BASE_URL] Same character (Freddy Fractions, Italian-American chef), same 3/4 back view as above with his back to the viewer, mouth OPEN as if speaking to the customer, slightly more animated posture, same outfit and styling, isolated on plain white or transparent background, warm Italian-American palette, bold rounded shapes, kid-friendly illustrated style, Duolingo meets Pixar aesthetic, --ar 1:1 --v 7 --style raw
```

---

## Background removal

Midjourney's "transparent background" prompts don't always produce clean alpha.
After picking the best variant of each Freddy prompt:

1. Run the image through **remove.bg** (free for one image) or **photoroom.com**
2. Save the result as PNG with transparency
3. Drop into the destination path

Restaurant scene (Prompt 1) keeps its background — don't strip it.

---

## v1 asset set — what we need by Wednesday EOD

For the Phase 1 mouth-state plan (closed + open per pose):

| Asset | File | Priority |
|---|---|---|
| Restaurant scene | `backgrounds/superslice-interior.png` | P0 — locks the world |
| Freddy facing student, mouth closed | `characters/freddy/facing-student-closed.png` | P0 — onboarding |
| Freddy facing student, mouth open | `characters/freddy/facing-student-open.png` | P0 — onboarding |
| Freddy facing guest, mouth closed | `characters/freddy/facing-guest-closed.png` | P1 — Instruct phase |
| Freddy facing guest, mouth open | `characters/freddy/facing-guest-open.png` | P1 — Instruct phase |

**P2 (Phase 2 phoneme expansion — only if we adopt Rhubarb lip-sync):**

- `facing-student-ah.png` — mouth in "A / O" shape
- `facing-student-ee.png` — mouth in "E / I" wide shape
- `facing-student-oo.png` — mouth in "OO / U" small-O shape
- `facing-student-mb.png` — mouth in "M / B / P" pressed-together shape
- (same expansion for facing-guest)

## Guest characters (P4 — not yet, but flagging for future prompt drafting)

We'll draft guest prompts when we get to Phase 3 / Beat 3 work. Anticipated:
- 3 distinct guests (varied age/style/clothing for personality differentiation)
- 3 expressions each (neutral, frown, smile)
- Total: ~9 guest images
- Same `--cref` workflow for each guest's consistency across expressions

## CTA hero illustration (P5)

For the SuperTutors landing page "Learn Fractions with Freddy" card.

**File destination:** `public/images/landing/cta-hero.png`
**Aspect ratio:** 4:3

```
Vibrant scene of Freddy Fractions standing in front of his SuperSlice Pizza shop, holding a freshly cut pizza with one slice raised to camera, warm welcoming gesture, hanging string lights behind him, brick oven glowing in the background, kid-friendly illustrated style, Duolingo meets Pixar character aesthetic, warm Italian-American palette (terracotta, mozzarella cream, tomato red, basil green, oven-glow yellow), bold rounded shapes, joyful mood, no text, no signage, --ar 4:3 --v 7 --style raw
```
