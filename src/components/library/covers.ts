import { withWebpCloudMaxWidth } from "@/utils/assets";

/**
 * Widest grid card is about 176px inside max-w-3xl (4 columns).
 * 360px is ~2× for retina, including ~115px phone cards at 3×.
 * Keep in sync with `.library-grid` in library.css.
 */
export const LIBRARY_COVER_THUMB_MAX_WIDTH = 360;

/**
 * Modal poster CSS is at most 11.25rem (~180px). 360 is 2× that and matches
 * the grid thumb URL, so opening a card reuses the already-fetched variant.
 * 540+ is a separate cache key; large posters 504 there on a cold miss.
 * Keep in sync with `.library-dialog-poster` in library.css.
 */
export const LIBRARY_COVER_MODAL_MAX_WIDTH = 360;

export const LIBRARY_COVER_SIZES =
  "(min-width: 72rem) 10rem, (min-width: 40rem) 8.25rem, 30vw";

/** Overrides the proxy dashboard quality for library covers only. */
export const LIBRARY_COVER_QUALITY = 60;

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
  return withWebpCloudMaxWidth(
    url,
    LIBRARY_COVER_THUMB_MAX_WIDTH,
    LIBRARY_COVER_QUALITY
  );
}

export function libraryModalCover(url: string): string {
  return withWebpCloudMaxWidth(
    url,
    LIBRARY_COVER_MODAL_MAX_WIDTH,
    LIBRARY_COVER_QUALITY
  );
}
