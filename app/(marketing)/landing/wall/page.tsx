import type { CSSProperties } from "react";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { MODELS } from "@/lib/models";
import { SHOWCASE_PROMPT } from "@/lib/samples";

import { LANDING_IMAGES, LANDING_VIDEOS } from "../_media";
import styles from "./wall.module.css";

// Real generated renders (flux2-dev stills + Kling clips). The wall recycles the
// image pool with per-tile crop + timing variation so repeats read as distinct
// cells, and drops the live video clips at two focal positions. Color on this
// page comes ONLY from this generated media.
const TILE_COUNT = 48;
const VIDEO_AT = new Map<number, string>([
  [11, LANDING_VIDEOS[0]],
  [30, LANDING_VIDEOS[1]],
]);
const WALL_TILES = Array.from({ length: TILE_COUNT }, (_, i) => {
  const video = VIDEO_AT.get(i);
  return video
    ? { i, src: video, kind: "video" as const }
    : { i, src: LANDING_IMAGES[i % LANDING_IMAGES.length], kind: "image" as const };
});

// Public roster for the rail — internal/non-commercial models stay hidden.
const RAIL_MODELS = MODELS.filter((model) => !model.internal);

const STEPS = [
  {
    n: "01",
    title: "Create",
    body: "Write one brief. Send it to every model you select — image or video — in a single run.",
  },
  {
    n: "02",
    title: "Compare",
    body: "Every result lands on one wall. Judge composition, detail, text, and motion side by side, not tab by tab.",
  },
  {
    n: "03",
    title: "Save",
    body: "Pick the winner, keep the reference edits, and let your model choices sharpen with every run.",
  },
];

const FEATURES = [
  {
    n: "01",
    title: "Every model, one run",
    body: "Black Forest Labs, Stability, ByteDance, Alibaba, Recraft, Ideogram, Kling and more — image and video, no tab-switching.",
  },
  {
    n: "02",
    title: "Evaluation built in",
    body: "Benchmark signals for speed, cost, and fidelity sit next to the outputs, so the pick is evidence, not a hunch.",
  },
  {
    n: "03",
    title: "Refine from a reference",
    body: "Upload a direction, generate a refinement, and keep only the frames that move the image closer to finished.",
  },
];

export default function WallLandingPage() {
  return (
    <main className={styles.page}>
      <MarketingNav
        links={[
          { href: "/leaderboard", label: "Model scores" },
          { href: "/benchmark", label: "Benchmarks" },
          { href: "/docs", label: "Docs" },
          { href: "/pricing", label: "Pricing" },
        ]}
      />

      {/* HERO — the living comparison wall */}
      <section className={styles.hero} aria-labelledby="wall-hero-title">
        <div className={styles.wall} aria-hidden="true">
          {WALL_TILES.map((tile) => (
            <figure
              key={tile.i}
              className={styles.tile}
              style={{ "--i": tile.i } as CSSProperties}
            >
              {tile.kind === "video" ? (
                <video
                  className={styles.tileImg}
                  src={tile.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img className={styles.tileImg} src={tile.src} alt="" decoding="async" />
              )}
            </figure>
          ))}
        </div>

        <div className={styles.veil} aria-hidden="true" />

        <div className={styles.placard}>
          <div className={styles.placardInner}>
            <p className={styles.eyebrow}>
              <span className={styles.live}>
                <span className={styles.liveDot} aria-hidden="true" />
                Live
              </span>
              <span className={styles.sep} aria-hidden="true">
                /
              </span>
              <span className={styles.prompt}>{SHOWCASE_PROMPT}</span>
            </p>

            <h1 id="wall-hero-title" className={styles.headline}>
              <span className={styles.headlineLine}>One prompt.</span>
              <span className={styles.headlineAccent}>Every model.</span>
            </h1>

            <p className={styles.lede}>
              Run one brief across every leading image and video model at once.
              Compare the results on a single wall, then keep the winner.
            </p>

            <div className={styles.actions}>
              <Link className="gp-button gp-button--primary" href="/studio">
                Open Studio
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link className="gp-button gp-button--ghost" href="/leaderboard">
                View model scores
              </Link>
            </div>
          </div>
        </div>

        <nav className={styles.rail} aria-label="Models compared">
          <div className={styles.railViewport}>
            <ul className={styles.railTrack}>
              {RAIL_MODELS.map((model) => (
                <li key={model.id} className={styles.railItem}>
                  {model.name}
                </li>
              ))}
            </ul>
            <ul className={styles.railTrack} aria-hidden="true">
              {RAIL_MODELS.map((model) => (
                <li key={`${model.id}-clone`} className={styles.railItem}>
                  {model.name}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </section>

      {/* HOW IT WORKS */}
      <section className={styles.section} id="how" aria-labelledby="wall-how-title">
        <div className={styles.inner}>
          <p className={styles.kicker}>Process</p>
          <h2 id="wall-how-title" className={styles.sectionTitle}>
            Three moves from prompt to pick.
          </h2>

          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step.n} className={styles.step}>
                <span className={styles.stepN}>{step.n}</span>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepBody}>{step.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FEATURES */}
      <section
        className={`${styles.section} ${styles.features}`}
        id="features"
        aria-labelledby="wall-features-title"
      >
        <div className={styles.inner}>
          <p className={styles.kicker}>Why Ghost Palette</p>
          <h2 id="wall-features-title" className={styles.sectionTitle}>
            Built to compare, not just generate.
          </h2>

          <ul className={styles.featureList}>
            {FEATURES.map((feature) => (
              <li key={feature.n} className={styles.featureRow}>
                <span className={styles.featureNum}>{feature.n}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className={styles.cta} aria-labelledby="wall-cta-title">
        <div className={styles.inner}>
          <h2 id="wall-cta-title" className={styles.ctaTitle}>
            Run your next brief across every model.
          </h2>
          <div className={styles.ctaActions}>
            <Link className="gp-button gp-button--primary" href="/studio">
              Open Studio
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
