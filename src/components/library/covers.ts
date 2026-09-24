import { withWebpCloudMaxWidth } from "@/utils/assets";

/**
 * Widest grid card is about 176px inside max-w-3xl (4 columns).
 * 360px is ~2× for retina, including ~115px phone cards at 3×.
 * Keep in sync with `.library-grid` in library.css.
 */
export const LIBRARY_COVER_THUMB_MAX_WIDTH = 360;

/**
 * Modal poster CSS is at most 11.25rem (~180px). 540px is 3× that and still
 * above the 360px thumb. Wider caps (600+) 504 on large posters and do not
 * fill the cache, so this stays at 540.
 * Keep in sync with `.library-dialog-poster` in library.css.
 */
export const LIBRARY_COVER_MODAL_MAX_WIDTH = 540;

/** 2:3 box, matching `.poster { aspect-ratio: 2 / 3 }`. */
export function libraryCoverBox(maxWidth: number): {
  width: number;
  height: number;
} {
  return {
    width: maxWidth,
    height: Math.round((maxWidth * 3) / 2),
  };
}

export function libraryThumbCover(url: string): string {
  return withWebpCloudMaxWidth(url, LIBRARY_COVER_THUMB_MAX_WIDTH);
}

export function libraryModalCover(url: string): string {
  return withWebpCloudMaxWidth(url, LIBRARY_COVER_MODAL_MAX_WIDTH);
}
