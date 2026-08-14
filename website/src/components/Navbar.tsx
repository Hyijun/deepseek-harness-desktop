import { useEffect, useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { useI18n } from "../i18n/context";
import { GITHUB_RELEASES, GITHUB_REPO } from "../lib/links";
import { GitHubIcon } from "./GitHubIcon";

const NAV_LINKS = [
  { id: "features", key: "nav.features" },
  { id: "faq", key: "nav.faq" },
] as const;

export function Navbar() {
  const { t, language, setLanguage } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-line bg-canvas/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src="/favicon.svg" alt="logo" className="h-8 w-8 rounded-lg" />
          <span className="text-[15px] font-semibold tracking-tight">
            DeepSeek Harness <span className="text-muted font-normal">Desktop</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-ink"
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <button
            type="button"
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
            aria-label="Switch language"
          >
            {language === "zh" ? "EN" : "中"}
          </button>
          <a
            href={GITHUB_RELEASES}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-2"
          >
            <Download className="h-4 w-4" />
            {t("nav.download")}
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line bg-canvas/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                {t(link.key)}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-2.5 border-t border-line pt-3">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-medium transition-colors hover:bg-panel-2"
              >
                <GitHubIcon className="h-4 w-4" />
                {t("nav.github")}
              </a>
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-2"
              >
                <Download className="h-4 w-4" />
                {t("nav.download")}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
