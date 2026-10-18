import { AppHeader } from "@/components/account/AppHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LibraryLessons } from "@/components/lesson/LibraryLessons";
import { ButtonLink } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getT();
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-8 md:py-16">
        <section className="max-w-3xl">
          <p className="font-extrabold uppercase tracking-widest text-brand-600">{t.home.kicker}</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-balance md:text-6xl">{t.home.title}</h1>
          <p className="mt-4 text-xl leading-relaxed text-muted">{t.home.intro}</p>
          <ButtonLink href="/create" size="lg" className="mt-6">
            {t.home.createLesson}
          </ButtonLink>
        </section>

        <LibraryLessons />
      </main>
      <SiteFooter />
    </>
  );
}
