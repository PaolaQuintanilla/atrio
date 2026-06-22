"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DOC_TYPES = [
  "DERECHOS_REALES",
  "TITLE_DEED",
  "VEHICLE_TITLE",
  "ID_DOCUMENT",
  "TAX_RECEIPT",
  "OTHER",
] as const;

type Doc = { id: string; fileName: string; type: string; verificationStatus: string };

export function DocumentUploader({
  listingId,
  initial,
}: {
  listingId: string;
  initial: Doc[];
}) {
  const t = useTranslations("listing");
  const [docs, setDocs] = useState<Doc[]>(initial);
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>("DERECHOS_REALES");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { uploadUrl, key } = await client.documents.requestUpload({
        listingId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error("Upload failed");
      const created = await client.documents.attach({
        listingId,
        type: docType,
        key,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      setDocs((d) => [
        { id: created.id, fileName: created.fileName, type: created.type, verificationStatus: created.verificationStatus },
        ...d,
      ]);
      toast.success(t("pending"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 text-primary" />
        {t("documents")} — Derechos Reales, títulos, etc. (privado)
      </p>

      <div className="space-y-2">
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <FileText className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate">{d.fileName}</span>
            <Badge variant={d.verificationStatus === "VERIFIED" ? "success" : "default"}>
              {d.verificationStatus === "VERIFIED" ? t("verified") : t("pending")}
            </Badge>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={docType}
          onChange={(e) => setDocType(e.target.value as (typeof DOC_TYPES)[number])}
          className="w-auto"
        >
          {DOC_TYPES.map((d) => (
            <option key={d} value={d}>
              {d.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" />
          {t("documents")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files)}
      />
    </div>
  );
}
