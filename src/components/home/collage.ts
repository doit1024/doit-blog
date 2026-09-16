export const COLLAGE_TONES = [
  "butter",
  "sage",
  "rose",
  "sky",
  "terracotta",
] as const;

export type CollageTone = (typeof COLLAGE_TONES)[number];
