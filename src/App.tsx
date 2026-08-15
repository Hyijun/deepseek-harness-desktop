import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import WindowControls from "./components/WindowControls";
import SetupScreen, { InstallProgress, SetupStatus } from "./components/SetupScreen";
import SidebarPanel from "./components/SidebarPanel";
import { useI18n } from "./i18n/context";
import { generateTimestampedUrl } from "./hooks/useAutoSync";
import { useDshTheme } from "./hooks/useDshTheme";

const MAX_RETRIES = 8;
const WINDOW_DRAG_MESSAGE = "deepseek-harness-desktop:start-window-drag";
const WINDOW_TOGGLE_MAXIMIZE_MESSAGE = "deepseek-harness-desktop:toggle-window-maximize";

interface InstallerState {
  title: string;
  detail: string;
  percentage: number;
  logs: string[];
}

interface DshUpdateInfo {
  tag: string;
  commit: string;
}

const initialInstaller: InstallerState = {
  title: "",
  detail: "",
  percentage: 0,
  logs: [],
};

const btnPrimary =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-accent bg-accent px-3 py-1.5 text-[13px] text-white transition-colors hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-55";

export default function App() {
  const { t } = useI18n();
  useDshTheme();
  const [status, setStatus] = useState<SetupStatus>("ready");
  const [installer, setInstaller] = useState<InstallerState>(initialInstaller);
  const [errorMsg, setErrorMsg] = useState("");
  const [serviceUrl, setServiceUrl] = useState("http://127.0.0.1:3080");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [serviceHealthy, setServiceHealthy] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<DshUpdateInfo | null>(null);
  const [updating, setUpdating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved === null ? false : saved === "true";
  });
  const [serviceRunning, setServiceRunning] = useState(false);

  const bootToken = useRef(0);
  const bootStartedRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const appWindow = useMemo(() => getCurrentWindow(), []);

  const iframeSrc = useMemo(() => generateTimestampedUrl(serviceUrl), [serviceUrl]);
  const dshOrigin = useMemo(() => new URL(serviceUrl).origin, [serviceUrl]);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      localStorage.setItem("sidebarOpen", String(!prev));
      return !prev;
    });
  };

  // 点击侧边栏外内容（遮罩）时收起侧边栏
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem("sidebarOpen", "false");
  };

  // The DSH client plugin sends this only from a session Header's non-interactive area.
  // Verify both the frame identity and its current origin before requesting native drag.
  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== dshOrigin || event.source !== iframeRef.current?.contentWindow) return;
      if (typeof event.data !== "object" || event.data === null || !("type" in event.data)) {
        return;
      }
      if (event.data.type === WINDOW_DRAG_MESSAGE) {
        void appWindow.startDragging().catch((err) => {
          console.error("[App] failed to start window dragging:", err);
        });
        return;
      }
      if (event.data.type === WINDOW_TOGGLE_MAXIMIZE_MESSAGE) {
        void appWindow
          .isMaximized()
          .then((maximized) => (maximized ? appWindow.unmaximize() : appWindow.maximize()))
          .catch((err) => console.error("[App] failed to toggle window maximize:", err));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appWindow, dshOrigin]);

  //ฤศจassistant to=functions.edit  彩神争霸网站՞ւjson /*<<<ി՞նչ սպասിച്ചു  微信天天中彩票】【。json
  //
  const refreshIframe = useCallback(() => {
    setIframeLoaded(false);
    setIframeError(false);
    setTimeout(() => setIframeKey((prev) => prev + 1), 800);
  }, []);

  const checkHealthViaProxy = async (): Promise<boolean> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("health check timeout")), 8000);
      });
      const resultPromise = invoke<string>("proxy_health_check");
      const result = await Promise.race([resultPromise, timeoutPromise]);

      const lower = result.toLowerCase();
      if (
        lower.includes("healthy") ||
        lower.includes("ready") ||
        result.includes("200") ||
        result.includes("201") ||
        lower.includes("ok")
      ) {
        console.log("[App] health check passed:", result);
        return true;
      }
      console.log("[App] health check returned:", result);
      return false;
    } catch (err) {
      const message = String(err);
      if (message.includes("502") || message.includes("Bad Gateway")) {
        console.log("[App] transient 502 during health check, retrying");
      } else {
        console.log("[App] health check failed:", err);
      }
      return false;
    }
  };

  // 安装进度流：只前进不后退，供首次安装/手动更新共用
  const listenInstallProgress = useCallback(async (): Promise<UnlistenFn> => {
    return listen<InstallProgress>("install-progress", (e) => {
      const payload = e.payload;
      setInstaller((prev) => {
        if (payload.percentage < prev.percentage) {
          return prev;
        }
        const logs = payload.log
          ? [...prev.logs, payload.log].slice(-5)
          : prev.logs;
        return {
          title: payload.title || prev.title,
          detail: payload.detail || prev.detail,
          percentage: payload.percentage,
          logs,
        };
      });
    });
  }, []);

  // 后台静默检查是否有新版 Harness（网络失败/API 限流时静默跳过）
  const checkForUpdate = useCallback(async () => {
    try {
      const info = await invoke<DshUpdateInfo | null>("check_dsh_update");
      if (info) {
        setUpdateInfo(info);
      }
    } catch (err) {
      console.log("[App] update check skipped:", err);
    }
  }, []);

  // 拉起服务并等待健康检查通过，通过后才挂载 iframe
  const launchAndWait = useCallback(async () => {
    setStatus("ready");
    setInstaller(initialInstaller);
    setServiceHealthy(false);
    setIframeLoaded(false);
    setIframeError(false);
    await invoke("launch_harness");
    setServiceRunning(true);

    let healthy = false;
    for (let attempt = 0; attempt < MAX_RETRIES && !healthy; attempt++) {
      healthy = await checkHealthViaProxy();
      if (!healthy) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    if (!healthy) {
      throw new Error(
        t("errors.service_start_timeout", { port: new URL(serviceUrl).port || "3080" }),
      );
    }
    setServiceHealthy(true);
  }, [serviceUrl, t]);

  const boot = useCallback(async () => {
    const token = ++bootToken.current;
    // 回到加载态：已安装时不再显示检测/启动界面，直接进入页面加载状态
    setServiceHealthy(false);
    setIframeLoaded(false);
    setIframeError(false);
    let unlistenInstall: UnlistenFn | null = null;

    try {
      // 事件监听失败（例如 IPC 自定义协议被 CSP 拦截、回退 postMessage 也异常）
      // 不应阻断启动流程，因此容错跳过。
      try {
        unlistenInstall = await listenInstallProgress();
      } catch (err) {
        console.error("[App] failed to listen install-progress:", err);
      }
      const runtimeInfo = await invoke<{ service_url: string }>("get_runtime_info");
      setServiceUrl(runtimeInfo.service_url);

      // 已安装过则跳过安装界面，避免每次启动都闪现“正在安装依赖...”
      const config = await invoke<{ installed: boolean }>("get_app_config");

      // 仅首次使用需要检测环境/安装依赖；之后直接进入页面
      if (!config.installed) {
        setStatus("installing");
        setInstaller({ ...initialInstaller, title: t("status.installing") });
        await invoke("install_dependencies");
      }

      await launchAndWait();

      if (token !== bootToken.current) return;
      // 已安装时后台静默检查新版，发现后提示用户
      if (config.installed) {
        void checkForUpdate();
      }
    } catch (err) {
      if (token !== bootToken.current) return;
      console.error("[App] startup failed:", err);
      setErrorMsg(String(err));
      setStatus("error");
      setServiceRunning(false);
    } finally {
      unlistenInstall?.();
    }
  }, [listenInstallProgress, launchAndWait, checkForUpdate, t]);

  // 手动更新：重新下载安装新版并重启服务
  const handleUpdate = async () => {
    if (updating) return;
    setUpdating(true);
    setUpdateInfo(null);
    let unlistenInstall: UnlistenFn | null = null;
    try {
      unlistenInstall = await listenInstallProgress();
      setStatus("installing");
      setInstaller({ ...initialInstaller, title: t("status.updating") });
      await invoke("install_dependencies");
      await launchAndWait();
      setUpdateInfo(null);
    } catch (err) {
      console.error("[App] update failed:", err);
      setErrorMsg(String(err));
      setStatus("error");
      setServiceRunning(false);
    } finally {
      unlistenInstall?.();
      setUpdating(false);
    }
  };

  // React StrictMode 在 dev 下会执行两次 effect，这里确保 boot 只挂载一次
  useEffect(() => {
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;
    void boot();
  }, [boot]);

  // 进入 ready 后如果 iframe 长时间未加载（dsh 未就绪/挂起），
  // 转为错误界面，避免一直停在黑色加载遮罩
  useEffect(() => {
    if (status !== "ready" || !serviceHealthy || iframeLoaded) return;
    const timer = setTimeout(() => {
      setIframeLoaded(false);
      setIframeError(true);
    }, 20000);
    return () => clearTimeout(timer);
  }, [status, serviceHealthy, iframeLoaded, iframeKey]);

  const restart = async () => {
    try {
      await invoke("shutdown_harness");
    } catch (err) {
      console.error("[App] shutdown during restart failed:", err);
    }
    setServiceRunning(false);
    setIframeLoaded(false);
    void boot();
  };

  const shutdown = async () => {
    try {
      await invoke("shutdown_harness");
    } catch (err) {
      console.error("[App] shutdown failed:", err);
    }
    setServiceRunning(false);
    setStatus("error");
    setErrorMsg(t("ui.stopped"));
  };

  const openBrowser = async () => {
    try {
      await invoke("open_in_browser");
    } catch (err) {
      console.error("[App] open in browser failed:", err);
    }
  };

  if (status === "error") {
    return (
      <div className="flex h-screen w-screen">
        <main className="relative flex-1 bg-canvas">
          <SetupScreen
            status="error"
            title=""
            detail=""
            percentage={installer.percentage}
            logs={installer.logs}
            errorMsg={serviceUrl ? `${errorMsg} (${serviceUrl})` : errorMsg}
            onRetry={boot}
          />
        </main>
        <WindowControls sidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
        <SidebarPanel
          open={sidebarOpen}
          serviceRunning={serviceRunning}
          onClose={handleCloseSidebar}
          onRestart={restart}
          onShutdown={shutdown}
          onStart={boot}
          onOpenBrowser={openBrowser}
        />
      </div>
    );
  }

  if (status !== "ready") {
    return (
      <div className="flex h-screen w-screen">
        <main className="relative w-full bg-canvas">
          <SetupScreen
            status={status}
            title={installer.title}
            detail={installer.detail}
            percentage={installer.percentage}
            logs={installer.logs}
            errorMsg=""
            onRetry={boot}
          />
        </main>
        <WindowControls sidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen">
      <main className="relative flex-1 bg-canvas">
        {!iframeLoaded && (
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 bg-canvas text-ink">
            <span className="h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-line border-t-accent" />
            <p>{t("status.loading")}</p>
          </div>
        )}
        {serviceHealthy && iframeError && (
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 bg-canvas text-ink">
            <p>{t("ui.iframe_error")}</p>
            <p className="text-muted">{t("ui.ensure_running", { url: serviceUrl })}</p>
            <button className={btnPrimary} onClick={refreshIframe}>
              {t("app.retry")}
            </button>
          </div>
        )}
        {serviceHealthy && (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            className="block h-full w-full border-none bg-white"
            src={iframeSrc}
            onLoad={() => {
              setIframeLoaded(true);
              setIframeError(false);
            }}
            onError={() => {
              setIframeError(true);
              setIframeLoaded(false);
            }}
            title={t("app.open_editor")}
          />
        )}
      </main>
      {updateInfo && !updating && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-[420px] items-center gap-3 rounded-lg border border-accent/40 bg-panel px-4 py-3 shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{t("update.available", { tag: updateInfo.tag })}</p>
            <p className="mt-0.5 text-xs text-muted">{updateInfo.commit.slice(0, 7)}</p>
          </div>
          <button className={btnPrimary} onClick={handleUpdate}>
            {t("update.now")}
          </button>
          <button
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-line bg-panel2 px-3 py-1.5 text-[13px] text-ink transition-colors hover:bg-panel-hover"
            onClick={() => setUpdateInfo(null)}
          >
            {t("update.later")}
          </button>
        </div>
      )}
      <WindowControls sidebarOpen={sidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <SidebarPanel
        open={sidebarOpen}
        serviceRunning={serviceRunning}
        onClose={handleCloseSidebar}
        onRestart={restart}
        onShutdown={shutdown}
        onStart={boot}
        onOpenBrowser={openBrowser}
      />
    </div>
  );
}
