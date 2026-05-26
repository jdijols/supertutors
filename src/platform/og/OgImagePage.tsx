import { BrainliftCard } from "@/platform/landing/BrainliftCard";

/**
 * OgImagePage — frame used only by `scripts/generate-og-image.mjs` to
 * rasterize a 1200×630 PNG of the BrainliftCard for og:image / twitter:image
 * sharing. The 1200×630 box matches the OpenGraph spec (1.91:1). The card
 * sits on the same dark ink surface it does on the landing bento, with a
 * thin inset so the rounded corners stay visible at the frame edge.
 *
 * Not linked from anywhere in-app; reach it directly via /og-image during
 * generation. Re-run `npm run og:generate` after any BrainliftCard change.
 */
export function OgImagePage() {
  return (
    <div
      className="bg-sb-ink flex items-stretch justify-stretch"
      style={{ width: "1200px", height: "630px", padding: "24px" }}
    >
      <div className="flex-1">
        <BrainliftCard onActivate={() => {}} />
      </div>
    </div>
  );
}
