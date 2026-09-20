import { useStore } from "zustand";
import { create } from "zustand";
import { temporal, type TemporalState } from "zundo";
import { defaultEffects, type ImageEffects, type EffectTarget } from "./image-effects";
import {
  createImageLayer,
  createTextLayer,
  type ImageLayer,
  type LayerKind,
  type LayerSelection,
  type TextLayer,
} from "./editor-types";

interface EditorStore {
  effects: Record<EffectTarget, ImageEffects>;
  updateEffects: (target: EffectTarget, patch: Partial<ImageEffects>) => void;
  resetEffects: (target: EffectTarget) => void;
  selectedLayer: LayerSelection | null;
  textLayers: TextLayer[];
  imageLayers: ImageLayer[];
  addTextLayer: () => void;
  addImageLayer: (src: string, name: string) => void;
  duplicateTextLayer: (layer: TextLayer) => void;
  duplicateImageLayer: (layer: ImageLayer) => void;
  removeLayer: (kind: LayerKind, id: number) => void;
  resetDocument: () => void;
  selectLayer: (selection: LayerSelection | null) => void;
  updateTextLayer: (id: number, patch: Partial<Omit<TextLayer, "id">>) => void;
  updateImageLayer: (id: number, patch: Partial<Omit<ImageLayer, "id">>) => void;
  bringLayerToFront: (kind: LayerKind, id: number) => void;
  sendLayerBehind: (kind: LayerKind, id: number) => void;
}

type EditorHistoryState = Pick<EditorStore, "textLayers" | "imageLayers" | "effects">;

const nextId = (state: Pick<EditorStore, "textLayers" | "imageLayers">) =>
  Math.max(0, ...state.textLayers.map((layer) => layer.id), ...state.imageLayers.map((layer) => layer.id)) + 1;
const nextZ = (state: Pick<EditorStore, "textLayers" | "imageLayers">) =>
  Math.max(0, ...state.textLayers.map((layer) => layer.zIndex), ...state.imageLayers.map((layer) => layer.zIndex)) + 1;

export const useEditorStore = create<EditorStore>()(
  temporal<EditorStore, [], [], EditorHistoryState>(
    (set, get) => ({
      effects: { background: defaultEffects(), subject: defaultEffects() },
      updateEffects: (target, patch) => set(state => ({ effects: { ...state.effects, [target]: { ...state.effects[target], ...patch } } })),
      resetEffects: target => set(state => ({ effects: { ...state.effects, [target]: defaultEffects() } })),
      selectedLayer: null,
      textLayers: [],
      imageLayers: [],
      addTextLayer: () => {
        const id = nextId(get());
        set((state) => ({
          selectedLayer: { kind: "text", id },
          textLayers: [...state.textLayers, { ...createTextLayer(id), zIndex: nextZ(state) }],
        }));
      },
      addImageLayer: (src, name) => {
        const id = nextId(get());
        set((state) => ({
          selectedLayer: { kind: "image", id },
          imageLayers: [...state.imageLayers, { ...createImageLayer(id, src, name), zIndex: nextZ(state) }],
        }));
      },
      duplicateTextLayer: (layer) => {
        const id = nextId(get());
        set((state) => ({
          selectedLayer: { kind: "text", id },
          textLayers: [...state.textLayers, { ...layer, id, left: layer.left + 4, top: layer.top - 4, zIndex: nextZ(state) }],
        }));
      },
      duplicateImageLayer: (layer) => {
        const id = nextId(get());
        set((state) => ({
          selectedLayer: { kind: "image", id },
          imageLayers: [...state.imageLayers, { ...layer, id, name: `${layer.name} copy`, left: layer.left + 4, top: layer.top - 4, zIndex: nextZ(state) }],
        }));
      },
      removeLayer: (kind, id) => set((state) => ({
        selectedLayer: state.selectedLayer?.kind === kind && state.selectedLayer.id === id ? null : state.selectedLayer,
        textLayers: kind === "text" ? state.textLayers.filter((layer) => layer.id !== id) : state.textLayers,
        imageLayers: kind === "image" ? state.imageLayers.filter((layer) => layer.id !== id) : state.imageLayers,
      })),
      resetDocument: () => set({ selectedLayer: null, textLayers: [], imageLayers: [], effects: { background: defaultEffects(), subject: defaultEffects() } }),
      selectLayer: (selectedLayer) => set({ selectedLayer }),
      updateTextLayer: (id, patch) => set((state) => ({ textLayers: state.textLayers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer) })),
      updateImageLayer: (id, patch) => set((state) => ({ imageLayers: state.imageLayers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer) })),
      bringLayerToFront: (kind, id) => {
        const zIndex = nextZ(get());
        set((state) => ({
          selectedLayer: { kind, id },
          textLayers: kind === "text" ? state.textLayers.map((layer) => layer.id === id ? { ...layer, placement: "front", textEffect: "normal", zIndex } : layer) : state.textLayers,
          imageLayers: kind === "image" ? state.imageLayers.map((layer) => layer.id === id ? { ...layer, placement: "front", zIndex } : layer) : state.imageLayers,
        }));
      },
      sendLayerBehind: (kind, id) => set((state) => ({
        selectedLayer: { kind, id },
        textLayers: kind === "text" ? state.textLayers.map((layer) => layer.id === id ? { ...layer, placement: "behind", textEffect: "behind" } : layer) : state.textLayers,
        imageLayers: kind === "image" ? state.imageLayers.map((layer) => layer.id === id ? { ...layer, placement: "behind" } : layer) : state.imageLayers,
      })),
    }),
    {
      limit: 50,
      equality: (past, current) => past.textLayers === current.textLayers && past.imageLayers === current.imageLayers && past.effects === current.effects,
      partialize: (state): EditorHistoryState => ({ textLayers: state.textLayers, imageLayers: state.imageLayers, effects: state.effects }),
    },
  ),
);

export const useEditorHistory = <T,>(selector: (state: TemporalState<EditorHistoryState>) => T) =>
  useStore(useEditorStore.temporal, selector);

export const clearEditorHistory = () => useEditorStore.temporal.getState().clear();
