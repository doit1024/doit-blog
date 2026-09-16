import { useEffect } from "react";

const THRESHOLD = 6;

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

    for (const item of items) {
      let pointerId: number | null = null;
      let startX = 0;
      let startY = 0;
      let originX = 0;
      let originY = 0;
      let dragging = false;
      let suppressClick = false;

      const onDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        pointerId = event.pointerId;
        item.setPointerCapture(event.pointerId);
        const offset = readOffset(item);
        originX = offset.x;
        originY = offset.y;
        startX = event.clientX;
        startY = event.clientY;
        dragging = false;
      };

      const onMove = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (!dragging && Math.hypot(dx, dy) < THRESHOLD) return;
        dragging = true;
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

      item.addEventListener("pointerdown", onDown);
      item.addEventListener("pointermove", onMove);
      item.addEventListener("pointerup", onUp);
      item.addEventListener("pointercancel", onUp);
      item.addEventListener("dragstart", onNativeDrag);
      item.addEventListener("click", onClick, true);

      cleanups.push(() => {
        item.removeEventListener("pointerdown", onDown);
        item.removeEventListener("pointermove", onMove);
        item.removeEventListener("pointerup", onUp);
        item.removeEventListener("pointercancel", onUp);
        item.removeEventListener("dragstart", onNativeDrag);
        item.removeEventListener("click", onClick, true);
      });
    }

    return () => {
      for (const stop of cleanups) stop();
    };
  }, []);

  return null;
}
