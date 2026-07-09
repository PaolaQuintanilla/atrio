"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { useRouter } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Initial = {
  displayName?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  fallbackName?: string | null;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onAvatarFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    console.log("Uploading avatar file:", file);
    try {
      const { uploadUrl, publicUrl } = await client.profile.requestAvatarUpload({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("Upload failed");
      setAvatarUrl(publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      await client.profile.update({
        displayName: String(form.get("displayName") || "") || undefined,
        phone: String(form.get("phone") || "") || undefined,
        country: String(form.get("country") || "") || undefined,
        city: String(form.get("city") || "") || undefined,
        bio: String(form.get("bio") || "") || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      toast.success(t("saved"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        >
          <Avatar
            name={initial.displayName ?? initial.fallbackName}
            src={avatarUrl || undefined}
            className="size-16 text-xl transition group-hover:opacity-85"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-white font-medium">Edit</span>
          </div>
        </button>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">{t("avatarUrl")}</p>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-primary hover:underline font-medium focus:outline-none"
            >
              {uploading ? tc("loading") : t("avatarUploadLink")}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onAvatarFile(e.target.files?.[0])}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("name")}</Label>
        <Input id="displayName" name="displayName" defaultValue={initial.displayName ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">{t("city")}</Label>
          <Input id="city" name="city" defaultValue={initial.city ?? ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="country">{t("country")}</Label>
        <Input id="country" name="country" defaultValue={initial.country ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("bio")}</Label>
        <Textarea id="bio" name="bio" rows={4} defaultValue={initial.bio ?? ""} />
      </div>

      <Button type="submit" disabled={pending}>
        {tc("save")}
      </Button>
    </form>
  );
}
