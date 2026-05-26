import { DarkPageHeader } from "@/platform/ui/DarkPageHeader";

/**
 * WorkflowPage — Jason's "how I build" artifact, linked from the
 * AboutCard footer.
 *
 * Body content is structured as the actual playbook: a 3×3 matrix of
 * stage (Plan / Build / Test) × cadence (Human-paired / Gated handoff /
 * Autonomous loop). Each cell is a bespoke ordered recipe across the
 * four skill ecosystems I run from (gstack, compound-engineering,
 * Matt Pocock skills, superpowers). Followed by the three-layer stack
 * (memory, execution, trust) and an eval strategy section that makes
 * the autonomous row safe to use at all.
 */
export function WorkflowPage() {
  return (
    <div className="flex flex-col h-[100dvh] bg-sb-ink text-sb-paper-soft antialiased">
      <DarkPageHeader />

      <main className="flex-1 overflow-y-auto">
        <article className="px-6 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-16 max-w-[1440px] w-full mx-auto">
        {/* Title block */}
        <div className="max-w-[1080px]">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-px w-6 bg-sb-accent-deep/60" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
              Workflow
            </span>
          </div>

          <h1 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-paper-soft text-[42px] sm:text-[56px] md:text-[68px] lg:text-[80px]">
            How I build.
          </h1>

          <p className="mt-6 max-w-[62ch] text-[15px] sm:text-[16px] md:text-[18px] text-sb-paper-soft/75 leading-relaxed font-sans">
            I don't ship features — I run loops. Every cycle is{" "}
            <span className="text-sb-paper-soft font-medium">Plan → Build → Test</span>, and
            the only real question is who's driving: am I in every keystroke, gating an
            agent at the door, or letting a loop run for hours without me? The matrix
            below is the actual playbook — each cell is an ordered recipe stitched
            across four skill ecosystems I run from daily: gstack, compound-engineering,
            Matt Pocock skills, and superpowers.
          </p>
        </div>

        {/* Philosophy band — four values, each one sentence */}
        <PhilosophyBand />

        {/* The matrix */}
        <MatrixSection />

        {/* The three-layer substrate */}
        <LayerBand />

        {/* Eval strategy — what makes the autonomous row safe */}
        <EvalStrategy />

        {/* Closing */}
        <p className="mt-20 sm:mt-24 max-w-[62ch] text-[14px] sm:text-[15px] text-sb-paper-soft/65 leading-relaxed font-sans">
          Every page on SuperTutors — this one included — was built using the recipe in
          the cell it belongs to. The matrix isn't aspirational. It's the playbook I'm
          running right now.
        </p>

        <p className="mt-12 mb-4 text-[11px] sm:text-[12px] text-sb-paper/40 font-mono uppercase tracking-[0.22em] inline-flex items-center gap-2">
          <span className="h-px w-6 bg-sb-paper/30" aria-hidden />
          End of workflow
        </p>
        </article>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Philosophy band — four values that the matrix is in service of.
   ───────────────────────────────────────────────────────────────────── */

const VALUES: Array<{ name: string; body: string }> = [
  {
    name: "Security",
    body: "Every autonomous loop is gated by something that can say no. Secrets stay out of prompts; `/cso` runs on every gated handoff.",
  },
  {
    name: "Scalability",
    body: "Agents in parallel beat agents in serial. Worktrees, isolation, fan-out — five loops on five slices, merged at a single gate.",
  },
  {
    name: "Reliability",
    body: "Evals are the difference between yolo and engineering. No autonomous step ships without an oracle telling it the truth.",
  },
  {
    name: "Iterability",
    body: "The loop is the product. Every cycle teaches the next via `/ce-compound` and `/learn` — the playbook itself compounds.",
  },
];

function PhilosophyBand() {
  return (
    <section className="mt-16 sm:mt-20">
      <SectionEyebrow label="The four values" />
      <h2 className="font-mono font-bold tracking-[-0.02em] text-sb-paper-soft text-[24px] sm:text-[28px] md:text-[32px] mt-4 max-w-[44ch]">
        What the matrix is in service of.
      </h2>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VALUES.map((v) => (
          <div
            key={v.name}
            className="rounded-[18px] border border-white/10 bg-white/[0.03] p-6 sm:p-7"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
              {v.name}
            </div>
            <p className="mt-3 text-[13px] sm:text-[14px] text-sb-paper-soft/75 leading-relaxed font-sans">
              {v.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   The matrix — 3 stages × 3 cadences. Nine bespoke recipes.
   ───────────────────────────────────────────────────────────────────── */

type CellSpec = {
  stage: "Plan" | "Build" | "Test";
  recipe: Array<string>; // chained with arrows visually
  why: string;
  failure: string;
  values: Array<string>;
  layer?: "RAG / graphs" | "Agents" | "Evals";
};

type RowSpec = {
  cadence: string;
  caption: string;
  cells: [CellSpec, CellSpec, CellSpec];
};

const ROWS: RowSpec[] = [
  {
    cadence: "Human-paired",
    caption: "I'm driving every keystroke. The back-and-forth IS the work.",
    cells: [
      {
        stage: "Plan",
        recipe: [
          "/office-hours",
          "/ce-brainstorm",
          "/grill-me",
          "/ce-strategy",
          "one-page intent",
        ],
        why: "When scope is still vague, dialogue beats structure. No agent substitutes for taste.",
        failure: "Skipped — you generate a perfect plan for the wrong problem.",
        values: ["Iterability"],
      },
      {
        stage: "Build",
        recipe: [
          "/prototype",
          "/ce-frontend-design",
          "/browse snapshot loop",
          "/verify",
          "/design-review",
        ],
        why: "Kid-facing UI lives or dies on micro-details. Hierarchy, spacing, motion — vibe-check every minute.",
        failure: "Handed off — agents ship correct, ugly code. Taste doesn't survive a 2hr gap.",
        values: ["Iterability"],
      },
      {
        stage: "Test",
        recipe: [
          "/open-gstack-browser",
          "walk golden path",
          "/design-review",
          "/qa-only",
          "/diagnose | /investigate",
        ],
        why: "The eye catches what bots can't — boredom, friction, the 'this feels off' signal. Critical for kid UX where pedagogy ≠ functionality.",
        failure: "Trusted automation alone for kid flows — Playwright can't tell you the lesson is boring.",
        values: ["Iterability"],
      },
    ],
  },
  {
    cadence: "Gated handoff",
    caption: "Agent runs for 30 min – 2 hr. I check in at the gate.",
    cells: [
      {
        stage: "Plan",
        recipe: [
          "/ce-plan",
          "/autoplan (CEO + design + eng + DX in parallel)",
          "/grill-with-docs",
          "/to-prd  →  /to-issues",
        ],
        why: "Agents do the review legwork in parallel. I make the taste calls only at the gate.",
        failure: "Skipped reconcile against ADRs — plan contradicts a decision from three weeks ago.",
        values: ["Reliability"],
      },
      {
        stage: "Build",
        recipe: [
          "/tdd (red)",
          "/ce-work (green)",
          "refactor",
          "/superpowers:verification-before-completion",
          "/code-review medium",
          "/ship",
        ],
        why: "When the contract is clear, TDD locks the agent to truth. The failing test is the oracle.",
        failure: "Test written second — agent produces lint-passing, reality-failing code.",
        values: ["Reliability"],
      },
      {
        stage: "Test",
        recipe: [
          "/qa (test-fix-verify)",
          "/code-review",
          "/review (SQL, side effects)",
          "/cso daily",
          "/codex (2nd opinion)",
          "/ship  →  /land-and-deploy",
        ],
        why: "Long enough for a thorough sweep, short enough for momentum. The `/cso` security gate is non-negotiable.",
        failure: "Skipped `/cso` — secrets in prompts, supply-chain holes, broken auth ship to prod.",
        values: ["Security", "Reliability"],
      },
    ],
  },
  {
    cadence: "Autonomous loop",
    caption: "Agent runs up to 8 hr with `/loop` + bypass permissions. I review the artifact.",
    cells: [
      {
        stage: "Plan",
        recipe: [
          "/loop  →  /ce-ideate",
          "parallel: ce-web-researcher + ce-best-practices-researcher + ce-learnings-researcher",
          "/ce-doc-review deepen",
          "/sync-gbrain",
          "fleshed PRD + citations",
        ],
        why: "Deep research parallelizes embarrassingly. Six subagents in six corners of the web compress days into hours.",
        failure: "No seed context — produces generic encyclopedia slop. Garbage in, dictionary out.",
        values: ["Scalability", "Iterability"],
        layer: "RAG / graphs",
      },
      {
        stage: "Build",
        recipe: [
          "/ce-worktree × N",
          "/superpowers:dispatching-parallel-agents",
          "/loop  →  /ce-work per worktree (bypass perms)",
          "/ce-compound (learn from self)",
          "merge gate: /review max + /code-review max",
        ],
        why: "Five worktrees on five independent slices = 5× throughput when the slicing is disciplined. This is where agentic compounding shows up.",
        failure: "Slices overlap the same files — merge hell. The slicing discipline is everything.",
        values: ["Scalability", "Reliability"],
        layer: "Agents",
      },
      {
        stage: "Test",
        recipe: [
          "/canary baselines",
          "/benchmark (CWV + bundle)",
          "/loop  →  /qa-only per preview URL",
          "/ce-test-browser on PR",
          "/health weekly",
          "eval suite (output · visual · e2e · RAG)",
        ],
        why: "The only way to trust autonomous building is autonomous testing. This row is the conscience of the loop.",
        failure: "Autonomous Build column without this row = yolo. Regressions ship silent.",
        values: ["Reliability", "Scalability"],
        layer: "Evals",
      },
    ],
  },
];

function MatrixSection() {
  return (
    <section className="mt-20 sm:mt-24">
      <SectionEyebrow label="The matrix" />
      <h2 className="font-mono font-bold tracking-[-0.02em] text-sb-paper-soft text-[28px] sm:text-[36px] md:text-[44px] mt-4 max-w-[28ch]">
        Stage × cadence. Nine recipes.
      </h2>
      <p className="mt-4 max-w-[62ch] text-[14px] sm:text-[15px] text-sb-paper-soft/70 leading-relaxed font-sans">
        Columns are stage of work. Rows are who's driving. Each cell tells you the
        ordered chain of skills to run, why it's the right shape for that combination,
        and the failure mode when you reach for the wrong recipe.
      </p>

      {/* Column headers — visible only on lg+ where the grid renders as
          a true matrix. Below lg the cells stack and each one shows its
          own stage badge inline. */}
      <div className="hidden lg:grid lg:grid-cols-[180px_1fr_1fr_1fr] lg:gap-4 mt-10">
        <div />
        <ColumnHeader label="Plan" />
        <ColumnHeader label="Build" />
        <ColumnHeader label="Test" />
      </div>

      <div className="mt-3 lg:mt-2 grid gap-4">
        {ROWS.map((row) => (
          <div
            key={row.cadence}
            className="grid grid-cols-1 lg:grid-cols-[180px_1fr_1fr_1fr] gap-4 items-stretch"
          >
            <RowLabel cadence={row.cadence} caption={row.caption} />
            {row.cells.map((cell, i) => (
              <MatrixCell key={`${row.cadence}-${i}`} cadence={row.cadence} cell={cell} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function ColumnHeader({ label }: { label: string }) {
  return (
    <div className="pb-2 border-b border-white/10">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
        Stage
      </div>
      <div className="mt-1 font-mono font-bold text-sb-paper-soft text-[24px] tracking-[-0.02em]">
        {label}
      </div>
    </div>
  );
}

function RowLabel({ cadence, caption }: { cadence: string; caption: string }) {
  return (
    <div className="lg:py-2">
      <div className="lg:hidden flex items-center gap-2 mb-2">
        <span className="h-px w-6 bg-sb-accent-deep/60" aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
          Cadence
        </span>
      </div>
      <div className="font-mono font-bold text-sb-paper-soft text-[18px] sm:text-[20px] tracking-[-0.01em]">
        {cadence}
      </div>
      <p className="mt-2 text-[12px] sm:text-[13px] text-sb-paper-soft/65 leading-snug font-sans max-w-[36ch]">
        {caption}
      </p>
    </div>
  );
}

function MatrixCell({ cadence, cell }: { cadence: string; cell: CellSpec }) {
  return (
    <div className="relative rounded-[18px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col gap-4 hover:bg-white/[0.05] transition-colors duration-200">
      {/* Top strip: stage badge (mobile only) + value badges + layer tag */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="lg:hidden font-mono text-[10px] uppercase tracking-[0.18em] text-sb-accent-deep">
            {cell.stage}
          </span>
          <span className="lg:hidden font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/30">
            ·
          </span>
          <span className="lg:hidden font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
            {cadence}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {cell.values.map((v) => (
            <span
              key={v}
              className="font-mono text-[9px] uppercase tracking-[0.18em] bg-sb-paper text-sb-ink rounded-full px-2 py-0.5"
            >
              {v}
            </span>
          ))}
          {cell.layer && (
            <span
              className="font-mono text-[9px] uppercase tracking-[0.18em] border border-sb-accent-deep/60 text-sb-accent-deep rounded-full px-2 py-0.5"
              title="Substrate this cell leans on most"
            >
              {cell.layer}
            </span>
          )}
        </div>
      </div>

      {/* Recipe chain */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
          Recipe
        </div>
        <ol className="mt-2 flex flex-col gap-1.5">
          {cell.recipe.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2 font-mono text-[12px] sm:text-[12.5px] text-sb-paper-soft/90 leading-snug"
            >
              <span className="text-sb-accent-deep tabular-nums shrink-0 mt-px">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="break-words">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Why */}
      <div className="border-t border-white/5 pt-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
          Why
        </div>
        <p className="mt-1 text-[12.5px] sm:text-[13px] text-sb-paper-soft/80 leading-snug font-sans">
          {cell.why}
        </p>
      </div>

      {/* Failure mode */}
      <div className="border-t border-white/5 pt-3 mt-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
          Fails when
        </div>
        <p className="mt-1 text-[12.5px] sm:text-[13px] text-sb-paper-soft/60 leading-snug font-sans italic">
          {cell.failure}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Layer band — three substrates the matrix runs on.
   ───────────────────────────────────────────────────────────────────── */

const LAYERS: Array<{
  name: string;
  caption: string;
  what: string;
  powers: string;
}> = [
  {
    name: "Memory",
    caption: "RAG · Knowledge graphs · /sync-gbrain · CONTEXT.md · ADRs",
    what: "The substrate that grounds research and lets the loop remember what was decided, what's been tried, and which doc said what.",
    powers:
      "Plan × Autonomous (deep research grounds in repo + landscape) · Build × Autonomous (loops query prior learnings) · Test × Autonomous (regression history)",
  },
  {
    name: "Execution",
    caption: "Agents · Subagents · Worktrees · /loop · /superpowers:dispatching-parallel-agents",
    what: "The pattern that does the work. A single agent on one cell; a swarm of parallel agents on the Autonomous row.",
    powers:
      "Present in every cell. Intensifies down the rows: Human-paired uses one agent as a partner; Autonomous fans out across five worktrees in parallel.",
  },
  {
    name: "Trust",
    caption: "Evals · /cso · /qa · /canary · /benchmark · /code-review",
    what: "The harness that proves the loop didn't break what it touched. The thing that makes 'bypass permissions' a safe sentence to say out loud.",
    powers:
      "Required for the Autonomous row — without it, 8hr loops are yolo. Advisable for the Gated row. Optional for Human-paired (you ARE the eval).",
  },
];

function LayerBand() {
  return (
    <section className="mt-20 sm:mt-24">
      <SectionEyebrow label="The three layers" />
      <h2 className="font-mono font-bold tracking-[-0.02em] text-sb-paper-soft text-[28px] sm:text-[36px] md:text-[44px] mt-4 max-w-[34ch]">
        Memory. Execution. Trust.
      </h2>
      <p className="mt-4 max-w-[62ch] text-[14px] sm:text-[15px] text-sb-paper-soft/70 leading-relaxed font-sans">
        The matrix sits on top of a three-layer stack. Memory is what the agents
        read from. Execution is the pattern by which they run. Trust is what
        makes the autonomous row safe to leave alone for eight hours.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {LAYERS.map((layer, i) => (
          <div
            key={layer.name}
            className="relative rounded-[18px] border border-white/10 bg-white/[0.03] p-6 sm:p-7 flex flex-col gap-4"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono font-bold text-sb-paper-soft text-[22px] sm:text-[26px] tracking-[-0.02em]">
                {layer.name}
              </span>
            </div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-sb-paper/55 leading-relaxed">
              {layer.caption}
            </div>
            <p className="text-[13px] sm:text-[14px] text-sb-paper-soft/80 leading-relaxed font-sans">
              {layer.what}
            </p>
            <div className="border-t border-white/5 pt-3 mt-auto">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
                Powers
              </div>
              <p className="mt-1 text-[12px] sm:text-[12.5px] text-sb-paper-soft/65 leading-snug font-sans">
                {layer.powers}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Eval strategy — six concrete eval types. The trust layer made specific.
   ───────────────────────────────────────────────────────────────────── */

const EVALS: Array<{
  name: string;
  what: string;
  how: string;
}> = [
  {
    name: "Output evals",
    what: "Quality of LLM-generated lesson content — Freddy hints, Sage ASL prompts, name-pronunciation TTS.",
    how: "Judge-LLM with a per-character rubric: stays in voice, scaffolds rather than gives the answer, no leaked system prompt. Golden set of N=50 prompts per character; re-run on every prompt edit.",
  },
  {
    name: "Visual regression",
    what: "Detects invisible CSS drift, iPad-portrait layout shifts, font-loading flicker, focus-ring color regressions.",
    how: "Playwright screenshot diff per PR on the canonical viewports (iPad 820×1180, iPad 1180×820, 1440×900). Tolerance ≤ 0.1% pixel delta. Anchored to the DESIGN.md tokens.",
  },
  {
    name: "Performance",
    what: "Core Web Vitals + bundle size regressions per PR.",
    how: "/benchmark on the Vercel preview URL. Thresholds: LCP < 2.5s, CLS < 0.1, INP < 200ms, bundle delta < +50KB. Tracks trend across PRs via /health weekly composite.",
  },
  {
    name: "Security",
    what: "Secrets in prompts, exposed env vars, vulnerable deps, prompt-injection surfaces, supply-chain holes in skills.",
    how: "/cso daily mode on every PR (low-noise 8/10 gate) + /cso comprehensive monthly. Scans both app code and the skill ecosystem itself (gstack/CE/Pocock/superpowers).",
  },
  {
    name: "Behavioral (e2e)",
    what: "The five things that must never break for a kid: sign in, pick a lesson, complete one tile, hear Freddy speak, hand-track start.",
    how: "Playwright suite in /e2e against the local Vite dev server + the Vercel preview. Runs on every PR open and on canary post-deploy.",
  },
  {
    name: "Retrieval quality (RAG)",
    what: "When an agent claims it checked the BrainLift or an ADR — did it actually pull the right chunk?",
    how: "Golden set of question → correct-doc pairs (currently ~40), maintained alongside docs/. Re-run after any doc edit or after /sync-gbrain. Recall@1 ≥ 0.85 is the floor.",
  },
];

function EvalStrategy() {
  return (
    <section className="mt-20 sm:mt-24">
      <SectionEyebrow label="Eval strategy" />
      <h2 className="font-mono font-bold tracking-[-0.02em] text-sb-paper-soft text-[28px] sm:text-[36px] md:text-[44px] mt-4 max-w-[34ch]">
        Six oracles. The trust layer, made specific.
      </h2>
      <p className="mt-4 max-w-[62ch] text-[14px] sm:text-[15px] text-sb-paper-soft/70 leading-relaxed font-sans">
        Without evals, the Autonomous row is yolo. These are the six oracles I
        wire into the loop — each one with a concrete method and a concrete
        threshold, so failure is detectable by an agent rather than a vibe.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVALS.map((evalSpec, i) => (
          <div
            key={evalSpec.name}
            className="relative rounded-[18px] border border-white/10 bg-white/[0.03] p-6 sm:p-7 flex flex-col gap-3"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono font-bold text-sb-paper-soft text-[18px] sm:text-[20px] tracking-[-0.01em]">
                {evalSpec.name}
              </span>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
                What
              </div>
              <p className="mt-1 text-[13px] sm:text-[13.5px] text-sb-paper-soft/80 leading-relaxed font-sans">
                {evalSpec.what}
              </p>
            </div>
            <div className="border-t border-white/5 pt-3 mt-auto">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-paper/50">
                How
              </div>
              <p className="mt-1 text-[12.5px] sm:text-[13px] text-sb-paper-soft/65 leading-snug font-sans">
                {evalSpec.how}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Shared atoms
   ───────────────────────────────────────────────────────────────────── */

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px w-6 bg-sb-accent-deep/60" aria-hidden />
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
        {label}
      </span>
    </div>
  );
}
