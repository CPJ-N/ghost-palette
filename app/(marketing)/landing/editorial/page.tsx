import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { MODELS } from "@/lib/models";

import { LANDING_IMAGES, LANDING_VIDEOS } from "../_media";
import styles from "./landing.module.css";

// Public roster only — internal/non-commercial models stay hidden.
const ROSTER = MODELS.filter((model) => !model.internal);

const PROCESS = [
  {
    n: "01",
    title: "Create",
    body: "Write one brief and choose the image and video models worth testing.",
  },
  {
    n: "02",
    title: "Compare",
    body: "Every model renders the same prompt in parallel, judged on one wall.",
  },
  {
    n: "03",
    title: "Save",
    body: "Every render, the winner, and the reference edits are saved automatically to your Gallery.",
  },
];

// A few generated stills as quiet evidence under the headline.
const EVIDENCE = LANDING_IMAGES.slice(0, 5);

export default function EditorialLandingPage() {
  return (
    <main className={styles.page}>
      <MarketingNav
        links={[
          { href: "/leaderboard", label: "Model scores" },
          { href: "/docs", label: "Docs" },
          { href: "/pricing", label: "Pricing" },
        ]}
      />

      <section className={styles.hero} aria-labelledby="editorial-title">
        <p className={styles.eyebrow}>Ghost Palette — model evaluation studio</p>
        <h1 id="editorial-title" className={styles.title}>
          The evaluation layer for image &amp; video models.
        </h1>
        <div className={styles.heroFoot}>
          <p className={styles.lede}>
            Run one prompt across every leading model, weigh the results on the
            same evidence, and ship the output that wins.
          </p>
          <div className={styles.actions}>
            <Link className="gp-button gp-button--primary" href="/studio">
              Open Studio
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link className="gp-button gp-button--ghost" href="/benchmark">
              See benchmarks
            </Link>
          </div>
        </div>
      </section>

      <hr className={styles.rule} />

      <section className={styles.evidence} aria-label="Sample outputs">
        <figure className={styles.clip}>
          <video src={LANDING_VIDEOS[0]} autoPlay muted loop playsInline />
          <figcaption>Kling 2.6 Pro · video</figcaption>
        </figure>
        <div className={styles.stills}>
          {EVIDENCE.map((src, i) => (
            <figure key={src} className={styles.still}>
              <img src={src} alt="" loading="lazy" decoding="async" />
              <figcaption>{String(i + 1).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <hr className={styles.rule} />

      <section className={styles.process} aria-labelledby="editorial-process">
        <p className={styles.kicker} id="editorial-process">
          Process
        </p>
        <ol className={styles.processGrid}>
          {PROCESS.map((step) => (
            <li key={step.n} className={styles.step}>
              <span className={styles.stepN}>{step.n}</span>
              <h2 className={styles.stepTitle}>{step.title}</h2>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <hr className={styles.rule} />

      <section className={styles.roster} aria-labelledby="editorial-roster">
        <p className={styles.kicker} id="editorial-roster">
          Models compared
        </p>
        <ul className={styles.rosterList}>
          {ROSTER.map((model) => (
            <li key={model.id} className={styles.rosterItem}>
              <span className={styles.rosterName}>{model.name}</span>
              <span className={styles.rosterKind}>
                {model.kind === "video" ? "video" : "image"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <hr className={styles.rule} />

      <section className={styles.closing} aria-labelledby="editorial-closing">
        <h2 id="editorial-closing" className={styles.closingTitle}>
          Start with the image. Let the model choice get smarter.
        </h2>
        <Link className="gp-button gp-button--primary" href="/studio">
          Open Studio
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
