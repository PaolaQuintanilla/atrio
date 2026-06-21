import { useTranslations } from "next-intl";
import { localized } from "@/lib/utils";

type AttrDef = {
  key: string;
  label: unknown;
  type: string;
  unit: string | null;
  options: unknown;
};
type AttrOption = { value: string; label: Record<string, string> };

export function AttributeList({
  definitions,
  values,
  locale,
}: {
  definitions: AttrDef[];
  values: Record<string, unknown>;
  locale: string;
}) {
  const t = useTranslations("common");

  const rows = definitions
    .map((def) => {
      const raw = values?.[def.key];
      if (raw === undefined || raw === null || raw === "") return null;

      let display: string;
      if (def.type === "BOOLEAN") {
        display = raw ? t("yes") : t("no");
      } else if (def.type === "ENUM") {
        const opts = (def.options as AttrOption[] | null) ?? [];
        const found = opts.find((o) => o.value === String(raw));
        display = found ? localized(found.label, locale) : String(raw);
      } else {
        display = `${raw}${def.unit ? ` ${def.unit}` : ""}`;
      }

      return { key: def.key, label: localized(def.label, locale), display };
    })
    .filter(Boolean) as { key: string; label: string; display: string }[];

  if (rows.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</dt>
          <dd className="font-medium">{row.display}</dd>
        </div>
      ))}
    </dl>
  );
}
