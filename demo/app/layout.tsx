import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Native Elements — Web Component Library",
  description: "Accessible, framework-independent custom elements built on browser standards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
