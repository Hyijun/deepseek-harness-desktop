import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";

const STORAGE_KEY = "interfaceZoom";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_INCREMENT = 0.1;
const MIN_LAYOUT_WIDTH = 720;
const ZOOM_LEVEL_COUNT = Math.round((MAX_ZOOM - MIN_ZOOM) / ZOOM_INCREMENT) + 1;
const ZOOM_LEVELS = Array.from({ length: ZOOM_LEVEL_COUNT }, (_, index) =>
  Number(
    (
      MIN_ZOOM +
      ((MAX_ZOOM - MIN_ZOOM) * index) / (ZOOM_LEVEL_COUNT - 1)
    ).toFixed(2),
  ),
);

interface ZoomNotice {
  percent: number;
  limit: "min" | "max" | null;
}

function getMaximumZoom(logicalWidth: number): number {
  return (
    [...ZOOM_LEVELS]
      .reverse()
      .find((zoom) => logicalWidth / zoom >= MIN_LAYOUT_WIDTH) ?? MIN_ZOOM
  );
}

function readStoredZoom(): number {
  const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) ?? "1");
  return Number.isFinite(stored) ? stored : 1;
}

export default function InterfaceZoom() {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<ZoomNotice | null>(null);
  const previousPercent = useRef<number | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    const webview = getCurrentWebview();
    let disposed = false;
    let measureTimer: ReturnType<typeof setTimeout> | null = null;
    let measuring = false;

    const showNotice = (percent: number, limit: ZoomNotice["limit"]) => {
      if (disposed) return;
      setNotice({ percent, limit });
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), 1600);
    };

    const measureZoom = async (showChange: boolean) => {
      if (measuring || disposed || window.innerWidth <= 0) return;
      measuring = true;
      try {
        const [physicalSize, scaleFactor] = await Promise.all([
          appWindow.innerSize(),
          appWindow.scaleFactor(),
        ]);
        const logicalWidth = physicalSize.width / scaleFactor;
        const detectedZoom = logicalWidth / window.innerWidth;
        const maximumZoom = getMaximumZoom(logicalWidth);
        const nextZoom = Math.min(maximumZoom, Math.max(MIN_ZOOM, detectedZoom));
        const wasClamped = Math.abs(nextZoom - detectedZoom) > 0.015;

        if (wasClamped) {
          await webview.setZoom(nextZoom);
        }

        const percent = Math.round(nextZoom * 100);
        localStorage.setItem(STORAGE_KEY, String(nextZoom));

        if (showChange && (wasClamped || previousPercent.current !== percent)) {
          const limit =
            nextZoom <= MIN_ZOOM + 0.005
              ? "min"
              : nextZoom >= maximumZoom - 0.005
                ? "max"
                : null;
          showNotice(percent, limit);
        }
        previousPercent.current = percent;
      } catch (error) {
        console.error("[InterfaceZoom] failed to update zoom:", error);
      } finally {
        measuring = false;
      }
    };

    const scheduleMeasure = () => {
      if (measureTimer) clearTimeout(measureTimer);
      measureTimer = setTimeout(() => void measureZoom(true), 50);
    };

    const initialize = async () => {
      try {
        const [physicalSize, scaleFactor] = await Promise.all([
          appWindow.innerSize(),
          appWindow.scaleFactor(),
        ]);
        const logicalWidth = physicalSize.width / scaleFactor;
        const initialZoom = Math.min(
          getMaximumZoom(logicalWidth),
          Math.max(MIN_ZOOM, readStoredZoom()),
        );
        await webview.setZoom(initialZoom);
        previousPercent.current = Math.round(initialZoom * 100);
        localStorage.setItem(STORAGE_KEY, String(initialZoom));
      } catch (error) {
        console.error("[InterfaceZoom] failed to restore zoom:", error);
      }

      if (disposed) return;
      window.addEventListener("resize", scheduleMeasure);
      window.visualViewport?.addEventListener("resize", scheduleMeasure);
    };

    void initialize();

    return () => {
      disposed = true;
      window.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      if (measureTimer) clearTimeout(measureTimer);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  if (!notice) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 left-1/2 z-[70] min-w-32 -translate-x-1/2 rounded-md border border-line bg-panel/95 px-4 py-2 text-center shadow-lg backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <p className="text-[13px] font-semibold text-ink">
        {t("ui.zoom_level", { level: notice.percent })}
      </p>
      {notice.limit && (
        <p className="mt-0.5 text-[11px] text-muted">
          {t(notice.limit === "min" ? "ui.zoom_minimum" : "ui.zoom_maximum")}
        </p>
      )}
    </div>
  );
}
