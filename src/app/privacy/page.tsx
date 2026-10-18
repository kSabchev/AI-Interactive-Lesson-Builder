import type { Metadata } from "next";
import { AppHeader } from "@/components/account/AppHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.meta.page(t.privacy.title) };
}

export default async function PrivacyPage() {
  const t = await getT();
  const p = t.privacy;
  // A contact address for data questions; without one, invited people are pointed to whoever invited them.
  const contact = process.env.CONTACT_EMAIL;
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-4xl font-extrabold">{p.title}</h1>
        <p className="mt-2 text-sm text-muted">{p.updated}</p>
        <p className="mt-6 text-lg">{p.intro}</p>
        {p.sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-2xl font-extrabold">{section.title}</h2>
            {section.paragraphs.map((text) => (
              <p key={text} className="mt-3">
                {text}
              </p>
            ))}
            {section.items.length > 0 && (
              <ul className="mt-3 list-disc space-y-2 pl-6">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="mt-8 font-bold">{contact ? p.contact(contact) : p.contactFallback}</p>
        <p className="mt-2 text-sm text-muted">{p.demoNote}</p>
      </main>
      <SiteFooter />
    </>
  );
}
