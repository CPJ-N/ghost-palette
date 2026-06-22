import { BACKDROP_SOURCES } from "@/lib/samples";

/** Tiled sample outputs for the Composer backdrop grid. */
export function ComposerBackdrop() {
  const tiles = Array.from({ length: 24 }, (_, index) => {
    const src = BACKDROP_SOURCES[index % BACKDROP_SOURCES.length];
    return { src, key: `${src}-${index}` };
  });

  return (
    <div className="gp-composer-backdrop" aria-hidden="true">
      {tiles.map((tile) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={tile.key} src={tile.src} alt="" loading="lazy" />
      ))}
    </div>
  );
}
