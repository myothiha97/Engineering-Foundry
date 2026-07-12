import type { Metadata } from "next";
import "@platform/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Go Runtime Lab",
  description:
    "Build correct mental models of Go compilation, memory, runtime behavior, and design.",
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
