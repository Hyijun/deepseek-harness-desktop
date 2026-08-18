<p align="center">
  <a href="https://github.com/hairyf/deepseek-harness-desktop">
    <img src="public/favicon.svg" width="96" alt="DeepSeek Harness Desktop" />
  </a>
</p>

<h1 align="center">DeepSeek Harness 桌面版</h1>

<p align="center">
  在桌面上一键运行 <a href="https://github.com/deepseek-ai/deepseek-harness">DeepSeek Harness</a> ——<br />
  无需 Node.js、无需 pnpm、无需 Docker，下载即用。
</p>

<p align="center">
  <a href="https://github.com/hairyf/deepseek-harness-desktop/releases">
    <img src="https://img.shields.io/github/v/release/hairyf/deepseek-harness-desktop?style=flat-square&label=release&color=4D6BFE" alt="Release" />
  </a>
  <img src="https://img.shields.io/github/downloads/hairyf/deepseek-harness-desktop/total?style=flat-square&label=downloads&color=4D6BFE" alt="Downloads" />
  <img src="https://img.shields.io/github/stars/hairyf/deepseek-harness-desktop?style=flat-square&label=stars&color=4D6BFE" alt="Stars" />
  <img src="https://img.shields.io/github/license/hairyf/deepseek-harness-desktop?style=flat-square&label=license&color=4D6BFE" alt="MIT License" />
  <img src="https://img.shields.io/badge/Windows%20%7C%20macOS%20%7C%20Linux-black?style=flat-square" alt="Windows | macOS | Linux" />
</p>

<p align="center">
  <samp><a href="./README.md">English</a> · <strong>中文</strong></samp>
</p>

![预览](docs/hero.png)

## 功能

- ⚡️ **零环境** — 首次启动自动装配内置 Node 运行时与 Harness 内核；本机已有兼容 Node / Pnpm 时直接复用，不碰你的系统环境。
- 🔄 **内核自愈** — 每次启动自动同步上游最新 Harness 版本，上游修复无需重新安装，打开即跟上。
- 🔒 **纯本地 · 隐私默认** — 运行在 `127.0.0.1:3080`，profile / 会话 / 设置全部留在本机，默认关闭遥测。
- 🪶 **原生轻量** — Tauri 2 外壳（非 Electron）：更小的安装包、更低的内存占用、原生窗口。Windows / macOS / Linux，中英双语界面。
- ⌨️ **命令行集成** — 安装后自动注册 `dsh` 命令（`*/bin`），新开终端即用。
- 🧭 **首次启动引导** — 首次启动可选装推荐插件（如 dsh-market 插件市场）并实时查看安装日志；可随时跳过，之后也能从侧边栏重新打开。

## 快速开始

从 [Releases](https://github.com/hairyf/deepseek-harness-desktop/releases) 下载对应平台安装包，安装后启动即可。

首次运行会下载 Node 运行时与 Harness 内核（合计约几百 MB），随后直接进入 `http://127.0.0.1:3080` 的 Harness 界面；此后完全本地运行，无需联网。

**系统要求：** Windows 10+（64 位）· macOS 10.15+ · Linux（AppImage）· 首次运行需要网络

## 开发

想参与开发？参见 [docs/DEVELOPMENT.zh.md](./docs/DEVELOPMENT.zh.md)。

## 工作原理

```text
┌──────────────────────────────────────────────┐
│ Tauri WebView (React)                        │
│   安装状态机 → 下载进度 → iframe              │
│   加载 dsh Web 界面 + 侧边栏控制              │
└──────────────────────┬───────────────────────┘
                       │ invoke 命令 + 事件
┌──────────────────────┴───────────────────────┐
│ Tauri Rust 后端                              │
│   service/download  安装器 + 解压             │
│   service/workflow  dsh 进程生命周期          │
│   task              dsh 健康检查              │
└──────┬───────────────────────────┬───────────┘
       │                           │
  runtime/ (Node.js v22.22.0)   dependencies/dsh/ (发行版)
       └─────────────┬─────────────┘
                     ▼
   dsh --profile web --host 127.0.0.1 --port 3080
                     │  DSH_HOME=<app-data>/data/dsh
                     ▼
        http://127.0.0.1:3080/  ← 内嵌界面
```

Harness 发行版由 [deepseek-harness-pkg](https://github.com/hairyf/deepseek-harness-pkg) 构建发布。每次启动都会对比最新发行版，本地过期时自动重新下载；GitHub 不可达时保留本地安装。

## 说明

> [!WARNING]
> **开发预览** — 上游 `dsh` 仍在快速迭代，存在破坏性变更；本项目同步跟随。

> [!IMPORTANT]
> **macOS Gatekeeper** — 应用未公证，首次启动需在系统设置 → 隐私与安全性 → 仍要打开 放行一次。

> [!NOTE]
> **安全声明** — `dsh` 具备本地代码执行能力。仅供学习 / 研究 / 测试，请在可信、隔离的环境中使用。

## 相关项目

- [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — 上游 `dsh` agent 平台
- [deepseek-harness-pkg](https://github.com/hairyf/deepseek-harness-pkg) — 打包好的 Harness 发行版（本应用下载源）
- [dsh-market](https://github.com/dsh-market/dsh-market) — 插件市场，首次启动时作为推荐预装插件提供
- [n8n-desktop](https://github.com/tangtao646/n8n-desktop) — 参考实现

## License

[MIT](./LICENSE) © deepseek-harness-desktop contributors
