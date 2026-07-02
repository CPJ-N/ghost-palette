import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ghost Palette — compare AI image and video models side by side";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "88px",
          background: "#0a0a0b",
          color: "#f5f5f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#f5f5f5",
              color: "#0a0a0b",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            GP
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Ghost Palette
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            maxWidth: 980,
          }}
        >
          Every model, judged in the same light.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 28,
            lineHeight: 1.4,
            color: "#9a9a9a",
            maxWidth: 900,
          }}
        >
          Generate and compare AI images &amp; video across FLUX, Stable Diffusion, Recraft,
          Seedream, Kling, Luma and more — one prompt, one grid.
        </div>
      </div>
    ),
    { ...size },
  );
}
