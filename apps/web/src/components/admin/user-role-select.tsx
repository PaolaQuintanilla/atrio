"use client";

import { useState } from "react";
import { toast } from "sonner";
import { client } from "@/lib/orpc/client";
import { Select } from "@/components/ui/select";

const ROLES = ["BUYER", "SELLER", "ADMIN"] as const;

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const [value, setValue] = useState(role);
  const [pending, setPending] = useState(false);

  async function onChange(next: string) {
    setPending(true);
    setValue(next);
    try {
      await client.admin.setRole({ userId, role: next as (typeof ROLES)[number] });
      toast.success("✓");
    } catch {
      setValue(role);
      toast.error("Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-auto"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </Select>
  );
}
