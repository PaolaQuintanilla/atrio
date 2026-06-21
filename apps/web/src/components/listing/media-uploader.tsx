"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";

type Media = { id: string; url: string; isCover: boolean };

export function MediaUploader({
  listingId,
  initial,
}: {
  listingId: string;
  initial: Media[];
}) {
  const t = useTranslations("listing");
  const [media, setMedia] = useState<Media[]>(initial);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const { uploadUrl, key, publicUrl } = await client.media.requestUpload({
          listingId,
          fileName: file.name,
          contentType: file.type,
        });
        const put = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!put.ok) throw new Error("Upload failed");
        const created = await client.media.attach({
          listingId,
          key,
          url: publicUrl,
          isCover: media.length === 0,
        });
        setMedia((m) => [...m, { id: created.id, url: created.url, isCover: created.isCover }]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    setMedia((m) => m.filter((x) => x.id !== id));
    await client.media.remove({ id }).catch(() => {});
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {media.map((m) => (
          <div key={m.id} className="group relative size-24 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" className="size-full object-cover" />
            <button
              onClick={() => remove(m.id)}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/80"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid size-24 place-items-center rounded-md border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ImagePlus className="size-6" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">{t("photos")}</p>
    </div>
  );
}
