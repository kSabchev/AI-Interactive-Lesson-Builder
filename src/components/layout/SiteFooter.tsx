import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/** The footer under the site's pages (not the lesson player, which fills the screen). */
export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="border-t border-line">
      <nav aria-label={t.footer.nav} className="mx-auto flex w-full max-w-6xl flex-wrap gap-4 px-4 py-6 text-sm md:px-8">
        <span className="text-muted">{t.common.appName}</span>
        <Link href="/privacy" className="font-bold text-brand-700 underline-offset-2 hover:underline">
          {t.footer.privacy}
        </Link>
      </nav>
    </footer>
  );
}
