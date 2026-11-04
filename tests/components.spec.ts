import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status").first()).toHaveText("Components ready");
});

test("native action button supports keyboard, disabled state and React events", async ({ page }) => {
  const button = page.getByRole("button", { name: "Count a click" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Clicks: 1", { exact: true })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByText("Clicks: 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  await page.locator("ce-button[disabled]").evaluate((element: HTMLElement) => element.click());
  await expect(page.getByText("Clicks: 2", { exact: true })).toBeVisible();
});

test("text field has an accessible name, required validity, form value and reset", async ({ page }) => {
  const field = page.getByRole("textbox", { name: "Your name", exact: true });
  await expect(field).toHaveAttribute("required", "");
  await expect(field).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "Submit form" }).click();
  await expect(page.getByText("No submission yet.", { exact: true })).toBeVisible();
  await expect(field).toHaveAttribute("aria-invalid", "true");
  expect(await page.locator("form").evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
  await expect(field).toBeFocused();
  await field.fill("Ada Lovelace");
  await expect(field).toHaveAttribute("aria-invalid", "false");
  await field.fill("");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await field.fill("Ada Lovelace");
  await expect(page.locator("output")).toHaveText("Ada Lovelace");
  expect(await page.locator("form").evaluate((form: HTMLFormElement) =>
    new FormData(form).get("name"))).toBe("Ada Lovelace");
  await page.getByRole("button", { name: "Submit form" }).click();
  await expect(page.getByText("Submitted: Ada Lovelace", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset form" }).click();
  await expect(field).toHaveValue("");
  await expect(field).toHaveAttribute("aria-invalid", "false");
  expect(await page.locator("form").evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
});

test("disabled fieldsets disable the shadow input and exclude the form value", async ({ page }) => {
  const field = page.getByRole("textbox", { name: "Your name" });
  await field.fill("Grace");
  await page.locator("fieldset").evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  await expect(field).toBeDisabled();
  expect(await page.locator("form").evaluate((form: HTMLFormElement) =>
    new FormData(form).has("name"))).toBe(false);
  expect(await page.locator("form").evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true);
  await page.locator("fieldset").evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await expect(field).toBeEnabled();
  await expect(field).toHaveValue("Grace");
});

test("tab order skips disabled controls and reaches the actual shadow input", async ({ page }) => {
  await page.getByRole("button", { name: "Count a click" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Your name" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Submit form" })).toBeFocused();
});

test("dirty/default values, native change events and resets remain distinct", async ({ page }) => {
  const field = page.locator("ce-text-field");
  await field.evaluate((element) => {
    element.setAttribute("value", "default");
    element.addEventListener("change", () => {
      element.dataset.changes = String(Number(element.dataset.changes ?? 0) + 1);
    });
  });
  const input = page.getByRole("textbox", { name: "Your name" });
  await expect(input).toHaveValue("default");
  await input.fill("edited");
  await input.press("Tab");
  await expect(field).toHaveAttribute("data-changes", "1");
  await field.evaluate((element) => { element.setAttribute("value", "new default"); });
  await expect(input).toHaveValue("edited");
  await page.getByRole("button", { name: "Reset form" }).click();
  await expect(input).toHaveValue("new default");
  await expect(field).toHaveAttribute("data-changes", "1");
  expect(await page.locator("form").evaluate((form: HTMLFormElement) =>
    new FormData(form).get("name"))).toBe("new default");
});

test("disclosure uses native keyboard interaction and reflects open state", async ({ page }) => {
  const summary = page.locator("ce-disclosure summary");
  const content = page.getByText("Custom elements work in plain HTML and across frameworks without a runtime dependency.");
  await expect(content).toBeHidden();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(content).toBeVisible();
  await expect(page.locator("ce-disclosure")).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(content).toBeHidden();
  await expect(page.locator("ce-disclosure")).not.toHaveAttribute("open");
});

test("styles are encapsulated, customizable and respect hidden", async ({ page }) => {
  await page.addStyleTag({ content: `
    button { border-radius: 99px !important; }
    ce-button { --ce-accent: rgb(100, 20, 120); }
    ce-button::part(button) { border-radius: 12px; }
  ` });
  const button = page.getByRole("button", { name: "Count a click" });
  await expect(button).toHaveCSS("background-color", "rgb(100, 20, 120)");
  await expect(button).toHaveCSS("border-radius", "12px");
  await page.locator("ce-button").first().evaluate((element: HTMLElement) => { element.hidden = true; });
  await expect(button).toBeHidden();
});

test("pre-upgrade properties survive definition and reconnecting does not duplicate events", async ({ page }) => {
  expect(await page.evaluate(() => {
    const Base = customElements.get("ce-button")!;
    const local = document.createElement("ce-late-local") as HTMLElement & { disabled: boolean };
    local.disabled = true;
    document.body.append(local);
    customElements.define("ce-late-local", class extends Base {});
    const disabled = local.shadowRoot!.querySelector("button")!.disabled;
    local.remove();
    document.body.append(local);
    let clicks = 0;
    local.addEventListener("click", () => clicks++);
    local.disabled = false;
    local.click();
    local.remove();
    return { disabled, clicks };
  })).toEqual({ disabled: true, clicks: 1 });
});

test("SSR markup hydrates without browser errors", async ({ page, request }) => {
  const response = await request.get("/");
  expect(await response.text()).toContain("Native Elements");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole("status").first()).toHaveText("Components ready");
  expect(errors).toEqual([]);
});
