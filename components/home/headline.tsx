type Props = {
  totalCount: number;
  firstYear: number;
};

export function Headline({ totalCount, firstYear }: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pb-10 pt-6 md:px-10">
      <h1 className="text-[56px] font-bold leading-[0.95] tracking-tightest md:text-[88px]">
        Field notes <span className="font-serif italic font-normal">from</span>
        <br />
        <span className="headline-underline">a working engineer.</span>
      </h1>
      <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-bento-dim md:gap-x-4">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-bento-accent" />
          {totalCount} posts published
        </span>
        <span aria-hidden="true">—</span>
        <span>since Jan {firstYear}</span>
        <span aria-hidden="true">—</span>
        <span>Cloud · Java · Go · Database</span>
      </div>
    </section>
  );
}
