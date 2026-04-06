import type { ViewState } from "./types";

export const CARD_WIDTH = 208;
export const CARD_HEIGHT = 104;
export const CARD_GAP = 16;
export const MAP_HORIZONTAL_PADDING = 32;
export const MAP_VERTICAL_PADDING = 32;
export const TIMELINE_HEADER_HEIGHT = 72;
export const TIMELINE_START_HOUR = 8;
export const TIMELINE_END_HOUR = 16;
export const TIMELINE_BUCKET_SAFE_PADDING = 18;
export const TIMELINE_COLUMN_MIN_WIDTH =
  CARD_WIDTH + TIMELINE_BUCKET_SAFE_PADDING * 2;
export const TIMELINE_COLUMN_MAX_WIDTH = 420;
export const TIMELINE_COLUMN_ZOOM_STEP = 28;
export const TIMELINE_HOME_VIEW_PADDING = 24;
export const MIN_SCALE = 0.2;
export const MAX_SCALE = 1;

export const INITIAL_VIEW: ViewState = {
  x: 0,
  y: 0,
  scale: 1,
};

export const DEFAULT_SELECTED_CARD_ID: string | null = null;
