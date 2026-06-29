import { sampleSrc } from "@/lib/samples";

const MODEL_IDS = ["flux2-pro", "flux2-dev", "sd35-large", "recraft-v3"];

// Every real sample (showcase + example), collected once.
const BASE: string[] = [];
for (const set of ["showcase", "example"] as const) {
  for (const id of MODEL_IDS) {
    const src = sampleSrc(set, id);
    if (src) BASE.push(src);
  }
}

// Repeat (and alternate order) so the masonry fills tall viewports without an
// obvious tiling seam. Only 9 unique files are actually fetched.
const TILES = [...BASE, ...[...BASE].reverse(), ...BASE, ...[...BASE].reverse()];

/**
 * Decorative, full-bleed masonry of generated samples sat behind the auth card,
 * dimmed + blurred to the current theme so the card stays readable. Purely
 * cosmetic — aria-hidden and non-interactive.
 */
export function AuthBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="columns-3 gap-3 p-3 sm:columns-4 xl:columns-5">
        {TILES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt=""
            loading="lazy"
            className="mb-3 w-full break-inside-avoid rounded-xl"
          />
        ))}
      </div>
      {/* theme-tinted veil: dims + blurs the wall so the card pops */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[3px]" />
    </div>
  );
}
