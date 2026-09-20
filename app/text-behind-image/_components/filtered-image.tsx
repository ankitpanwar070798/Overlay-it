"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import Konva from "konva";
import { Image as CanvasImage } from "react-konva";
import { hasEffects, type ImageEffects } from "../_lib/image-effects";

/** Cache only the photo, at export resolution; text stays vector-sharp. */
export default function FilteredImage({ image, width, height, effects }: { image: HTMLImageElement; width: number; height: number; effects: ImageEffects }) {
  const ref = useRef<Konva.Image>(null);
  const active = hasEffects(effects);
  const ratio = Math.min(image.naturalWidth / width, Math.sqrt(32_000_000 / (width * height)));
  const filters = useMemo(() => {
    const list = [];
    if (effects.brightness) list.push(Konva.Filters.Brightness);
    if (effects.contrast) list.push(Konva.Filters.Contrast);
    if (effects.hue || effects.saturation) list.push(Konva.Filters.HSL);
    if (effects.grayscale || effects.saturation === -100) list.push(Konva.Filters.Grayscale);
    if (effects.sepia) list.push(Konva.Filters.Sepia);
    if (effects.invert) list.push(Konva.Filters.Invert);
    if (effects.pixelate) list.push(Konva.Filters.Pixelate);
    if (effects.blur) list.push(Konva.Filters.Blur);
    if (effects.noise) list.push(Konva.Filters.Noise);
    return list;
  }, [effects]);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (active) node.cache({ pixelRatio: ratio, imageSmoothingEnabled: true });
    else node.clearCache();
    node.getLayer()?.batchDraw();
    return () => { node.clearCache(); };
  }, [image, width, height, ratio, active]);
  return <CanvasImage ref={ref} image={image} width={width} height={height} listening={false}
    filters={filters} brightness={1 + effects.brightness / 100} contrast={effects.contrast}
    saturation={effects.saturation === -100 ? 0 : Math.log2(1 + effects.saturation / 100)} hue={effects.hue}
    blurRadius={effects.blur * width / 1000} pixelSize={Math.max(1, effects.pixelate * width / 1000)} noise={effects.noise / 100}/>;
}
