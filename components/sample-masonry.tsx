import type { CSSProperties } from "react";

import { getModel } from "@/lib/models";
import { sampleSrc } from "@/lib/samples";

type Tile = {
  set: "showcase" | "example";
  modelId: string;
  ratio: string;
  top?: boolean;
};

// Real generated outputs (1024² each) shown at varied display ratios so square
// sources still read as a staggered masonry. Interleaved across models so no two
// neighbours are the same model.
const TILES: Tile[] = [
  { set: "showcase", modelId: "flux2-pro", ratio: "4 / 5", top: true },
  { set: "example", modelId: "flux2-dev", ratio: "1 / 1" },
  { set: "showcase", modelId: "flux1-dev", ratio: "3 / 4" },
  { set: "example", modelId: "sd35-large", ratio: "1 / 1" },
  { set: "showcase", modelId: "recraft-v3", ratio: "4 / 5" },
  { set: "example", modelId: "flux2-pro", ratio: "1 / 1" },
  { set: "showcase", modelId: "flux2-dev", ratio: "3 / 4" },
  { set: "example", modelId: "flux1-dev", ratio: "4 / 5" },
  { set: "showcase", modelId: "sd35-large", ratio: "1 / 1" },
];

export function SampleMasonry() {
  return (
    <section className="gp-gallery" id="gallery" aria-labelledby="gallery-title">
      <div className="gp-gallery__head">
        <p className="gp-kicker">The evaluation gallery</p>
        <h2 id="gallery-title">Every model on one wall. Pick the best.</h2>
        <p>
          Real outputs from FLUX.2, FLUX.1, SD&nbsp;3.5 and Recraft — the same brief,
          judged side by side. This is the question Ghost Palette answers: which model
          actually wins?
        </p>
      </div>

      <div className="gp-masonry">
        {TILES.map((tile, i) => {
          const model = getModel(tile.modelId);
          const src = sampleSrc(tile.set, tile.modelId);
          if (!src) return null;
          return (
            <figure
              className={`gp-masonry__item ${tile.top ? "is-top" : ""}`}
              key={`${tile.set}-${tile.modelId}-${i}`}
            >
              <img
                src={src}
                alt={`${model.name} output`}
                loading="lazy"
                style={{ aspectRatio: tile.ratio } as CSSProperties}
              />
              {tile.top ? <span className="gp-masonry__badge">★ Top pick</span> : null}
              <figcaption className="gp-masonry__model">{model.name}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
