// Lightweight client-side structural similarity (8×8 grayscale, mean-squared
// difference → 0–100). Best-effort: returns null if an image can't be read
// (e.g. cross-origin without CORS). Semantic (vision-LLM) scoring comes later.

function loadGrayscale(src: string): Promise<number[] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, 8, 8);
        const { data } = ctx.getImageData(0, 0, 8, 8);
        const out: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          out.push(
            (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255,
          );
        }
        resolve(out);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function structuralSimilarity(
  referenceSrc: string,
  candidateSrc: string,
): Promise<number | null> {
  const [a, b] = await Promise.all([
    loadGrayscale(referenceSrc),
    loadGrayscale(candidateSrc),
  ]);
  if (!a || !b) {
    return null;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  const rmse = Math.sqrt(sum / a.length);
  return Math.max(0, Math.min(100, Math.round((1 - rmse) * 100)));
}
