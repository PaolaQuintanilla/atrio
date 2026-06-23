import { describe, expect, it } from "bun:test";
import type { AttributeDefinition } from "@atria/db";
import { validateListingAttributes } from "./attributes";

/** Build a minimal AttributeDefinition for tests (only the fields the validator reads). */
function def(partial: Partial<AttributeDefinition> & Pick<AttributeDefinition, "key" | "type">) {
  return {
    id: partial.key,
    categoryId: "cat",
    label: { en: partial.key },
    unit: null,
    options: null,
    required: false,
    filterable: true,
    order: 0,
    ...partial,
  } as AttributeDefinition;
}

describe("validateListingAttributes", () => {
  it("coerces numbers and passes through text", () => {
    const defs = [def({ key: "area", type: "NUMBER" }), def({ key: "make", type: "TEXT" })];
    const result = validateListingAttributes(defs, { area: "120", make: "Toyota" });
    expect(result).toEqual({ area: 120, make: "Toyota" });
  });

  it("normalizes booleans from strings and real booleans", () => {
    const defs = [def({ key: "furnished", type: "BOOLEAN" })];
    expect(validateListingAttributes(defs, { furnished: "true" })).toEqual({ furnished: true });
    expect(validateListingAttributes(defs, { furnished: false })).toEqual({ furnished: false });
  });

  it("accepts a valid enum option and rejects an invalid one", () => {
    const defs = [
      def({
        key: "fuel",
        type: "ENUM",
        options: [
          { value: "gasoline", label: { en: "Gasoline" } },
          { value: "electric", label: { en: "Electric" } },
        ],
      }),
    ];
    expect(validateListingAttributes(defs, { fuel: "electric" })).toEqual({ fuel: "electric" });
    expect(() => validateListingAttributes(defs, { fuel: "coal" })).toThrow();
  });

  it("throws when a required field is missing", () => {
    const defs = [def({ key: "area", type: "NUMBER", required: true })];
    expect(() => validateListingAttributes(defs, {})).toThrow();
  });

  it("throws on a non-numeric value for a NUMBER field", () => {
    const defs = [def({ key: "area", type: "NUMBER" })];
    expect(() => validateListingAttributes(defs, { area: "not-a-number" })).toThrow();
  });

  it("ignores empty optional fields and unknown keys", () => {
    const defs = [def({ key: "area", type: "NUMBER" })];
    const result = validateListingAttributes(defs, { area: "", extra: "ignored" });
    expect(result).toEqual({});
  });
});
