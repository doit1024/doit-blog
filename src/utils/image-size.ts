import fs from "node:fs";
import path from "node:path";
import { getOriginImage, toWebpCloudUrl } from "./assets";
import { parseImageSizeDetailed, type ImageSize } from "./image-size-parse";

export type { ImageSize };

const CACHE_PATH = path.join(process.cwd(), ".cache", "image-dimensions.json");
const RANGE_LENGTHS = [64 * 1024, 512 * 1024, 2 * 1024 * 1024];
const MAX_CONCURRENT = 6;
const FETCH_TIMEOUT_MS = 12_000;

const memory = new Map<string, ImageSize | null>();
const inflight = new Map<string, Promise<ImageSize | null>>();

let diskLoaded = false;
let diskMap: Record<string, ImageSize> = {};
let active = 0;
const waiters: Array<() => void> = [];

function isSize(value: unknown): value is ImageSize {
  if (!value || typeof value !== "object") return false;
  const { width, height } = value as ImageSize;
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= 100_000 &&
    height <= 100_000
  );
}

function loadDisk(): void {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return;
    for (const [key, value] of Object.entries(parsed)) {
      if (isSize(value)) diskMap[key] = value;
    }
  } catch {
    diskMap = {};
  }
}

function persist(key: string, size: ImageSize): void {
  loadDisk();
  diskMap[key] = size;
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    const tmp = `${CACHE_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(diskMap));
    fs.renameSync(tmp, CACHE_PATH);
  } catch {
    // Dimension cache is an optimization. A failed write must not fail the build.
  }
}

export function imageDimensionKey(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    const pathOnly = trimmed.split(/[?#]/, 1)[0] ?? trimmed;
    if (!pathOnly || pathOnly.includes("..")) return null;
    return `public:${pathOnly}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return toWebpCloudUrl(parsed.toString());
  } catch {
    return null;
  }
}

export function rememberImageSize(url: string, size: ImageSize): void {
  const key = imageDimensionKey(url);
  if (!key || !isSize(size)) return;
  memory.set(key, size);
  persist(key, size);
}

function lookup(key: string): ImageSize | null | undefined {
  if (memory.has(key)) return memory.get(key) ?? null;
  loadDisk();
  const cached = diskMap[key];
  if (cached) {
    memory.set(key, cached);
    return cached;
  }
  return undefined;
}

async function withLimit<T>(run: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => {
      waiters.push(resolve);
    });
  }
  active += 1;
  try {
    return await run();
  } finally {
    active -= 1;
    const next = waiters.shift();
    if (next) next();
  }
}

async function fetchPrefix(
  url: string,
  length: number
): Promise<Uint8Array | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Range: `bytes=0-${length - 1}`,
        Accept:
          "image/jpeg,image/png,image/gif,image/webp,image/avif,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; doit-blog-build/1.0; +https://doooit.me)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok && response.status !== 206) return null;
    if (!response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received < length) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      received += value.byteLength;
    }
    await reader.cancel().catch(() => undefined);
    const out = new Uint8Array(Math.min(received, length));
    let offset = 0;
    for (const chunk of chunks) {
      const take = Math.min(chunk.byteLength, out.length - offset);
      if (take <= 0) break;
      out.set(chunk.subarray(0, take), offset);
      offset += take;
    }
    return out.subarray(0, offset);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function probeRemote(url: string): Promise<ImageSize | null> {
  for (const length of RANGE_LENGTHS) {
    const bytes = await fetchPrefix(url, length);
    if (!bytes || bytes.byteLength === 0) return null;
    const parsed = parseImageSizeDetailed(bytes);
    if (parsed.status === "ok") return parsed.size;
    if (parsed.status === "unsupported") return null;
    if (bytes.byteLength < length) return null;
  }
  return null;
}

async function probeLocal(pathname: string): Promise<ImageSize | null> {
  const relative = pathname.replace(/^\/+/, "");
  const full = path.join(process.cwd(), "public", relative);
  let handle: fs.promises.FileHandle | null = null;
  try {
    handle = await fs.promises.open(full, "r");
    const stat = await handle.stat();
    if (!stat.isFile()) return null;
    for (const length of RANGE_LENGTHS) {
      const take = Math.min(stat.size, length);
      const buf = new Uint8Array(take);
      await handle.read(buf, 0, take, 0);
      const parsed = parseImageSizeDetailed(buf);
      if (parsed.status === "ok") return parsed.size;
      if (parsed.status === "unsupported") return null;
      if (take < length || take === stat.size) return null;
    }
    return null;
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function probe(key: string): Promise<ImageSize | null> {
  if (key.startsWith("public:")) {
    return probeLocal(key.slice("public:".length));
  }
  const size = await withLimit(() => probeRemote(key));
  if (size) return size;
  const origin = getOriginImage(key);
  if (origin === key) return null;
  return withLimit(() => probeRemote(origin));
}

export async function resolveImageSize(url: string): Promise<ImageSize | null> {
  const key = imageDimensionKey(url);
  if (!key) return null;
  const known = lookup(key);
  if (known !== undefined) return known;
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = probe(key)
    .then(size => {
      memory.set(key, size);
      if (size) persist(key, size);
      return size;
    })
    .catch(() => {
      memory.set(key, null);
      return null;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, job);
  return job;
}
