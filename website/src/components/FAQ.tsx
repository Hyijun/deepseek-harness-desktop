import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n, sectionList, sectionMap } from "../i18n/context";
import type { FaqItem } from "../i18n/zh";
import { Section, SectionHeader } from "./Section";

export function FAQ() {
  const { t, dict } = useI18n();
  const faq = sectionMap(dict.faq);
  const items = sectionList<FaqItem>(faq.items);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq">
      <SectionHeader kicker={t("faq.kicker")} title={t("faq.title")} />

      <div className="reveal mx-auto mt-12 max-w-3xl space-y-3">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div
              key={item.q}
              className={`overflow-hidden rounded-xl border transition-colors ${
                open ? "border-line-strong bg-panel-2" : "border-line bg-panel hover:border-line-strong"
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
              >
                <span className="text-[15px] font-medium">{item.q}</span>
                <ChevronDown
                  className={`h-4.5 w-4.5 shrink-0 text-muted transition-transform duration-300 ${
                    open ? "rotate-180 text-accent-2" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
