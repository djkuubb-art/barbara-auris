import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbara Auris | Analiza połączenia",
  description: "Interaktywna analiza relacji i emocjonalnego połączenia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
