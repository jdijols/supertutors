# How I Build — Matrix Rebuild & Ship to Prod

**Date:** Tuesday, May 26, 2026 at 02:10 AM CDT
**Session focus:** Replace the four stub sections on `/workflow` with a 3×3 stage-by-cadence matrix of agentic-workflow recipes; ship it to prod through a mid-flight merge conflict with `DarkPageHeader`.

---

## TL;DR

Rebuilt the `/workflow` page from four placeholder sections into the actual playbook: a 3×3 matrix of Plan/Build/Test × Human-paired/Gated handoff/Autonomous loop, with bespoke recipes drawn from gstack, compound-engineering, Matt Pocock skills, and superpowers. Added a three-layer substrate band (Memory/Execution/Trust) and a six-oracle Eval Strategy section. Shipped via PR #8, reconciled with a mid-flight `DarkPageHeader` refactor that landed on main while the work was in flight, and merged to main pending Vercel prod deploy.

---

## Critical Decisions

- **Y-axis is "who's driving," not "cadence."** — Renamed the initial *Constant attention / 30min-2hr / 8hr loop* framing to *Human-paired / Gated handoff / Autonomous loop*. The time intervals were a proxy; the actual axis is whether a human is in every keystroke, gating at a door, or absent for hours.
- **RAG/graphs/agents/evals are three substrate layers, not peer mentions.** — Pulled them out of the cell text into a dedicated "three layers" band: Memory (RAG/graphs) grounds, Execution (agents) does the work, Trust (evals) proves nothing broke.
- **Security/Scalability/Reliability/Iterability live as per-cell badges and a values band, not inside cells.** — Stuffing all four values into every cell diluted the recipes; pulled them up to a 4-card "what the matrix is in service of" band, then dropped 1–2 value badges per cell where most relevant.
- **Each cell carries an explicit "Fails when…" line.** — Turns the matrix from a menu into a decision tool: *Plan × Autonomous with no seed context = generic encyclopedia slop. Build × Human-paired on a CRUD endpoint = wasted senior time.*
- **Cells are data-driven.** — Recipes/values/layers live in `ROWS`, `VALUES`, `LAYERS`, `EVALS` constants at the top of the file so future copy edits don't touch JSX.
- **Adopt `DarkPageHeader` on conflict resolution.** — Main landed a shared dark-surface header (laurel-as-back + UserMenu, no MuteToggle, tighter padding) while this branch was in flight. Reconciled by replacing the inline header with `<DarkPageHeader />` and restructuring to match BrainliftViewer's pattern (outer `<div>` flex column + `<main flex-1 overflow-y-auto>`).

## Big Changes / Pivots

- **Page architecture: stubs → matrix playbook.** — Was four placeholder sections (`The loop`, `Agents in parallel`, `Plans as deliverables`, `Verification on device`). Now: title + values band + 3×3 matrix + 3-layer band + 6-oracle eval strategy + closing.
- **Scrollable container: from `min-h-[100dvh] flex flex-col` → `h-[100dvh]` outer + `flex-1 overflow-y-auto` on inner `<main>`.** — Required because the new content far exceeds viewport on iPad, and the global `body { overflow: hidden }` rule would have clipped the page otherwise.

## Files Created / Modified

- [`src/platform/workflow/WorkflowPage.tsx`](src/platform/workflow/WorkflowPage.tsx) — Full body rebuild. New atoms: `PhilosophyBand`, `MatrixSection`, `ColumnHeader`, `RowLabel`, `MatrixCell`, `LayerBand`, `EvalStrategy`, `SectionEyebrow`. Data constants `VALUES`, `ROWS` (with `CellSpec`/`RowSpec` types), `LAYERS`, `EVALS`.
- [`Logs/May-26-0210-workflow-page-matrix-rebuild.md`](Logs/May-26-0210-workflow-page-matrix-rebuild.md) — This log.

---

## Important User Prompts

> "the how i build page's body content should be a matrix where x-axis represents stage of development (plan, build, test) and the y-axis represents Intervention Cadence (Constant Focused Attention, 30min-2hr, up to 8hr cycle) and inside the matrix holds an ordered recipe of gstack, compound engineering, matt pocock, and superpowers skills in order of exection… We must blend Security, Sclability, Reliability, Iterability. We must mention Rag, graphs, agents, evals where appropriate… Let me know if you have ideas to make my idea better or call out where i am wrong if at all"

**Why it mattered:** Set the entire scope of the rebuild and explicitly invited pushback. The "call out where i am wrong" framing licensed the three sharpening edits — rename Y-axis, layer-stack RAG/graphs/agents/evals, lift values to a separate axis — before any code got written.

> "yes draft the cell recipes and build out the entire pages content. your analysis was great insight. you got it"

**Why it mattered:** Greenlit the full implementation in one stroke. Removed the back-and-forth on individual recipes and let the build go end-to-end without intermediate checkpoints.

> "i dont see that new workflow page on prod"

**Why it mattered:** Surfaced the worktree → branch → PR → main → Vercel gap. Triggered the shipping flow: explain → commit → push → PR → merge → deploy.

> "do it"

**Why it mattered:** Explicit authorization to commit + push + open PR — converted the change from a worktree experiment into a reviewable artifact (PR #8).

> "merge push go to prod"

**Why it mattered:** Authorized the final merge to main. Surfaced the latent merge conflict with main's new `DarkPageHeader` (three commits had landed in the parallel window), forcing the reconciliation and a second push.

---

## Action Timeline

1. User proposed 3×3 matrix concept for `/workflow` body.
2. Responded with three sharpening pushbacks (rename Y-axis, layer-stack, values axis) + the "failure mode" addition; offered to draft cells or formally brainstorm.
3. User approved drafting; I explored `src/platform/workflow/WorkflowPage.tsx`, `DESIGN.md`, `LandingPage.tsx`, `AboutCard.tsx`, and the route table.
4. Wrote the new `WorkflowPage.tsx` with `PhilosophyBand` / `MatrixSection` / `LayerBand` / `EvalStrategy` and data-driven `ROWS` / `VALUES` / `LAYERS` / `EVALS` constants.
5. Started Vite dev server (port 5174 after autoPort), navigated to `/workflow`, verified at 1440×900 desktop and 820×1180 iPad portrait. No console errors.
6. User shared screenshot of old `/workflow` page in prod; clarified worktree → branch → PR shipping flow.
7. User said "do it" — staged file, committed with `feat(workflow): how-i-build matrix — stage × cadence recipes + eval strategy`, pushed to `claude/sleepy-poincare-27de22`, opened PR #8 against `main` with a populated test plan.
8. User said "merge push go to prod" — `gh pr merge 8 --merge --delete-branch` failed with "not mergeable: the merge commit cannot be cleanly created."
9. Fetched main; found three new commits adding `DarkPageHeader.tsx` and refactoring WorkflowPage + BrainliftViewer to use it (also dropped MuteToggle from the dark-page header and tightened padding).
10. Ran `git merge origin/main`; conflict in `WorkflowPage.tsx` header block.
11. Resolved by replacing the inline header with `<DarkPageHeader />`; restructured outer container to match BrainliftViewer (outer `<div flex flex-col h-[100dvh]>` + `<main flex-1 overflow-y-auto>` wrapping the `<article>`). Removed unused Link/LaurelMark/MuteToggle imports.
12. Vite reported a stale conflict-marker error initially; latest HMR update at 01:44:54 AM compiled cleanly. Took a screenshot to confirm.
13. Committed merge resolution with explanatory message; pushed.
14. Re-ran `gh pr merge 8 --merge --delete-branch` — local-branch-delete failed (worktree conflict) but the remote merge had already gone through. Confirmed via `gh pr view 8`: merged at 2026-05-26T06:49:41Z, merge commit `68d4d7dc0`.
15. Checked Vercel deployments — a new prod build kicked off ~38s in. Started a background bash polling for Ready/Error.

---

## Open Threads / Next Steps

- **Vercel prod deploy in flight** at log-write time (background bash `b1kgnybtp` polling). Once Ready, verify `https://supertutors.[domain]/workflow` shows the matrix (and not the four stubs).
- **Indentation hygiene** — the manual conflict resolution left JSX children at the old indent level (one level shallower than the new `<main>` wrapper). Compiles fine; Prettier pass would clean it.
- **Possible follow-up content edits** to the `ROWS` / `VALUES` / `LAYERS` / `EVALS` constants once the page is live and the matrix has been read end-to-end on the deployed site.
- **AboutCard CTA copy** still says "How I build" — matches the page heading. No change needed but worth confirming on prod that the navigation feels coherent.
