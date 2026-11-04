import { controlStyles, upgradeProperties } from "./internal";

export class CeDisclosure extends HTMLElement {
  static observedAttributes = ["open"];
  #details: HTMLDetailsElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        ${controlStyles}
        :host { display: block; }
        details {
          border: 1px solid var(--ce-border, #94a3b8);
          border-radius: var(--ce-radius, .5rem); padding: 1rem;
        }
        summary { cursor: pointer; font-weight: 600; }
        [part="content"] { padding-top: 1rem; }
      </style>
      <details part="details">
        <summary part="summary"><slot name="summary">More information</slot></summary>
        <div part="content"><slot></slot></div>
      </details>
    `;
    this.#details = root.querySelector("details")!;
    this.#details.addEventListener("toggle", () => {
      this.open = this.#details.open;
      this.dispatchEvent(new Event("toggle"));
    });
  }

  connectedCallback() {
    upgradeProperties(this, ["open"]);
  }

  attributeChangedCallback() {
    if (this.#details.open !== this.open) this.#details.open = this.open;
  }

  get open() { return this.hasAttribute("open"); }
  set open(value: boolean) { this.toggleAttribute("open", Boolean(value)); }
}
