type Props = {
  lines: string[];
  attribution: string;
};

export function QuoteCard({ lines, attribution }: Props) {
  return (
    <div className="col-span-12 flex min-h-[260px] flex-col justify-between rounded-card-xl bg-bento-hero-dark p-7 text-white md:col-span-4 md:min-h-[260px] md:p-8">
      <div
        aria-hidden="true"
        className="text-6xl font-bold leading-none text-bento-accent"
        style={{ lineHeight: 0.7 }}
      >
        "
      </div>
      <blockquote className="my-3 font-serif text-lg font-medium leading-tight tracking-tighter md:text-xl">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </blockquote>
      <cite className="text-xs not-italic text-white/60">{attribution}</cite>
    </div>
  );
}
