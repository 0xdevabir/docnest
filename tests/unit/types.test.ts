import { describe, expect, it } from "vitest";

import { err, ok } from "../../src/types/index.js";

describe("Result helpers", () => {
  it("ok() returns a successful result", () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it("err() returns a failed result", () => {
    const result = err(new Error("oops"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("oops");
    }
  });
});
