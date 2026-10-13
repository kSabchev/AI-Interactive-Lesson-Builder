import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Suspense } from "react";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";
import { StoreProvider } from "@/lib/storage/StoreProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.siteTitle, description: t.meta.siteDescription };
}

/** Reads the interface language from the request, so the first render is already in the right language. */
async function LocaleRoot({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <LocaleProvider initialLocale={locale}>
      <StoreProvider>{children}</StoreProvider>
    </LocaleProvider>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense>
          <LocaleRoot>{children}</LocaleRoot>
        </Suspense>
      </body>
    </html>
  );
}
