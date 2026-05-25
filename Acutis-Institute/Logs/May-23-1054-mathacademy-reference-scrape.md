# Math Academy Reference Scrape + Formatting Pass

**Date:** Saturday, May 23, 2026 at 10:54 AM CDT
**Session focus:** Reformat `ASSUMPTIONS.md`, then scrape four Math Academy website pages into polished markdown reference files with inline links, downloaded image assets, and recreated diagrams.

---

## TL;DR

Started by reformatting `ASSUMPTIONS.md` and `MathAcademy-Pedagogy.md`, then scaled the same pattern into a full Math Academy reference set: four website pages (Pedagogy, How Our AI Works, Courses, FAQ) scraped from raw HTML, polished into structured markdown with inline-linked citations, locally-downloaded images, and Mermaid-recreated course prerequisite diagrams. Filesystem moves mid-session twice broke and fixed image paths.

---

## Critical Decisions

- **Always scrape the raw HTML, not just the WebFetch markdown output** — WebFetch strips images and most inline links, so the polished output relied on `curl`-ing the HTML and grepping `<a>` / `<img>` tags directly.
- **Download images locally to `Assets/MathAcademy/`** rather than hotlinking — Cursor's markdown preview blocks external images, so all 6 PNGs were pulled to disk and referenced via relative paths.
- **Use `flowchart BT` (bottom-up) for Mermaid course maps** — matches the source page's visual reading direction where lower courses sit below advanced ones.
- **Color-code Mermaid course maps by tier** — needed for the mega-graph (28 nodes) to stay legible since Mermaid can't replicate the source's hand-tuned positioning.
- **Edges based on official prerequisite text from the source page, not the visual diagram** — e.g. drew `Prealgebra → Algebra I` (per text) instead of `8th Grade Math → Algebra I` (suggested by source PNG but unsupported by prereqs); skipped `AP Calc AB → AP Calc BC` for the same reason.
- **Mermaid Diagram 3 placement** — inserted into the "Comprehensive Curriculum" section instead of as a separate trailing block, since that section was a single sentence that needed visual content and the placement still satisfies the source's "at-the-bottom" position.
- **Add `mailto:` links to emails even when the source page used plain text** — obvious accessibility/usability improvement consistent across all four files.
- **Preserve source typos when intent is unambiguous flagged; fix only obvious ones** — fixed `Ecompassings` → `Encompassings` in Pedagogy; preserved other source quirks verbatim.

## Big Changes / Pivots

- **ASSUMPTIONS.md reformatting → Math Academy reference scrape project** — the user's initial single-file formatting request expanded into a 4-file scrape of the entire Math Academy site.
- **Mermaid-only fallback for Figure 1 → image + Mermaid → image-only → image + Mermaid** — When no static image was assumed to exist, recreated as Mermaid. User supplied a real image URL; replaced. User pushed back on losing Mermaid; restored both. Reverted by user.
- **External image URLs → local `Assets/MathAcademy/` paths** — Cursor preview wouldn't render hotlinked images, prompting full image download.
- **Relative path `Assets/...` → `../Assets/...`** — Triggered when user moved `MathAcademy-How-Our-AI-Works.md` from repo root into `References/`. Same break would now apply to the deeper `References/Math-Academy/` location (see Open Threads).
- **Diagrams 1, 2, 3 added to Courses page** — user requested three Mermaid course-prerequisite maps after initially asking whether any were recreated. I offered Option C (all three, with Diagram 3 doubling as the Comprehensive Curriculum visual); user accepted.

## Files Created / Modified

- [`ASSUMPTIONS.md`](../ASSUMPTIONS.md) — Reformatted from prose-heavy critique into structured Article-vs-SPOV sections with blockquotes, numbered headings, attribution formatting; preserved all 8 supporting quotes verbatim.
- [`References/Math-Academy/MathAcademy-Pedagogy.md`](../References/Math-Academy/MathAcademy-Pedagogy.md) — Polished the existing flat dump into 8 sectioned pedagogy concepts with `Further Reading` lists. All 30+ further-reading entries hyperlinked to source URLs. Inline links added for ~12 terms (mastery learning, deliberate practice, spaced repetition, neural/cognitive/social/experiential, spreading activation, working memory, worked-example effect, dual-coding theory, etc.).
- [`References/Math-Academy/MathAcademy-How-Our-AI-Works.md`](../References/Math-Academy/MathAcademy-How-Our-AI-Works.md) — Built from scratch; 8 sections covering knowledge graph, student model, spaced repetition, diagnostic, task selection, pace adaptation. Five Math Academy diagram PNGs downloaded + embedded with captions. One Mermaid recreation of the "tiny knowledge graph" alongside the source image. All intra-page anchor links remapped.
- [`References/Math-Academy/MathAcademy-Courses.md`](../References/Math-Academy/MathAcademy-Courses.md) — Built from scratch; ~35 courses with detail-page hyperlinks, prerequisite chains, "Coming soon" markers (8th Grade Math, ACT Math, Abstract Algebra). WASC accreditation logo downloaded + embedded. Three Mermaid prerequisite diagrams: K–12 map, Foundations→University subgraph, full 28-node course map.
- [`References/Math-Academy/MathAcademy-FAQ.md`](../References/Math-Academy/MathAcademy-FAQ.md) — Built from scratch; 4 sections, 26 Q&A pairs. 24 inline links captured verbatim from source HTML (Common Core, UC publisher directory, individual course pages, etc.). Email addresses turned into `mailto:` links.
- [`Assets/MathAcademy/`](../Assets/MathAcademy/) — Downloaded 6 PNGs: `tiny-knowledge-graph`, `course-knowledge-graph`, `large-knowledge-graph`, `calculus-knowledge-graph`, `knowledge-frontier`, `wasc-fully-accredited-logo`.

---

## Important User Prompts

> "Improve the formatting of my assumptions markdown file. Make sure to retain the critical content without losing anything."

**Why it mattered:** Set the session's foundational pattern — *improve structure / preserve all content verbatim* — which carried through every subsequent file.

> "on their website mathacademy.com/pedagogy all the further Reading bullets are links to outside resources. can you go scrap the links and embed them inline to their respective text with our @MathAcademy-Pedagogy.md file. There are also inline links within the body paragraphs..."

**Why it mattered:** Established the recurring scrape-the-HTML-not-just-the-text workflow. Surfaced that WebFetch markdown strips links, forcing the `curl`+`grep` approach used for all four files.

> "you didnt catch the inline links for deliberate practice, neural, cognitive, social, and experiential, spreading activation, working memory, worked-example effect, dual-coding theory, visualizations, diagrams, and mental images"

**Why it mattered:** Forced thoroughness on inline-link extraction. Revealed that the bulleted layout I'd used in the Cognitive Load section hid links that were technically present, leading to a prose-form restoration.

> "If i gave you this website link on math academy's site https://www.mathacademy.com/how-our-ai-works, could you scrape all of its content including text, links, images and diagrams to remake in this repo as a mardown file similar to how we made this pedagogy file?"

**Why it mattered:** Scaled the workflow from a single retrofit to a full multi-file scrape project. Established `images + diagrams` as part of scope, not just text.

> "https://www.mathacademy.com/img/course-knowledge-graph.png Can you use this image url for the course knowledge graph?"

**Why it mattered:** Revealed the source page's image-naming convention (`kebab-case-of-div-id.png`), enabling discovery of all 5 diagram images via probing — they were not referenced anywhere in the HTML.

> "I dont see any images inline of the rendered preview of this markdown file and you removed the mermaid diagrams that were valuable"

**Why it mattered:** Drove two parallel fixes: (1) download images locally to dodge Cursor preview's external-image block, (2) restore the Mermaid diagram for the tiny knowledge graph as a co-pilot to the image.

> "it was briefly fixed and then went back to this"

**Why it mattered:** Identified that moving the markdown file into `References/` had silently broken all 5 image paths — relative paths needed `../` prefix. Same pattern recurs with the later `References/Math-Academy/` move (see Open Threads).

> "did you recreate any mermaid diagrams inline and or pulled image assets like you did with @References/MathAcademy-How-Our-AI-Works.md ?"

**Why it mattered:** Surfaced a miss on the Courses page — only the WASC logo was pulled, no diagrams attempted. Triggered creation of three course-prerequisite Mermaid diagrams.

> "I think all three are best served as in-line memory diagrams. See if you can recreate them. On push back if you think you have a better solution than what I'm suggesting."

**Why it mattered:** Explicit invitation to be opinionated. I offered three options (all-three / two-only / all-three-with-#3-doubling-as-the-Comprehensive-Curriculum-visual); chose the third.

> "okay last one, lets do the same website to markdown file creation process her for this link https://www.mathacademy.com/faq and text dont mis any inline links."

**Why it mattered:** Closed the scrape project (4 of 4 pages done) and explicitly raised the bar on link-extraction completeness after the earlier Pedagogy miss.

---

## Action Timeline

1. Reformatted `ASSUMPTIONS.md` into Article-vs-SPOV structure with blockquotes and proper attribution.
2. Reformatted `MathAcademy-Pedagogy.md` into 8 sectioned pedagogy concepts.
3. Scraped Math Academy pedagogy page raw HTML; embedded all 30+ Further Reading citation URLs as inline links.
4. Caught and added 11 inline body links (mastery learning, spreading activation, working memory, worked-example effect, etc.) after first pass missed them.
5. Restored Cognitive Load section to prose form so the cluster of dual-coding-theory inline links read naturally.
6. Scraped `how-our-ai-works` page; built new `MathAcademy-How-Our-AI-Works.md` from scratch with 8 sections.
7. Initially used placeholder boxes for the 5 source-page diagrams (assumed JS-rendered, no static images).
8. After user supplied one image URL, discovered all 5 diagrams existed at predictable `kebab-case-div-id.png` paths; replaced placeholders with real images.
9. Downloaded all 5 PNGs to `Assets/MathAcademy/` after images failed to render via external URLs in Cursor preview.
10. Restored Mermaid recreation of the tiny knowledge graph as a co-pilot to the source PNG.
11. Updated image paths from `Assets/...` → `../Assets/...` after user moved the file into `References/`.
12. Scraped `courses` page; built `MathAcademy-Courses.md` with all ~35 courses hyperlinked to their detail pages plus the WASC accreditation logo downloaded and embedded.
13. Added three Mermaid prerequisite course-map diagrams after user asked whether any were recreated.
14. Scraped `faq` page; built `MathAcademy-FAQ.md` with all 24 source-HTML inline links and bonus `mailto:` links on emails.
15. (Skill invocation) Wrote this log to `Logs/`.

---

## Open Threads / Next Steps

- **Image paths likely broken again** — User has since moved the four Math Academy markdown files from `References/` into `References/Math-Academy/`. Image references in `MathAcademy-How-Our-AI-Works.md` and `MathAcademy-Courses.md` still use `../Assets/MathAcademy/...` which resolves to `References/Assets/MathAcademy/...` (nonexistent). They need to be `../../Assets/MathAcademy/...`. Same fix-pattern as before.
- **Mermaid still renders as raw code** in Cursor's default markdown preview. Resolution requires installing the **Markdown Preview Mermaid Support** extension (Matt Bierner) or **Markdown All in One**. Diagrams 1 and 2 on the Courses page will render cleanly; Diagram 3 (28 nodes) will be dense but legible thanks to color-coding.
- **Diagram 3 redundancy** — User may decide the full course map at the bottom of `MathAcademy-Courses.md` is unnecessary given Diagrams 1 and 2 already cover its content. Trivial to remove if so.
- **Math Academy reference set is complete** for the public site's four content pages (Pedagogy, How Our AI Works, Courses, FAQ). Adjacent pages exist but were out of scope: `/common-core-standards`, `/about-us`, `/how-it-works`, `/adult-students`, `/press`, individual course detail pages, and `/articles` (if it exists).
- **`ASSUMPTIONS.md` fix preserved this session** — Single word-level fix `life is is marked` → `life is marked` in SPOV 4 still stands; user did not push back.
