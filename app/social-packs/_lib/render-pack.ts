export const FORMATS = [
  { id: "post", name: "Portrait post", width: 1080, height: 1350 },
  { id: "story", name: "Story / vertical cover", width: 1080, height: 1920 },
  { id: "thumbnail", name: "Video thumbnail", width: 1280, height: 720 },
] as const;
export type Format = typeof FORMATS[number];
export const THEMES = [
  { id: "studio", name: "Studio", background: "#171820", ink: "#ffffff", accent: "#d9ff5a", font: "Arial" },
  { id: "paper", name: "Editorial", background: "#f3eee5", ink: "#25221e", accent: "#be482e", font: "Georgia" },
  { id: "violet", name: "Electric", background: "#342061", ink: "#ffffff", accent: "#e4cbff", font: "Arial" },
] as const;
export type Theme = typeof THEMES[number];
export interface Framing { mode: "fit" | "fill"; x: number; y: number; }
export interface PackContent { headline: string; detail: string; label: string; brand: string; }

/** Split even long unbroken words so no text can overflow the export. */
export function wrapText(context: Pick<CanvasRenderingContext2D, "measureText">, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= width) { line = candidate; continue; }
    if (line) { lines.push(line); line = ""; }
    for (const character of Array.from(word)) {
      if (line && context.measureText(line + character).width > width) { lines.push(line); line = ""; }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, height: number, size: number, font: string, weight: number) {
  let lines: string[] = [];
  // Fit to the space instead of truncating the user's copy.
  do {
    ctx.font = `${weight} ${size}px ${font}`;
    lines = wrapText(ctx, text, width);
    if (lines.length * size * 1.16 <= height) break;
    size -= 1;
  } while (size > 10);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * size * 1.16));
}

export function renderPack(canvas: HTMLCanvasElement, image: HTMLImageElement, format: Format, theme: Theme, content: PackContent, framing: Framing) {
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not create an image canvas.");
  const { width: w, height: h } = format;
  const wide = format.id === "thumbnail";
  const story = format.id === "story";
  const margin = wide ? 56 : 72;
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, w, h);
  // Deliberately compose each format, rather than cropping an existing design.
  const photo = wide
    ? { x: w * .49, y: 32, width: w * .49 - 16, height: h - 64 }
    : { x: margin, y: story ? 600 : 460, width: w - margin * 2, height: story ? 1010 : 700 };
  ctx.save();
  ctx.beginPath();
  ctx.rect(photo.x, photo.y, photo.width, photo.height);
  ctx.clip();
  ctx.fillStyle = theme.id === "paper" ? "#e5dfd4" : "#0e0e16";
  ctx.fillRect(photo.x, photo.y, photo.width, photo.height);
  const scale = (framing.mode === "fit" ? Math.min : Math.max)(photo.width / image.naturalWidth, photo.height / image.naturalHeight);
  const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, photo.x + (photo.width - iw) * framing.x / 100, photo.y + (photo.height - ih) * framing.y / 100, iw, ih);
  ctx.restore();
  ctx.textBaseline = "top";
  const textWidth = wide ? w * .49 - margin - 24 : w - margin * 2;
  const top = story ? 190 : wide ? 88 : 72;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(margin, top, 40, 5);
  textBlock(ctx, content.label.toUpperCase(), margin, top + 24, textWidth, 50, 24, "Arial", 700);
  ctx.fillStyle = theme.ink;
  textBlock(ctx, content.headline, margin, top + 90, textWidth, wide ? 260 : story ? 190 : 185, wide ? 66 : 84, theme.font, 700);
  ctx.globalAlpha = .8;
  textBlock(ctx, content.detail, margin, wide ? 470 : story ? 495 : 365, textWidth, wide ? 110 : 75, wide ? 27 : 30, "Arial", 400);
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.accent;
  textBlock(ctx, content.brand, margin, wide ? h - 88 : story ? h - 230 : h - 105, textWidth, 55, 26, "Arial", 700);
}
