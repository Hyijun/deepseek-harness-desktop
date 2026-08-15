import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Copy, Minus, Square, Wrench, X } from "lucide-react";
import { useI18n } from "../i18n/context";
import InterfaceZoom from "./InterfaceZoom";

const btn =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-ink transition-colors hover:bg-panel-hover";

interface WindowControlsProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * 右上角浮动窗口控制条（隐藏/最大化/关闭 + 侧边栏开关）。
 *
 * 参考 damn-reports 的自定义标题栏：去掉系统边框后，把窗口控制放到
 * 右侧侧边栏按钮所在的位置，内嵌 dsh 页面保持全窗口显示；
 * 半透明面板浮于其上并跟随 dsh 主题切换，视觉上与内部应用融为一体。
 * DSH 会话 Header 中的本地 client plugin 会触发窗口拖拽。
 */
export default function WindowControls({ sidebarOpen, onToggleSidebar }: WindowControlsProps) {
  const { t } = useI18n();
  const appWindow = useMemo(() => getCurrentWindow(), []);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let disposed = false;
    const sync = async () => {
      try {
        const next = await appWindow.isMaximized();
        if (!disposed) setMaximized(next);
      } catch (err) {
        console.error("[WindowControls] failed to read maximized state:", err);
      }
    };
    void sync();

    let unlisten: (() => void) | null = null;
    appWindow
      .onResized(() => {
        void sync();
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      })
      .catch((err) => console.error("[WindowControls] failed to watch resize:", err));

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [appWindow]);

  const handleMinimize = () => {
    void appWindow.minimize();
  };

  const handleMaximize = async () => {
    if (await appWindow.isMaximized()) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };

  // 与 damn-reports 一致：关闭按钮隐藏到托盘（Rust 侧 CloseRequested 同样处理）
  const handleClose = () => {
    void appWindow.hide();
  };

  return (
    <>
      <InterfaceZoom />
      <div className="fixed top-2 right-2 z-50">
      <div className="flex items-center gap-0.5 rounded-lg bg-panel/80 p-1 backdrop-blur-md">
        <button
          className={btn}
          onClick={onToggleSidebar}
          title={sidebarOpen ? t("app.collapse_sidebar") : t("app.expand_sidebar")}
        >
          <Wrench className="size-3.5" />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" />
        <button className={btn} onClick={handleMinimize} title={t("ui.minimize")}>
          <Minus className="size-3.5" />
        </button>
        <button className={btn} onClick={handleMaximize} title={maximized ? t("ui.restore") : t("ui.maximize")}>
          {maximized ? <Copy className="size-3" /> : <Square className="size-3" />}
        </button>
        <button className={`${btn} hover:bg-danger`} onClick={handleClose} title={t("ui.close")}>
          <X className="size-3.5" />
        </button>
      </div>
      </div>
    </>
  );
}
