import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { MODELS } from "@/lib/models";

import { LANDING_IMAGES, LANDING_VIDEOS } from "../_media";
import styles from "./landing.module.css";

// The ambient reel — the two real Kling clips interleaved with flux2-dev stills,
// crossfading. Color comes ONLY from this generated media.
const REEL = [
  { kind: "video" as const, src: LANDING_VIDEOS[0], poster: LANDING_IMAGES[0], label: "Kling 2.6 Pro" },
  { kind: "image" as const, src: LANDING_IMAGES[2], label: "FLUX.2" },
  { kind: "video" as const, src: LANDING_VIDEOS[1], poster: LANDING_IMAGES[5], label: "Kling 2.6 Pro" },
  { kind: "image" as const, src: LANDING_IMAGES[6], label: "FLUX.2" },
];

// One line of every model — image and video — for screen readers, since the
// animated reel itself is decorative and hidden from assistive tech.
const ROSTER = MODELS.filter((m) => !m.internal)
  .map((m) => m.name)
  .join(", ");

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

export default function CinematicLandingPage() {
  const reelCount = REEL.length;

  return (
    <main className={styles.page}>
      <MarketingNav
        links={[
          { href: "/docs", label: "Docs" },
          { href: "/pricing", label: "Pricing" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="cinematic-title">
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
              {/* decorative montage frame */}
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

        <div className={styles.hud} aria-hidden="true">
          <span className={styles.hudTopLeft}>Reel · image + video models</span>
          <span className={styles.hudTopRight}>
            <span className={styles.recDot} />
            Live
          </span>
        </div>

        <div className={styles.inner}>
          <p className={styles.kicker}>The evaluation layer for image &amp; video models</p>
          <h1 id="cinematic-title" className={styles.title}>
            Every model, judged in the <em>same light</em>.
          </h1>
          <p className={styles.lede}>
            One prompt, run across the leading image and video models — then
            weighed frame by frame until the strongest answer is obvious.
          </p>

          <p className={styles.srOnly}>
            Ghost Palette compares these models: {ROSTER}.
          </p>

          <div className={styles.actions}>
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

      <section className={styles.steps} aria-labelledby="cinematic-how">
        <div className={styles.stepsHead}>
          <p id="cinematic-how">How it works</p>
        </div>
        <ol className={styles.stepGrid}>
          {STEPS.map((step) => (
            <li key={step.n} className={styles.step}>
              <span className={styles.stepNum}>{step.n}</span>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.closing} aria-labelledby="cinematic-closing">
        <h2 id="cinematic-closing" className={styles.closingLine}>
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
