import { ORPCError } from "@orpc/server";
import type { AttributeDefinition } from "@atria/db";

type AttrOption = { value: string; label: Record<string, string> };

/**
 * Validate and normalize a listing's dynamic attribute values against the
 * AttributeDefinitions of its category. Returns a clean record of values,
 * or throws a BAD_REQUEST with field-level details.
 */
export function validateListingAttributes(
  definitions: AttributeDefinition[],
  rawValues: Record<string, unknown>,
): Record<string, unknown> {
  const errors: Record<string, string> = {};
  const clean: Record<string, unknown> = {};

  for (const def of definitions) {
    const value = rawValues[def.key];
    const isEmpty = value === undefined || value === null || value === "";

    if (isEmpty) {
      if (def.required) errors[def.key] = "required";
      continue;
    }

    switch (def.type) {
      case "NUMBER": {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isNaN(n)) errors[def.key] = "must be a number";
        else clean[def.key] = n;
        break;
      }
      case "BOOLEAN": {
        clean[def.key] = value === true || value === "true";
        break;
      }
      case "TEXT": {
        clean[def.key] = String(value);
        break;
      }
      case "DATE": {
        const d = new Date(String(value));
        if (Number.isNaN(d.getTime())) errors[def.key] = "invalid date";
        else clean[def.key] = d.toISOString();
        break;
      }
      case "ENUM": {
        const options = (def.options as AttrOption[] | null) ?? [];
        const allowed = options.map((o) => o.value);
        if (!allowed.includes(String(value))) errors[def.key] = "invalid option";
        else clean[def.key] = String(value);
        break;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Invalid listing attributes.",
      data: { attributes: errors },
    });
  }

  return clean;
}
