import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { StoreProvider } from "@/lib/storage/StoreProvider";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lesson Builder — interactive science lessons for kids",
  description:
    "Turn a topic into an interactive lesson and quiz for learners aged 8–12. Review, present and check understanding on one shared screen.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
