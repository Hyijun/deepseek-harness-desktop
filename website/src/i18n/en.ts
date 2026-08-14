import type { Translation } from "./zh";

const en: Translation = {
  nav: {
    features: "Features",
    faq: "FAQ",
    github: "GitHub",
    download: "Download",
  },
  hero: {
    badge: "v0.1.8 · Built with Tauri 2 · MIT",
    title1: "Run DeepSeek Harness",
    title2: "on your desktop, instantly",
    subtitle:
      "No Node.js, no pnpm, no Docker — download the installer and go. 100% local, your data never leaves the machine, and the core updates itself to follow upstream.",
    ctaPrimary: "Download",
    ctaSecondary: "View source",
    stat1: "0",
    stat1Label: "GitHub stars",
    stat2: "3",
    stat2Label: "Platforms",
    stat3: "0",
    stat3Label: "Env setup",
    stat4: "100%",
    stat4Label: "Local",
    scrollHint: "Scroll to explore",
    imgAlt: "DeepSeek Harness Desktop main UI preview",
  },
  features: {
    kicker: "Features",
    title: "Core features",
    subtitle: "The 82k-star agent platform, packaged into a download-and-run desktop app.",
    items: [
      {
        title: "One-click, out of the box",
        desc: "First launch bootstraps the bundled Harness bundle and Node runtime automatically; if a compatible Node (v22.15+ / v23.8+) is already installed it is reused — zero environment setup.",
      },
      {
        title: "Self-healing core updates",
        desc: "On every launch it diffs against the latest deepseek-harness-pkg release and re-downloads when out of date, so upstream fixes reach you without manual reinstalls.",
      },
      {
        title: "100% local",
        desc: "The dsh web service runs on 127.0.0.1:3080. Profiles, sessions and settings all stay on your machine — no cloud dependency.",
      },
      {
        title: "Privacy by default",
        desc: "Isolated $DSH_HOME, telemetry disabled by default (DSH_TELEMETRY_DISABLED=1). Your data never leaves the machine.",
      },
      {
        title: "Native & lightweight",
        desc: "Built on Tauri 2, not Electron: smaller installers, lower memory, using the system WebView2/WebKit instead of bundling Chromium.",
      },
      {
        title: "Cross-platform",
        desc: "Windows (NSIS/MSI), macOS (DMG) and Linux (AppImage) installers, all available.",
      },
      {
        title: "Bilingual",
        desc: "The UI supports both English and 中文, switchable at any time.",
      },
      {
        title: "Theme-aware",
        desc: "A frameless native window whose shell and sidebar adapt to the Harness light/dark theme automatically.",
      },
    ],
  },
  faq: {
    kicker: "FAQ",
    title: "Frequently asked questions",
    items: [
      {
        q: "How much needs to be downloaded on first launch?",
        a: "The Node runtime and the Harness bundle (~a few hundred MB) are downloaded once; after that it runs offline. If a compatible Node (v22.15+ / v23.8+) is found on your machine it is reused and the runtime download is skipped.",
      },
      {
        q: "Port 3080 is taken — what now?",
        a: "Change the port in the sidebar settings and restart the service.",
      },
      {
        q: "Why does it reach GitHub on every launch?",
        a: "It compares the installed Harness bundle against the latest release commit and re-downloads when they differ. If GitHub is unreachable, the local installation is kept.",
      },
      {
        q: "How do updates work after install?",
        a: "Launches skip the setup screen and check for new versions silently; an “Update now / Later” prompt appears when one is found. Updating re-downloads the bundle and restarts the service.",
      },
      {
        q: "Where is my data stored?",
        a: "It follows the app bundle identifier: %APPDATA% on Windows, ~/Library/Application Support on macOS, ~/.local/share on Linux — containing runtime, dependencies/dsh and data/dsh.",
      },
    ],
  },
  cta: {
    title: "Ready to run DeepSeek Harness locally?",
    desc: "Free · MIT · Open source. Windows / macOS / Linux.",
    button: "Download from GitHub Releases",
    secondary: "Star the project",
  },
  footer: {
    tagline: "The one-click desktop app for DeepSeek Harness — zero setup, fully local, self-healing updates.",
    product: "Product",
    links: {
      features: "Features",
      faq: "FAQ",
    },
    project: "Project",
    projectLinks: {
      github: "GitHub repo",
      releases: "Releases",
      issues: "Issues / Feedback",
    },
    related: "Related",
    relatedLinks: {
      upstream: "deepseek-harness (upstream)",
      pkg: "deepseek-harness-pkg",
    },
    disclaimer: "For learning / research / testing only. The agent has local code execution — use it in an isolated environment.",
    license: "MIT License © deepseek-harness-desktop contributors",
    based: "Built with Tauri 2 · Bilingual",
  },
};

export default en;
