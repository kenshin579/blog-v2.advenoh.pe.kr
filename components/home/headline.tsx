type Props = {
  totalCount: number;
};

export function Headline({ totalCount }: Props) {
  return (
    <section className="mx-auto max-w-canvas px-6 pb-10 pt-6 md:px-10">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-bento-dim">
        Field notes from a working engineer
      </p>
      <h1 className="mt-4 text-[56px] font-bold leading-[0.95] tracking-tightest md:text-[88px]">
        Field notes <span className="headline-hi">from</span> a working engineer.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-bento-dim md:text-lg">
        Cloud · Java · Go · Database · {totalCount}편 누적.
      </p>
    </section>
  );
}
