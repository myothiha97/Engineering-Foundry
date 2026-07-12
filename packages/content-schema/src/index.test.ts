import { describe, expect, it } from "vitest";
import { lessonSchema } from "./index";

describe("lesson schema", () => {
  it("rejects lessons without exercises", () => {
    expect(() => lessonSchema.parse({ exercises: [] })).toThrow();
  });
});
