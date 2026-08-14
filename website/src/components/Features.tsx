import {
  EyeOff,
  Feather,
  HardDrive,
  Languages,
  MonitorDown,
  RefreshCw,
  Rocket,
  SunMoon,
} from "lucide-react";
import { useI18n, sectionList, sectionMap } from "../i18n/context";
import type { FeatureItem } from "../i18n/zh";
import { Section, SectionHeader } from "./Section";

const ICONS = [Rocket, RefreshCw, HardDrive, EyeOff, Feather, MonitorDown, Languages, SunMoon];

export function Features() {
  const { t, dict } = useI18n();
  const items = sectionList<FeatureItem>(sectionMap(dict.features).items);

  return (
    <Section id="features">
      <SectionHeader kicker={t("features.kicker")} title={t("features.title")} subtitle={t("features.subtitle")} />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <div
              key={item.title}
              className="reveal group rounded-2xl border border-line bg-panel p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:bg-panel-hover"
              style={{ transitionDelay: `${(index % 4) * 60}ms` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent/25">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
