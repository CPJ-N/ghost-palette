import type { CSSProperties } from "react";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { MODELS } from "@/lib/models";

import { LANDING_IMAGES, LANDING_VIDEOS } from "./landing/_media";
import styles from "./home.module.css";

// The ambient hero reel — the two real Kling clips interleaved with flux stills,
// crossfading behind the title. Color on this page comes ONLY from this media.
const REEL = [
  { kind: "video" as const, src: LANDING_VIDEOS[0], poster: LANDING_IMAGES[0], label: "Kling 2.6 Pro" },
  { kind: "image" as const, src: LANDING_IMAGES[2], label: "FLUX.2" },
  { kind: "video" as const, src: LANDING_VIDEOS[1], poster: LANDING_IMAGES[5], label: "Kling 2.6 Pro" },
  { kind: "image" as const, src: LANDING_IMAGES[6], label: "FLUX.2" },
];

// Public roster only — internal / non-commercially-licensed models stay hidden.
const PUBLIC_MODELS = MODELS.filter((model) => !model.internal);
const ROSTER_NAMES = PUBLIC_MODELS.map((model) => model.name).join(", ");
// Honest counts (replaces the old "{MODELS.length} models" stat, which over-
// counted by including the internal model and conflating image with video).
const IMAGE_COUNT = PUBLIC_MODELS.filter((model) => model.kind !== "video").length;
const VIDEO_COUNT = PUBLIC_MODELS.filter((model) => model.kind === "video").length;

// "How it works" — three moves from prompt to pick.
const STEPS = [
  {
    n: "01",
    title: "Prompt once",
    body: "Write a single brief and choose the image and video models worth testing.",
  },
  {
    n: "02",
    title: "Generate together",
    body: "Every model renders the same prompt in parallel — no re-typing, no switching tabs.",
  },
  {
    n: "03",
    title: "Judge in the same light",
    body: "Weigh detail, motion, and fidelity side by side, then keep the output that wins.",
  },
];

// "Why Ghost Palette" — value, not just generation.
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

const FRAME_TOTAL = String(LANDING_IMAGES.length).padStart(2, "0");

// "Output across models" mosaic — 8 diverse subjects generated across 4 models
// (flux2-pro, recraft-v3, sd35-large, flux2-dev), shown as an asymmetric grid
// distinct from the generated-stills film strip. flux2-dev is labeled FLUX.2.
const GALLERY: { src: string; label: string }[] = [
  { src: "/samples/landing/gallery-1.jpg", label: "FLUX.2 [pro]" },
  { src: "/samples/landing/gallery-2.jpg", label: "Recraft V3" },
  { src: "/samples/landing/gallery-3.jpg", label: "SD 3.5 Large" },
  { src: "/samples/landing/gallery-4.jpg", label: "FLUX.2" },
  { src: "/samples/landing/gallery-7.jpg", label: "Recraft V3" },
  { src: "/samples/landing/gallery-5.jpg", label: "FLUX.2 [pro]" },
  { src: "/samples/landing/gallery-6.jpg", label: "SD 3.5 Large" },
  { src: "/samples/landing/gallery-8.jpg", label: "FLUX.2" },
];

export default function MarketingPage() {
  const reelCount = REEL.length;

  return (
    <main className={styles.page}>
      <MarketingNav
        homeAnchors={[
          { href: "#how", label: "How it works" },
          { href: "#frames", label: "Frames" },
          { href: "#why", label: "Why" },
          { href: "#models", label: "Models" },
        ]}
        links={[
          { href: "/docs", label: "Docs" },
          { href: "/pricing", label: "Pricing" },
        ]}
      />

      {/* ---------------------------------------------------------- HERO */}
      <section className={styles.hero} aria-labelledby="home-hero-title">
        {/* Signature: ambient drifting reel — decorative, hidden from SR */}
        <div
          className={styles.reel}
          aria-hidden="true"
          style={{ "--reel-count": reelCount } as CSSProperties}
        >
          {REEL.map((frame, i) => (
            <div
              key={`${frame.src}-${i}`}
              className={styles.frame}
              style={{ "--i": i } as CSSProperties}
            >
              {frame.kind === "video" ? (
                <video
                  src={frame.src}
                  poster={frame.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img src={frame.src} alt="" loading={i === 0 ? "eager" : "lazy"} />
              )}
            </div>
          ))}
          <div className={styles.veil} />
          <div className={styles.scanline} />
          <div className={styles.grain} />
        </div>

        <div className={styles.heroInner}>
          <p className={styles.heroKicker}>The evaluation layer for image &amp; video models</p>
          <h1 id="home-hero-title" className={styles.heroTitle}>
            Every model, judged in the <em>same light</em>.
          </h1>
          <p className={styles.heroLede}>
            One prompt, run across the leading image and video models — then
            weighed frame by frame until the strongest answer is obvious.
          </p>

          <p className={styles.srOnly}>
            Ghost Palette compares these models: {ROSTER_NAMES}.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.cta} href="/studio">
              Open Studio
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>

          {/* captions synced to the montage — decorative */}
          <div className={styles.nowShowing} aria-hidden="true">
            {REEL.map((frame, i) => (
              <span
                key={`${frame.label}-${i}`}
                className={styles.caption}
                style={{ "--i": i } as CSSProperties}
              >
                <span className={styles.captionIndex}>
                  {String(i + 1).padStart(2, "0")} / {String(reelCount).padStart(2, "0")}
                </span>
                <span className={styles.captionRule} aria-hidden="true" />
                {frame.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- HOW IT WORKS */}
      {/* Signature: a "call sheet" — oversized ghost numerals on a single
          connecting rail with a sweeping playhead. Not three equal cards. */}
      <section className={`${styles.section} ${styles.how}`} id="how" aria-labelledby="home-how-title">
        <div className={styles.sectionInner}>
          <header className={styles.howHead}>
            <p className={styles.eyebrow} id="home-how-title">
              How it works
            </p>
            <h2 className={styles.howTitle}>
              Three moves from <em>prompt</em> to pick.
            </h2>
          </header>

          <ol className={styles.flow}>
            <span className={styles.flowPlayhead} aria-hidden="true" />
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                className={styles.flowStep}
                style={{ "--i": i } as CSSProperties}
              >
                <span className={styles.flowNode} aria-hidden="true" />
                <span className={styles.flowNumeral} aria-hidden="true">
                  {step.n}
                </span>
                <span className={styles.flowStage}>Step {step.n}</span>
                <h3 className={styles.flowName}>{step.title}</h3>
                <p className={styles.flowBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ FRAMES */}
      {/* The actual output. A dark "contact sheet" film-strip — the images are
          the only color on the page, presented like slides on a lightbox. */}
      <section className={styles.frames} id="frames" aria-labelledby="home-frames-title">
        <div className={styles.framesInner}>
          <header className={styles.framesHead}>
            <p className={styles.framesEyebrow} id="home-frames-title">
              Selected frames
            </p>
            <p className={styles.framesMeta}>
              {FRAME_TOTAL} stills · FLUX.2 · scroll the strip
            </p>
          </header>
        </div>

        <div className={styles.stripWrap}>
          <ul
            className={styles.strip}
            tabIndex={0}
            aria-label="Generated stills from FLUX.2 — horizontally scrollable film strip"
          >
            {LANDING_IMAGES.map((src, i) => (
              <li
                key={src}
                className={styles.frameCell}
                style={{ "--i": i } as CSSProperties}
              >
                <figure className={styles.frameFig}>
                  <span className={styles.frameWell}>
                    <img
                      src={src}
                      alt={`Still generated by FLUX.2 — frame ${i + 1} of ${LANDING_IMAGES.length}`}
                      loading="lazy"
                    />
                  </span>
                  <figcaption className={styles.frameCap}>
                    <span className={styles.frameIndex}>
                      {String(i + 1).padStart(2, "0")} / {FRAME_TOTAL}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <div className={styles.stripFadeStart} aria-hidden="true" />
          <div className={styles.stripFadeEnd} aria-hidden="true" />
        </div>
      </section>

      {/* ------------------------------------------- WHY GHOST PALETTE */}
      <section
        className={`${styles.section} ${styles.sectionAlt}`}
        id="why"
        aria-labelledby="home-why-title"
      >
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>Why Ghost Palette</p>
          <h2 id="home-why-title" className={styles.sectionTitle}>
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

      {/* --------------------------------------------- MODELS COMPARED */}
      <section className={styles.section} id="models" aria-labelledby="home-models-title">
        <div className={styles.sectionInner}>
          <div className={styles.rosterHead}>
            <p className={styles.eyebrow} id="home-models-title">
              Models compared
            </p>
            <p className={styles.rosterCount}>
              {IMAGE_COUNT} image · {VIDEO_COUNT} video
            </p>
          </div>
          <ul className={styles.rosterList}>
            {PUBLIC_MODELS.map((model) => (
              <li key={model.id} className={styles.rosterItem}>
                <span className={styles.rosterName}>{model.name}</span>
                <span className={styles.rosterKind}>
                  {model.kind === "video" ? "video" : "image"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------- OUTPUT GALLERY */}
      {/* The existing cross-model sample renders, as an asymmetric mosaic — a
          different treatment from the generated-stills film strip above. */}
      <section className={styles.section} id="gallery" aria-labelledby="home-gallery-title">
        <div className={styles.sectionInner}>
          <header className={styles.galleryHead}>
            <p className={styles.eyebrow} id="home-gallery-title">
              Output across models
            </p>
            <h2 className={styles.sectionTitle}>Every kind of brief.</h2>
          </header>
          <div className={styles.mosaic}>
            {GALLERY.map((shot, i) => (
              <figure
                key={shot.src}
                className={styles.mosaicCell}
                style={{ "--i": i } as CSSProperties}
              >
                <img src={shot.src} alt={`${shot.label} sample output`} loading="lazy" />
                <figcaption className={styles.mosaicCap}>{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- CLOSING CTA */}
      <section className={styles.closing} aria-labelledby="home-closing-title">
        <h2 id="home-closing-title" className={styles.closingLine}>
          The best model is the one you can <em>watch win</em>.
        </h2>
        <Link className={styles.closingCta} href="/studio">
          Open Studio
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
