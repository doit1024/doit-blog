import { NotionRenderer } from "react-notion-x";
import type { ExtendedRecordMap } from "notion-types";
import type { ImgHTMLAttributes } from "react";
import { mapBbImageUrl } from "@/utils/assets";

type BbImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  zoomable?: boolean;
  blurDataURL?: string;
  placeholder?: string;
  priority?: boolean;
};

function BbImage(props: BbImageProps) {
  const { src, alt, priority, ...rest } = props;
  Reflect.deleteProperty(rest, "zoomable");
  Reflect.deleteProperty(rest, "blurDataURL");
  Reflect.deleteProperty(rest, "placeholder");
  return (
    <img
      {...rest}
      src={src}
      alt={alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

export function BbNotion({ recordMap }: { recordMap: ExtendedRecordMap }) {
  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={false}
      darkMode={false}
      mapImageUrl={url => mapBbImageUrl(url ?? "")}
      components={{ Image: BbImage }}
    />
  );
}
