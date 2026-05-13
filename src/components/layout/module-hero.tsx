type ModuleHeroMetric = {
  label: string;
  value: string;
  helper?: string;
};

type ModuleHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: ModuleHeroMetric[];
  tone?: "dark" | "light";
};

export function ModuleHero({ eyebrow, title, description }: ModuleHeroProps) {
  return (
    <section className="mb-5 border-b pb-5">
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
