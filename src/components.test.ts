import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { defineElements } from "./index";

beforeAll(() => defineElements());
// happy-dom has no ElementInternals. Native form behavior is tested in Playwright.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "attachInternals", {
    configurable: true,
    value: () => ({ setFormValue: vi.fn(), setValidity: vi.fn() }),
  });
});
afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "attachInternals");
});
afterEach(() => document.body.replaceChildren());

describe("registration", () => {
  it("can be awaited repeatedly and concurrently", async () => {
    const constructor = customElements.get("ce-button");
    await Promise.all([defineElements(), defineElements()]);
    expect(customElements.get("ce-button")).toBe(constructor);
  });
});

describe("ce-button", () => {
  it("preserves light DOM content and uses a non-submit native button", () => {
    const element = document.createElement("ce-button");
    element.textContent = "Save";
    document.body.append(element);
    expect(element.textContent).toBe("Save");
    expect(element.shadowRoot!.querySelector("slot")).not.toBeNull();
    expect(element.shadowRoot!.querySelector("button")!.type).toBe("button");
  });

  it("reflects boolean disabled state and suppresses activation", () => {
    const element = document.createElement("ce-button");
    document.body.append(element);
    const listener = vi.fn();
    element.addEventListener("click", listener);
    element.disabled = true;
    element.click();
    expect(listener).not.toHaveBeenCalled();
    expect(element.shadowRoot!.querySelector("button")!.disabled).toBe(true);
    element.disabled = false;
    element.click();
    expect(listener).toHaveBeenCalledOnce();
    element.setAttribute("disabled", "false");
    expect(element.disabled).toBe(true);
  });

  it("does not multiply listeners after reconnect", () => {
    const element = document.createElement("ce-button");
    document.body.append(element);
    element.remove();
    document.body.append(element);
    const listener = vi.fn();
    element.addEventListener("click", listener);
    element.click();
    expect(listener).toHaveBeenCalledOnce();
  });
});

describe("ce-disclosure", () => {
  it("reflects open state in both directions", () => {
    const element = document.createElement("ce-disclosure");
    document.body.append(element);
    element.open = true;
    const details = element.shadowRoot!.querySelector("details")!;
    expect(details.open).toBe(true);
    const listener = vi.fn();
    element.addEventListener("toggle", listener);
    details.open = false;
    details.dispatchEvent(new Event("toggle"));
    expect(element.open).toBe(false);
    expect(listener).toHaveBeenCalled();
    element.setAttribute("open", "");
    expect(details.open).toBe(true);
  });

  it("provides named/default slots and a fallback summary", () => {
    const element = document.createElement("ce-disclosure");
    expect(element.shadowRoot!.querySelector('slot[name="summary"]')!.textContent).toBe("More information");
    expect(element.shadowRoot!.querySelector("slot:not([name])")).not.toBeNull();
  });
});

describe("ce-text-field", () => {
  it("uses a safely rendered, associated label", () => {
    const element = document.createElement("ce-text-field");
    element.label = '<img src=x onerror="alert(1)">';
    document.body.append(element);
    expect(element.shadowRoot!.querySelector("label")!.textContent).toBe(element.label);
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("label")!.htmlFor).toBe("control");
  });

  it("reflects required, disabled and name properties", () => {
    const element = document.createElement("ce-text-field");
    element.required = true;
    element.disabled = true;
    element.name = "username";
    document.body.append(element);
    const input = element.shadowRoot!.querySelector("input")!;
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(element.getAttribute("name")).toBe("username");
    element.disabled = false;
    expect(input.disabled).toBe(false);
  });

  it("shows required errors after interaction or failed validation and clears them on reset", () => {
    const element = document.createElement("ce-text-field");
    element.required = true;
    document.body.append(element);
    const input = element.shadowRoot!.querySelector("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("false");
    element.dispatchEvent(new Event("invalid"));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    element.formResetCallback();
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("distinguishes the default value from a dirty value and resets", () => {
    const element = document.createElement("ce-text-field");
    element.setAttribute("value", "initial");
    document.body.append(element);
    expect(element.value).toBe("initial");
    element.value = "edited";
    element.setAttribute("value", "new default");
    expect(element.value).toBe("edited");
    element.formResetCallback();
    expect(element.value).toBe("new default");
    element.setAttribute("value", "pristine");
    expect(element.value).toBe("pristine");
  });

  it("updates value on input and emits one public change event", () => {
    const element = document.createElement("ce-text-field");
    document.body.append(element);
    const input = element.shadowRoot!.querySelector("input")!;
    const listener = vi.fn();
    element.addEventListener("change", listener);
    input.value = "typed";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(element.value).toBe("typed");
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]![0].composed).toBe(true);
  });

  it("restores state and handles disabled fieldsets", () => {
    const element = document.createElement("ce-text-field");
    document.body.append(element);
    element.formStateRestoreCallback("restored");
    expect(element.value).toBe("restored");
    element.formDisabledCallback(true);
    expect(element.shadowRoot!.querySelector("input")!.disabled).toBe(true);
    element.formDisabledCallback(false);
    expect(element.shadowRoot!.querySelector("input")!.disabled).toBe(false);
  });
});
