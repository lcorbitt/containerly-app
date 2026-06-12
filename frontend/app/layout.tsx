import type { Metadata } from "next";
import { Fustat, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { ThemeScript } from "@/utils/theme/ThemeScript";
import { rootSiteMetadata } from "@/lib/site-metadata";
import "./globals.css";

const fustat = Fustat({
  variable: "--font-fustat",
  subsets: ["latin"],
  weight: "variable",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = rootSiteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fustat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
