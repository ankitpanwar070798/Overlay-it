export interface ImageEffects {
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  pixelate: number;
  noise: number;
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
}
export type EffectTarget = "background" | "subject";
export const defaultEffects = (): ImageEffects => ({ blur: 0, brightness: 0, contrast: 0, saturation: 0, hue: 0, pixelate: 0, noise: 0, grayscale: false, sepia: false, invert: false });
export const hasEffects = (effects: ImageEffects) => Object.values(effects).some(Boolean);
