export type ImageSize = {
  width: number;
  height: number;
};

export type ImageSizeParse =
  | { status: "ok"; size: ImageSize }
  | { status: "need-more" }
  | { status: "unsupported" };

const MAX_EDGE = 100_000;

function ok(width: number, height: number): ImageSizeParse {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > MAX_EDGE ||
    height > MAX_EDGE
  ) {
    return { status: "unsupported" };
  }
  return { status: "ok", size: { width, height } };
}

function applyOrientation(
  size: ImageSize,
  orientation: number | null
): ImageSize {
  if (orientation != null && orientation >= 5 && orientation <= 8) {
    return { width: size.height, height: size.width };
  }
  return size;
}

function readExifOrientation(segment: Uint8Array): number | null {
  if (segment.length < 14) return null;
  if (
    segment[0] !== 0x45 ||
    segment[1] !== 0x78 ||
    segment[2] !== 0x69 ||
    segment[3] !== 0x66 ||
    segment[4] !== 0 ||
    segment[5] !== 0
  ) {
    return null;
  }
  const tiff = segment.subarray(6);
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d;
  if (!le && !be) return null;
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  if (tiff.length < 8 || view.getUint16(2, le) !== 42) return null;
  const ifd = view.getUint32(4, le);
  if (ifd + 2 > tiff.length) return null;
  const count = view.getUint16(ifd, le);
  for (let entry = 0; entry < count; entry += 1) {
    const offset = ifd + 2 + entry * 12;
    if (offset + 12 > tiff.length) return null;
    if (view.getUint16(offset, le) === 0x0112) {
      return view.getUint16(offset + 8, le);
    }
  }
  return null;
}

function parseJpeg(data: Uint8Array): ImageSizeParse {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return { status: "unsupported" };
  }
  let orientation: number | null = null;
  let size: ImageSize | null = null;
  let offset = 2;
  while (offset + 1 < data.length) {
    if (data[offset] !== 0xff) break;
    while (offset < data.length && data[offset] === 0xff) offset += 1;
    if (offset >= data.length) break;
    const marker = data[offset];
    offset += 1;
    if (marker === 0xda || marker === 0xd9) break;
    if (
      marker === 0x00 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd8)
    ) {
      continue;
    }
    if (offset + 2 > data.length) return { status: "need-more" };
    const segLen = (data[offset] << 8) | data[offset + 1];
    if (segLen < 2) return { status: "unsupported" };
    if (offset + segLen > data.length) {
      if (size) break;
      return { status: "need-more" };
    }
    const payload = data.subarray(offset + 2, offset + segLen);
    const sof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;
    if (sof && payload.length >= 5) {
      const height = (payload[1] << 8) | payload[2];
      const width = (payload[3] << 8) | payload[4];
      const parsed = ok(width, height);
      if (parsed.status !== "ok") return parsed;
      size = parsed.size;
    } else if (marker === 0xe1) {
      const found = readExifOrientation(payload);
      if (found) orientation = found;
    }
    offset += segLen;
    if (size && orientation) break;
  }
  if (!size) {
    return offset + 1 >= data.length
      ? { status: "need-more" }
      : { status: "unsupported" };
  }
  const oriented = applyOrientation(size, orientation);
  return ok(oriented.width, oriented.height);
}

function parsePng(data: Uint8Array): ImageSizeParse {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (data.length < sig.length) {
    return data.every((byte, index) => byte === sig[index])
      ? { status: "need-more" }
      : { status: "unsupported" };
  }
  for (let index = 0; index < sig.length; index += 1) {
    if (data[index] !== sig[index]) return { status: "unsupported" };
  }
  if (data.length < 24) return { status: "need-more" };
  if (
    data[12] !== 0x49 ||
    data[13] !== 0x48 ||
    data[14] !== 0x44 ||
    data[15] !== 0x52
  ) {
    return { status: "unsupported" };
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return ok(view.getUint32(16), view.getUint32(20));
}

function parseGif(data: Uint8Array): ImageSizeParse {
  if (data.length < 6) return { status: "need-more" };
  const header = String.fromCharCode(...data.subarray(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") {
    return { status: "unsupported" };
  }
  if (data.length < 10) return { status: "need-more" };
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return ok(view.getUint16(6, true), view.getUint16(8, true));
}

function parseWebp(data: Uint8Array): ImageSizeParse {
  if (data.length < 12) return { status: "need-more" };
  const riff =
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46;
  const webp =
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50;
  if (!riff || !webp) return { status: "unsupported" };
  if (data.length < 16) return { status: "need-more" };
  const chunk = String.fromCharCode(data[12], data[13], data[14], data[15]);
  if (chunk === "VP8X") {
    if (data.length < 30) return { status: "need-more" };
    const width = 1 + data[24] + (data[25] << 8) + (data[26] << 16);
    const height = 1 + data[27] + (data[28] << 8) + (data[29] << 16);
    return ok(width, height);
  }
  if (chunk === "VP8 ") {
    if (data.length < 30) return { status: "need-more" };
    const width = data[26] | ((data[27] & 0x3f) << 8);
    const height = data[28] | ((data[29] & 0x3f) << 8);
    return ok(width, height);
  }
  if (chunk === "VP8L") {
    if (data.length < 25) return { status: "need-more" };
    const b1 = data[21];
    const b2 = data[22];
    const b3 = data[23];
    const b4 = data[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return ok(width, height);
  }
  return { status: "unsupported" };
}

function parseIsoBmff(data: Uint8Array): ImageSizeParse {
  if (data.length < 12) return { status: "need-more" };
  const ftyp =
    data[4] === 0x66 &&
    data[5] === 0x74 &&
    data[6] === 0x79 &&
    data[7] === 0x70;
  if (!ftyp) return { status: "unsupported" };
  for (let index = 0; index + 16 <= data.length; index += 1) {
    if (
      data[index] !== 0x69 ||
      data[index + 1] !== 0x73 ||
      data[index + 2] !== 0x70 ||
      data[index + 3] !== 0x65
    ) {
      continue;
    }
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const parsed = ok(view.getUint32(index + 8), view.getUint32(index + 12));
    if (parsed.status === "ok") return parsed;
  }
  return { status: "need-more" };
}

export function parseImageSizeDetailed(data: Uint8Array): ImageSizeParse {
  if (data.length === 0) return { status: "need-more" };
  if (data[0] === 0xff && (data.length < 2 || data[1] === 0xd8)) {
    return parseJpeg(data);
  }
  if (data[0] === 137) return parsePng(data);
  if (data[0] === 0x47) return parseGif(data);
  if (data[0] === 0x52) return parseWebp(data);
  if (
    data.length >= 12 &&
    data[4] === 0x66 &&
    data[5] === 0x74 &&
    data[6] === 0x79 &&
    data[7] === 0x70
  ) {
    return parseIsoBmff(data);
  }
  return { status: "unsupported" };
}

export function parseImageSize(data: Uint8Array): ImageSize | null {
  const parsed = parseImageSizeDetailed(data);
  return parsed.status === "ok" ? parsed.size : null;
}
