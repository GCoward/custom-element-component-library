export const controlStyles = `
  :host { display: inline-block; font: inherit; color: inherit; }
  :host([hidden]) { display: none; }
  *, *::before, *::after { box-sizing: border-box; }
  button, input { font: inherit; }
  :focus-visible { outline: 3px solid var(--ce-focus, #2563eb); outline-offset: 3px; }
`;

export function upgradeProperties(element: HTMLElement, properties: string[]) {
  for (const property of properties) {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = Reflect.get(element, property);
      Reflect.deleteProperty(element, property);
      Reflect.set(element, property, value);
    }
  }
}
