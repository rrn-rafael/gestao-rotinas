import type { ViewState } from "./types";

export const COLUMN_WIDTH = 232;
export const COLUMN_GAP = 40;
export const CARD_WIDTH = 208;
export const CARD_HEIGHT = 104;
export const CARD_GAP = 16;
export const MAP_PADDING = 40;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 1.8;

export const INITIAL_VIEW: ViewState = {
  x: 80,
  y: 40,
  scale: 1,
};

export const DEFAULT_SELECTED_CARD_ID: string | null = null;
