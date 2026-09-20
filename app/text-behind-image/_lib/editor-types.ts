export interface TextLayer {
  id: number;
  text: string;
  fontFamily: string;
  top: number;
  left: number;
  color: string;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  shadowColor: string;
  shadowSize: number;
  rotation: number;
  placement: LayerPlacement;
  textEffect: "normal" | "behind" | "knockout";
  outlineWidth: number;
  zIndex: number;
}

export type TextLayerAttribute = Exclude<keyof TextLayer, "id">;
export type LayerPlacement = "behind" | "front";
export type LayerKind = "text" | "image";

export interface ImageLayer {
  id: number;
  name: string;
  src: string;
  top: number;
  left: number;
  width: number;
  opacity: number;
  rotation: number;
  placement: LayerPlacement;
  zIndex: number;
}

export interface LayerSelection {
  id: number;
  kind: LayerKind;
}

export const createTextLayer = (id: number): TextLayer => ({
  id,
  text: "YOUR TEXT",
  fontFamily: "Inter",
  top: 0,
  left: 0,
  color: "#ffffff",
  fontSize: 100,
  fontWeight: 800,
  opacity: 1,
  shadowColor: "rgba(0, 0, 0, 0.8)",
  shadowSize: 0,
  rotation: 0,
  placement: "behind",
  textEffect: "behind",
  outlineWidth: 2,
  zIndex: id,
});

export const createImageLayer = (
  id: number,
  src: string,
  name: string,
): ImageLayer => ({
  id,
  name,
  src,
  top: 0,
  left: 0,
  width: 32,
  opacity: 1,
  rotation: 0,
  placement: "front",
  zIndex: id,
});
