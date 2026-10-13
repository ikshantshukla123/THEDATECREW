import type { Manglik } from "@prisma/client";

/**
 * Manglik dosha is a Hindu astrological concern, and the convention is that a
 * manglik should marry a manglik — so it is a hard constraint a matchmaker
 * needs to see before shortlisting, not a detail buried in the biodata.
 * Shown only where it carries that meaning; NO and DONT_KNOW say nothing
 * worth a tag.
 */
const STYLES: Partial<Record<Manglik, { label: string; title: string; className: string }>> = {
  YES: {
    label: "Manglik",
    title: "Manglik — conventionally matched only with another manglik",
    className: "bg-[#FBE9E4] text-[#8A2E1A] dark:bg-[#33201C] dark:text-[#E79C86]",
  },
  PARTIAL: {
    label: "Partial Manglik",
    title: "Anshik (partial) manglik — usually treated as compatible either way",
    className: "bg-[#FBEEE6] text-[#8A4B1F] dark:bg-[#33241A] dark:text-[#E0AC84]",
  },
};

export function ManglikBadge({ manglik, religion }: { manglik: Manglik; religion: string }) {
  if (religion.trim().toLowerCase() !== "hindu") return null;
  const style = STYLES[manglik];
  if (!style) return null;

  return (
    <span
      title={style.title}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  );
}
