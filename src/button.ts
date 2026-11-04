import { controlStyles, upgradeProperties } from "./internal";

/** An action button. Use a native button for form submission. */
export class CeButton extends HTMLElement {
  static observedAttributes = ["disabled"];
  #button: HTMLButtonElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.innerHTML = `
      <style>
        ${controlStyles}
        button {
          border: 1px solid transparent; border-radius: var(--ce-radius, .5rem);
          padding: .65rem 1rem; cursor: pointer;
          background: var(--ce-accent, #1746a2); color: var(--ce-on-accent, white);
        }
        button:disabled { opacity: .55; cursor: not-allowed; }
      </style>
      <button part="button" type="button"><slot></slot></button>
    `;
    this.#button = root.querySelector("button")!;
  }

  connectedCallback() {
    upgradeProperties(this, ["disabled"]);
  }

  attributeChangedCallback() {
    this.#button.disabled = this.disabled;
  }

  get disabled() { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }

  override focus(options?: FocusOptions) { this.#button.focus(options); }
  override click() { this.#button.click(); }
}
