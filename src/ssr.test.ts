// @vitest-environment node
import { expect, it } from "vitest";
import { defineElements } from "./index";

it("imports and skips registration without browser globals", async () => {
  expect(typeof window).toBe("undefined");
  await expect(defineElements()).resolves.toBeUndefined();
});
