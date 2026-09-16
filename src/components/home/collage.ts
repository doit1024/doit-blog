export const COLLAGE_TONES = [
  "blush",
  "candy",
  "lilac",
  "peach",
  "periwinkle",
] as const;

export type CollageTone = (typeof COLLAGE_TONES)[number];
