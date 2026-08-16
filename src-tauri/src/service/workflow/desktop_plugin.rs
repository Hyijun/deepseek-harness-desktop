use crate::config;
use serde_json::{json, Map, Value};
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Runtime};

const PACKAGE_NAME: &str = "@deepseek-harness-desktop/dsh-window-drag-bridge";
const PACKAGE_DIR: &str = "dsh-window-drag-bridge";
const PACKAGE_JSON: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../dsh-plugins/desktop-window-drag-bridge/package.json"
));
const PACKAGE_PATCH: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../dsh-plugins/desktop-window-drag-bridge/cordis.patch.yml"
));
const PACKAGE_INDEX: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../dsh-plugins/desktop-window-drag-bridge/lib/index.js"
));
const PACKAGE_CLIENT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../dsh-plugins/desktop-window-drag-bridge/lib/client.js"
));

fn write_if_changed(path: &Path, content: &str) -> Result<(), String> {
    if fs::read_to_string(path).ok().as_deref() == Some(content) {
        return Ok(());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("create {}: {error}", parent.display()))?;
    }
    fs::write(path, content).map_err(|error| format!("write {}: {error}", path.display()))
}

fn deploy_package(package_dir: &Path) -> Result<(), String> {
    write_if_changed(&package_dir.join("package.json"), PACKAGE_JSON)?;
    write_if_changed(&package_dir.join("cordis.patch.yml"), PACKAGE_PATCH)?;
    write_if_changed(&package_dir.join("lib/index.js"), PACKAGE_INDEX)?;
    write_if_changed(&package_dir.join("lib/client.js"), PACKAGE_CLIENT)
}

fn default_profile_manifest() -> Value {
    json!({
        "name": "dsh-profile-web",
        "private": true,
        "dependencies": {},
        "dsh": {
            "profile": {
                "bundles": [
                    "@deepseek-ai/dsh-base",
                    "@deepseek-ai/dsh-web-app"
                ]
            }
        }
    })
}

fn object_mut<'a>(value: &'a mut Value, context: &str) -> Result<&'a mut Map<String, Value>, String> {
    value
        .as_object_mut()
        .ok_or_else(|| format!("desktop drag plugin: {context} must be a JSON object"))
}

fn ensure_profile_bundle(profile_manifest: &Path) -> Result<bool, String> {
    let mut manifest = match fs::read_to_string(profile_manifest) {
        Ok(content) => serde_json::from_str(&content)
            .map_err(|error| format!("parse {}: {error}", profile_manifest.display()))?,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => default_profile_manifest(),
        Err(error) => return Err(format!("read {}: {error}", profile_manifest.display())),
    };

    let dsh = object_mut(&mut manifest, "profile manifest")
        .and_then(|root| {
            Ok(root
                .entry("dsh")
                .or_insert_with(|| Value::Object(Map::new())))
        })?;
    let profile = object_mut(dsh, "profile manifest dsh")
        .and_then(|dsh| {
            Ok(dsh
                .entry("profile")
                .or_insert_with(|| Value::Object(Map::new())))
        })?;
    let bundles = object_mut(profile, "profile manifest dsh.profile")?
        .entry("bundles")
        .or_insert_with(|| Value::Array(Vec::new()))
        .as_array_mut()
        .ok_or_else(|| "desktop drag plugin: profile bundles must be an array".to_string())?;

    if bundles.iter().any(|bundle| bundle.as_str() == Some(PACKAGE_NAME)) {
        return Ok(false);
    }

    bundles.push(Value::String(PACKAGE_NAME.to_string()));
    let content = serde_json::to_string_pretty(&manifest)
        .map_err(|error| format!("serialize {}: {error}", profile_manifest.display()))?;
    write_if_changed(profile_manifest, &format!("{content}\n"))?;
    Ok(true)
}

/// Deploy the bundled client plugin and register it in the web profile.
///
/// The bundle resolver reads from the DSH installation, while Node resolves a
/// loader entry from the profile directory. Keep identical copies at both lookup
/// roots so no pnpm install or user dependency change is required.
pub fn ensure_desktop_window_drag_plugin<R: Runtime>(app_handle: &AppHandle<R>) -> Result<(), String> {
    let package_dir = config::get_dsh_install_path(app_handle)
        .join("node_modules")
        .join("@deepseek-harness-desktop")
        .join(PACKAGE_DIR);
    deploy_package(&package_dir)?;

    let profile_dir = config::get_dsh_data_path(app_handle)
        .join("profiles")
        .join("web");
    deploy_package(
        &profile_dir
            .join("node_modules")
            .join("@deepseek-harness-desktop")
            .join(PACKAGE_DIR),
    )?;

    let profile_manifest = profile_dir.join("package.json");
    if ensure_profile_bundle(&profile_manifest)? {
        log::info!("Registered desktop window drag bridge in the DSH web profile");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{deploy_package, ensure_profile_bundle, PACKAGE_NAME};
    use serde_json::Value;
    use std::fs;

    #[test]
    fn creates_and_preserves_profile_bundle_list() {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = std::env::temp_dir().join(format!("dsh-desktop-plugin-{unique}"));
        let manifest = root.join("profiles/web/package.json");

        assert!(ensure_profile_bundle(&manifest).unwrap());
        assert!(!ensure_profile_bundle(&manifest).unwrap());

        let document: Value = serde_json::from_str(&fs::read_to_string(&manifest).unwrap()).unwrap();
        let bundles = document["dsh"]["profile"]["bundles"].as_array().unwrap();
        assert_eq!(bundles.last().and_then(Value::as_str), Some(PACKAGE_NAME));

        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn deploys_a_profile_local_package_copy() {
        let root = std::env::temp_dir().join(format!(
            "dsh-desktop-plugin-package-{}",
            std::process::id()
        ));
        let package_dir = root.join("node_modules/@deepseek-harness-desktop/dsh-window-drag-bridge");

        deploy_package(&package_dir).unwrap();
        assert!(package_dir.join("package.json").is_file());
        let client = fs::read_to_string(package_dir.join("lib/client.js")).unwrap();
        assert!(client.contains("conversation.session.header.utilities"));
        assert!(client.contains("desktop-window-controls"));
        assert!(client.contains("minimize-window"));
        assert!(client.contains("hide-window"));
        assert!(client.contains("write-native-clipboard"));
        assert!(client.contains("native-clipboard-write-result"));

        fs::remove_dir_all(root).unwrap();
    }
}
