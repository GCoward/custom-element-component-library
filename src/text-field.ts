import { controlStyles, upgradeProperties } from "./internal";

export class CeTextField extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["label", "value", "required", "disabled"];
  #internals: ElementInternals;
  #input: HTMLInputElement;
  #label: HTMLLabelElement;
  #dirty = false;
  #showValidation = false;
  #formDisabled = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.innerHTML = `
      <style>
        ${controlStyles}
        :host { display: block; }
        label { display: block; font-weight: 600; margin-bottom: .4rem; }
        input {
          width: 100%; padding: .65rem; color: inherit; background: var(--ce-surface, white);
          border: 1px solid var(--ce-border, #64748b); border-radius: var(--ce-radius, .5rem);
        }
        input:disabled { opacity: .55; cursor: not-allowed; }
      </style>
      <label part="label" for="control"></label>
      <input part="input" id="control" type="text">
    `;
    this.#input = root.querySelector("input")!;
    this.#label = root.querySelector("label")!;
    this.#input.addEventListener("input", () => {
      this.#dirty = true;
      this.#syncForm();
    });
    this.#input.addEventListener("change", (event) => {
      event.stopPropagation();
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    });
    this.addEventListener("invalid", () => {
      this.#showValidation = true;
      this.#syncForm();
    });
  }

  connectedCallback() {
    upgradeProperties(this, ["value", "label", "required", "disabled", "name"]);
    this.#sync();
  }

  attributeChangedCallback(name: string) {
    if (name === "value" && !this.#dirty) {
      this.#input.value = this.getAttribute("value") ?? "";
    }
    this.#sync();
  }

  #sync() {
    this.#label.textContent = this.label;
    this.#input.required = this.required;
    this.#input.disabled = this.disabled || this.#formDisabled;
    this.#syncForm();
  }

  #syncForm() {
    this.#internals.setFormValue(this.#input.value);
    const missing = this.#input.validity.valueMissing;
    this.#internals.setValidity(
      missing ? { valueMissing: true } : {},
      missing ? this.#input.validationMessage : "",
      this.#input,
    );
    this.#input.setAttribute("aria-invalid", String(missing && this.#showValidation));
  }

  get value() { return this.#input.value; }
  set value(value: string) {
    this.#dirty = true;
    this.#input.value = String(value);
    this.#syncForm();
  }

  get label() { return this.getAttribute("label") ?? "Text"; }
  set label(value: string) { this.setAttribute("label", value); }
  get name() { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get required() { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get disabled() { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get form() { return this.#internals.form; }
  get validity() { return this.#internals.validity; }
  get validationMessage() { return this.#internals.validationMessage; }
  get willValidate() { return this.#internals.willValidate; }
  checkValidity() { return this.#internals.checkValidity(); }
  reportValidity() { return this.#internals.reportValidity(); }
  override focus(options?: FocusOptions) { this.#input.focus(options); }

  formResetCallback() {
    this.#dirty = false;
    this.#showValidation = false;
    this.#input.value = this.getAttribute("value") ?? "";
    this.#syncForm();
  }

  formDisabledCallback(disabled: boolean) {
    this.#formDisabled = disabled;
    this.#sync();
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === "string") this.value = state;
  }
}
