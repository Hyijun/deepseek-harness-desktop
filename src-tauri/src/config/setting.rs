use super::constants::*;
use super::runtime::get_base_dir;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, Runtime};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct DshEnvironmentVariable {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Setting {
    pub installed: bool,
    pub port: u16,
    pub auto_start: bool,
    pub language: String,
    #[serde(default)]
    pub http_proxy: String,
    #[serde(default)]
    pub dsh_environment: Vec<DshEnvironmentVariable>,
    #[serde(default)]
    pub dsh_arguments: Vec<String>,
    #[serde(default)]
    pub dsh_launch_options_version: u8,
    #[serde(default = "default_dsh_telemetry_disabled", skip_serializing)]
    pub dsh_telemetry_disabled: String,
    #[serde(default = "default_no_color", skip_serializing)]
    pub no_color: String,
    #[serde(default, skip_serializing)]
    pub dsh_web_port: String,
    #[serde(default = "default_dsh_profile", skip_serializing)]
    pub dsh_profile: String,
    #[serde(default = "default_dsh_host", skip_serializing)]
    pub dsh_host: String,
    #[serde(default)]
    pub dsh_pkg_commit: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct StoreData {
    setting: Setting,
}

fn default_dsh_telemetry_disabled() -> String {
    "1".to_string()
}

fn default_no_color() -> String {
    "1".to_string()
}

fn default_dsh_profile() -> String {
    "web".to_string()
}

fn default_dsh_host() -> String {
    "127.0.0.1".to_string()
}

fn normalize_setting(mut setting: Setting) -> Setting {
    if setting.dsh_launch_options_version == 0 {
        let dsh_web_port = if setting.dsh_web_port.is_empty() {
            setting.port.to_string()
        } else {
            setting.dsh_web_port.clone()
        };
        setting.dsh_environment = vec![
            DshEnvironmentVariable {
                name: "DSH_TELEMETRY_DISABLED".to_string(),
                value: setting.dsh_telemetry_disabled.clone(),
            },
            DshEnvironmentVariable {
                name: "NO_COLOR".to_string(),
                value: setting.no_color.clone(),
            },
            DshEnvironmentVariable {
                name: "DSH_WEB_PORT".to_string(),
                value: dsh_web_port,
            },
        ];
        setting.dsh_arguments = vec![
            "--profile".to_string(),
            setting.dsh_profile.clone(),
            "--host".to_string(),
            setting.dsh_host.clone(),
        ];
        setting.dsh_launch_options_version = 1;
    }

    setting
}

impl Default for Setting {
    fn default() -> Self {
        Self {
            installed: false,
            port: DSH_PORT,
            auto_start: true,
            language: "zh-CN".to_string(),
            http_proxy: String::new(),
            dsh_environment: vec![
                DshEnvironmentVariable {
                    name: "DSH_TELEMETRY_DISABLED".to_string(),
                    value: default_dsh_telemetry_disabled(),
                },
                DshEnvironmentVariable {
                    name: "NO_COLOR".to_string(),
                    value: default_no_color(),
                },
                DshEnvironmentVariable {
                    name: "DSH_WEB_PORT".to_string(),
                    value: DSH_PORT.to_string(),
                },
            ],
            dsh_arguments: vec![
                "--profile".to_string(),
                default_dsh_profile(),
                "--host".to_string(),
                default_dsh_host(),
            ],
            dsh_launch_options_version: 1,
            dsh_telemetry_disabled: default_dsh_telemetry_disabled(),
            no_color: default_no_color(),
            dsh_web_port: DSH_PORT.to_string(),
            dsh_profile: default_dsh_profile(),
            dsh_host: default_dsh_host(),
            dsh_pkg_commit: None,
        }
    }
}

fn store_path<R: Runtime>(app_handle: &AppHandle<R>) -> PathBuf {
    get_base_dir(app_handle).join(STORE_DAT_FILE)
}

fn read_setting(path: &std::path::Path) -> Option<Setting> {
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str::<StoreData>(&content)
        .ok()
        .map(|store| store.setting)
}

fn write_setting(path: &std::path::Path, setting: &Setting) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("Failed to create settings directory");
    }
    let content = serde_json::to_string_pretty(&StoreData {
        setting: setting.clone(),
    })
    .expect("Failed to serialize settings");
    fs::write(path, content).expect("Failed to save settings");
}

fn migrate_legacy_setting<R: Runtime>(
    app_handle: &AppHandle<R>,
    path: &std::path::Path,
) -> Option<Setting> {
    let legacy_path = app_handle.path().app_data_dir().ok()?.join(STORE_DAT_FILE);
    if legacy_path == path {
        return None;
    }

    let setting = read_setting(&legacy_path)?;
    write_setting(path, &setting);
    log::info!(
        "Migrated application settings from {} to {}",
        legacy_path.display(),
        path.display()
    );
    Some(setting)
}

pub fn set_store_dat_setting<R: Runtime>(app_handle: &AppHandle<R>, setting: Setting) {
    write_setting(&store_path(app_handle), &setting);
    app_handle
        .emit("setting_updated", &serde_json::to_value(&setting).unwrap())
        .expect("Failed to emit event");
}

pub fn get_store_dat_setting<R: Runtime>(app_handle: &AppHandle<R>) -> Setting {
    let path = store_path(app_handle);
    let setting = read_setting(&path)
        .or_else(|| migrate_legacy_setting(app_handle, &path))
        .unwrap_or_default();
    let should_persist_defaults = setting.dsh_launch_options_version == 0;
    let setting = normalize_setting(setting);
    if should_persist_defaults {
        write_setting(&path, &setting);
    }
    setting
}

pub fn normalize_http_proxy(value: &str) -> Result<String, String> {
    let value = value.trim();
    if value.is_empty() {
        return Ok(String::new());
    }

    let url = reqwest::Url::parse(value)
        .map_err(|_| "HTTP proxy must be a valid http:// URL".to_string())?;
    if url.scheme() != "http" || url.host_str().is_none() {
        return Err("HTTP proxy must be a valid http:// URL".to_string());
    }
    Ok(url.to_string())
}

pub fn validate_dsh_environment(
    environment: &[DshEnvironmentVariable],
) -> Result<(), String> {
    for variable in environment {
        if variable.name.is_empty() || variable.name.contains('=') {
            return Err("DSH environment variable names must be non-empty and cannot contain '='".to_string());
        }
        if variable.name.eq_ignore_ascii_case("DSH_HOME") {
            return Err("DSH_HOME is managed by the application".to_string());
        }
    }
    Ok(())
}

pub fn validate_dsh_arguments(arguments: &[String]) -> Result<(), String> {
    if arguments
        .iter()
        .any(|argument| argument == "--port" || argument.starts_with("--port="))
    {
        return Err("--port is managed by the application".to_string());
    }
    Ok(())
}

pub fn apply_http_proxy<R: Runtime>(
    app_handle: &AppHandle<R>,
    builder: reqwest::ClientBuilder,
) -> Result<reqwest::ClientBuilder, String> {
    let proxy = get_store_dat_setting(app_handle).http_proxy;
    if proxy.is_empty() {
        return Ok(builder);
    }

    let proxy = reqwest::Proxy::all(&proxy)
        .map_err(|error| format!("Failed to configure HTTP proxy: {error}"))?;
    Ok(builder.proxy(proxy))
}

/// 已安装 Harness 发行版对应的 GitHub release commit hash
pub fn get_dsh_pkg_commit<R: Runtime>(app_handle: &AppHandle<R>) -> Option<String> {
    get_store_dat_setting(app_handle).dsh_pkg_commit
}

/// 记录已安装 Harness 发行版的 GitHub release commit hash
pub fn set_dsh_pkg_commit<R: Runtime>(app_handle: &AppHandle<R>, commit: String) {
    let mut setting = get_store_dat_setting(app_handle);
    setting.dsh_pkg_commit = Some(commit);
    set_store_dat_setting(app_handle, setting);
}

#[cfg(test)]
mod tests {
    use super::{
        normalize_http_proxy, normalize_setting, read_setting, validate_dsh_arguments,
        validate_dsh_environment, DshEnvironmentVariable, Setting, StoreData,
    };
    use std::fs;

    #[test]
    fn reads_store_format_with_release_commit() {
        let path = std::env::temp_dir().join(format!(
            "deepseek-harness-desktop-setting-{}.json",
            std::process::id()
        ));
        let expected = Setting {
            installed: true,
            port: 3080,
            auto_start: false,
            language: "zh-CN".to_string(),
            http_proxy: "http://127.0.0.1:7890".to_string(),
            dsh_environment: vec![],
            dsh_arguments: vec![],
            dsh_launch_options_version: 0,
            dsh_telemetry_disabled: "1".to_string(),
            no_color: "1".to_string(),
            dsh_web_port: "3080".to_string(),
            dsh_profile: "web".to_string(),
            dsh_host: "127.0.0.1".to_string(),
            dsh_pkg_commit: Some("564019027fd9469991aef6e57bb0a96325491c4e".to_string()),
        };
        let content = serde_json::to_string(&StoreData {
            setting: expected.clone(),
        })
        .unwrap();
        fs::write(&path, content).unwrap();

        let actual = read_setting(&path).unwrap();
        assert_eq!(actual.dsh_pkg_commit, expected.dsh_pkg_commit);
        assert_eq!(actual.http_proxy, expected.http_proxy);
        fs::remove_file(path).unwrap();
    }

    #[test]
    fn restores_web_port_from_legacy_setting() {
        let mut setting = Setting::default();
        setting.port = 3810;
        setting.dsh_web_port.clear();
        setting.dsh_launch_options_version = 0;

        let normalized = normalize_setting(setting);
        assert_eq!(normalized.dsh_environment[2].value, "3810");
        assert_eq!(normalized.dsh_arguments, ["--profile", "web", "--host", "127.0.0.1"]);
    }

    #[test]
    fn validates_http_proxy_urls() {
        assert_eq!(
            normalize_http_proxy(" http://127.0.0.1:7890 ").unwrap(),
            "http://127.0.0.1:7890/"
        );
        assert!(normalize_http_proxy("socks5://127.0.0.1:7890").is_err());
        assert!(normalize_http_proxy("127.0.0.1:7890").is_err());
    }

    #[test]
    fn rejects_reserved_launch_options() {
        assert!(validate_dsh_environment(&[
            DshEnvironmentVariable {
                name: "DSH_HOME".to_string(),
                value: "custom".to_string(),
            }
        ])
        .is_err());
        assert!(validate_dsh_arguments(&["--port".to_string()]).is_err());
        assert!(validate_dsh_arguments(&["--port=4000".to_string()]).is_err());
    }
}
