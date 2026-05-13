// Article reading page — Bento aesthetic carried into long-form
// Layout: Bento card hero + body 720px + right sticky TOC 240px
// Dark code blocks with filename tab + copy button
// End: series nav → prev/next → related posts (Bento cards)
function ArticlePage() {
  const articles = window.SAMPLE_ARTICLES;
  const article = articles[2]; // Golang Concurrency 2 — has series
  const seriesArticles = articles.filter(a => a.series === article.series).sort((a, b) => a.seriesOrder - b.seriesOrder);

  const C0 = window.useBentoTokens();
  const C = { ...C0, codeBg: C0.dark ? "#0A0908" : "#0F0F0F", codeText: "#E8E6E1", codeMuted: "#7A7770" };

  const sansHead = C.sansHead;
  const sansBody = C.sansBody;
  const mono = C.mono;

  // Mock TOC
  const toc = [
    { id: "intro", text: "들어가며", level: 1, active: false },
    { id: "channel-basics", text: "채널의 기본", level: 1, active: true },
    { id: "buffered", text: "버퍼 채널 vs 비버퍼", level: 2, active: false },
    { id: "directional", text: "단방향 채널", level: 2, active: false },
    { id: "patterns", text: "실무 패턴", level: 1, active: false },
    { id: "fan-out", text: "Fan-out / Fan-in", level: 2, active: false },
    { id: "close-signal", text: "close 시그널", level: 2, active: false },
    { id: "pitfalls", text: "흔한 실수", level: 1, active: false },
    { id: "wrap", text: "정리", level: 1, active: false },
  ];

  const codeSample = `// fan-out 패턴: 여러 worker가 같은 채널에서 작업을 가져간다
func fanOut(jobs <-chan Job, workers int) <-chan Result {
    results := make(chan Result, workers)
    var wg sync.WaitGroup

    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for job := range jobs {
                results <- process(id, job)
            }
        }(i)
    }

    go func() {
        wg.Wait()
        close(results) // 모든 worker가 끝나면 채널 닫기
    }()

    return results
}`;

  return (
    <div style={{ width: "100%", minHeight: "100%", background: C.bg, color: C.ink, fontFamily: sansBody, padding: "32px 40px 80px" }}>
      {/* Header — same as home */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 28px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, fontFamily: sansHead }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>frank<span style={{ color: C.dim }}>.blog</span></div>
        </div>
        <nav style={{ display: "flex", gap: 4, padding: 4, background: "rgba(15,15,15,0.06)", borderRadius: 999 }}>
          {[["Home"], ["Posts", true], ["Series"], ["Tags"]].map(([n, a]) => (
            <a key={n} href="#" style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: a ? "white" : C.ink, background: a ? C.ink : "transparent", textDecoration: "none" }}>{n}</a>
          ))}
        </nav>
        <button style={{ padding: "8px 18px", borderRadius: 999, background: C.ink, color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>RSS</button>
      </header>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 4px 16px", fontSize: 13, color: C.dim, display: "flex", gap: 8, alignItems: "center" }}>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Home</a>
        <span>/</span>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Series</a>
        <span>/</span>
        <a href="#" style={{ color: C.accent, textDecoration: "none", fontWeight: 500 }}>{article.series}</a>
      </div>

      {/* Hero card — Bento style */}
      <article style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ background: C.ink, color: "white", borderRadius: 32, padding: "44px 48px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: 999, background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)`, opacity: 0.5 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", marginBottom: 20 }}>
              <span style={{ padding: "4px 12px", borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "white" }}>{article.category}</span>
              <span style={{ padding: "4px 12px", borderRadius: 999, background: C.accent, color: "white", fontWeight: 600 }}>SERIES · {article.seriesOrder}/{seriesArticles.length || 4}</span>
              <span>·</span>
              <span>{window.formatDate(article.date)}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontFamily: mono, letterSpacing: "0.02em" }}>
              {article.series}
            </div>
            <h1 style={{ fontFamily: sansHead, fontSize: 56, fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", margin: "0 0 20px", maxWidth: 900 }}>
              {article.title}
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", lineHeight: 1.55, margin: "0 0 28px", maxWidth: 720 }}>
              {article.excerpt}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: C.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>F</div>
              <span style={{ color: "white", fontWeight: 500 }}>Frank Advenoh</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>·</span>
              <div style={{ display: "flex", gap: 8 }}>
                {article.tags.map(t => <span key={t} style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>#{t}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Body + TOC */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 56, marginTop: 48 }}>
          {/* BODY */}
          <div style={{ maxWidth: 720, fontSize: 17, lineHeight: 1.75, color: C.ink }}>
            <p style={{ margin: "0 0 24px", fontSize: 19, color: C.ink, fontWeight: 400, letterSpacing: "-0.005em" }}>
              버퍼 채널, 단방향 채널, close 시그널까지. 실무에서 자주 마주치는 채널 패턴을 코드로 분해해봅니다.
              이 글은 <strong style={{ background: `linear-gradient(180deg, transparent 60%, ${C.butter} 60%)`, padding: "0 2px" }}>Golang Concurrency 시리즈의 두 번째 편</strong>으로, 1편에서 다룬 goroutine을 알고 있다는 가정으로 시작합니다.
            </p>

            <h2 id="channel-basics" style={{ fontFamily: sansHead, fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "48px 0 16px" }}>채널의 기본</h2>
            <p style={{ margin: "0 0 20px" }}>
              Go의 채널은 goroutine 간 통신을 위한 first-class 시민입니다. "Don't communicate by sharing memory; share memory by communicating" — 공식 격언이 말하듯이, mutex로 공유 상태를 지키는 대신 채널로 데이터를 주고받는 패턴이 권장됩니다.
            </p>

            <h3 id="buffered" style={{ fontFamily: sansHead, fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "36px 0 12px" }}>버퍼 채널 vs 비버퍼</h3>
            <p style={{ margin: "0 0 20px" }}>
              <code style={{ fontFamily: mono, fontSize: 15, padding: "2px 8px", borderRadius: 6, background: "rgba(15,15,15,0.06)", color: C.ink }}>make(chan int)</code>은 비버퍼, <code style={{ fontFamily: mono, fontSize: 15, padding: "2px 8px", borderRadius: 6, background: "rgba(15,15,15,0.06)", color: C.ink }}>make(chan int, 10)</code>은 버퍼 10인 채널입니다. 비버퍼는 송신과 수신이 동시에 일어나는 rendezvous 방식이라, send/receive가 만나는 순간까지 한쪽이 block됩니다.
            </p>

            {/* Pull quote — Bento accent */}
            <blockquote style={{ margin: "40px -8px", padding: "24px 32px", background: C.butter, borderRadius: 20, fontFamily: sansHead, fontSize: 22, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-0.015em", color: C.ink, position: "relative" }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", position: "absolute", top: -4, left: 18, fontSize: 80, lineHeight: 1, color: C.ink, opacity: 0.18 }}>"</div>
              버퍼 크기는 throughput을 위한 것이지, 동기화를 위한 것이 아닙니다. 버퍼로 race를 숨기지 마세요.
            </blockquote>

            <h3 id="directional" style={{ fontFamily: sansHead, fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "36px 0 12px" }}>단방향 채널</h3>
            <p style={{ margin: "0 0 20px" }}>
              함수 시그니처에 <code style={{ fontFamily: mono, fontSize: 15, padding: "2px 8px", borderRadius: 6, background: "rgba(15,15,15,0.06)", color: C.ink }}>chan&lt;- T</code> (송신 전용) 또는 <code style={{ fontFamily: mono, fontSize: 15, padding: "2px 8px", borderRadius: 6, background: "rgba(15,15,15,0.06)", color: C.ink }}>&lt;-chan T</code> (수신 전용)을 명시하면, 의도와 다른 사용을 컴파일 타임에 막을 수 있습니다.
            </p>

            <h2 id="patterns" style={{ fontFamily: sansHead, fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "48px 0 16px" }}>실무 패턴</h2>

            <h3 id="fan-out" style={{ fontFamily: sansHead, fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "36px 0 12px" }}>Fan-out / Fan-in</h3>
            <p style={{ margin: "0 0 20px" }}>
              여러 worker가 같은 입력 채널에서 작업을 꺼내가는 fan-out 패턴은 CPU-bound 작업에서 가장 자주 쓰입니다.
            </p>

            {/* Code block — dark with filename tab */}
            <div style={{ margin: "24px 0 32px", borderRadius: 16, overflow: "hidden", background: C.codeBg, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FF5F57" }} />
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FEBC2E" }} />
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: "#28C840" }} />
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 12, color: C.codeMuted, marginLeft: 8 }}>fanout.go</span>
                </div>
                <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: C.codeMuted, fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: mono, letterSpacing: "0.05em" }}>COPY</button>
              </div>
              <pre style={{ margin: 0, padding: "20px 24px", fontFamily: mono, fontSize: 13.5, lineHeight: 1.7, color: C.codeText, overflowX: "auto", whiteSpace: "pre" }}>
                <code dangerouslySetInnerHTML={{ __html: codeSample
                  .replace(/(\/\/[^\n]*)/g, '<span style="color:#7A7770">$1</span>')
                  .replace(/\b(func|var|for|go|defer|return|range|chan|make|close)\b/g, '<span style="color:#FF8B60">$1</span>')
                  .replace(/\b(int|Job|Result)\b/g, '<span style="color:#9DCFFF">$1</span>')
                  .replace(/\b(sync|wg)\b/g, '<span style="color:#C29DFF">$1</span>')
                }} />
              </pre>
            </div>

            <h3 id="close-signal" style={{ fontFamily: sansHead, fontSize: 22, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "36px 0 12px" }}>close 시그널</h3>
            <p style={{ margin: "0 0 20px" }}>
              송신자만 close해야 합니다. 수신자가 close하거나, 두 송신자가 동시에 close하면 panic이 납니다. 동시 송신자가 여러 개라면 <code style={{ fontFamily: mono, fontSize: 15, padding: "2px 8px", borderRadius: 6, background: "rgba(15,15,15,0.06)", color: C.ink }}>sync.WaitGroup</code>으로 모든 송신이 끝난 시점을 잡아 그때 close하는 패턴이 안전합니다.
            </p>

            {/* Callout / info card */}
            <aside style={{ margin: "32px 0", padding: "20px 24px", background: C.lavender, borderRadius: 20, display: "flex", gap: 16 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 999, background: C.ink, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sansHead, fontWeight: 700, fontSize: 18 }}>!</div>
              <div>
                <div style={{ fontFamily: sansHead, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Pitfall</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: C.ink }}>
                  <code style={{ fontFamily: mono, fontSize: 13, padding: "1px 6px", borderRadius: 4, background: "rgba(15,15,15,0.08)" }}>nil</code> 채널에 send/receive하면 영원히 block됩니다. select의 한 case를 비활성화하는 트릭으로 쓰일 수 있지만, 의도하지 않은 nil은 데드락의 단골입니다.
                </div>
              </div>
            </aside>

            <h2 id="pitfalls" style={{ fontFamily: sansHead, fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "48px 0 16px" }}>흔한 실수</h2>
            <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none" }}>
              {[
                "수신자가 채널을 close — panic",
                "이미 닫힌 채널에 send — panic",
                "버퍼로 race condition을 숨기기 — 디버깅이 어려워짐",
                "select 안에서 default를 남발 — busy loop",
              ].map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(15,15,15,0.08)" : "none", fontSize: 16 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, background: C.rose, color: C.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                  <span style={{ lineHeight: 1.6 }}>{t}</span>
                </li>
              ))}
            </ul>

            <h2 id="wrap" style={{ fontFamily: sansHead, fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "48px 0 16px" }}>정리</h2>
            <p style={{ margin: "0 0 20px" }}>
              채널은 단순한 자료구조가 아니라 동기화 도구입니다. 다음 편에서는 select와 sync 패키지를 결합해 더 복잡한 동시성 시나리오를 다뤄보겠습니다.
            </p>

            {/* Tags + meta footer */}
            <div style={{ marginTop: 56, padding: "20px 0", borderTop: `1px solid rgba(15,15,15,0.1)`, borderBottom: `1px solid rgba(15,15,15,0.1)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {article.tags.map(t => <a key={t} href="#" style={{ padding: "5px 12px", borderRadius: 999, fontSize: 13, background: "rgba(15,15,15,0.06)", color: C.ink, textDecoration: "none" }}>#{t}</a>)}
              </div>
              <div style={{ fontSize: 13, color: C.dim }}>
                {window.formatDate(article.date)} · {article.readTime} min read
              </div>
            </div>
          </div>

          {/* TOC — sticky */}
          <aside style={{ position: "relative" }}>
            <div style={{ position: "sticky", top: 24 }}>
              <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Contents</div>
              <nav style={{ display: "flex", flexDirection: "column", gap: 2, borderLeft: `1px solid rgba(15,15,15,0.1)` }}>
                {toc.map(t => (
                  <a key={t.id} href={`#${t.id}`} style={{
                    padding: t.level === 2 ? "5px 0 5px 28px" : "6px 0 6px 14px",
                    fontSize: t.level === 2 ? 12.5 : 13.5,
                    fontWeight: t.active ? 600 : 400,
                    color: t.active ? C.accent : (t.level === 2 ? C.dim : C.ink),
                    textDecoration: "none",
                    borderLeft: t.active ? `2px solid ${C.accent}` : "2px solid transparent",
                    marginLeft: -1,
                    lineHeight: 1.4,
                  }}>{t.text}</a>
                ))}
              </nav>

              {/* Mini reading progress */}
              <div style={{ marginTop: 32, padding: "16px 18px", background: C.card, borderRadius: 16, fontSize: 12, color: C.dim }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span>Reading</span>
                  <span style={{ color: C.ink, fontWeight: 600 }}>32%</span>
                </div>
                <div style={{ height: 4, background: "rgba(15,15,15,0.08)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: "32%", height: "100%", background: C.accent, borderRadius: 999 }} />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Series navigation — Bento card */}
        <section style={{ marginTop: 80, padding: 28, background: C.lavender, borderRadius: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Series</div>
              <div style={{ fontFamily: sansHead, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4 }}>{article.series}</div>
            </div>
            <a href="#" style={{ fontSize: 13, color: C.ink, textDecoration: "none", fontWeight: 500 }}>전체 시리즈 보기 →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {["Goroutine 기초", "Channel 완전 정복", "Select / sync 패턴", "Context 사용법"].map((p, i) => {
              const isCurrent = i + 1 === article.seriesOrder;
              const isDone = i + 1 < article.seriesOrder;
              return (
                <a key={i} href="#" style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: isCurrent ? "rgba(15,15,15,0.08)" : "transparent",
                  textDecoration: "none", color: C.ink,
                  fontSize: 15,
                  fontWeight: isCurrent ? 600 : 400,
                }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, background: isCurrent ? C.accent : (isDone ? C.ink : "rgba(15,15,15,0.1)"), color: isDone || isCurrent ? "white" : C.dim, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span style={{ flex: 1 }}>{p}</span>
                  {isCurrent && <span style={{ fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: "0.08em" }}>READING</span>}
                </a>
              );
            })}
          </div>
        </section>

        {/* Prev / Next nav */}
        <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <a href="#" style={{ padding: 24, background: C.card, borderRadius: 24, textDecoration: "none", color: C.ink, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>← Previous</div>
            <div style={{ fontFamily: sansHead, fontSize: 18, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>Golang Concurrency 1: Goroutine 기초</div>
            <div style={{ fontSize: 13, color: C.dim }}>2026.03.14 · 10 min</div>
          </a>
          <a href="#" style={{ padding: 24, background: C.ink, color: "white", borderRadius: 24, textDecoration: "none", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end", textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Next →</div>
            <div style={{ fontFamily: sansHead, fontSize: 18, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>Golang Concurrency 3: Select / sync 패턴</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Coming up · 12 min</div>
          </a>
        </section>

        {/* Related posts — Bento style cards */}
        <section style={{ marginTop: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontFamily: sansHead, fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>이런 글도 읽어보세요</h3>
            <a href="#" style={{ fontSize: 13, color: C.dim, textDecoration: "none" }}>모든 글 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[articles[0], articles[8], articles[5]].map((a, i) => {
              const tints = [C.rose, C.butter, C.sage];
              return (
                <a key={a.slug} href="#" style={{ padding: 22, background: tints[i], borderRadius: 24, textDecoration: "none", color: C.ink, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 200 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{a.category}</div>
                    <h4 style={{ fontFamily: sansHead, fontSize: 19, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.02em", margin: 0 }}>{a.title}</h4>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 12, color: C.dim }}>
                    <span>{window.formatDate(a.date)}</span>
                    <span style={{ color: C.ink, fontWeight: 500 }}>{a.readTime}m →</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </article>
    </div>
  );
}

window.ArticlePage = ArticlePage;
