export function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="mb-6">
      <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">{kicker}</p>
      <h2 className="mt-1 text-3xl font-extrabold leading-tight text-balance md:text-4xl lg:text-5xl">{title}</h2>
    </header>
  );
}
