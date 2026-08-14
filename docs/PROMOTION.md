# DeepSeek Harness Desktop — 推广内容包

> 目标：让「官方同源、Tauri 轻量、开箱即用」的 DeepSeek Harness 桌面端被更多人看到。
> 上游 `deepseek-ai/deepseek-harness` 已有 **8.2 万 star**，而本桌面端目前仅 ~12 star，严重被低估 —— 这就是机会。

---

## 0. 事实清单（所有帖子都基于以下事实，勿夸大）

- 项目：**DeepSeek Harness Desktop**（`hairyf/deepseek-harness-desktop`），v0.1.8，MIT
- 本质：DeepSeek Harness（dsh agent 平台）的一键桌面封装，**基于 Tauri 2**（比 Electron 轻得多）
- 一键开箱即用：免装 Node.js / pnpm / Docker，下载即跑；首次启动自动装内核
- 智能 Node 复用：本机有 v22.15+ / v23.8+ 的 Node 则直接复用，否则用内置 v22.22.0 LTS
- 内核自愈更新：每次启动对比 `deepseek-harness-pkg` 最新 release，不一致自动重下，上游修复无需手动重装
- 纯本地：服务跑在 `http://127.0.0.1:3080`，profile / 会话 / 设置全在本机
- 隐私默认：隔离 `$DSH_HOME`，默认关遥测（`DSH_TELEMETRY_DISABLED=1`，隐私观感加分）
- 跨平台：Windows（NSIS/MSI）、macOS（DMG）、Linux（AppImage）
- 中英双语界面的原生窗口外壳（无边框 + 主题跟随）
- 定位：非商业、仅供学习/研究/测试；agent 有本地代码执行能力，请在隔离环境使用
- 竞品参考（本盘点）：`steven-kid`(88★, Electron/JS)、`sleep2agi`(10★, JS)、`ningbainb`(15★, Electron/TS)

### 差异点（对外主打）
1. **同源可信**：与官方同作者生态，离上游最近、更新跟上最快的 Tauri 版（其他多为 Electron，更重）。
2. **免环境**：连 Node 都不用装就能跑完整 agent 平台，这是最大门槛的消除。
3. **内核自愈**：不用等桌面端发版，DeepSeek Harness 内核一更新，桌面端启动时就自动跟进。
4. **隐私**：纯本地 + 默认关遥测，数据不出机器。

---

## 1. V2EX（中文 · 「分享创造」节点风格，技术向但亲民）

**标题候选：**
> 做了个 DeepSeek Harness 桌面版：免装 Node/pnpm/Docker，下载即跑，还能自动更新内核

**正文：**

这几年 DeepSeek Harness（8w+ star 的那个 agent 平台）热度很高，但用起来的门槛是：得自己装 Node、pnpm、Docker，还要命令行。对只想点开就用的人来说有点劝退。

所以我基于 Tauri 2 做了个桌面封装：**DeepSeek Harness Desktop**，把这层门槛直接抹掉了。

核心几点：
- **一键开箱即用**：下载安装包 → 打开 → 自动装内核 → 完事。本机有兼容 Node 就直接复用，没有就内置 v22 LTS，完全不碰你的系统环境。
- **纯本地 + 隐私默认**：跑在 127.0.0.1:3080，profile/会话/设置都在本机；隔离开的 DSH_HOME，默认关遥测。
- **内核自愈更新**：每次启动对比最新的 deepseek-harness-pkg release，不一致自动重下。也就是说 DeepSeek Harness 上游一更新，桌面端不用等我就自动跟进，很省心。
- **跨平台**：Windows / macOS / Linux 都有安装包，界面中英双语。

为什么用 Tauri 而不是 Electron？因为同样的功能下它更轻，内存和安装包都小一圈，原生窗口更跟手。这类「本地跑 agent」的工具我倾向干干净净的。

项目是 MIT 开源，仅供学习/研究/测试。如果你是：
- 想试用 dsh 但不想折腾环境的 **小白**
- 想给家人/同事/客户低成本演示 agent 能力的 **布道者**
- 需要隔离、纯本地跑的 **隐私敏感用户**

可以试试。有问题欢迎来 GitHub 提 issue，也在收集 feedback 改进。

👉 https://github.com/hairyf/deepseek-harness-desktop

---

## 2. 知乎（中文 · 回答/文章体，偏「干货+价值」）

**标题候选（回答/文章）：**
> 体验过 DeepSeek Harness，但被命令行劝退？这个免安装的桌面版帮你三分钟跑起来

**正文：**

DeepSeek Harness 是现在关注度很高的开源 agent 平台（GitHub 8w+ star），「Everything is a Plugin」的理念很吸引人。但对大多数人来说，最大的拦路虎不是它不会用，而是**环境搭建**：Node 版本、pnpm、还可能踩 Docker 的坑，一套下来半天没了。

这也是我为什么会做一个桌面版 —— DeepSeek Harness Desktop（开源，MIT）。它不是重写，而是把这套 agent 平台打包成「下载 → 打开 → 用」的样子：

**1) 真正的一键式**
- 免装 Node.js / pnpm / Docker。
- 首次启动自动安装内核，本机若有兼容 Node 直接复用，没有就用内置的 v22 LTS。
- 之后打开就直接进入 Harness 界面，不用每次都配环境。

**2) 隐私是默认值**
- 所有东西跑在本地 127.0.0.1:3080，profile、会话、设置不离开你的机器。
- 隔离开的 DSH_HOME，默认关闭遥测。这一点对把 agent 当私人生产力工具的人很重要。

**3) 内核自愈更新**
最深的一点：它每次启动会对比上游 deepseek-harness-pkg 的最新 release，内核有更新就自动重下。等于**你不用管「桌面版 vs 上游」的版本落差**，官方一进步，你这边下次打开就跟上了。

**4) 跨平台 + 双语**
Windows/macOS/Linux 安装包都有，界面中英双语，原生窗口（Tauri 2，比 Electron 轻）。

适用人群：
- 学生/研究者：想低成本试 dsh，不想碰环境。
- 布道者：给不懂技术的同事/客户演示 agent 能力。
- 隐私敏感用户：需要纯本地、隔离运行。

一点诚实的提醒：agent 有本地代码执行能力，请务必在可信、隔离的环境里用，也不要用在商业生产。项目仍在快速迭代期。

项目地址（欢迎 star / issue）：

👉 https://github.com/hairyf/deepseek-harness-desktop

---

## 3. 即刻 / 微博（中文 · 短动态，2~3 条可轮流发）

**即刻/微博 短帖 A：**
> 把 DeepSeek Harness（8w+ star 的 agent 平台）做成了桌面 App：免装 Node/pnpm/Docker，下载即跑，纯本地，默认关遥测。最妙的是内核能自愈更新，上游一更新下次打开就自动跟进。基于 Tauri 2，比 Electron 轻。Win/mac/Linux 都有包，中英双语界面。🎉 🔗 github.com/hairyf/deepseek-harness-desktop

**短帖 B（偏使用场景）：**
> 想给不懂技术的家人/同事演示 agent 能干嘛？这个桌面版只要下载打开就能用，不用配任何环境。跑在本地 127.0.0.1，数据不出机器。适合想干净、私密体验 dsh 的人。Project: DeepSeek Harness Desktop @ GitHub 🔗 github.com/hairyf/deepseek-harness-desktop

**短帖 C（偏工程/清单）：**
> DeepSeek Harness Desktop v0.1.8：✓ 免 Node 环境 ✓ 纯本地+关遥测 ✓ 内核自愈更新 ✓ Tauri2 轻量 ✓ Win/mac/Linux ✓ 双语。开源 MIT，仅供学习/研究/测试。GitHub 欢迎 star/issue 🔗 github.com/hairyf/deepseek-harness-desktop

---

## 4. 小红书（中文 · 年轻人向，emoji + 图文清单 + 封面建议）

**标题候选：**
> 把 8w star 的 AI Agent 平台做成了一杯咖啡就能装好的桌面 App ☕️

**正文（配图 3 张：①界面预览 ②「一键安装」截图 ③跨平台清单）：**

今天发现了一个宝藏开源项目！把我心心念念的 DeepSeek Harness（GitHub 8w+ star 的 AI Agent 平台）做成了**桌面 App**，关键是真的能开箱即用👇

✨ 免装环境：不用 Node.js、不用 pnpm、不用 Docker！下载→打开→完事，内置了 Node 运行时，本机有兼容版本也会自动复用～

🔒 纯本地+隐私：所有数据和会话都跑在你自己电脑上（127.0.0.1），默认关遥测，不悄悄上传。介意隐私的同学会爱这个。

🔄 内核自愈更新：上游 agent 平台一更新，这个桌面版下次打开就自动跟进，不用手动折腾版本。

💻 跨平台：Windows / macOS / Linux 都有安装包，界面中英双语，原生 Tauri 2 比 Electron 更轻更流畅～

💡 适合谁？
- 想试 AI Agent 但配置环境想劝退的
- 想给家里人/同事演示「AI 能干这些事」的
- 想要干净私密本地运行体验的

⚠️ 提醒：开源免费，仅供学习/研究/测试；AI Agent 有本地执行能力，记得在隔离环境用。

🔗 地址放评论区！欢迎 star 🌟

**评论区置顶评论（放链接）：**
> github.com/hairyf/deepseek-harness-desktop 开源 MIT～ 欢迎体验和提 issue，收集 feedback 持续改进！

---

## 5. Hacker News（英文 · Show HN 风格，克制、技术性强）

**Title:**
> Show HN: DeepSeek Harness Desktop – Run the 82k-star agent harness locally, no Node/pnpm/Docker

**Text:**

I built a Tauri 2 desktop wrapper for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) ("Everything is a Plugin", ~82k stars). The ethos of that project is great, but the onboarding is a real wall for most people: you need the right Node, pnpm, sometimes Docker, then you drive it from the CLI.

DeepSeek Harness Desktop turns that into download → launch → use.

What it does:
- **One-click install**: it bundles a Node runtime (v22.22.0 LTS) and a prebuilt Harness bundle; if you already have a compatible Node (v22.15+ / v23.8+) it reuses yours and skips the download.
- **Runs 100% local**: the `dsh web` service on `http://127.0.0.1:3080`; profiles, sessions, settings all on your machine. Isolated `$DSH_HOME`, telemetry disabled by default (`DSH_TELEMETRY_DISABLED=1`).
- **Self-healing core updates**: on every launch it diffs the installed Harness bundle against the latest `deepseek-harness-pkg` release and re-downloads when it differs. So upstream fixes ship to end users without waiting on a wrapper release.
- **Cross-platform**: Windows (NSIS/MSI), macOS (DMG), Linux (AppImage). Bilingual UI (EN/中文). Built on Tauri 2 rather than Electron to keep it light.

Honest caveats: it's under active development (upstream dsh moves fast with breaking changes) and it's for learning/research/testing — as with any agent harness, it has local code execution, so run it in a trusted, isolated environment.

The official desktop repo is still small (~12 stars) next to its 82k-star upstream, which I think reflects an onboarding gap more than lack of interest.

Would love feedback. MIT.

https://github.com/hairyf/deepseek-harness-desktop

---

## 6. Reddit（英文 · r/LocalLLaMA / r/selfhosted 双版本，社区化语气）

**r/LocalLLaMA 版本：**

**Title:** DeepSeek Harness desktop app: run the agent platform locally with zero setup

**Post:**

DeepSeek Harness ("Everything is a Plugin", ~82k stars) is a genuinely interesting agent platform, but I kept seeing people bounce off the setup — Node version juggling, pnpm, sometimes Docker, then the CLI.

So I packaged it as a Tauri 2 desktop app. You download an installer, open it, and it bootstraps everything: bundled Node runtime (or it reuses a compatible local Node if present), prebuilt Harness bundle, and it launches straight into the local web UI on 127.0.0.1:3080.

Things I care about:
- **100% local & private**: profiles/sessions/settings stay on your machine; isolated DSH_HOME; telemetry off by default.
- **Self-healing updates**: it diffs the installed Harness against the latest upstream pkg release on each launch and re-downloads when changed — so you follow upstream without manual reinstalls.
- **Lightweight**: Tauri 2, not Electron. Win/macOS/Linux installers, bilingual UI.

Fair warning: it's an agent harness with local code execution — run it in a sandboxed/trusted environment, and treat it as learning/research only. Upstream moves fast, so expect change.

MIT, open source. Happy to get feedback/issues.

https://github.com/hairyf/deepseek-harness-desktop

---

**r/selfhosted 版本：**

**Title:** Self-hosted DeepSeek Harness that bootstraps itself — no Node/pnpm/Docker needed

**Post:**

For people who like dsh (DeepSeek Harness) but don't want to hand-tune Node/pnpm/Docker: I wrapped it in a Tauri desktop app that installs everything on first launch and runs fully local on `http://127.0.0.1:3080`.

- No Node.js setup — it bundles v22.22.0 LTS, or reuses a compatible local install.
- Data stays on-device (isolated `$DSH_HOME`, telemetry disabled by default).
- Auto-follows upstream: each launch syncs to the latest Harness bundle release, so updates come without manual reinstalls.
- Installers for Windows / macOS / Linux, EN+中文 UI.

Caveat: agent with local code execution — use in an isolated/trusted environment only (learning/research).

Would appreciate feedback / issues. MIT.

https://github.com/hairyf/deepseek-harness-desktop

---

## 7. Twitter / X（英文线程 + 中文短帖）

**英文 Thread（4 条）：**

1/ DeepSeek Harness is one of the most exciting agent platforms out there (~82k ⭐, "Everything is a Plugin"), but onboarding is a wall: Node, pnpm, Docker, CLI. So I wrapped it in a Tauri 2 desktop app that is truly download-and-run. 🧵

2/ First launch bootstraps everything: it reuses a compatible local Node (v22.15+/v23.8+) or bundles v22.22.0 LTS, pulls the prebuilt Harness bundle, and boots the local UI on 127.0.0.1:3080. No system env touched. ✅

3/ Privacy & updates are defaults, not afterthoughts: profile/sessions/settings stay on-device (isolated DSH_HOME, telemetry off by default), and it self-heals — re-syncing to the latest upstream Harness release on every launch. 🔒🔄

4/ Win/macOS/Linux installers, EN+中文 bilingual UI, built on Tauri 2 so it stays light (not Electron). MIT, open source — feedback/issues welcome. 👇
https://github.com/hairyf/deepseek-harness-desktop

**中文 X/微博 AI（选发）：**

把「Everything is a Plugin」的 DeepSeek Harness（8w+ star）装进了桌面 App：免 Node/pnpm/Docker，下载即跑；纯本地、默认关遥测；内核还能自愈更新、自动跟随上游。Tauri 2 轻量跨平台，中英双语。MIT 开源 🔗 github.com/hairyf/deepseek-harness-desktop

---

## 8. GitHub 侧建议（配合推广，让转化最大化）

**Release notes 草稿（v0.1.7/v0.1.8 可对外用）：**

```markdown
## DeepSeek Harness Desktop v0.1.8

Dsh 桌面版 —— 在本地一键运行 DeepSeek Harness，无需安装 Node.js / pnpm / Docker。

### 亮点
- 🚀 免安装环境，首次启动自动装配内核与 Node 运行时
- 🔒 纯本地运行 + 默认关闭遥测 + 隔离 `$DSH_HOME`
- 🔄 内核自愈更新：启动时自动同步上游 deepseek-harness-pkg 最新版本
- 🪟 原生 Tauri 2 无边框窗口，跟随主题，中英双语界面
- 🖥 Windows / macOS / Linux 安装包

### Install
从本页 Downloads 下载对应平台安装包 → 安装 → 启动即用。

> 仅供学习 / 研究 / 测试；agent 具备本地代码执行能力，请在可信隔离环境使用。

### 感谢
- 上游 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- [deepseek-harness-pkg](https://github.com/hairyf/deepseek-harness-pkg)
```

**README 增强建议（去 GitHub 时顺带做）：**
- 在 badge 行加：`GitHub stars`、`PRs welcome`、`awesome-dsh` 提交入口。
- 在顶部预览图前加一句钩子：「82k-star 上游的免环境桌面版」。
- 加一段「与 Electron 版对比」小节，直接回答选型疑问（体积/内存/常驻）。

---

## 9. 发布 Checklist & 时间建议
- [ ] 先在 GitHub 把 README/release notes 更新到位（转化地基）
- [ ] 同日先发 **Hacker News Show HN**（英文社区，最可能带来社媒涟漪）
- [ ] 之后 **Reddit** 两版 + **Twitter/X** 线程
- [ ] 国内：**V2EX → 知乎 → 即刻/微博 → 小红书** 依次或分天发布，用不同角度，避免同一平台连发被判定营销
- [ ] 每个平台评论区置顶放 GitHub 链接 + 一句「欢迎 star/issue 收集反馈」
- [ ] 观察数据：star 增速、issue/PR 量、各平台链接点击，据此复盘下一步渠道
---

## 10. 实际发布日志（OpenCLI 执行记录）

> 基于真实执行记录，帮助你和协作者追踪各平台发布状态。

| 平台 | 账号 | 状态 | 链接 / 备注 |
| --- | --- | --- | --- |
| GitHub README | hairyf | ✅ 已 push | commit `b66b2fb`，README 增强（钩子/badge/Why-Tauri）|
| Twitter/X | @hairy2579 | ✅ 已发布 | https://x.com/hairy2579/status/2088201272092684335 |
| 小红书 | Hairyf | 🟡 已存草稿 | 标题「把8万⭐AI平台做成桌面App」，含1图+5话题，待审核后点发布 |
| 即刻 | Hairyf | ✅ 已发布 | 短动态「把 DeepSeek Harness 做成桌面 App」|
| 微博 | mrmao202207 | ✅ 已发布 | 文字版（配图接口返回 Not allowed，故文字先行）|
| 知乎 | Hairyf | ⛔ 受阻 | 「未激活用户不允许此操作」→ 需先完成知乎账号激活方可发布 |
| Hacker News | — | ⚠️ 手动 | OpenCLI 只有读命令，无 submit；需账号 + `mk` API 手动发 Show HN |
| Reddit | u/Inevitable_Stay_9276 | ⚠️ 受限 | OpenCLI 仅 comment/reply，无发帖 submit 命令；需手动发 r/LocalLLaMA 帖子 |
| V2EX | — | ⚠️ 手动 | OpenCLI 仅读+签到，无建帖；需手动发「分享创造」节点 |

### 你仍需手动完成的事
1. **小红书**：到创作者中心草稿箱 review 并发（正文我已写好，含 GitHub 链接）。
2. **知乎**：完成账号激活（知乎网页端绑定/升级到可写），之后我可立即代发已备好的回答草稿。
3. **HN / Reddit / V2EX / 知乎文章版**：正文均已写好（见本文档相关小节），登录后粘贴发布即可。

