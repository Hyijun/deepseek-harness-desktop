use tauri::{Runtime, WebviewWindow};

pub fn show_window<R: Runtime>(window: &WebviewWindow<R>) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

pub fn app_icon_temp_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    let icon = app.default_window_icon()?;
    let path = std::env::temp_dir().join(format!("dsh-notification-{}.png", std::process::id()));
    let rgba = icon.rgba().to_vec();
    let img = image::RgbaImage::from_raw(icon.width(), icon.height(), rgba)?;
    img.save(&path).ok()?;
    Some(path)
}