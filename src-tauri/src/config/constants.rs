use std::time::Duration;

/// 捆绑的 Node.js 运行时版本（满足 v22.15.0+ / v23.8.0+ 的要求）
pub const NODE_VERSION: &str = "v22.22.0";

/// Node.js 官方下载地址
pub const NODE_BASE_URL: &str = "https://nodejs.org/dist/";

/// 打包的 DeepSeek Harness 发行版下载地址（GitHub Release）
pub const DSH_CORE_URL: &str =
    "https://github.com/hairyf/deepseek-harness-pkg/releases/latest/download/";

/// Harness 服务地址与默认端口
pub const DSH_HOST: &str = "http://127.0.0.1";
pub const DSH_PORT: u16 = 3080;

/// 安装目录与 CLI 入口（相对安装目录）
pub const DSH_CORE_DIR: &str = "dsh";
pub const DSH_ENTRY_RELATIVE: &str = "node_modules/@deepseek-ai/dsh/lib/bin.js";
pub const DSH_MANIFEST_RELATIVE: &str = "package.json";

/// 数据目录名（$DSH_HOME 的相对目录）
pub const DSH_DATA_DIR_NAME: &str = "dsh";

/// 安装目录中的应用设置文件
pub const STORE_DAT_FILE: &str = ".store.dat";

/// 健康检查超时
pub const HEALTH_CHECK_TIMEOUT: Duration = Duration::from_secs(5);
