import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../../node_modules/tw-animate-css/dist/tw-animate.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";

// Self-hosted (OFL) latin variable fonts. next/font/google breaks on Vercel's
// builders because Google serves Fredoka from a query-string URL.
const display = localFont({
  src: "./fonts/fredoka-latin-var.woff2",
  weight: "500 700",
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: "./fonts/nunito-latin-var.woff2",
  weight: "500 900",
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPARK · Waddle through your 4 years with Pingu",
  description: "Your AICTE activity points, turned into a 4-year journey. Join events, clear levels, and reach 100 points with Pingu.",
};

export const viewport: Viewport = {
  themeColor: "#F5F9FD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body">
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
