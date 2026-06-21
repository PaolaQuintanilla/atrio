"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { client } from "@/lib/orpc/client";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  listingId,
  initial = false,
  className,
}: {
  listingId: string;
  initial?: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    setFavorited((v) => !v);
    try {
      const res = await client.favorites.toggle({ listingId });
      setFavorited(res.favorited);
    } catch {
      setFavorited((v) => !v); // revert on error
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle favorite"
      className={cn(
        "grid size-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background",
        className,
      )}
    >
      <Heart
        className={cn("size-5", favorited ? "fill-accent text-accent" : "text-foreground")}
      />
    </button>
  );
}
