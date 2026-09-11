import {
  Component,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  Color,
  Group,
  PCFShadowMap,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { GearDevice, GearMode } from "@/data/gear";
import StudyRoom from "./StudyRoom";
import { ModelStore, type ModelEntry } from "./model-store";

type LoadStatus = {
  state: "idle" | "loading" | "ready" | "error";
  progress: number | null;
};

interface Props {
  devices: GearDevice[];
  mode: GearMode;
  selected: string;
  progress: { current: number };
  rotation: number;
  dark: boolean;
  reduced: boolean;
  visible: boolean;
  roomZoom: number;
  onSelect: (id: string) => void;
  onRoomZoom: (delta: number) => void;
  onFailure: () => void;
  onStatus: (status: LoadStatus) => void;
}

const StoreContext = createContext<ModelStore | null>(null);

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Gear model store is unavailable");
  useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  return store;
}

function useEntry(url?: string): ModelEntry | undefined {
  const store = useStore();
  useEffect(() => {
    if (url) store.load(url);
  }, [store, url]);
  return url ? store.get(url) : undefined;
}

function InvalidationBridge() {
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    const refresh = () => invalidate();
    window.addEventListener("gear:invalidate", refresh);
    return () => window.removeEventListener("gear:invalidate", refresh);
  }, [invalidate]);
  return null;
}

function GalleryModel({
  device,
  progress,
  rotation,
  reduced,
}: Pick<Props, "progress" | "rotation" | "reduced"> & { device: GearDevice }) {
  const entry = useEntry(device.asset?.display);
  const group = useRef<Group>(null);
  const scene = useMemo(() => entry?.scene?.clone(true), [entry?.scene]);
  useFrame(() => {
    if (!group.current) return;
    const scrollTurn = reduced ? 0 : (progress.current - 0.5) * Math.PI * 0.9;
    group.current.rotation.set(
      device.gallery.rotation[0],
      device.gallery.rotation[1] + rotation + scrollTurn,
      device.gallery.rotation[2]
    );
    group.current.position.y = reduced
      ? 0
      : Math.sin(progress.current * Math.PI) * 0.08;
  });
  if (!scene) return null;
  return (
    <group ref={group} scale={device.gallery.size}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}

function RoomDevice({
  device,
  selected,
  onSelect,
}: {
  device: GearDevice;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const entry = useEntry(device.asset?.room);
  const scene = useMemo(() => entry?.scene?.clone(true), [entry?.scene]);
  const choose = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onSelect(device.id);
  };
  return (
    <group
      position={device.room.position}
      rotation={device.room.rotation}
      scale={device.room.size}
      onClick={choose}
      onPointerOver={event => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {scene ? (
        <primitive object={scene} dispose={null} />
      ) : (
        // A quiet focus marker preserves each object's fixed location until its
        // verified asset is available; it does not imitate the missing device.
        <group scale={1 / device.room.size}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[selected ? 0.035 : 0.027, selected ? 0.041 : 0.032, 40]}
            />
            <meshBasicMaterial
              color={selected ? "#d3006a" : "#77786f"}
              transparent
              opacity={selected ? 0.95 : 0.5}
            />
          </mesh>
          <mesh position={[0, 0.012, 0]}>
            <sphereGeometry args={[0.009, 20, 20]} />
            <meshBasicMaterial color={selected ? "#d3006a" : "#77786f"} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Lighting({ mode, dark }: { mode: GearMode; dark: boolean }) {
  return (
    <>
      <ambientLight intensity={mode === "room" ? (dark ? 0.72 : 1.05) : 1.35} />
      <directionalLight
        position={mode === "room" ? [-3, 5, 4] : [3, 4, 5]}
        intensity={mode === "room" ? 2 : 2.7}
        color={mode === "room" ? "#fff0d2" : "#ffffff"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={12}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={0.65}
        color={dark ? "#8ea0c5" : "#dce8f2"}
      />
    </>
  );
}

function RoomCamera({
  reduced,
  roomZoom: zoom,
  onRoomZoom: onZoom,
}: Pick<Props, "reduced" | "roomZoom" | "onRoomZoom">) {
  const { camera, gl, invalidate } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const position = useRef(new Vector3());
  const focus = useMemo(() => new Vector3(0, 0.35, -0.1), []);

  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((event.clientY - rect.top) / rect.height - 0.5) * -2,
      };
      invalidate();
    };
    const onLeave = () => {
      mouse.current = { x: 0, y: 0 };
      invalidate();
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onZoom(Math.max(-0.32, Math.min(0.32, -event.deltaY * 0.0015)));
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [gl, invalidate, onZoom]);

  useEffect(() => invalidate(), [invalidate, zoom]);

  useFrame(() => {
    const yaw = mouse.current.x * 0.13;
    const baseX = 3.25;
    const baseZ = 4.25;
    const distanceScale = (5.55 - zoom) / 5.55;
    const x = baseX * Math.cos(yaw) - baseZ * Math.sin(yaw);
    const z = baseX * Math.sin(yaw) + baseZ * Math.cos(yaw);
    position.current.set(
      focus.x + x * distanceScale,
      focus.y + (2.45 + mouse.current.y * 0.18) * distanceScale,
      focus.z + z * distanceScale
    );
    if (reduced) camera.position.copy(position.current);
    else camera.position.lerp(position.current, 0.11);
    camera.lookAt(
      focus.x + mouse.current.x * 0.035,
      focus.y + mouse.current.y * 0.025,
      focus.z
    );
    if (!reduced && camera.position.distanceTo(position.current) > 0.002)
      invalidate();
  });

  return null;
}

function Scene(props: Props) {
  const { camera, gl, invalidate } = useThree();
  const current =
    props.devices.find(device => device.id === props.selected) ??
    props.devices[0];
  const store = useStore();

  useEffect(() => {
    if (props.mode === "gallery") {
      camera.position.set(0, 0.05, 4.2);
      camera.lookAt(0, 0, 0);
      const index = props.devices.indexOf(current);
      [current, props.devices[index + 1]].forEach(device => {
        if (device?.asset?.display) store.load(device.asset.display);
      });
    } else {
      camera.position.set(3.25, 2.8, 4.15);
      camera.lookAt(0, 0.35, -0.1);
      props.devices.forEach(device => {
        if (device.asset?.room) store.load(device.asset.room);
      });
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, current, invalidate, props.devices, props.mode, store]);

  useEffect(() => {
    const contextLost = (event: Event) => {
      event.preventDefault();
      props.onFailure();
    };
    gl.domElement.addEventListener("webglcontextlost", contextLost);
    return () =>
      gl.domElement.removeEventListener("webglcontextlost", contextLost);
  }, [gl, props.onFailure]);

  return (
    <>
      <InvalidationBridge />
      <color attach="background" args={[props.dark ? "#2c2e2a" : "#f0ede7"]} />
      <fog attach="fog" args={[props.dark ? "#2c2e2a" : "#f0ede7", 5.7, 10]} />
      <Lighting mode={props.mode} dark={props.dark} />
      {props.mode === "gallery" ? (
        <>
          <GalleryModel
            device={current}
            progress={props.progress}
            rotation={props.rotation}
            reduced={props.reduced}
          />
          <mesh position={[0, -1.34, 0]} receiveShadow>
            <cylinderGeometry args={[1.18, 1.25, 0.08, 72]} />
            <meshStandardMaterial
              color={props.dark ? "#3f413b" : "#e2ddd3"}
              roughness={0.78}
            />
          </mesh>
        </>
      ) : (
        <group>
          <StudyRoom dark={props.dark} />
          <group position={[0, -0.65, 0]}>
            {props.devices.map(device => (
              <RoomDevice
                key={device.id}
                device={device}
                selected={device.id === props.selected}
                onSelect={props.onSelect}
              />
            ))}
          </group>
        </group>
      )}
      {props.mode === "room" && (
        <RoomCamera
          reduced={props.reduced}
          roomZoom={props.roomZoom}
          onRoomZoom={props.onRoomZoom}
        />
      )}
    </>
  );
}

function StatusObserver({
  devices,
  mode,
  selected,
  onStatus,
}: Pick<Props, "devices" | "mode" | "selected" | "onStatus">) {
  const store = useStore();
  const current = devices.find(device => device.id === selected) ?? devices[0];
  const urls =
    mode === "gallery"
      ? ([current.asset?.display].filter(Boolean) as string[])
      : (devices.map(device => device.asset?.room).filter(Boolean) as string[]);
  const entries = urls.map(url => store.get(url));
  useEffect(() => {
    if (urls.length === 0) onStatus({ state: "idle", progress: null });
    else if (entries.some(entry => entry?.status === "error"))
      onStatus({ state: "error", progress: null });
    else if (entries.every(entry => entry?.status === "ready"))
      onStatus({ state: "ready", progress: 100 });
    else {
      const known = entries
        .map(entry => entry?.progress)
        .filter(
          (value): value is number => value !== null && value !== undefined
        );
      onStatus({
        state: "loading",
        progress: known.length
          ? Math.round(
              known.reduce((sum, value) => sum + value, 0) / entries.length
            )
          : null,
      });
    }
  }, [
    entries.map(entry => `${entry?.status}:${entry?.progress}`).join("|"),
    onStatus,
    urls.length,
  ]);
  return null;
}

export default function GearCanvas(props: Props) {
  const store = useMemo(() => new ModelStore(), []);
  useEffect(() => () => store.dispose(), [store]);
  const background = new Color(props.dark ? "#2c2e2a" : "#f0ede7");
  return (
    <SceneBoundary onFailure={props.onFailure}>
      <StoreContext.Provider value={store}>
        <Canvas
          frameloop={props.visible ? "demand" : "never"}
          dpr={[1, 1.75]}
          shadows={{ type: PCFShadowMap }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            outputColorSpace: SRGBColorSpace,
            toneMapping: ACESFilmicToneMapping,
          }}
          camera={{ fov: 35, near: 0.01, far: 30 }}
          style={{ background: `#${background.getHexString()}` }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = props.dark ? 0.95 : 1.08;
          }}
        >
          <Scene {...props} />
          <StatusObserver
            devices={props.devices}
            mode={props.mode}
            selected={props.selected}
            onStatus={props.onStatus}
          />
        </Canvas>
      </StoreContext.Provider>
    </SceneBoundary>
  );
}
