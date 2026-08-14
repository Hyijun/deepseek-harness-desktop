import { useEffect, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { useI18n } from "../i18n/context";
import { GITHUB_RELEASES, GITHUB_REPO } from "../lib/links";
import { GitHubIcon } from "./GitHubIcon";

const STATS = [
  { key: "stat1", labelKey: "stat1Label" },
  { key: "stat2", labelKey: "stat2Label" },
  { key: "stat3", labelKey: "stat3Label" },
  { key: "stat4", labelKey: "stat4Label" },
] as const;

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : Number(k.toFixed(1))}K`;
  }
  return String(n);
}

export function Hero() {
  const { t } = useI18n();
  const [stars, setStars] = useState("0");

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/repos/${GITHUB_REPO.replace("https://github.com/", "")}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!cancelled && typeof data?.stargazers_count === "number") {
          setStars(formatStars(data.stargazers_count));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/25 blur-[140px] animate-glow" />
        <div className="absolute top-64 -left-32 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute top-40 -right-32 h-72 w-72 rounded-full bg-accent-2/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-36 pb-20 sm:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("hero.badge")}
          </div>

          <h1 className="animate-fade-up mt-6 text-4xl leading-[1.12] font-bold tracking-tight sm:text-6xl" style={{ animationDelay: "80ms" }}>
            <span className="block">{t("hero.title1")}</span>
            <span className="block bg-gradient-to-r from-accent-2 via-[#8fa5ff] to-accent bg-clip-text text-transparent">
              {t("hero.title2")}
            </span>
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {t("hero.subtitle")}
          </p>

          <div
            className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_40px_rgba(77,107,254,0.35)] transition-all hover:-translate-y-0.5 hover:bg-accent-2 sm:w-auto"
            >
              <Download className="h-4.5 w-4.5" />
              {t("hero.ctaPrimary")}
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-panel/60 px-7 py-3.5 text-[15px] font-medium text-ink backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-panel-2 sm:w-auto"
            >
              <GitHubIcon className="h-4.5 w-4.5" />
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <dl
            className="animate-fade-up mx-auto mt-14 grid max-w-xl grid-cols-2 gap-y-8 sm:grid-cols-4"
            style={{ animationDelay: "320ms" }}
          >
            {STATS.map((stat) => (
              <div key={stat.key} className="flex flex-col items-center gap-1">
                <dt className="sr-only">{t(`hero.${stat.labelKey}`)}</dt>
                <dd className="text-2xl font-semibold tracking-tight sm:text-[26px]">
                  {stat.key === "stat1" ? stars : t(`hero.${stat.key}`)}
                </dd>
                <dd className="text-xs text-muted">{t(`hero.${stat.labelKey}`)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Screenshot in a window frame */}
        <div className="animate-fade-up relative mx-auto mt-16 max-w-5xl" style={{ animationDelay: "420ms" }}>
          <div className="absolute -inset-x-8 -top-10 bottom-10 -z-10 rounded-[40px] bg-gradient-to-t from-accent/20 to-transparent blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <div className="mx-auto flex items-center gap-1.5 rounded-md bg-canvas px-4 py-1 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-ok" />
                http://127.0.0.1:3080
              </div>
            </div>
            <img
              src="https://raw.githubusercontent.com/hairyf/deepseek-harness-desktop/main/docs/preivew.png"
              alt={t("hero.imgAlt")}
              className="w-full"
              loading="eager"
            />
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <a href="#features" className="flex flex-col items-center gap-1 text-xs text-muted transition-colors hover:text-ink">
            <span>{t("hero.scrollHint")}</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
