export type Translation = {
  [key: string]: string | string[] | Translation | Translation[];
};

export interface FeatureItem {
  title: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

const zh: Translation = {
  nav: {
    features: "核心特性",
    faq: "常见问题",
    github: "GitHub",
    download: "下载",
  },
  hero: {
    badge: "v0.1.8 · 基于 Tauri 2 · MIT 开源",
    title1: "在本地一键运行",
    title2: "DeepSeek Harness",
    subtitle:
      "免装 Node.js / pnpm / Docker —— 下载安装包，打开即用。纯本地运行、数据不出机器，内核随上游自愈更新。",
    ctaPrimary: "下载安装包",
    ctaSecondary: "查看源码",
    stat1: "0",
    stat1Label: "GitHub Star",
    stat2: "3",
    stat2Label: "平台支持",
    stat3: "0",
    stat3Label: "环境依赖",
    stat4: "100%",
    stat4Label: "本地运行",
    scrollHint: "向下滚动探索",
    imgAlt: "DeepSeek Harness Desktop 主界面预览",
  },
  features: {
    kicker: "Features",
    title: "核心特性",
    subtitle: "把 8.2 万 Star 的 agent 平台，装进一个「下载即用」的桌面应用。",
    items: [
      {
        title: "一键开箱即用",
        desc: "首次启动自动安装打包好的 Harness 发行版与 Node 运行时；本机已有兼容 Node（v22.15+ / v23.8+）则直接复用，无需配置任何环境。",
      },
      {
        title: "内核自愈更新",
        desc: "每次启动对比 deepseek-harness-pkg 最新 release，版本不一致自动重新下载，上游修复无需手动重装即可生效。",
      },
      {
        title: "纯本地运行",
        desc: "dsh web 服务运行在 127.0.0.1:3080，profile、会话与设置全部保存在本机，不依赖云端。",
      },
      {
        title: "隐私默认",
        desc: "隔离的 $DSH_HOME，默认关闭遥测（DSH_TELEMETRY_DISABLED=1），数据不出机器。",
      },
      {
        title: "原生轻量",
        desc: "基于 Tauri 2 而非 Electron：更小安装包、更低内存，内嵌系统 WebView2/WebKit 而非自带 Chromium。",
      },
      {
        title: "跨平台",
        desc: "Windows（NSIS/MSI）、macOS（DMG）、Linux（AppImage）安装包一应俱全。",
      },
      {
        title: "中英双语",
        desc: "界面支持中文与 English，随时一键切换。",
      },
      {
        title: "主题跟随",
        desc: "无边框原生窗口，侧边栏与窗口控制自动适配 Harness 的亮色 / 暗色主题。",
      },
    ],
  },
  faq: {
    kicker: "FAQ",
    title: "常见问题",
    items: [
      {
        q: "首次启动要下载多少内容？",
        a: "需要一次性下载 Node.js 运行时与 Harness 发行包（约几百 MB），之后即可离线运行。若本机已有兼容 Node（v22.15+ / v23.8+）会直接复用，跳过运行时下载。",
      },
      {
        q: "3080 端口被占用怎么办？",
        a: "在侧边栏设置中修改端口并重启服务即可。",
      },
      {
        q: "为什么每次启动都会访问 GitHub？",
        a: "用于对比本地 Harness 发行版与最新 release commit，不一致时自动重新下载；GitHub 不可达时保留本地安装，不影响使用。",
      },
      {
        q: "安装后如何更新？",
        a: "启动后跳过安装界面，后台静默检查新版并弹出「立即更新 / 稍后」提示；点击更新会重新下载发行版并重启服务。",
      },
      {
        q: "数据存在哪里？",
        a: "由应用 bundle identifier 决定：Windows 在 %APPDATA%，macOS 在 ~/Library/Application Support，Linux 在 ~/.local/share。包含 runtime、dependencies/dsh 与 data/dsh 等目录。",
      },
    ],
  },
  cta: {
    title: "准备好本地运行 DeepSeek Harness 了吗？",
    desc: "免费 · MIT · 开源。支持 Windows / macOS / Linux。",
    button: "前往 GitHub Releases 下载",
    secondary: "Star 支持项目",
  },
  footer: {
    tagline: "DeepSeek Harness 的一键式桌面应用 —— 免环境、纯本地、随上游自愈更新。",
    product: "产品",
    links: {
      features: "核心特性",
      faq: "常见问题",
    },
    project: "项目",
    projectLinks: {
      github: "GitHub 仓库",
      releases: "Releases 下载",
      issues: "Issues / 反馈",
    },
    related: "相关项目",
    relatedLinks: {
      upstream: "deepseek-harness（上游）",
      pkg: "deepseek-harness-pkg",
    },
    disclaimer: "仅用于学习、研究、测试。agent 具备本地代码执行能力，请在隔离环境使用。",
    license: "MIT License © deepseek-harness-desktop contributors",
    based: "基于 Tauri 2 构建 · 中英双语",
  },
};

export default zh;
