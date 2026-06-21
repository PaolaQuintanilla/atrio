"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type CategoryOption = { slug: string; label: string; depth: number };

export function SearchFilters({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial: Record<string, string>;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const [state, setState] = useState<Record<string, string>>(initial);

  function set(key: string, value: string) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function apply() {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v) params.set(k, v);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-card p-4">
      <h2 className="font-semibold">{t("filters")}</h2>

      <div className="space-y-1.5">
        <Label htmlFor="q">{t("title")}</Label>
        <Input
          id="q"
          value={state.q ?? ""}
          onChange={(e) => set("q", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">{t("category")}</Label>
        <Select id="category" value={state.category ?? ""} onChange={(e) => set("category", e.target.value)}>
          <option value="">{t("filters") === "Filtros" ? "Todas" : "All"}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {" ".repeat(c.depth * 2)}
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">{t("type")}</Label>
        <Select id="type" value={state.type ?? ""} onChange={(e) => set("type", e.target.value)}>
          <option value="">—</option>
          <option value="RENT">{t("rent")}</option>
          <option value="SALE">{t("sale")}</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="minPrice">{t("minPrice")}</Label>
          <Input
            id="minPrice"
            type="number"
            value={state.minPrice ?? ""}
            onChange={(e) => set("minPrice", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxPrice">{t("maxPrice")}</Label>
          <Input
            id="maxPrice"
            type="number"
            value={state.maxPrice ?? ""}
            onChange={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">{t("location")}</Label>
        <Input id="city" value={state.city ?? ""} onChange={(e) => set("city", e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.verifiedOnly === "1"}
          onChange={(e) => set("verifiedOnly", e.target.checked ? "1" : "")}
        />
        {t("verifiedOnly")}
      </label>

      <div className="space-y-1.5">
        <Label htmlFor="sort">{t("sort")}</Label>
        <Select id="sort" value={state.sort ?? "newest"} onChange={(e) => set("sort", e.target.value)}>
          <option value="newest">{t("newest")}</option>
          <option value="price_asc">{t("priceAsc")}</option>
          <option value="price_desc">{t("priceDesc")}</option>
        </Select>
      </div>

      <Button className="w-full" onClick={apply}>
        {t("title")}
      </Button>
    </div>
  );
}
