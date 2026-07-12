import type { Metadata } from "next";
import "@platform/ui/styles.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Backend Systems Atlas",
  description: "An architecture laboratory for backend engineering and LedgerFlow.",
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var t=localStorage.getItem("atlas-theme");document.documentElement.dataset.atlasTheme=t==="light"?"light":"dark"}())',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
