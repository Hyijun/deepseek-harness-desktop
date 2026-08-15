import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../i18n/context";

export interface RuntimeInfo {
  app_version: string;
  dsh_version: string | null;
  node_version: string;
  service_url: string;
  data_dir: string;
  log_path: string;
  platform: string;
  arch: string;
}

export interface DshEnvironmentVariable {
  name: string;
  value: string;
}

export interface AppConfig {
  port: number;
  auto_start: boolean;
  http_proxy: string;
  dsh_environment: DshEnvironmentVariable[];
  dsh_arguments: string[];
}

interface SidebarPanelProps {
  open: boolean;
  serviceRunning: boolean;
  onClose: () => void;
  onRestart: () => void;
  onShutdown: () => void;
  onStart: () => void;
  onOpenBrowser: () => void;
}

export default function SidebarPanel({
  open,
  serviceRunning,
  onClose,
  onRestart,
  onShutdown,
  onStart,
  onOpenBrowser,
}: SidebarPanelProps) {
  const { t, language, setLanguage } = useI18n();
  const btnBase =
    "inline-flex cursor-pointer items-center justify-center rounded-md border border-line bg-panel2 px-2 py-1 text-xs text-ink transition-colors hover:border-line-strong hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-55";
  const btnPrimary = `${btnBase} border-accent bg-accent text-white hover:border-accent2 hover:bg-accent2`;
  const btnDanger = `${btnBase} border-[rgba(229,72,77,0.4)] text-danger`;
  const btnBlock = " mt-1.5 w-full";
  const [info, setInfo] = useState<RuntimeInfo | null>(null);
  const [port, setPort] = useState("3080");
  const [autoStart, setAutoStart] = useState(true);
  const [httpProxy, setHttpProxy] = useState("");
  const [dshEnvironment, setDshEnvironment] = useState<DshEnvironmentVariable[]>([]);
  const [dshArguments, setDshArguments] = useState<string[]>([]);
  const [logs, setLogs] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const refreshInfo = async () => {
    try {
      const nextInfo = await invoke<RuntimeInfo>("get_runtime_info");
      setInfo(nextInfo);
    } catch (err) {
      console.error("[SidebarPanel] failed to load runtime info:", err);
    }
  };

  const refreshConfig = async () => {
    try {
      const nextConfig = await invoke<AppConfig>("get_app_config");
      setPort(String(nextConfig.port));
      setAutoStart(nextConfig.auto_start);
      setHttpProxy(nextConfig.http_proxy);
      setDshEnvironment(nextConfig.dsh_environment);
      setDshArguments(nextConfig.dsh_arguments);
    } catch (err) {
      console.error("[SidebarPanel] failed to load config:", err);
    }
  };

  const refreshLogs = async () => {
    try {
      setLogs(await invoke<string>("read_service_logs", { maxBytes: 64 * 1024 }));
    } catch (err) {
      console.error("[SidebarPanel] failed to read logs:", err);
    }
  };

  useEffect(() => {
    refreshInfo();
    refreshConfig();
    refreshLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const nextPort = Number(port);
      const nextConfig = await invoke<AppConfig>("update_app_config", {
        port: Number.isInteger(nextPort) && nextPort > 0 ? nextPort : null,
        autoStart,
        httpProxy,
        dshEnvironment,
        dshArguments,
      });
      setPort(String(nextConfig.port));
      setNotice(t("messages.config_saved"));
    } catch (err) {
      console.error("[SidebarPanel] failed to save config:", err);
      setNotice(t("messages.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = async () => {
    try {
      await invoke("copy_service_url");
      setNotice(t("messages.copy_success"));
    } catch {
      setNotice(t("messages.copy_failed"));
    }
  };

  const clearLogs = async () => {
    try {
      await invoke("clear_service_logs");
      setLogs("");
      setNotice(t("messages.logs_cleared"));
    } catch (err) {
      console.error("[SidebarPanel] failed to clear logs:", err);
    }
  };

  const revealDataDir = async () => {
    try {
      await invoke("reveal_data_dir");
    } catch (err) {
      console.error("[SidebarPanel] failed to reveal data dir:", err);
    }
  };

  return (
    <>
      {/* 点击侧边栏外内容时关闭侧边栏；透明遮罩位于内容之上、侧边栏(以及窗口控制)之下 */}
      {open && <div aria-hidden onClick={onClose} className="fixed inset-0 z-[25]" />}
      <aside
        className={`fixed top-14.5 right-0 bottom-0 z-30 flex w-[300px] flex-col overflow-y-auto border-l border-t rounded-md border-line bg-panel shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
      <div className="px-3 pt-4 pb-5">
        <div className="mb-[18px]">
          <h3 className="mb-2 flex items-center justify-between gap-1.5 text-xs uppercase tracking-[0.06em] text-muted">{t("ui.connection_status")}</h3>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              serviceRunning ? "bg-[rgba(70,167,88,0.15)] text-ok" : "bg-[rgba(229,72,77,0.15)] text-danger"
            }`}
          >
            {serviceRunning ? t("ui.running") : t("ui.stopped")}
          </span>
        </div>

        <div className="mb-[18px]">
          <h3 className="mb-2 flex items-center justify-between gap-1.5 text-xs uppercase tracking-[0.06em] text-muted">{t("ui.service_url")}</h3>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 truncate rounded-md border border-line bg-panel2 px-2 py-1.5 text-xs">{info?.service_url ?? "-"}</code>
            <button className={btnBase} onClick={copyUrl} title={t("app.copy_url")}>
              {t("buttons.copy")}
            </button>
          </div>
          <button className={`${btnBase}${btnBlock}`} onClick={onOpenBrowser}>
            {t("app.open_browser")}
          </button>
        </div>

        <div className="mb-[18px]">
          <h3 className="mb-2 flex items-center justify-between gap-1.5 text-xs uppercase tracking-[0.06em] text-muted">{t("ui.actions")}</h3>
          <div className="flex flex-wrap gap-1.5">
            {serviceRunning ? (
              <>
                <button className={btnBase} onClick={onRestart}>
                  {t("app.restart")}
                </button>
                <button className={btnDanger} onClick={onShutdown}>
                  {t("app.shutdown")}
                </button>
              </>
            ) : (
              <button className={btnPrimary} onClick={onStart}>
                {t("app.retry")}
              </button>
            )}
            <button className={btnBase} onClick={refreshInfo}>
              {t("app.refresh")}
            </button>
          </div>
        </div>

        <div className="mb-[18px]">
          <h3 className="mb-2 flex items-center justify-between gap-1.5 text-xs uppercase tracking-[0.06em] text-muted">{t("ui.app_info")}</h3>
          <dl className="m-0 text-xs">
            <dt className="mt-1.5 text-muted">{t("ui.current_version")}</dt>
            <dd className="mt-0.5 break-all">{info?.app_version ?? "-"}</dd>
            <dt className="mt-1.5 text-muted">{t("ui.dsh_version")}</dt>
            <dd className="mt-0.5 break-all">{info?.dsh_version ?? "-"}</dd>
            <dt className="mt-1.5 text-muted">{t("ui.node_version")}</dt>
            <dd className="mt-0.5 break-all">v{info?.node_version ?? "-"}</dd>
            <dt className="mt-1.5 text-muted">Platform</dt>
            <dd className="mt-0.5 break-all">
              {info?.platform ?? "-"} / {info?.arch ?? "-"}
            </dd>
            <dt className="mt-1.5 text-muted">{t("ui.data_dir")}</dt>
            <dd className="mt-0.5 flex items-center justify-center gap-2" title={info?.data_dir}>
              <div className="break-all truncate">{info?.data_dir ?? "-"}</div>
              <button className={`${btnBase} flex-shrink-0 text-[10px]`} onClick={revealDataDir}>
                {t("app.reveal_dir")}
              </button>
            </dd>
          </dl>
        </div>

        <div className="mb-[18px]">
          <h3 className="mb-2 flex items-center justify-between gap-1.5 text-xs uppercase tracking-[0.06em] text-muted">{t("ui.settings")}</h3>
          <label className="mb-2 flex items-center gap-2">
            <span>{t("ui.port")}</span>
            <input
              className="flex-1 rounded-md border border-line bg-panel2 px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent/60"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="mb-2 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} />
            <span>{t("ui.auto_start")}</span>
          </label>
          <label className="mb-2 block">
            <span className="mb-1 block text-xs text-muted">{t("ui.http_proxy")}</span>
            <input
              className="w-full rounded-md border border-line bg-panel2 px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent/60"
              value={httpProxy}
              onChange={(e) => setHttpProxy(e.target.value)}
              placeholder={t("ui.http_proxy_placeholder")}
              inputMode="url"
              spellCheck={false}
            />
          </label>
          <div className="mb-2 border-t border-line pt-2">
            <h4 className="mb-2 text-xs uppercase tracking-[0.06em] text-muted">{t("ui.harness_launch")}</h4>
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>{t("ui.dsh_environment")}</span>
                <button
                  className={btnBase}
                  onClick={() => setDshEnvironment([...dshEnvironment, { name: "", value: "" }])}
                  title={t("buttons.add")}
                >
                  +
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {dshEnvironment.map((variable, index) => (
                  <div className="flex items-center gap-1" key={`env-${index}`}>
                    <input
                      className="min-w-0 flex-1 rounded-md border border-line bg-panel2 px-1.5 py-1 text-xs text-ink outline-none focus:border-accent/60"
                      value={variable.name}
                      onChange={(e) => setDshEnvironment(dshEnvironment.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))}
                      placeholder={t("ui.name")}
                      spellCheck={false}
                    />
                    <input
                      className="min-w-0 flex-1 rounded-md border border-line bg-panel2 px-1.5 py-1 text-xs text-ink outline-none focus:border-accent/60"
                      value={variable.value}
                      onChange={(e) => setDshEnvironment(dshEnvironment.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value } : item))}
                      placeholder={t("ui.value")}
                      spellCheck={false}
                    />
                    <button
                      className={btnBase}
                      onClick={() => setDshEnvironment(dshEnvironment.filter((_, itemIndex) => itemIndex !== index))}
                      title={t("buttons.remove")}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>{t("ui.dsh_arguments")}</span>
                <button
                  className={btnBase}
                  onClick={() => setDshArguments([...dshArguments, ""])}
                  title={t("buttons.add")}
                >
                  +
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {dshArguments.map((argument, index) => (
                  <div className="flex items-center gap-1" key={`arg-${index}`}>
                    <input
                      className="min-w-0 flex-1 rounded-md border border-line bg-panel2 px-1.5 py-1 text-xs text-ink outline-none focus:border-accent/60"
                      value={argument}
                      onChange={(e) => setDshArguments(dshArguments.map((item, itemIndex) => itemIndex === index ? e.target.value : item))}
                      placeholder={t("ui.value")}
                      spellCheck={false}
                    />
                    <button
                      className={btnBase}
                      onClick={() => setDshArguments(dshArguments.filter((_, itemIndex) => itemIndex !== index))}
                      title={t("buttons.remove")}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className={`${btnBase}${btnBlock}`} onClick={saveConfig} disabled={saving}>
            {saving ? t("ui.saved") : t("ui.save")}
          </button>
          <div className="mt-2.5 flex items-center gap-2 text-[13px]">
            <span>{t("ui.language")}:</span>
            <select
              className="flex-1 rounded-md border border-line bg-panel2 px-2 py-1 text-[13px] text-ink outline-none"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "zh")}
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="mb-2 flex items-center justify-between gap-1.5 text-xs uppercase tracking-[0.06em] text-muted">
            {t("ui.logs")}
            <button className={btnBase} onClick={refreshLogs} title={t("buttons.refresh_logs")}>
              ↻
            </button>
          </h3>
          <pre className="m-0 max-h-[200px] overflow-auto whitespace-pre-wrap break-all rounded-md border border-line bg-log-bg px-2 py-2 text-[11px] leading-[1.45] text-log-ink">{logs || t("ui.no_logs")}</pre>
          <button className={btnBase} onClick={clearLogs}>
            {t("buttons.clear_logs")}
          </button>
        </div>

        {notice && (
          <div className="fixed bottom-[18px] left-1/2 z-10 -translate-x-1/2 rounded-lg border border-line bg-panel2 px-3.5 py-2 text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            {notice}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
