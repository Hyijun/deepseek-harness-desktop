use futures_util::StreamExt;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::config;
use crate::service::download::ProgressTracker;
use tauri::{AppHandle, Runtime};

/// 下载文件到内存
///
/// # 参数
/// - `tracker`: 进度追踪器
/// - `url`: 要下载的文件 URL
///
/// # 返回
/// 成功返回文件内容 `Ok(Vec<u8>)`，失败返回错误信息
pub async fn download_file<'a, R: Runtime>(
    tracker: &'a ProgressTracker<'a, R>,
    app_handle: &AppHandle<R>,
    url: String,
) -> Result<Vec<u8>, String> {
    log::info!("Starting file download: {}", url);
    // 创建具备 User-Agent 的客户端
    let client = config::apply_http_proxy(
        app_handle,
        reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (deepseek-harness-desktop)")
            .connect_timeout(std::time::Duration::from_secs(20)),
    )?
    .build()
        .map_err(|e| {
            log::error!("Failed to create HTTP client: {}", e);
            e.to_string()
        })?;

    let res = client.get(&url).send().await.map_err(|e| {
        log::error!("Download request failed: {}", e);
        e.to_string()
    })?;

    if !res.status().is_success() {
        log::error!("Download failed with HTTP status: {}", res.status());
        return Err(format!("Download failed: HTTP {}", res.status()));
    }

    // 下载流处理并写入内存
    let total_size = res.content_length().unwrap_or(0);
    log::debug!("File size: {} bytes", total_size);
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();
    let mut buffer = Vec::new();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| {
            log::error!("Download stream read error: {}", e);
            e.to_string()
        })?;
        buffer.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;
        let progress_pct = (downloaded as f64 / total_size as f64) * 100.0;
        tracker.update(
            progress_pct,
            format!(
                "已下载 {:.1} MB / {:.1} MB",
                downloaded as f64 / 1_000_000.0,
                total_size as f64 / 1_000_000.0
            ),
            format!("Download {}", url),
        );
    }

    log::info!("Download completed, {} bytes total", downloaded);
    Ok(buffer)
}

/// 删除目录并等待 Windows 文件锁释放。
///
/// 结束 dsh/node 进程后，加载进内存的 DLL 句柄不会立即释放，删除目录可能
/// 短暂失败（os error 32）。这里轮询等待，最长约 10 秒。
fn remove_dir_with_retry(dest: &Path) -> bool {
    const MAX_ATTEMPTS: u32 = 40;
    const RETRY_DELAY: Duration = Duration::from_millis(250);

    for attempt in 1..=MAX_ATTEMPTS {
        match fs::remove_dir_all(dest) {
            Ok(()) => return true,
            Err(e) => {
                if attempt < MAX_ATTEMPTS {
                    log::warn!(
                        "Failed to clean {:?} (attempt {}/{}), file may be locked: {}",
                        dest,
                        attempt,
                        MAX_ATTEMPTS,
                        e
                    );
                    std::thread::sleep(RETRY_DELAY);
                } else {
                    log::error!(
                        "Failed to clean {:?} after {} attempts: {}",
                        dest,
                        MAX_ATTEMPTS,
                        e
                    );
                }
            }
        }
    }
    false
}

/// 确保解压文件到指定目录
///
/// # 参数
/// - `tracker`: 进度追踪器
/// - `name`: 文件名
/// - `buffer`: 压缩文件内容
/// - `dest`: 解压目标目录
///
/// # 返回
/// 成功返回 `Ok(())`，失败返回错误信息
pub fn ensure_extract<'a, R: Runtime>(
    tracker: &'a ProgressTracker<'a, R>,
    name: String,
    buffer: Vec<u8>,
    dest: PathBuf,
) -> Result<(), String> {
    log::info!("Starting file extraction: {} -> {:?}", name, dest);
    use super::extractor::{extract_tgz, extract_zip};
    use super::utils::flatten_directory;

    // 判断文件类型
    let pure_name = name.split('?').next().unwrap_or(&name).to_lowercase();
    let is_tgz = pure_name.ends_with(".tar.gz") || pure_name.ends_with(".tgz");
    let is_zip = pure_name.ends_with(".zip");
    log::debug!("File type: tgz={}, zip={}", is_tgz, is_zip);

    // 目标是文件，跳过，直接写入文件
    if !is_tgz && !is_zip {
        log::debug!("Non-compressed file, writing directly");
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                log::error!("Failed to create parent directory: {}", e);
                e.to_string()
            })?;
        }
        fs::write(&dest, &buffer).map_err(|e| {
            log::error!("Failed to write file: {}", e);
            e.to_string()
        })?;
        tracker.update(
            100.0,
            format!("已写入: {}", "100%"),
            format!("File written: {}", dest.display()),
        );
        log::info!("File write completed: {}", dest.display());
        return Ok(());
    }

    // 清理并准备目标目录。Windows 上被进程加载的 DLL 在进程退出后释放句柄
    // 需要时间，轮询等待目录可被删除；仍被占用时直接报错，避免在残留文件
    // 上继续解压而得到“文件被锁”的误导性错误。
    if dest.exists() {
        log::debug!("Destination directory exists, cleaning");
        if !remove_dir_with_retry(&dest) {
            return Err(format!(
                "Destination directory is still locked, cannot clean: {:?}",
                dest
            ));
        }
    }
    fs::create_dir_all(&dest).map_err(|e| {
        log::error!("Failed to create destination directory: {}", e);
        e.to_string()
    })?;

    // 根据文件类型解压
    if is_tgz {
        log::debug!("Using tgz extractor");
        extract_tgz(tracker, &buffer, &dest)?;
    } else {
        log::debug!("Using zip extractor");
        extract_zip(tracker, &buffer, &dest)?;
    }

    // 处理解压后的"套娃"文件夹
    log::debug!("Flattening directory structure");
    flatten_directory(&dest).map_err(|e| {
        log::error!("Failed to flatten directory: {}", e);
        e.to_string()
    })?;

    // 权限修复与隔离属性移除 (仅限 Unix/macOS)
    #[cfg(unix)]
    {
        use super::utils::fix_recursive_permissions;
        // 递归赋予可执行权限 (755)
        log::debug!("Fixing file permissions");
        fix_recursive_permissions(&dest).map_err(|e| {
            log::error!("Failed to fix permissions: {}", e);
            format!("Failed to fix permissions: {}", e)
        })?;

        // macOS 移除 quarantine 属性
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            log::debug!("Removing macOS quarantine attribute");
            if let Some(path_str) = dest.to_str() {
                let _ = Command::new("xattr")
                    .args(["-cr", path_str])
                    .output();
            }
        }
    }

    Ok(())
}

/// GitHub API 地址（未认证限流 60 次/小时/IP，仅供每次启动检查一次）
const DSH_PKG_GITHUB_API: &str = "https://api.github.com/repos/hairyf/deepseek-harness-pkg";

/// 最新 Harness 发行版信息（版本 tag + 对应 commit hash）
#[derive(Debug, Clone, serde::Serialize)]
pub struct LatestDshPkg {
    pub tag: String,
    pub commit: String,
}

/// 查询 GitHub 上最新 Harness 发行版信息
///
/// 先取最新 release 的 tag_name，再通过 commits 端点把 tag 解析为 commit。
/// 网络不可用或 API 限流时返回 Err，由调用方决定是否保留本地安装。
pub async fn fetch_latest_dsh_pkg_info<R: Runtime>(
    app_handle: &AppHandle<R>,
) -> Result<LatestDshPkg, String> {
    let client = config::apply_http_proxy(
        app_handle,
        reqwest::Client::builder()
            .user_agent("deepseek-harness-desktop")
            .timeout(std::time::Duration::from_secs(5)),
    )?
    .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // 1. 最新 release 的 tag_name
    let release: serde_json::Value = client
        .get(format!("{}/releases/latest", DSH_PKG_GITHUB_API))
        .send()
        .await
        .map_err(|e| format!("Failed to request latest release: {}", e))?
        .error_for_status()
        .map_err(|e| format!("Latest release request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse latest release response: {}", e))?;
    let tag_name = release
        .get("tag_name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing tag_name in latest release response".to_string())?;

    // 2. 通过 commits 端点把 tag 解析为 commit hash
    let commit: serde_json::Value = client
        .get(format!("{}/commits/{}", DSH_PKG_GITHUB_API, tag_name))
        .send()
        .await
        .map_err(|e| format!("Failed to request release commit: {}", e))?
        .error_for_status()
        .map_err(|e| format!("Release commit request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse release commit response: {}", e))?;
    let sha = commit
        .get("sha")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing sha in release commit response".to_string())?;

    Ok(LatestDshPkg {
        tag: tag_name.to_string(),
        commit: sha.to_string(),
    })
}

/// 查询 GitHub 上最新 Harness 发行版对应的 commit hash
pub async fn fetch_latest_dsh_pkg_commit<R: Runtime>(
    app_handle: &AppHandle<R>,
) -> Result<String, String> {
    fetch_latest_dsh_pkg_info(app_handle).await.map(|info| info.commit)
}
