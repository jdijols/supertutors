import { DarkPageHeader } from "@/platform/ui/DarkPageHeader";

/**
 * WorkflowPage — Jason's "how I build" artifact, linked from the
 * AboutCard footer. Production-grade chrome around an authored body
 * that's currently in flight. The chrome and layout are stable; the
 * body sections are intentional stubs ready for content.
 */
export function WorkflowPage() {
  return (
    <main className="min-h-[100dvh] w-full bg-sb-ink text-sb-paper-soft antialiased flex flex-col">
      <DarkPageHeader />

      <article className="flex-1 px-6 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-12 md:py-16 max-w-[1080px] w-full mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-px w-6 bg-sb-accent-deep/60" aria-hidden />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
            Workflow
          </span>
        </div>

        <h1 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-paper-soft text-[42px] sm:text-[56px] md:text-[68px] lg:text-[80px]">
          How I build.
        </h1>

        <p className="mt-6 max-w-[58ch] text-[15px] sm:text-[16px] md:text-[18px] text-sb-paper-soft/70 leading-relaxed font-sans">
          A working journal of the AI-native loop behind SuperTutors. Parallel
          agents, plan-mode reviewers, and on-device verification collapse
          weeks of feature work into days of high-confidence shipping.
        </p>

        <div className="mt-14 sm:mt-16 grid gap-10 sm:gap-12">
          <WorkflowSection
            order="01"
            title="The loop"
            body="How a product idea moves from sketch to a landed PR. Where I start, what I check at each pass, and what every cycle produces."
          />
          <WorkflowSection
            order="02"
            title="Agents in parallel"
            body="When to fan out across multiple agents, when to consolidate, and what each one is responsible for owning end to end."
          />
          <WorkflowSection
            order="03"
            title="Plans as deliverables"
            body="Why every meaningful change begins as a reviewed plan before any code, and how plan reviews catch the costly mistakes early."
          />
          <WorkflowSection
            order="04"
            title="Verification on device"
            body="How the QA loop runs the real app on the real device, catches regressions before they reach the PR, and closes its own feedback loop."
          />
        </div>

        <p className="mt-16 sm:mt-20 max-w-[58ch] text-[11px] sm:text-[12px] text-sb-paper/40 font-mono uppercase tracking-[0.22em] inline-flex items-center gap-2">
          <span className="h-px w-6 bg-sb-paper/30" aria-hidden />
          Section bodies currently authoring
        </p>
      </article>
    </main>
  );
}

function WorkflowSection({
  order,
  title,
  body,
}: {
  order: string;
  title: string;
  body: string;
}) {
  return (
    <section className="grid sm:grid-cols-[80px_1fr] gap-3 sm:gap-8 items-start">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep pt-1">
        {order}
      </span>
      <div>
        <h2 className="font-mono font-bold leading-[1.0] tracking-[-0.02em] text-sb-paper-soft text-[22px] sm:text-[26px] md:text-[28px]">
          {title}
        </h2>
        <p className="mt-3 max-w-[58ch] text-[14px] sm:text-[15px] text-sb-paper-soft/70 leading-relaxed font-sans">
          {body}
        </p>
      </div>
    </section>
  );
}
