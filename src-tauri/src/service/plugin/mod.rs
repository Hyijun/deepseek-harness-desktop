//! 预装插件：首次启动引导安装官方推荐插件（当前为 DSH Market）。
//!
//! 安装通过 `dsh plugin --profile web add <pkg>` 完成：该子命令是 pnpm 转发器，
//! 会在 `$DSH_HOME/profiles/web` 初始化 profile 并执行 `pnpm add`，随后把声明了
//! `dsh.bundle` 的依赖写入 profile 的 bundles 层，使插件在下次启动时加载。
//! 进程输出逐行通过 `preinstall-log` 事件实时推送给前端日志面板。
//! 调用 dsh 前会先按需补齐捆绑 pnpm（老版本升级后可能缺失，安装流程内自愈）。
//!
//! 预设清单存放在随安装包分发的 `resources/preset-plugins.json`：社区新增推荐插件
//! 只需在该 JSON 中追加一项并提交 PR，无需改动 Rust 代码；界面与安装逻辑自动生效。
//!
//! 模块划分（参考 `service/cli/`、`service/download/`）：
//! - [`preset`]：预设清单读取与解析（`resources/preset-plugins.json`）
//! - [`installed`]：profile 内已安装插件检测（解析 package.json 的依赖与 bundles）
//! - [`install`]：对外安装编排（校验选中项、环境准备、调用 dsh 子进程）
//! - [`process`]：dsh 子进程启动与输出流逐行转发
//! - [`cancel`]：Windows 下取消正在进行的安装

mod cancel;
mod install;
mod installed;
mod preset;
mod process;

pub use cancel::cancel;
pub use install::install;
pub use installed::{list, PreinstallPlugin};
pub use preset::repo_url_of;