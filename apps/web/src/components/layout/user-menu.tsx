"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { authClient } from "@atria/auth/client";
import { Link, useRouter } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
};

export function UserMenu({ name, email, image, role }: Props) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function signOut() {
    setOpen(false);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  const items = [
    { href: "/dashboard/profile", icon: UserIcon, label: t("profile") },
    { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/messages", icon: MessageSquare, label: t("messages") },
    { href: "/favorites", icon: Heart, label: t("favorites") },
    ...(role === "ADMIN" ? [{ href: "/admin", icon: Shield, label: t("admin") }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
      >
        <Avatar name={name} src={image} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--color-border)] bg-popover text-popover-foreground shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-3">
            <Avatar name={name} src={image} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="px-3 pt-2">
            <Badge variant={role === "ADMIN" ? "accent" : "primary"}>{role}</Badge>
          </div>

          <nav className="p-1.5">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition hover:bg-secondary"
              >
                <it.icon className="size-4 text-muted-foreground" />
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-[var(--color-border)] p-1.5">
            <button
              type="button"
              onClick={signOut}
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-destructive transition hover:bg-secondary",
              )}
            >
              <LogOut className="size-4" />
              {t("signOut")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Kept for backwards-compatibility where a bare sign-out button is needed. */
export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
