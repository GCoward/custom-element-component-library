# Native Elements

A small TypeScript Web Component library: **custom elements, open Shadow DOM, native
HTML controls, and no production framework dependency**. Vite builds the library;
a separate Next.js App Router application demonstrates consuming it with React 19.
Vitest and Playwright test every component. No Jest or Storybook.

The goal is to demonstrate browser-platform competence, not build another UI framework.
The three components deliberately cover different platform features:

| Component | Demonstrates |
| --- | --- |
| `ce-button` | Native keyboard activation, disabled state, content projection |
| `ce-text-field` | Form-associated custom elements, validation, reset, state restoration |
| `ce-disclosure` | Native `details`/`summary`, named slots, reflected state |

## Run locally

Use **Node.js 22.12+** and npm 10+.

```sh
npm ci
npm run dev
```

Open <http://localhost:3000>. `predev` builds the library before starting Next.js.
After changing library source, run `npm run build` again; Next.js hot reload handles
demo changes. For continuous library work, run `npx vite build --watch` in another
terminal (run a full build afterward to refresh declarations).

```sh
npm run build          # Clean Vite ES module output + TypeScript declarations in dist/
npm run build:demo     # Library + production Next.js build
npm run lint           # Strict library/test type checking + Next.js ESLint
npm test               # Vitest unit tests, including a Node-only SSR test
npm run test:watch
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e       # Build library; start demo; test all three browser engines
npm run test:e2e -- --project=chromium
npm run start --workspace demo  # Serve the production demo after build:demo
```

There is one root lockfile and one npm workspace, `demo`. CI runs the production
builds, lint, unit tests, and all three Playwright projects. Browser traces for
failed tests are saved under ignored `test-results/`.

## Architecture

```text
src/
  index.ts             SSR-safe registration and public TypeScript types
  button.ts            ce-button
  text-field.ts        ce-text-field
  disclosure.ts        ce-disclosure
  internal.ts          Shared static styles and pre-upgrade property handling
  *.test.ts            Vitest tests
demo/
  app/                 Next.js server page and a small client playground
  custom-elements.d.ts React-only JSX declarations (not part of the library)
tests/
  components.spec.ts   Real-browser integration tests
```

The dependency direction is **demo → library → browser APIs**. React is not involved
in rendering or updating component internals. Attributes, DOM properties, slots,
and standard events are the public contract.

Vite library mode emits native ES modules and lazy-loaded component chunks.
TypeScript emits declarations without an extra plugin. The package is private:
it is a demonstration, not an already-published npm product. The demo consumes the
same built package that a non-React application would use, through a local dependency.

### Registration and plain HTML usage

Importing the entry point is safe during SSR: component classes are imported only
when `defineElements()` runs in a browser. Registration is explicit, asynchronous,
and idempotent, including concurrent calls and development refreshes.

```ts
import { defineElements } from "@gcoward/custom-elements";

await defineElements();
const field = document.querySelector("ce-text-field");
field?.addEventListener("input", () => console.log(field.value));
```

After building, the output can also be used without a bundler. Serve **the entire
`dist/` directory**, retaining its chunk files, under a path such as `/components/`:

```html
<script type="module">
  import { defineElements } from "/components/custom-elements.js";
  await defineElements();
</script>

<ce-button>Perform action</ce-button>
<form>
  <ce-text-field label="Your name" name="name" required></ce-text-field>
  <button type="submit">Submit</button>
  <button type="reset">Reset</button>
</form>
<ce-disclosure>
  <span slot="summary">More information</span>
  <p>Ordinary light DOM content.</p>
</ce-disclosure>
```

Use closing tags: autonomous custom elements are **not** void elements.
Properties assigned before definition are upgraded without losing their values.
Wait for `defineElements()` (or `customElements.whenDefined("ce-text-field")`) before
calling methods. Each element owns its shadow tree and installs internal listeners
once; disconnect/reconnect does not duplicate handlers or retain global listeners.

### Next.js / React

Call `defineElements()` from a client component's `useEffect`, not during rendering.
See `demo/app/playground.tsx` for a complete example and
`demo/custom-elements.d.ts` for typed JSX. React 19 supports custom element
properties; the demo uses `onClick` and `onInput` with real DOM events.
For other frameworks, use the same HTML API or `addEventListener`.

The server renders the page shell, not the shadow trees. This project intentionally
does not implement Declarative Shadow DOM or server-rendered interactive controls.
The demo keeps examples hidden until registration succeeds, shows a loading/error
status, and includes a no-JavaScript message. Applications that require functional
no-JavaScript forms should render native controls instead.

## Component API

Boolean attributes use **HTML presence semantics**: `disabled="false"` is still
disabled. Remove the attribute or assign `element.disabled = false`.
Reflected properties update their attributes. Programmatic state changes do not
pretend to be user input.

### `ce-button`

```html
<ce-button>Save draft</ce-button>
<ce-button disabled>Unavailable</ce-button>
```

- **Attribute/property:** `disabled: boolean` (default `false`, reflected).
- **Slot:** default, for a meaningful visible label. Do not nest interactive content.
- **Event:** native composed, bubbling `click`, retargeted to the host.
- **Methods:** `focus(options?)`, `click()` delegate to the native button.
- **Part:** `button`.

The inner control is always `type="button"`. This is an **action button**, not a
form-associated submit/reset button. Use native `<button type="submit">` or
`<button type="reset">` for form actions. Disabled native buttons neither activate
nor enter the keyboard tab order.

### `ce-text-field`

```html
<ce-text-field label="Display name" name="displayName" value="Ada" required></ce-text-field>
```

| Attribute / property | Contract |
| --- | --- |
| `label` / `label: string` | Visible, safely rendered internal label; defaults to `"Text"` |
| `name` / `name: string` | Native form submission key; defaults to `""` |
| `value` attribute | Default/reset value; defaults to `""` |
| `value: string` property | Current value; does **not** reflect to the attribute |
| `required` / `required: boolean` | Required-value constraint; reflected |
| `disabled` / `disabled: boolean` | Disabled control; reflected |

- **Events:** native composed, bubbling `input`; one bubbling, composed `change`
  event on commit. Read `field.value`; the event target is the host. Setting `.value`
  or resetting does not emit either event.
- **Form API:** read-only `form`, `validity`, `validationMessage`, `willValidate`;
  `checkValidity()`, `reportValidity()`, and `focus(options?)`.
- **Parts:** `label`, `input`. No content slots.
- **Native behavior:** `ElementInternals.setFormValue` supplies the value;
  `setValidity` mirrors the internal input's required constraint and anchors
  validation UI to it. A disabled field or disabled ancestor fieldset excludes the
  control from validation/submission and disables the shadow input.
- **Reset/restoration:** reset restores the latest `value` attribute and clears
  dirty state. Browser string-state restoration updates the current value.
  Changing the default attribute after user input or a `.value` assignment does not
  overwrite the current value until reset.

Always provide a meaningful `label`. It is associated with the actual input
**inside the same shadow root**, so the native input supplies the textbox role,
accessible name, required/disabled semantics, and focus. The host intentionally
does not duplicate that role. The internal input also exposes `aria-invalid`.
An external light DOM `label[for]` or `aria-labelledby` is not the supported
accessible-name API: ID references do not automatically cross shadow boundaries.

This is deliberately a **single-line text field**, not a complete replacement for
every input type. Pattern/email constraints, custom error messages, implicit
Enter-to-submit, autocomplete configuration, and arbitrary ARIA forwarding are not
part of its current contract. Use a native input when those features are needed.

### `ce-disclosure`

```html
<ce-disclosure open>
  <span slot="summary">Shipping details</span>
  <p>Delivered in three working days.</p>
</ce-disclosure>
```

- **Attribute/property:** `open: boolean` (default `false`, reflected in both
  directions, including user interaction).
- **Slots:** named `summary` (fallback `"More information"`), default for content.
- **Event:** non-bubbling `toggle` on the host after native state changes;
  listen directly on the element. Native toggle events may coalesce rapid changes.
- **Parts:** `details`, `summary`, `content`.

The browser supplies expansion semantics and Enter/Space keyboard behavior.
Keep summary content descriptive and non-interactive. Each disclosure is independent;
there is no accordion/group controller or custom focus-management layer.

## Styling

Components inherit font and text color. Shadow DOM isolates internal selectors;
global `button`/`input` rules do not accidentally restyle them. Slots remain
consumer-owned light DOM. Custom properties inherit through the boundary:

```css
:root {
  --ce-accent: #1746a2;
  --ce-on-accent: white;
  --ce-focus: #2563eb;
  --ce-radius: .5rem;
  --ce-border: #64748b;
  --ce-surface: white;
}

ce-button::part(button) { font-weight: 700; }
ce-text-field::part(label) { margin-bottom: .75rem; }
```

`--ce-border` defaults to `#64748b` for fields and `#94a3b8` for disclosures;
the other defaults are shown above. Public parts are intentional escape hatches,
not a requirement to target private shadow selectors. Consumers own theme contrast.
All hosts honor `hidden`; styles use no fixed control widths or motion effects,
and text follows the inherited language/direction.

## Standards and accessibility checklist

Design is guided by the [Web Components best practices / Gold Standard checklist](https://webcomponents.today/best-practices/)
and [custom element best practices](https://web.dev/articles/custom-elements-best-practices).
This is an implementation/evidence map, **not a certification or claim that every
item in an external checklist has been independently audited**.

| Principle | Implementation / verification |
| --- | --- |
| Native semantics before custom ARIA | Internal button, labelled input, details/summary; browser role/name and keyboard tests |
| Framework-independent APIs | Standard attributes/properties/events, slots; no production dependencies |
| Safe lifecycle and late upgrade | Constructor creates shadow DOM only; property upgrade on connection; reconnect tests |
| Predictable state | Boolean reflection, dirty/default values, native reset and validity tests |
| Form participation | ElementInternals; real FormData, required and disabled-fieldset tests |
| Encapsulation with escape hatches | Open shadow roots, CSS properties, `::part`, inherited typography |
| Consumer content ownership | Slots; no rewriting consumer children or interpolating user HTML |
| Keyboard and focus | Browser-native behavior, visible focus rings, delegated control focus |
| SSR and hydration | Server-safe entry import; explicit client registration; browser error checks |
| Cross-browser behavior | Playwright projects for Chromium, Firefox, WebKit |

### Test boundaries and browser support

Vitest checks reflection, slots, safe text rendering, value/default semantics,
events, reconnects, and registration. happy-dom does not implement ElementInternals;
unit tests stub **only** that API and make no claim to prove native form behavior.
Playwright checks the built library through Next.js, including accessible textbox
names, native validation focus, FormData, reset, fieldset disabling, keyboard
operation, Shadow DOM styling, late property upgrade, and hydration.

Target modern evergreen browsers with Custom Elements, Shadow DOM, and
form-associated custom element support (Chromium 77+, Firefox 93+, Safari 16.4+).
Automated testing covers the installed Playwright engine versions, not every older
release or actual Safari device. No legacy-browser polyfills are bundled.
Unsupported browsers should receive native HTML controls from the consuming app.

Before shipping to users, manually verify screen readers (for example
NVDA/Firefox and VoiceOver/Safari), high-contrast mode, zoom to 200–400%, RTL,
and your chosen color theme. Accessible-name and keyboard tests are useful
regressions, not a substitute for assistive-technology testing or a WCAG audit.

## Scope and provenance

The request references [GCoward/app-template](https://github.com/GCoward/app-template)
and a [Consortia senior frontend role](https://consortia.com/jobs/senior-frontend-developer-j17873).
The template returned 404 during implementation and the role/checklist sites were
unreachable in the build environment. This project therefore uses the official
Vite vanilla-TypeScript and create-next-app scaffolds, retaining the requested
TypeScript/Next.js direction without copying unavailable template code or claiming
to have verified the job posting. It demonstrates the explicitly requested Web
Components skills with documented limitations rather than inventing role requirements.

There is intentionally no framework wrapper package, custom rendering engine,
CSS framework, component generator, backend, or publishing automation.
The root `minimatch` override pins a patched transitive lint dependency; `npm audit`
should be checked when updating dependencies and the override removed when upstream
ranges no longer need it.
