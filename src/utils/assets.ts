export const WEBP_CLOUD_ORIGIN = "https://d28ebb3.webp.li";
export const R2_ORIGIN = "https://asset.doooit.me";

export const getOriginImage = (webpImgUrl: string) => {
  if (webpImgUrl.startsWith(WEBP_CLOUD_ORIGIN)) {
    return webpImgUrl.replace(WEBP_CLOUD_ORIGIN, R2_ORIGIN);
  }
  return webpImgUrl;
};
