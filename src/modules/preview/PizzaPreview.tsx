import { Pizza } from "@/modules/table/Pizza";

/**
 * PizzaPreview — visual inspection sandbox for the raster pizza assets.
 *
 * Lives at `/preview/pizza`. Renders the expected file paths under
 * `/images/pizza/<variant>/`; if an asset hasn't been generated yet, the
 * browser shows a broken-image icon — that's the signal to generate (or
 * regenerate) that piece via the ChatGPT prompts.
 *
 * Variants:
 *   - pepperoni-v1: full 15-piece decomposition (whole + halves + quarters
 *     + eighths)
 *   - cheese-v1: same 15 pieces + 3 "thirds" (vertical strips) used as
 *     static examples in Beat 3 (Numerator/Denominator) — not part of the
 *     bisect slicing tree
 */

type VariantConfig = {
  id: "pepperoni-v1" | "cheese-v1";
  label: string;
};

const VARIANTS: VariantConfig[] = [
  { id: "pepperoni-v1", label: "Pepperoni" },
  { id: "cheese-v1", label: "Plain cheese" },
];

const HALF_SLOTS = [
  { slot: "half-left", label: "Left" },
  { slot: "half-right", label: "Right" },
] as const;

const QUARTER_SLOTS = [
  { slot: "quarter-tl", label: "TL" },
  { slot: "quarter-tr", label: "TR" },
  { slot: "quarter-bl", label: "BL" },
  { slot: "quarter-br", label: "BR" },
] as const;

/**
 * Eighths use a hyphenated 2-part name: eighth-{quarter}-{outer-edge}.png
 *   - {quarter}: which parent quarter (tl/tr/bl/br)
 *   - {outer-edge}: which crust edge the triangle retains (t/r/b/l)
 *
 * Pieces are triangular — each quarter's diagonal cut produces 2 right
 * triangles, one keeping the "horizontal" outer crust edge and one keeping
 * the "vertical" outer crust edge.
 */
const EIGHTH_SLOTS = [
  { slot: "eighth-tl-t", label: "TL · top" },
  { slot: "eighth-tl-l", label: "TL · left" },
  { slot: "eighth-tr-t", label: "TR · top" },
  { slot: "eighth-tr-r", label: "TR · right" },
  { slot: "eighth-bl-b", label: "BL · bottom" },
  { slot: "eighth-bl-l", label: "BL · left" },
  { slot: "eighth-br-b", label: "BR · bottom" },
  { slot: "eighth-br-r", label: "BR · right" },
] as const;

/** Thirds — vertical strips, cheese-v1 only. Display-only for Beat 3 vocab. */
const THIRD_SLOTS = [
  { slot: "third-left", label: "Left" },
  { slot: "third-center", label: "Center" },
  { slot: "third-right", label: "Right" },
] as const;

function variantBase(variant: VariantConfig["id"]): string {
  return `/images/pizza/${variant}`;
}

interface VariantSectionsProps {
  variant: VariantConfig;
}

function VariantSections({ variant }: VariantSectionsProps) {
  const base = variantBase(variant.id);
  return (
    <>
      <h2 className="font-display text-3xl text-terracotta-600 mt-12 mb-6">
        {variant.label}
        <span className="text-sm font-normal text-terracotta-400 ml-3">
          /{variant.id}/
        </span>
      </h2>

      {/* Whole */}
      <section className="mb-10">
        <h3 className="font-display text-xl text-terracotta-500 mb-3">
          Whole pizza
        </h3>
        <div className="flex justify-center bg-mozzarella-50 rounded-2xl p-8 shadow-sm">
          <figure className="flex flex-col items-center gap-3">
            <Pizza src={`${base}/whole.png`} fraction="1" width={320} />
            <figcaption className="text-sm font-medium text-terracotta-500">
              whole.png · fraction 1
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Halves */}
      <section className="mb-10">
        <h3 className="font-display text-xl text-terracotta-500 mb-3">
          Two halves
        </h3>
        <div className="flex justify-center items-center gap-4 bg-mozzarella-50 rounded-2xl p-8 shadow-sm">
          {HALF_SLOTS.map(({ slot, label }) => (
            <figure
              key={slot}
              className="flex flex-col items-center gap-2"
            >
              <Pizza
                src={`${base}/${slot}.png`}
                fraction="1/2"
                width={160}
                height={320}
              />
              <figcaption className="text-xs font-medium text-terracotta-500">
                {slot}.png ({label.toLowerCase()})
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Quarters */}
      <section className="mb-10">
        <h3 className="font-display text-xl text-terracotta-500 mb-3">
          Four quarters
        </h3>
        <div className="flex justify-center bg-mozzarella-50 rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            {QUARTER_SLOTS.map(({ slot, label }) => (
              <figure
                key={slot}
                className="flex flex-col items-center gap-2"
              >
                <Pizza
                  src={`${base}/${slot}.png`}
                  fraction="1/4"
                  width={150}
                  height={150}
                />
                <figcaption className="text-xs font-medium text-terracotta-500">
                  {slot}.png ({label})
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Eighths (triangular) */}
      <section className="mb-10">
        <h3 className="font-display text-xl text-terracotta-500 mb-3">
          Eight eighths (triangular)
        </h3>
        <div className="flex justify-center bg-mozzarella-50 rounded-2xl p-8 shadow-sm">
          <div className="grid grid-cols-4 gap-3">
            {EIGHTH_SLOTS.map(({ slot, label }) => (
              <figure
                key={slot}
                className="flex flex-col items-center gap-2"
              >
                <Pizza
                  src={`${base}/${slot}.png`}
                  fraction="1/8"
                  width={140}
                  height={140}
                />
                <figcaption className="text-xs font-medium text-terracotta-500 text-center">
                  {label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Thirds — only rendered if variant has them (cheese-v1 only). */}
      {variant.id === "cheese-v1" && (
        <section className="mb-10">
          <h3 className="font-display text-xl text-terracotta-500 mb-3">
            Three thirds{" "}
            <span className="text-xs font-normal text-terracotta-400 ml-2">
              · display-only, Beat 3 vocab
            </span>
          </h3>
          <div className="flex justify-center items-center gap-4 bg-mozzarella-50 rounded-2xl p-8 shadow-sm">
            {THIRD_SLOTS.map(({ slot, label }) => (
              <figure
                key={slot}
                className="flex flex-col items-center gap-2"
              >
                <Pizza
                  src={`${base}/${slot}.png`}
                  fraction="1/3"
                  width={110}
                  height={320}
                />
                <figcaption className="text-xs font-medium text-terracotta-500">
                  {slot}.png ({label})
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xs text-terracotta-400 mt-2 text-center">
            Thirds aren't part of the bisect slicing tree. They're shown
            statically in Beat 3 to introduce numerator/denominator vocab
            before the slicing exploration.
          </p>
        </section>
      )}
    </>
  );
}

export function PizzaPreview() {
  return (
    <main className="min-h-screen w-full bg-mozzarella-100 px-6 py-10 md:px-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl text-terracotta-600">
            Pizza Preview
          </h1>
          <p className="text-terracotta-500 mt-2 max-w-3xl">
            Raster assets from{" "}
            <code className="text-terracotta-600 bg-mozzarella-50 px-1 rounded">
              /images/pizza/&lt;variant&gt;/
            </code>{" "}
            · sequential ChatGPT decomposition. Broken-image icons mean that
            asset hasn't been generated yet.
          </p>
        </header>

        {VARIANTS.map((variant) => (
          <VariantSections key={variant.id} variant={variant} />
        ))}

        <footer className="text-center text-sm text-terracotta-400 mt-12">
          Raster · style anchor = Freddy ChatGPT thread · slicing mechanic
          composes these pieces dynamically in Beat 2 (Sandbox)
        </footer>
      </div>
    </main>
  );
}
