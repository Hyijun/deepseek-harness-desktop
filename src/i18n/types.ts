export type Language = "en" | "zh";

export interface Translations {
  app: {
    title: string;
    retry: string;
    ready: string;
    open_editor: string;
    expand_sidebar: string;
    collapse_sidebar: string;
    restart: string;
    shutdown: string;
    open_browser: string;
    copy_url: string;
    reveal_dir: string;
    refresh: string;
  };
  status: {
    checking: string;
    installing: string;
    updating: string;
    preparing_engine: string;
    downloading_harness: string;
    extracting: string;
    starting: string;
    ready: string;
    error: string;
    loading: string;
  };
  update: {
    available: string;
    now: string;
    later: string;
  };
  errors: {
    service_start_timeout: string;
    install_verify_failed: string;
    network_timeout: string;
    unknown: string;
  };
  ui: {
    service_url: string;
    port: string;
    auto_start: string;
    app_info: string;
    current_version: string;
    dsh_version: string;
    node_version: string;
    data_dir: string;
    logs: string;
    no_logs: string;
    save: string;
    saved: string;
    loading_interface: string;
    iframe_error: string;
    ensure_running: string;
    language: string;
    actions: string;
    connection_status: string;
    running: string;
    stopped: string;
    settings: string;
    minimize: string;
    maximize: string;
    restore: string;
    close: string;
    drag_window: string;
    zoom_level: string;
    zoom_minimum: string;
    zoom_maximum: string;
    waiting_logs: string;
    install_log: string;
  };
  buttons: {
    retry: string;
    save: string;
    copy: string;
    clear_logs: string;
    refresh_logs: string;
  };
  messages: {
    copy_success: string;
    copy_failed: string;
    config_saved: string;
    save_failed: string;
    start_failed: string;
    stop_failed: string;
    restarting: string;
    logs_cleared: string;
  };
}
