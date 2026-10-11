import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { PricingPlans } from "@/components/billing/PricingPlans";

export const metadata: Metadata = { title: "Pricing — Lesson Builder" };

export default function PricingPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Plans</h1>
        <p className="mt-2 mb-8 max-w-2xl text-lg text-muted">
          Sample lessons, the editor, the player and quizzes are free for everyone. Plans add AI-generated lessons and
          more room for your library.
        </p>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <PricingPlans />
        </Suspense>
      </main>
    </>
  );
}
