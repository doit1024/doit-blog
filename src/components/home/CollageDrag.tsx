import { useEffect } from "react";

const THRESHOLD = 6;
const IDLE_MS = 3000;
const RETURN_MS = 700;
const HINT_KEY = "doit-collage-dragged";

function readOffset(el: HTMLElement) {
  return {
    x: Number.parseFloat(el.style.getPropertyValue("--dx") || "0") || 0,
    y: Number.parseFloat(el.style.getPropertyValue("--dy") || "0") || 0,
  };
}

export default function CollageDrag() {
  useEffect(() => {
    const board = document.querySelector<HTMLElement>("[data-collage-board]");
    if (!board) return;

    const items = [...board.querySelectorAll<HTMLElement>("[data-draggable]")];
    const cleanups: Array<() => void> = [];
    let topLayer = 30;
    let idleTimer: number | null = null;
    let returnTimer: number | null = null;
    let returning = false;

    try {
      if (localStorage.getItem(HINT_KEY) === "1") {
        board.classList.add("has-dragged");
        board.classList.remove("is-hinting");
      } else {
        board.classList.add("is-hinting");
      }
    } catch {
      board.classList.add("is-hinting");
    }

    const bringToFront = (item: HTMLElement) => {
      topLayer += 1;
      item.style.zIndex = String(topLayer);
    };

    const clearTimer = (id: number | null) => {
      if (id != null) window.clearTimeout(id);
    };

    const clearIdle = () => {
      clearTimer(idleTimer);
      idleTimer = null;
    };

    const freezeCurrentOffsets = () => {
      const captured = items.map(item => {
        const styles = getComputedStyle(item);
        return {
          item,
          x: styles.getPropertyValue("--dx").trim() || "0px",
          y: styles.getPropertyValue("--dy").trim() || "0px",
        };
      });
      for (const { item, x, y } of captured) {
        item.classList.remove("is-returning");
        item.style.setProperty("--dx", x);
        item.style.setProperty("--dy", y);
      }
      returning = false;
      clearTimer(returnTimer);
      returnTimer = null;
    };

    const snapBack = () => {
      idleTimer = null;
      const moved = items.some(item => {
        const offset = readOffset(item);
        return offset.x !== 0 || offset.y !== 0;
      });
      if (!moved) return;

      returning = true;
      for (const item of items) {
        item.classList.add("is-returning");
        item.style.setProperty("--dx", "0px");
        item.style.setProperty("--dy", "0px");
      }
      clearTimer(returnTimer);
      returnTimer = window.setTimeout(() => {
        returnTimer = null;
        returning = false;
        for (const item of items) item.classList.remove("is-returning");
      }, RETURN_MS + 50);
    };

    const scheduleIdle = () => {
      clearIdle();
      idleTimer = window.setTimeout(snapBack, IDLE_MS);
    };

    const dismissHint = () => {
      if (board.classList.contains("has-dragged")) return;
      board.classList.remove("is-hinting");
      board.classList.add("has-dragged");
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* private mode */
      }
    };

    for (const item of items) {
      let pointerId: number | null = null;
      let startX = 0;
      let startY = 0;
      let originX = 0;
      let originY = 0;
      let dragging = false;
      let suppressClick = false;

      const onEnter = () => {
        item.classList.add("is-lifted");
      };

      const onLeave = () => {
        if (!dragging) item.classList.remove("is-lifted");
      };

      const onDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        pointerId = event.pointerId;
        item.setPointerCapture(event.pointerId);
        clearIdle();
        if (returning) freezeCurrentOffsets();
        const offset = readOffset(item);
        originX = offset.x;
        originY = offset.y;
        startX = event.clientX;
        startY = event.clientY;
        dragging = false;
        item.classList.add("is-lifted");
        bringToFront(item);
      };

      const onMove = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (!dragging && Math.hypot(dx, dy) < THRESHOLD) return;
        dragging = true;
        dismissHint();
        item.classList.add("is-dragging");
        item.style.setProperty("--dx", `${originX + dx}px`);
        item.style.setProperty("--dy", `${originY + dy}px`);
        event.preventDefault();
      };

      const onUp = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        if (dragging) {
          suppressClick = true;
          item.classList.remove("is-dragging");
        }
        dragging = false;
        const under = document.elementFromPoint(event.clientX, event.clientY);
        if (!under || !item.contains(under)) {
          item.classList.remove("is-lifted");
        }
        scheduleIdle();
      };

      const onClick = (event: MouseEvent) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      };

      const onNativeDrag = (event: DragEvent) => {
        event.preventDefault();
      };

      item.addEventListener("pointerenter", onEnter);
      item.addEventListener("pointerleave", onLeave);
      item.addEventListener("pointerdown", onDown);
      item.addEventListener("pointermove", onMove);
      item.addEventListener("pointerup", onUp);
      item.addEventListener("pointercancel", onUp);
      item.addEventListener("dragstart", onNativeDrag);
      item.addEventListener("click", onClick, true);

      cleanups.push(() => {
        item.removeEventListener("pointerenter", onEnter);
        item.removeEventListener("pointerleave", onLeave);
        item.removeEventListener("pointerdown", onDown);
        item.removeEventListener("pointermove", onMove);
        item.removeEventListener("pointerup", onUp);
        item.removeEventListener("pointercancel", onUp);
        item.removeEventListener("dragstart", onNativeDrag);
        item.removeEventListener("click", onClick, true);
      });
    }

    return () => {
      clearIdle();
      clearTimer(returnTimer);
      for (const stop of cleanups) stop();
    };
  }, []);

  return null;
}
