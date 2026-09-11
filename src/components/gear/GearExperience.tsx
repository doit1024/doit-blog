import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GearDevice, GearMode } from "@/data/gear";

const GearCanvas = lazy(() => import("./GearCanvas"));

export default function GearExperience({
  devices,
  children,
}: {
  devices: GearDevice[];
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const progress = useRef(0.5);
  const pendingJump = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<GearMode>("gallery");
  const [selected, setSelected] = useState(devices[0].id);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [roomZoom, setRoomZoom] = useState(0);
  const [modelStatus, setModelStatus] = useState<{
    state: "idle" | "loading" | "ready" | "error";
    progress: number | null;
  }>({ state: "idle", progress: null });
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const device = devices.find(item => item.id === selected) ?? devices[0];
  const selectedIndex = devices.indexOf(device);

  useEffect(() => {
    const probe = document.createElement("canvas");
    const context = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!context) setWebglFailed(true);
    else context.getExtension("WEBGL_lose_context")?.loseContext();
    setMounted(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    const syncTheme = () =>
      setDark(document.documentElement.dataset.theme === "dark");
    syncMotion();
    syncTheme();
    media.addEventListener("change", syncMotion);
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const intersection = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting)
    );
    if (frame.current) intersection.observe(frame.current);
    const onVisibility = () => {
      if (!document.hidden && frame.current) {
        const rect = frame.current.getBoundingClientRect();
        setVisible(rect.bottom > 0 && rect.top < window.innerHeight);
      } else setVisible(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", syncMotion);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!mounted || mode !== "gallery") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (pendingJump.current) return;
      const stories = Array.from(
        root.current?.querySelectorAll<HTMLElement>("[data-gear-story]") ?? []
      );
      // On phones the sticky model occupies the top half; read the copy below it.
      const anchor =
        window.innerHeight * (window.innerWidth < 760 ? 0.76 : 0.5);
      let best = stories[0];
      let distance = Infinity;
      stories.forEach(story => {
        const rect = story.getBoundingClientRect();
        const d = Math.abs(rect.top + rect.height / 2 - anchor);
        if (d < distance) {
          best = story;
          distance = d;
        }
      });
      if (!best) return;
      const rect = best.getBoundingClientRect();
      progress.current = Math.max(
        0,
        Math.min(1, (anchor - rect.top) / rect.height)
      );
      const id = best.dataset.gearStory!;
      setSelected(previous => {
        if (previous !== id) setRotation(0);
        return id;
      });
      window.dispatchEvent(new Event("gear:invalidate"));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [mounted, mode]);

  function jump(id: string) {
    const target = root.current?.querySelector<HTMLElement>(
      `[data-gear-story="${id}"]`
    );
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const anchor = window.innerHeight * (window.innerWidth < 760 ? 0.76 : 0.5);
    // An immediate jump avoids a scroll animation selecting intermediate devices.
    window.scrollTo({
      top: Math.max(0, window.scrollY + rect.top + rect.height / 2 - anchor),
      behavior: "instant",
    });
    progress.current = 0.5;
  }

  useLayoutEffect(() => {
    if (mode === "gallery" && pendingJump.current) {
      jump(pendingJump.current);
      pendingJump.current = null;
    }
  }, [mode]);

  function choose(id: string) {
    setSelected(id);
    setRotation(0);
    if (mode === "gallery") jump(id);
    else {
      detailTrigger.current = document.activeElement as HTMLElement;
      setDetailsOpen(true);
    }
  }

  function changeMode(next: GearMode) {
    if (next === mode) return;
    setDetailsOpen(false);
    if (next === "gallery") pendingJump.current = selected;
    setMode(next);
    if (next === "room")
      root.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  useEffect(() => {
    if (detailsOpen) detailHeading.current?.focus({ preventScroll: true });
  }, [detailsOpen, selected]);
  function closeDetails() {
    setDetailsOpen(false);
    detailTrigger.current?.focus({ preventScroll: true });
  }

  const changeRoomZoom = useCallback((delta: number) => {
    setRoomZoom(value => Math.max(-1.2, Math.min(1.55, value + delta)));
  }, []);

  return (
    <div
      ref={root}
      className={`gear-experience ${mounted ? "is-enhanced" : ""}`}
      data-mode={mode}
      data-selected={selected}
    >
      <div className="gear-toolbar">
        <div className="gear-mode-switch" role="group" aria-label="展示方式">
          <button
            type="button"
            aria-pressed={mode === "gallery"}
            disabled={!mounted}
            onClick={() => changeMode("gallery")}
          >
            <span aria-hidden="true">◉</span> 滚动展台
          </button>
          <button
            type="button"
            aria-pressed={mode === "room"}
            disabled={!mounted}
            onClick={() => changeMode("room")}
          >
            <span aria-hidden="true">⌑</span> 立体书房
          </button>
        </div>
        <span className="gear-toolbar-note">
          {mode === "gallery" ? "向下滚动，换个角度" : "点击物件，看看细节"}
        </span>
      </div>
      <div className="gear-composition">
        <div className="gear-stage" ref={frame}>
          <div className="gear-stage-caption" aria-hidden="true">
            <span>{mode === "gallery" ? device.category : "一间小书房"}</span>
            <span>
              {mode === "gallery"
                ? `${String(selectedIndex + 1).padStart(2, "0")} / 05`
                : "固定视角"}
            </span>
          </div>
          <div
            className="gear-canvas"
            aria-label={
              mode === "gallery"
                ? `${device.name} 三维展示`
                : "设备书房三维展示"
            }
          >
            {mounted && !webglFailed ? (
              <Suspense
                fallback={
                  <div className="gear-model-notice" role="status">
                    展台准备中…
                  </div>
                }
              >
                <GearCanvas
                  key={retry}
                  devices={devices}
                  mode={mode}
                  selected={selected}
                  progress={progress}
                  rotation={rotation}
                  dark={dark}
                  reduced={reduced}
                  visible={visible}
                  roomZoom={roomZoom}
                  onSelect={choose}
                  onRoomZoom={changeRoomZoom}
                  onFailure={() => setWebglFailed(true)}
                  onStatus={setModelStatus}
                />
              </Suspense>
            ) : mounted ? (
              <div className="gear-static-fallback">
                {device.asset && (
                  <img
                    src={device.asset.preview}
                    alt={`${device.name} 静态预览`}
                  />
                )}
                <p>当前无法显示 3D，设备信息仍可浏览。</p>
                <button
                  type="button"
                  onClick={() => {
                    setRetry(value => value + 1);
                    setWebglFailed(false);
                  }}
                >
                  重新加载 3D
                </button>
              </div>
            ) : null}
          </div>
          {mode === "gallery" && !device.asset && !webglFailed && (
            <div className="gear-model-notice">
              <span className="gear-ghost-number" aria-hidden="true">
                {String(selectedIndex + 1).padStart(2, "0")}
              </span>
              <p>{device.name}</p>
              <span>精细模型准备中</span>
            </div>
          )}
          {mode === "gallery" && device.asset && !webglFailed && (
            <div
              className="gear-turn-controls"
              role="group"
              aria-label="旋转模型"
            >
              <button
                type="button"
                aria-label="向左旋转模型"
                onClick={() => setRotation(value => value - Math.PI / 4)}
              >
                ↶
              </button>
              <button type="button" onClick={() => setRotation(0)}>
                复位
              </button>
              <button
                type="button"
                aria-label="向右旋转模型"
                onClick={() => setRotation(value => value + Math.PI / 4)}
              >
                ↷
              </button>
            </div>
          )}
          {mode === "room" && !webglFailed && (
            <div
              className="gear-room-controls"
              role="group"
              aria-label="书房视角缩放"
            >
              <button
                type="button"
                aria-label="缩小书房视角"
                onClick={() => changeRoomZoom(-0.45)}
              >
                −
              </button>
              <button type="button" onClick={() => setRoomZoom(0)}>
                复位视角
              </button>
              <button
                type="button"
                aria-label="放大书房视角"
                onClick={() => changeRoomZoom(0.45)}
              >
                +
              </button>
            </div>
          )}
          {!webglFailed && modelStatus.state === "loading" && (
            <div className="gear-model-status" role="status">
              {modelStatus.progress !== null && (
                <progress max="100" value={modelStatus.progress} />
              )}
              <span>
                {modelStatus.progress === null
                  ? "正在加载模型…"
                  : `正在加载模型 ${modelStatus.progress}%`}
              </span>
            </div>
          )}
          {!webglFailed && modelStatus.state === "error" && (
            <div className="gear-model-status" role="status">
              <span>模型加载失败</span>
              <button
                type="button"
                onClick={() => setRetry(value => value + 1)}
              >
                重试
              </button>
            </div>
          )}
          {mode === "room" && (
            <p className="gear-room-note">
              桌面上的设备，也可以从下方目录选择。
            </p>
          )}
          <nav className="gear-device-nav" aria-label="设备目录">
            {devices.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-current={selected === item.id ? "true" : undefined}
                onClick={() => choose(item.id)}
                disabled={!mounted}
              >
                <span className="gear-nav-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item.shortName}</span>
              </button>
            ))}
          </nav>
          {mode === "room" && detailsOpen && (
            <aside
              className="gear-detail"
              aria-labelledby="gear-detail-title"
              onKeyDown={event => {
                if (event.key === "Escape") closeDetails();
              }}
            >
              <button
                className="gear-detail-close"
                type="button"
                aria-label="关闭设备详情"
                onClick={closeDetails}
              >
                ×
              </button>
              <p className="gear-eyebrow">{device.category}</p>
              <h2 ref={detailHeading} id="gear-detail-title" tabIndex={-1}>
                {device.name}
              </h2>
              <p className="gear-spec">
                {[device.color, device.configuration]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {device.description && <p>{device.description}</p>}
              {!device.asset && <p className="gear-pending">精细模型准备中</p>}
              <button
                type="button"
                className="gear-text-link"
                onClick={() => changeMode("gallery")}
              >
                查看模型 <span aria-hidden="true">↗</span>
              </button>
            </aside>
          )}
        </div>
        <div className="gear-copy-column" hidden={mode === "room"}>
          {children}
        </div>
      </div>
      <p className="gear-bottom-note">
        {mode === "gallery"
          ? "日常使用，慢慢记录。"
          : "书房为构想空间，设备位置固定。"}
      </p>
    </div>
  );
}
