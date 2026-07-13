"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { localized } from "@/lib/utils";
import dynamic from "next/dynamic";

const LotMappingTool = dynamic(
  () => import("./lot-mapping-tool").then((mod) => mod.LotMappingTool),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-xl bg-muted flex items-center justify-center border border-[var(--color-border)]">
        <span className="text-sm text-muted-foreground">Loading interactive map...</span>
      </div>
    ),
  }
);

type AttrOption = { value: string; label: Record<string, string> };
type AttrDef = {
  key: string;
  label: unknown;
  type: "TEXT" | "NUMBER" | "BOOLEAN" | "ENUM" | "DATE";
  unit: string | null;
  required: boolean;
  options: unknown;
};
type Category = {
  id: string;
  slug: string;
  name: unknown;
  parentId: string | null;
  attributes: AttrDef[];
};

const CURRENCIES = ["USD", "BOB", "EUR", "BRL"];

export function ListingForm({
  categories,
  locale,
  initial,
}: {
  categories: Category[];
  locale: string;
  initial?: {
    id: string;
    categoryId: string;
    type: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    city?: string | null;
    country?: string | null;
    address?: string | null;
    attributes: Record<string, unknown>;
    lat?: number | null;
    lng?: number | null;
    boundary?: unknown;
  };
}) {
  const t = useTranslations("listing");
  const tc = useTranslations("common");
  const router = useRouter();

  // Only leaf categories (those that own attributes) are selectable.
  const leafCategories = useMemo(
    () => categories.filter((c) => c.attributes.length > 0 || !categories.some((x) => x.parentId === c.id)),
    [categories],
  );

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? leafCategories[0]?.id ?? "");
  const [type, setType] = useState(initial?.type ?? "SALE");
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [attrs, setAttrs] = useState<Record<string, unknown>>(initial?.attributes ?? {});
  const [lat, setLat] = useState<number | undefined>(initial?.lat ?? undefined);
  const [lng, setLng] = useState<number | undefined>(initial?.lng ?? undefined);
  const [boundary, setBoundary] = useState<unknown>(initial?.boundary ?? null);
  const [pending, setPending] = useState(false);

  const handleMapUpdate = (data: { boundary: unknown; lat: number | null; lng: number | null; area?: number }) => {
    setBoundary(data.boundary);
    setLat(data.lat ?? undefined);
    setLng(data.lng ?? undefined);

    if (data.area && data.area > 0) {
      setAttrs((prev) => ({ ...prev, area: Math.round(data.area || 0) }));
    }
  };

  const category = categories.find((c) => c.id === categoryId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      categoryId,
      type: type as "RENT" | "SALE",
      title: String(form.get("title")),
      description: String(form.get("description")),
      price: Number(form.get("price")),
      currency: currency as "USD" | "BOB" | "EUR" | "BRL",
      city: String(form.get("city") || "") || undefined,
      country: String(form.get("country") || "") || undefined,
      address: String(form.get("address") || "") || undefined,
      lat,
      lng,
      boundary,
      attributes: attrs,
      sourceLocale: locale as "es" | "en" | "pt" | "zh" | "ru",
    };

    try {
      if (initial) {
        await client.listings.update({ id: initial.id, ...payload });
        toast.success("✓");
        router.refresh();
      } else {
        const created = await client.listings.create(payload);
        toast.success("✓");
        router.push(`/dashboard/listings/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("required"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">{t("category")}</Label>
          <Select
            id="category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setAttrs({});
            }}
          >
            {leafCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {localized(c.name, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">{t("type")}</Label>
          <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="SALE">{t("type")} — Sale</option>
            <option value="RENT">{t("type")} — Rent</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">{t("titleField")}</Label>
        <Input id="title" name="title" required defaultValue={initial?.title} maxLength={160} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={6}
          defaultValue={initial?.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="price">{t("price")}</Label>
          <Input id="price" name="price" type="number" min="0" step="any" required defaultValue={initial?.price} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">{t("currency")}</Label>
          <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={initial?.city ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={initial?.country ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={initial?.address ?? ""} />
        </div>
      </div>

      {category?.slug === "land" && (
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-4 bg-card">
          <h3 className="font-semibold text-sm">Límites del Terreno (Mapa Interactivo)</h3>
          <LotMappingTool
            initialBoundary={boundary as { lat: number; lng: number }[] | null | undefined}
            initialLat={lat}
            initialLng={lng}
            onUpdate={handleMapUpdate}
          />
        </div>
      )}

      {/* Dynamic, category-driven attributes */}
      {category && category.attributes.length > 0 && (
        <div className="space-y-4 rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-semibold">{t("details")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {category.attributes.map((def) => (
              <AttributeField
                key={def.key}
                def={def}
                locale={locale}
                value={attrs[def.key]}
                onChange={(v) => setAttrs((a) => ({ ...a, [def.key]: v }))}
              />
            ))}
          </div>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {initial ? tc("save") : t("createTitle")}
      </Button>
    </form>
  );
}

function AttributeField({
  def,
  locale,
  value,
  onChange,
}: {
  def: AttrDef;
  locale: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = localized(def.label, locale) + (def.unit ? ` (${def.unit})` : "");
  const options = (def.options as AttrOption[] | null) ?? [];

  if (def.type === "BOOLEAN") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {def.type === "ENUM" ? (
        <Select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {localized(o.label, locale)}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          type={def.type === "NUMBER" ? "number" : def.type === "DATE" ? "date" : "text"}
          value={(value as string) ?? ""}
          required={def.required}
          onChange={(e) =>
            onChange(def.type === "NUMBER" ? e.target.valueAsNumber || e.target.value : e.target.value)
          }
        />
      )}
    </div>
  );
}
