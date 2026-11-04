"use client";

import { useEffect, useState } from "react";
import { defineElements } from "@gcoward/custom-elements";

export function Playground() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState("No submission yet.");
  const [input, setInput] = useState("");

  useEffect(() => {
    let active = true;
    defineElements().then(
      () => { if (active) setReady(true); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, []);

  return (
    <>
      <p role="status">{error ? "Components could not load. Please reload." :
        ready ? "Components ready" : "Loading interactive components…"}</p>
      <noscript>These custom elements need JavaScript. Enable it to try the examples.</noscript>
      <div className="examples" hidden={!ready}>
        <section aria-labelledby="button-heading">
          <h2 id="button-heading">01 / Action button</h2>
          <p>Native keyboard activation, disabled state, and a light DOM label.</p>
          <div className="row">
            <ce-button onClick={() => setCount((value) => value + 1)}>Count a click</ce-button>
            <ce-button disabled>Unavailable</ce-button>
          </div>
          <p aria-live="polite">Clicks: {count}</p>
          <pre><code>{'<ce-button>Count a click</ce-button>'}</code></pre>
        </section>

        <section aria-labelledby="field-heading">
          <h2 id="field-heading">02 / Form-associated text field</h2>
          <p>A real form value, required validation, and native reset behavior.</p>
          <form onSubmit={(event) => {
            event.preventDefault();
            setResult(`Submitted: ${new FormData(event.currentTarget).get("name")}`);
          }}>
            <fieldset>
              <legend>Your details</legend>
              <ce-text-field
                label="Your name"
                name="name"
                required
                onInput={(event) => setInput(event.currentTarget.value)}
              />
            </fieldset>
            <div className="row">
              <button type="submit">Submit form</button>
              <button type="reset">Reset form</button>
            </div>
          </form>
          <p aria-live="polite">{result}</p>
          <p>Last input event: <output>{input || "—"}</output></p>
          <pre><code>{'<ce-text-field label="Your name" name="name" required></ce-text-field>'}</code></pre>
        </section>

        <section aria-labelledby="disclosure-heading">
          <h2 id="disclosure-heading">03 / Disclosure</h2>
          <p>No custom keyboard logic: the browser owns details and summary.</p>
          <ce-disclosure>
            <span slot="summary">Why Web Components?</span>
            <p>Custom elements work in plain HTML and across frameworks without a runtime dependency.</p>
          </ce-disclosure>
          <pre><code>{'<ce-disclosure>\n  <span slot="summary">Why Web Components?</span>\n  <p>Content goes here.</p>\n</ce-disclosure>'}</code></pre>
        </section>
      </div>
    </>
  );
}
