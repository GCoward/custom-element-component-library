import type { CeButton } from "./button.js";
import type { CeDisclosure } from "./disclosure.js";
import type { CeTextField } from "./text-field.js";

export type { CeButton, CeDisclosure, CeTextField };

/** Safe to import on the server; call and await in the browser to upgrade elements. */
export async function defineElements(): Promise<void> {
  if (typeof window === "undefined" || !window.customElements) return;

  const [{ CeButton }, { CeDisclosure }, { CeTextField }] = await Promise.all([
    import("./button"),
    import("./disclosure"),
    import("./text-field"),
  ]);
  const elements = [
    ["ce-button", CeButton],
    ["ce-disclosure", CeDisclosure],
    ["ce-text-field", CeTextField],
  ] as const;
  for (const [name, constructor] of elements) {
    if (!customElements.get(name)) customElements.define(name, constructor);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ce-button": CeButton;
    "ce-disclosure": CeDisclosure;
    "ce-text-field": CeTextField;
  }
}
