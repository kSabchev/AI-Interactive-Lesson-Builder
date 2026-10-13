import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/account/AppHeader";
import { PricingPlans } from "@/components/billing/PricingPlans";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.header.pricing) };
}

export default async function PricingPage() {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">{t.pricing.title}</h1>
        <p className="mt-2 mb-8 max-w-2xl text-lg text-muted">{t.pricing.intro}</p>
        <Suspense fallback={<p className="text-muted">{t.common.loading}</p>}>
          <PricingPlans />
        </Suspense>
      </main>
    </>
  );
}
