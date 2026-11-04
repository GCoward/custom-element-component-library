import { Playground } from "./playground";

export default function Home() {
  return (
    <main>
      <header>
        <p className="eyebrow">CUSTOM ELEMENTS · SHADOW DOM · TYPESCRIPT</p>
        <h1>Native Elements</h1>
        <p className="intro">
          Three small components. Browser-native behavior. No framework required.
          This Next.js page is just one way to use them.
        </p>
      </header>
      <Playground />
      <footer>
        Built with Web Components, packaged by Vite, demonstrated with Next.js.
        See the repository README for APIs, design decisions, and testing guidance.
      </footer>
    </main>
  );
}
