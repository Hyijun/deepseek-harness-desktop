import { ExternalLink, Heart } from "lucide-react";
import { useI18n } from "../i18n/context";
import { GITHUB_ISSUES, GITHUB_RELEASES, GITHUB_REPO, PKG_REPO, UPSTREAM_REPO } from "../lib/links";
import { GitHubIcon } from "./GitHubIcon";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/favicon.svg" alt="logo" className="h-8 w-8 rounded-lg" />
              <span className="text-[15px] font-semibold tracking-tight">
                DeepSeek Harness <span className="text-muted font-normal">Desktop</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t("footer.tagline")}</p>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <FooterColumn
            title={t("footer.product")}
            links={[
              { label: t("footer.links.features"), href: "#features" },
              { label: t("footer.links.faq"), href: "#faq" },
            ]}
          />

          <FooterColumn
            title={t("footer.project")}
            links={[
              { label: t("footer.projectLinks.github"), href: GITHUB_REPO, external: true },
              { label: t("footer.projectLinks.releases"), href: GITHUB_RELEASES, external: true },
              { label: t("footer.projectLinks.issues"), href: GITHUB_ISSUES, external: true },
            ]}
          />

          <FooterColumn
            title={t("footer.related")}
            links={[
              { label: t("footer.relatedLinks.upstream"), href: UPSTREAM_REPO, external: true },
              { label: t("footer.relatedLinks.pkg"), href: PKG_REPO, external: true },
            ]}
          />
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="text-xs leading-relaxed text-muted">{t("footer.disclaimer")}</p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>{t("footer.license")}</span>
            <span className="flex items-center gap-1.5">
              {t("footer.based")}
              <Heart className="h-3.5 w-3.5 fill-[#e5484d] text-[#e5484d]" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
              {link.external ? <ExternalLink className="h-3 w-3" /> : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
