// Category page — 한 카테고리(예: Cloud)의 모든 글
function CategoryPage() {
  const articles = window.SAMPLE_ARTICLES;
  const categories = window.CATEGORIES;
  const cat = "Cloud";
  const catCount = 26;
  const catArticles = articles.filter(a => a.category === cat);
  // pad with cloud-y mock articles
  const mockExtra = [
    { slug: "aws-lambda-cold-start", category: "Cloud", title: "AWS Lambda Cold Start 줄이기 — 실전 7가지 방법", date: "2025-12-22", excerpt: "프로비저닝 동시성, SnapStart, 패키지 다이어트까지. 콜드 스타트를 1초에서 200ms로.", tags: ["aws", "lambda", "performance"], readTime: 11 },
    { slug: "gcp-vs-aws-iam", category: "Cloud", title: "GCP vs AWS IAM — 같은 듯 다른 권한 모델", date: "2025-12-08", excerpt: "Resource policy, IAM Role, Service Account의 매핑. 멀티 클라우드에서 헷갈리지 않는 법.", tags: ["gcp", "aws", "iam"], readTime: 9 },
    { slug: "ecs-fargate-깊이-있게", category: "Cloud", title: "ECS Fargate 깊이 있게 — 컨테이너 오케스트레이션의 다른 길", date: "2025-11-24", excerpt: "Kubernetes만이 답은 아닙니다. 운영이 단순해지는 Fargate 활용법.", tags: ["ecs", "fargate", "container"], readTime: 14 },
    { slug: "argo-cd-실전-운영", category: "Cloud", title: "Argo CD 실전 운영 — GitOps의 표준이 된 이유", date: "2025-11-10", excerpt: "Sync wave, App of Apps, secret 관리까지. 실 서비스에서 검증된 패턴.", tags: ["argocd", "gitops", "kubernetes"], readTime: 16 },
    { slug: "cloudflare-workers-edge", category: "Cloud", title: "Cloudflare Workers로 엣지 함수 만들기", date: "2025-10-27", excerpt: "V8 isolate, KV, D1까지. 글로벌 엣지에서 돌리는 가벼운 API.", tags: ["cloudflare", "edge", "serverless"], readTime: 8 },
  ];
  const list = [...catArticles, ...mockExtra].slice(0, 8);

  const C = window.useBentoTokens();
  const sansHead = C.sansHead;
  const tints = [C.sage, C.butter, C.rose, C.lavender];

  return (
    <div style={{ width: "100%", minHeight: "100%", background: C.bg, color: C.ink, fontFamily: sansHead, padding: "32px 40px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 28px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>frank<span style={{ color: C.dim }}>.blog</span></div>
        </div>
        <nav style={{ display: "flex", gap: 4, padding: 4, background: "rgba(15,15,15,0.06)", borderRadius: 999 }}>
          {[["Home"], ["Posts", true], ["Series"], ["Tags"]].map(([n, a]) => (
            <a key={n} href="#" style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: a ? "white" : C.ink, background: a ? C.ink : "transparent", textDecoration: "none" }}>{n}</a>
          ))}
        </nav>
        <button style={{ padding: "8px 18px", borderRadius: 999, background: C.ink, color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>RSS</button>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 4px 16px", fontSize: 13, color: C.dim, display: "flex", gap: 8 }}>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Home</a><span>/</span>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Posts</a><span>/</span>
        <span style={{ color: C.accent, fontWeight: 500 }}>{cat}</span>
      </div>

      {/* Hero — 카테고리 큰 카드 + 사이드 sub categories */}
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        <div style={{ background: C.ink, color: "white", borderRadius: 32, padding: "44px 48px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -120, right: -120, width: 420, height: 420, borderRadius: 999, background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)`, opacity: 0.55 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Category</div>
            <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "16px 0 16px" }}>{cat}.</div>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: "0 0 28px", maxWidth: 480 }}>
              AWS · GCP · Kubernetes · Terraform. 운영 가능한 인프라를 짓는 데 필요한 모든 것.
            </p>
            <div style={{ display: "flex", gap: 24, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <span><strong style={{ color: "white", fontSize: 16 }}>{catCount}</strong> 편</span>
              <span><strong style={{ color: "white", fontSize: 16 }}>3</strong> 시리즈</span>
              <span><strong style={{ color: "white", fontSize: 16 }}>2018–</strong></span>
            </div>
          </div>
        </div>

        {/* Sub categories pile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.cream, borderRadius: 24, padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.dim, marginBottom: 12 }}>Other categories</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categories.filter(c => c.name !== cat).map(c => (
                <a key={c.name} href="#" style={{ padding: "8px 14px", borderRadius: 999, background: "rgba(15,15,15,0.06)", fontSize: 13, color: C.ink, textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {c.name} <span style={{ color: C.dim, fontSize: 11 }}>{c.count}</span>
                </a>
              ))}
            </div>
          </div>
          <div style={{ background: C.butter, borderRadius: 24, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ink, opacity: 0.6, marginBottom: 8 }}>In this category</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 14 }}>주요 시리즈</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["Terraform 완벽 가이드", 5], ["Kubernetes 운영 노트", 4], ["AWS 입문", 3]].map(([t, n]) => (
                <a key={t} href="#" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(15,15,15,0.1)", fontSize: 14, color: C.ink, textDecoration: "none" }}>
                  <span>{t}</span><span style={{ color: C.dim, fontSize: 12 }}>{n}편</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ maxWidth: 1280, margin: "32px auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: C.dim }}><strong style={{ color: C.ink, fontSize: 18 }}>{catCount}</strong> 편의 글</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Latest", "Popular", "Series"].map((n, i) => (
            <button key={n} style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, border: "none", background: i === 0 ? C.ink : "rgba(15,15,15,0.06)", color: i === 0 ? "white" : C.ink, cursor: "pointer" }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Articles grid — Bento varied sizes */}
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "minmax(120px, auto)", gap: 16 }}>
        {list.map((a, i) => {
          // Vary span: first wide, then mix
          const span = i === 0 ? 12 : (i % 5 === 1 ? 7 : i % 5 === 2 ? 5 : i % 5 === 3 ? 4 : i % 5 === 4 ? 4 : 4);
          const rowSpan = i === 0 ? 2 : 2;
          const tint = i === 0 ? C.ink : tints[i % tints.length];
          const isDark = i === 0;
          return (
            <a key={a.slug} href="#" style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}`, background: tint, color: isDark ? "white" : C.ink, borderRadius: 24, padding: 24, textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: i === 0 ? 240 : 180 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : C.dim, marginBottom: 12 }}>{cat} · {window.formatDate(a.date)}</div>
                <h3 style={{ fontSize: i === 0 ? 36 : (span >= 7 ? 26 : 20), fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, color: isDark ? "white" : C.ink }}>{a.title}</h3>
                {(i === 0 || span >= 7) && (
                  <p style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.75)" : C.dim, lineHeight: 1.55, margin: "12px 0 0", maxWidth: 540 }}>{a.excerpt}</p>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,15,15,0.06)" }}>#{t}</span>)}
                </div>
                <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.7)" : C.dim, fontWeight: 500 }}>{a.readTime}m →</span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ maxWidth: 1280, margin: "32px auto 0", display: "flex", justifyContent: "center", gap: 6 }}>
        {[1, 2, 3, 4].map(n => (
          <button key={n} style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: n === 1 ? C.ink : "rgba(15,15,15,0.06)", color: n === 1 ? "white" : C.ink, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{n}</button>
        ))}
        <button style={{ padding: "0 16px", height: 36, borderRadius: 999, border: "none", background: "rgba(15,15,15,0.06)", color: C.ink, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Next →</button>
      </div>
    </div>
  );
}

// Series page — 한 시리즈의 진행도 + 모든 편
function SeriesPage() {
  const articles = window.SAMPLE_ARTICLES;
  const seriesName = "Golang Concurrency";
  const seriesArticles = [
    { num: 1, title: "Goroutine 기초 — 가벼운 스레드의 정체", date: "2026-03-14", readTime: 10, status: "done", excerpt: "OS 스레드와 goroutine의 차이, M:N 스케줄링이 뭔지 그림으로 정리합니다." },
    { num: 2, title: "Channel 완전 정복", date: "2026-03-28", readTime: 14, status: "done", excerpt: "버퍼 채널, 단방향 채널, close 시그널까지. 실무에서 자주 마주치는 채널 패턴을 코드로 분해해봅니다.", current: true },
    { num: 3, title: "Select / sync 패턴", date: "Coming up", readTime: 12, status: "next", excerpt: "select가 만드는 비결정적 분기와 sync 패키지의 mutex/once/cond/pool. 언제 채널 대신 sync를 쓸지." },
    { num: 4, title: "Context 사용법 — 취소와 시한", date: "TBD", readTime: 9, status: "planned", excerpt: "context.Context로 취소 시그널과 데드라인을 함께 흘리기. cancel을 까먹으면 생기는 누수." },
    { num: 5, title: "실전 패턴: Worker Pool, Pipeline", date: "TBD", readTime: 16, status: "planned", excerpt: "현실의 동시성 문제를 다루는 두 가지 패턴 — fan-out/fan-in과 단계 파이프라인." },
  ];

  const C = window.useBentoTokens();
  const sansHead = C.sansHead;

  const doneCount = seriesArticles.filter(a => a.status === "done").length;
  const progress = (doneCount / seriesArticles.length) * 100;

  return (
    <div style={{ width: "100%", minHeight: "100%", background: C.bg, color: C.ink, fontFamily: sansHead, padding: "32px 40px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 28px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>frank<span style={{ color: C.dim }}>.blog</span></div>
        </div>
        <nav style={{ display: "flex", gap: 4, padding: 4, background: "rgba(15,15,15,0.06)", borderRadius: 999 }}>
          {[["Home"], ["Posts"], ["Series", true], ["Tags"]].map(([n, a]) => (
            <a key={n} href="#" style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: a ? "white" : C.ink, background: a ? C.ink : "transparent", textDecoration: "none" }}>{n}</a>
          ))}
        </nav>
        <button style={{ padding: "8px 18px", borderRadius: 999, background: C.ink, color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>RSS</button>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 4px 16px", fontSize: 13, color: C.dim, display: "flex", gap: 8 }}>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Home</a><span>/</span>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Series</a><span>/</span>
        <span style={{ color: C.accent, fontWeight: 500 }}>{seriesName}</span>
      </div>

      {/* Hero — 시리즈 카드 + 진행도 */}
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ background: C.lavender, borderRadius: 32, padding: "44px 48px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink, opacity: 0.6 }}>Series · Go</div>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "16px 0 18px" }}>{seriesName}.</div>
            <p style={{ fontSize: 18, color: C.ink, opacity: 0.75, lineHeight: 1.55, margin: "0 0 28px", maxWidth: 600 }}>
              Go의 동시성 모델을 처음부터. goroutine과 channel이 무엇인지부터 worker pool 같은 실무 패턴까지, 다섯 편으로 정리합니다.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="#" style={{ padding: "12px 22px", borderRadius: 999, background: C.ink, color: "white", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>처음부터 읽기 →</a>
              <a href="#" style={{ padding: "12px 22px", borderRadius: 999, background: "rgba(15,15,15,0.08)", color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>이어 읽기 (2편)</a>
            </div>
          </div>
          {/* Progress dial */}
          <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 24, padding: 24, textAlign: "center" }}>
            <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 14px" }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(15,15,15,0.1)" strokeWidth="12" />
                <circle cx="80" cy="80" r="68" fill="none" stroke={C.accent} strokeWidth="12" strokeDasharray={`${(progress / 100) * 427} 427`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 80 80)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>{doneCount}/{seriesArticles.length}</div>
                <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>편</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{Math.round(progress)}% 발행 완료</div>
          </div>
        </div>
      </div>

      {/* Series episodes — vertical timeline */}
      <div style={{ maxWidth: 980, margin: "48px auto 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>편별 목록</h3>
          <div style={{ fontSize: 13, color: C.dim }}>2편 발행 · 3편 예정</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {seriesArticles.map((a, i) => {
            const isDone = a.status === "done";
            const isCurrent = a.current;
            const isNext = a.status === "next";
            const dotColor = isDone ? (isCurrent ? C.accent : C.ink) : (isNext ? C.butter : "rgba(15,15,15,0.1)");
            const dotText = isDone ? (isCurrent ? "★" : "✓") : a.num;
            const cardBg = isCurrent ? C.butter : (isDone ? C.card : "transparent");
            const cardBorder = !isDone && !isNext ? "1px dashed rgba(15,15,15,0.2)" : "none";
            return (
              <div key={a.num} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 20 }}>
                {/* Timeline column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: dotColor, color: isDone || isNext ? (isCurrent ? "white" : "white") : C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {dotText}
                  </div>
                  {i < seriesArticles.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: isDone ? C.ink : "rgba(15,15,15,0.1)", marginTop: 4, minHeight: 60 }} />
                  )}
                </div>
                {/* Content */}
                <a href="#" style={{ display: "block", padding: 22, borderRadius: 20, background: cardBg, border: cardBorder, textDecoration: "none", color: C.ink, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.dim, letterSpacing: "0.05em", marginBottom: 8 }}>
                    <span>EP {String(a.num).padStart(2, "0")}</span>
                    <span>·</span>
                    <span>{a.date}</span>
                    {isCurrent && <span style={{ padding: "2px 10px", borderRadius: 999, background: C.accent, color: "white", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>READING</span>}
                    {isNext && <span style={{ padding: "2px 10px", borderRadius: 999, background: C.ink, color: "white", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>NEXT UP</span>}
                  </div>
                  <h4 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 8px", color: isDone ? C.ink : (isNext ? C.ink : C.dim) }}>{a.title}</h4>
                  <p style={{ fontSize: 14.5, color: isDone ? C.dim : (isNext ? C.dim : "rgba(15,15,15,0.4)"), lineHeight: 1.6, margin: "0 0 10px" }}>{a.excerpt}</p>
                  {isDone && (
                    <div style={{ fontSize: 12, color: C.dim, display: "flex", gap: 12 }}>
                      <span>{a.readTime} min read</span>
                      <span style={{ color: C.accent, fontWeight: 500 }}>읽기 →</span>
                    </div>
                  )}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Other series */}
      <div style={{ maxWidth: 1280, margin: "64px auto 0" }}>
        <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 18px" }}>다른 시리즈</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { name: "Terraform 완벽 가이드", count: 5, done: 5, tint: C.sage },
            { name: "MQTT v5", count: 4, done: 1, tint: C.rose },
            { name: "Spring Boot 입문", count: 6, done: 4, tint: C.butter },
          ].map((s) => (
            <a key={s.name} href="#" style={{ padding: 22, background: s.tint, borderRadius: 24, textDecoration: "none", color: C.ink, display: "flex", flexDirection: "column", gap: 14, minHeight: 160 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ink, opacity: 0.6 }}>Series</div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{s.name}</div>
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 6, background: "rgba(15,15,15,0.1)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${(s.done / s.count) * 100}%`, height: "100%", background: C.ink }} />
                  </div>
                  <span style={{ color: C.dim, fontSize: 12 }}>{s.done}/{s.count}</span>
                </div>
                <span style={{ color: C.ink, fontWeight: 500 }}>→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

window.CategoryPage = CategoryPage;
window.SeriesPage = SeriesPage;
