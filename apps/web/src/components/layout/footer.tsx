import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Building2 className="size-4" />
          Atria
        </div>
        <p>© {new Date().getFullYear()} Atria — Marketplace</p>
      </div>
    </footer>
  );
}
