import { Download, Star } from "lucide-react";
import { useI18n } from "../i18n/context";
import { GITHUB_RELEASES, GITHUB_REPO } from "../lib/links";
import { Section } from "./Section";

export function CTA() {
  const { t } = useI18n();

  return (
    <Section className="pt-4">
      <div className="reveal relative overflow-hidden rounded-3xl border border-line bg-panel px-6 py-16 text-center sm:px-12">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full bg-accent/25 blur-[110px]"
          aria-hidden="true"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mt-4 text-sm text-muted sm:text-[15px]">{t("cta.desc")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={GITHUB_RELEASES}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-[15px] font-medium text-white shadow-[0_8px_40px_rgba(77,107,254,0.35)] transition-all hover:-translate-y-0.5 hover:bg-accent-2 sm:w-auto"
            >
              <Download className="h-4.5 w-4.5" />
              {t("cta.button")}
            </a>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-canvas/60 px-8 py-3.5 text-[15px] font-medium transition-all hover:-translate-y-0.5 hover:bg-panel-hover sm:w-auto"
            >
              <Star className="h-4.5 w-4.5 text-[#f5b301]" />
              {t("cta.secondary")}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
