import { Box3, Group, Mesh, Texture, Vector3, type Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

export type ModelEntry = {
  status: "loading" | "ready" | "error";
  progress: number | null;
  scene?: Group;
  error?: string;
};

export function disposeModel(scene: Object3D) {
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<Mesh["material"] extends (infer M)[] ? M : never>();
  const textures = new Set<Texture>();
  scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];
    list.forEach(material => {
      // Material texture properties include normal, roughness, emissive and extensions.
      Object.values(material).forEach(value => {
        if (value instanceof Texture) textures.add(value);
      });
      materials.add(material as never);
    });
  });
  geometries.forEach(value => value.dispose());
  (materials as Set<{ dispose: () => void }>).forEach(value => value.dispose());
  textures.forEach(value => {
    value.dispose();
    if (
      typeof ImageBitmap !== "undefined" &&
      value.image instanceof ImageBitmap
    )
      value.image.close();
  });
}

/** Cache owned by one page. A failed request is retried only by explicit user action. */
export class ModelStore {
  private entries = new Map<string, ModelEntry>();
  private requests = new Set<AbortController>();
  private listeners = new Set<() => void>();
  private disposed = false;
  private version = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  snapshot = () => this.version;
  get = (url: string) => this.entries.get(url);
  private notify() {
    this.version++;
    this.listeners.forEach(listener => listener());
  }

  load(url: string) {
    if (this.entries.has(url) || this.disposed) return;
    const controller = new AbortController();
    this.requests.add(controller);
    this.entries.set(url, { status: "loading", progress: null });
    this.notify();
    // Timeout prevents an unreachable asset from leaving a permanent spinner.
    const timeout = setTimeout(() => controller.abort(), 45000);
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const total = Number(response.headers.get("content-length"));
        let buffer: ArrayBuffer;
        if (response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let received = 0;
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (!this.disposed) {
              this.entries.set(url, {
                status: "loading",
                progress:
                  total > 0
                    ? Math.min(99, Math.round((received / total) * 100))
                    : null,
              });
              this.notify();
            }
          }
          const merged = new Uint8Array(received);
          let offset = 0;
          chunks.forEach(chunk => {
            merged.set(chunk, offset);
            offset += chunk.length;
          });
          buffer = merged.buffer;
        } else buffer = await response.arrayBuffer();
        if (this.disposed) return;
        const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
        const gltf = await loader.parseAsync(
          buffer,
          url.slice(0, url.lastIndexOf("/") + 1)
        );
        if (this.disposed) {
          disposeModel(gltf.scene);
          return;
        }
        const box = new Box3().setFromObject(gltf.scene);
        if (box.isEmpty()) {
          disposeModel(gltf.scene);
          throw new Error("模型不包含可显示的几何体");
        }
        const size = box.getSize(new Vector3());
        const longest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(longest) || longest <= 0) {
          disposeModel(gltf.scene);
          throw new Error("模型尺寸无效");
        }
        const centre = box.getCenter(new Vector3());
        // Normalize once; display and room transforms remain independent of source units.
        gltf.scene.position.sub(centre);
        const normalized = new Group();
        normalized.add(gltf.scene);
        normalized.scale.setScalar(1 / longest);
        gltf.scene.traverse(object => {
          if (object instanceof Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        this.entries.set(url, {
          status: "ready",
          progress: 100,
          scene: normalized,
        });
      } catch (error) {
        if (!this.disposed)
          this.entries.set(url, {
            status: "error",
            progress: null,
            error: error instanceof Error ? error.message : "模型加载失败",
          });
      } finally {
        clearTimeout(timeout);
        this.requests.delete(controller);
        if (!this.disposed) this.notify();
      }
    })();
  }
  retry(url: string) {
    if (this.entries.get(url)?.status === "error") {
      this.entries.delete(url);
      this.load(url);
    }
  }
  dispose() {
    this.disposed = true;
    this.requests.forEach(controller => controller.abort());
    this.requests.clear();
    this.entries.forEach(entry => {
      if (entry.scene) disposeModel(entry.scene);
    });
    this.entries.clear();
    this.listeners.clear();
  }
}
