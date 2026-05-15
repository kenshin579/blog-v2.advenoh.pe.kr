// Mobile (390px) variants of all four pages.
// Bento aesthetic preserved but stacked into a single column.
//
// M_COLORS is a getter that re-reads bento tokens on every access — so
// even though component bodies reference M_COLORS.bg etc, dark-mode and
// accent-color tweaks flow through. Tokens come from the Provider in HTML.

let __mobileTokens = null;
function _resolveMobileTokens() {
  // If Provider is set up, components call useBentoTokens() before render and
  // we cache the result. But many call sites use M_COLORS at function-body
  // top level (synchronously during render), so we expose a hook + getter.
  return __mobileTokens || window.buildBentoTokens({ accent: "orange", dark: false, radius: 24, fontScale: 1 });
}
const M_COLORS = new Proxy({}, {
  get(_t, key) { return _resolveMobileTokens()[key]; }
});
const M_SANS = "'Pretendard Variable', Pretendard, system-ui, sans-serif";
const M_SERIF = "'Instrument Serif', Georgia, serif";

function _useMobileTokens() {
  const t = window.useBentoTokens();
  __mobileTokens = t;
  return t;
}

function MobileShell({ children, scrollHeight = 1800 }) {
  _useMobileTokens();
  return (
    <div style={{ width: 390, minHeight: scrollHeight, background: M_COLORS.bg, color: M_COLORS.ink, fontFamily: M_SANS, position: "relative", overflow: "hidden" }}>
      {children}
    </div>
  );
}

function MobileTopBar({ active = "Home" }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(242,239,234,0.9)", backdropFilter: "blur(12px)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(15,15,15,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: M_COLORS.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>F</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>frank<span style={{ color: M_COLORS.dim }}>.blog</span></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button aria-label="search" style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: "rgba(15,15,15,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        </button>
        <button aria-label="menu" style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: M_COLORS.ink, color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="13" x2="20" y2="13"/><line x1="4" y1="19" x2="14" y2="19"/></svg>
        </button>
      </div>
    </header>
  );
}

// ------------------ Home ------------------
function MobileHome() {
  _useMobileTokens();
  const articles = window.SAMPLE_ARTICLES;
  const featured = articles[0];
  const series = { name: "Golang Concurrency", count: 5, done: 2 };
  const biweekly = articles.slice(1, 5);
  const recent = articles.slice(5, 9);
  const cats = window.CATEGORIES.slice(0, 6);

  return (
    <MobileShell scrollHeight={2400}>
      <MobileTopBar active="Home" />

      {/* Headline */}
      <section style={{ padding: "28px 20px 24px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: M_COLORS.dim, marginBottom: 12 }}>Field notes from a working engineer</div>
        <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.035em", margin: 0 }}>
          Field notes <span style={{ fontFamily: M_SERIF, fontStyle: "italic", fontWeight: 400, background: M_COLORS.butter, padding: "0 6px", borderRadius: 4 }}>from</span> a working engineer.
        </h1>
        <p style={{ fontSize: 14, color: M_COLORS.dim, lineHeight: 1.55, margin: "16px 0 0" }}>
          Cloud · JVM · Go · Database. 격주로 발행. 178편 누적.
        </p>
      </section>

      {/* Featured card */}
      <section style={{ padding: "0 20px" }}>
        <a href="#" style={{ display: "block", background: M_COLORS.ink, color: "white", borderRadius: 24, padding: 24, textDecoration: "none", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: 999, background: `radial-gradient(circle, ${M_COLORS.accent} 0%, transparent 70%)`, opacity: 0.5 }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ padding: "3px 10px", borderRadius: 999, background: M_COLORS.accent, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>FEATURED</span>
              <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontSize: 11 }}>{featured.category}</span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 12px" }}>{featured.title}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: "0 0 18px" }}>{featured.excerpt}</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              <span>{window.formatDate(featured.date)}</span>
              <span>{featured.readTime}m read →</span>
            </div>
          </div>
        </a>
      </section>

      {/* Series spotlight */}
      <section style={{ padding: "16px 20px 0" }}>
        <a href="#" style={{ display: "block", background: M_COLORS.lavender, color: M_COLORS.ink, borderRadius: 24, padding: 22, textDecoration: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M_COLORS.ink, opacity: 0.6 }}>Active Series</div>
            <div style={{ fontSize: 12, color: M_COLORS.dim }}>{series.done}/{series.count}</div>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 14px" }}>{series.name}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[1,2,3,4,5].map(n => {
              const isDone = n <= series.done;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderTop: n > 1 ? "1px solid rgba(15,15,15,0.08)" : "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, background: isDone ? M_COLORS.ink : "rgba(15,15,15,0.1)", color: isDone ? "white" : M_COLORS.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{isDone ? "✓" : n}</div>
                  <div style={{ fontSize: 13, color: isDone ? M_COLORS.ink : M_COLORS.dim, flex: 1 }}>{n === 1 ? "Goroutine 기초" : n === 2 ? "Channel 완전 정복" : n === 3 ? "Select / sync 패턴" : n === 4 ? "Context 사용법" : "실전 패턴 — Worker Pool"}</div>
                </div>
              );
            })}
          </div>
        </a>
      </section>

      {/* Biweekly */}
      <section style={{ padding: "16px 20px 0" }}>
        <div style={{ background: M_COLORS.accent, color: "white", borderRadius: 24, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>Biweekly</h3>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75 }}>매 격주 화요일</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {biweekly.map((a, i) => (
              <a key={a.slug} href="#" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.18)" : "none", textDecoration: "none", color: "white" }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: "rgba(255,255,255,0.18)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>{window.formatDate(a.date)} · {a.readTime}m</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Recent — 2-col mini bento */}
      <section style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Recent</h3>
          <a href="#" style={{ fontSize: 13, color: M_COLORS.accent, textDecoration: "none", fontWeight: 500 }}>전체 →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {recent.map((a, i) => {
            const tints = [M_COLORS.sage, M_COLORS.butter, M_COLORS.rose, M_COLORS.cream];
            return (
              <a key={a.slug} href="#" style={{ background: tints[i % 4], padding: 16, borderRadius: 18, textDecoration: "none", color: M_COLORS.ink, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 130 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: M_COLORS.dim, marginBottom: 6 }}>{a.category}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>{a.title.length > 40 ? a.title.slice(0, 40) + "…" : a.title}</div>
                </div>
                <div style={{ fontSize: 10, color: M_COLORS.dim, marginTop: 10 }}>{a.readTime}m</div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "20px 20px 32px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 12px" }}>Browse by topic</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cats.map(c => (
            <a key={c.name} href="#" style={{ padding: "9px 14px", borderRadius: 999, background: M_COLORS.card, fontSize: 13, color: M_COLORS.ink, textDecoration: "none", display: "inline-flex", gap: 8, alignItems: "center" }}>
              {c.name} <span style={{ color: M_COLORS.dim, fontSize: 11 }}>{c.count}</span>
            </a>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

// ------------------ Article ------------------
function MobileArticle() {
  _useMobileTokens();
  return (
    <MobileShell scrollHeight={2600}>
      <MobileTopBar />

      {/* Reading progress bar */}
      <div style={{ position: "sticky", top: 60, height: 3, background: "rgba(15,15,15,0.06)", zIndex: 9 }}>
        <div style={{ width: "32%", height: "100%", background: M_COLORS.accent }} />
      </div>

      {/* Hero card */}
      <section style={{ padding: "20px" }}>
        <div style={{ background: M_COLORS.lavender, borderRadius: 24, padding: 22 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(15,15,15,0.08)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Series · Go</span>
            <span style={{ padding: "3px 10px", borderRadius: 999, background: M_COLORS.ink, color: "white", fontSize: 10, fontWeight: 600 }}>EP 02 / 05</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.025em", margin: "0 0 14px" }}>Channel <span style={{ fontFamily: M_SERIF, fontStyle: "italic", fontWeight: 400 }}>완전</span> 정복</h1>
          <p style={{ fontSize: 14, color: M_COLORS.ink, opacity: 0.75, lineHeight: 1.55, margin: "0 0 16px" }}>버퍼 채널, 단방향 채널, close 시그널까지. 실무에서 마주치는 채널 패턴을 코드로 분해합니다.</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(15,15,15,0.1)", fontSize: 12, color: M_COLORS.dim }}>
            <span>Frank Advenoh · 2026.03.28</span>
            <span>14m read</span>
          </div>
        </div>
      </section>

      {/* TOC collapsible */}
      <section style={{ padding: "0 20px 8px" }}>
        <details style={{ background: M_COLORS.card, borderRadius: 16, padding: "12px 16px", border: "1px solid rgba(15,15,15,0.06)" }}>
          <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, cursor: "pointer", listStyle: "none" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: M_COLORS.dim, letterSpacing: "0.08em", textTransform: "uppercase" }}>목차</span>
              <span>5 sections</span>
            </span>
            <span style={{ fontSize: 16, color: M_COLORS.dim }}>↓</span>
          </summary>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(15,15,15,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
            {["1. Channel이란 무엇인가", "2. 버퍼 채널 vs 비버퍼", "3. 단방향 채널", "4. close와 range 패턴", "5. 실수하기 쉬운 함정"].map((t, i) => (
              <a key={t} href="#" style={{ fontSize: 13, color: i === 1 ? M_COLORS.accent : M_COLORS.ink, textDecoration: "none", fontWeight: i === 1 ? 600 : 400, padding: "4px 0" }}>{t}</a>
            ))}
          </div>
        </details>
      </section>

      {/* Body */}
      <article style={{ padding: "16px 24px 32px", fontSize: 16, lineHeight: 1.75, color: "#1F1F1F" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", margin: "16px 0 12px" }}>Channel이란 무엇인가</h2>
        <p style={{ margin: "0 0 18px" }}>Go에서 channel은 goroutine 사이의 통신 수단이자 동기화 도구입니다. 메모리를 공유하는 대신, "통신을 통해 메모리를 공유하라"는 Go의 철학이 가장 잘 드러나는 부분이죠.</p>

        <p style={{ margin: "0 0 18px" }}>채널을 만들 때 두 가지 결정이 따라옵니다 — 어떤 타입을 흘릴지, 그리고 버퍼를 둘지.</p>

        {/* Code block */}
        <div style={{ background: "#1A1815", color: "#E8E6E0", borderRadius: 14, padding: "14px 16px", margin: "0 -4px 18px", fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, lineHeight: 1.55, overflow: "auto" }}>
          <div style={{ color: "#7A7670", fontSize: 10, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>go</div>
          <pre style={{ margin: 0, whiteSpace: "pre" }}>
{`ch := make(chan int)        `}<span style={{ color: "#7A7670" }}>{`// unbuffered`}</span>{`
ch := make(chan int, 10)    `}<span style={{ color: "#7A7670" }}>{`// buffered`}</span>{`

`}<span style={{ color: "#FF8B5C" }}>{`go`}</span>{` `}<span style={{ color: "#A5D6A7" }}>{`func`}</span>{`() {
    ch <- 42
}()
fmt.Println(<-ch)`}
          </pre>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", margin: "20px 0 12px" }}>버퍼 채널 vs 비버퍼</h2>
        <p style={{ margin: "0 0 18px" }}>비버퍼 채널은 송수신이 만나야만 통과합니다. 버퍼 채널은 버퍼가 비어 있는 동안 송신이 대기 없이 진행되죠.</p>

        {/* Pull quote */}
        <blockquote style={{ background: M_COLORS.butter, borderRadius: 16, padding: "20px 22px", margin: "8px -4px 20px", fontFamily: M_SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.4, letterSpacing: "-0.01em", color: M_COLORS.ink }}>
          "Don't communicate by sharing memory; share memory by communicating."
          <div style={{ fontFamily: M_SANS, fontStyle: "normal", fontSize: 12, color: M_COLORS.dim, marginTop: 10 }}>— Go proverb</div>
        </blockquote>

        <p style={{ margin: "0 0 18px" }}>실무에서는 비버퍼 채널을 동기화 신호로, 버퍼 채널을 유한한 큐로 활용하는 패턴이 가장 자주 등장합니다.</p>
      </article>

      {/* Series nav */}
      <section style={{ padding: "0 20px 20px" }}>
        <div style={{ background: M_COLORS.card, borderRadius: 20, padding: 18, border: "1px solid rgba(15,15,15,0.06)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: M_COLORS.dim, marginBottom: 10 }}>Series · Golang Concurrency</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Goroutine 기초", "Channel 완전 정복", "Select / sync 패턴"].map((t, i) => {
              const isCurrent = i === 1;
              return (
                <a key={t} href="#" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, background: isCurrent ? M_COLORS.lavender : "transparent", textDecoration: "none", color: M_COLORS.ink }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: i < 2 ? M_COLORS.ink : "rgba(15,15,15,0.1)", color: i < 2 ? "white" : M_COLORS.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{i < 1 ? "✓" : (isCurrent ? "★" : i+1)}</div>
                  <span style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400 }}>{t}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prev / next */}
      <section style={{ padding: "0 20px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <a href="#" style={{ background: M_COLORS.cream, padding: "16px 14px", borderRadius: 18, textDecoration: "none", color: M_COLORS.ink }}>
          <div style={{ fontSize: 11, color: M_COLORS.dim, marginBottom: 6 }}>← 이전</div>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>Goroutine 기초</div>
        </a>
        <a href="#" style={{ background: M_COLORS.ink, padding: "16px 14px", borderRadius: 18, textDecoration: "none", color: "white" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6, textAlign: "right" }}>다음 →</div>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, textAlign: "right" }}>Select / sync 패턴</div>
        </a>
      </section>
    </MobileShell>
  );
}

// ------------------ Category ------------------
function MobileCategory() {
  _useMobileTokens();
  const cat = "Cloud";
  const list = [
    { slug: "terraform-완벽-가이드", title: "Terraform 완벽 가이드 — 기본부터 GitOps까지", date: "2026-04-08", readTime: 22, tags: ["terraform", "iac"] },
    { slug: "kubernetes-secret", title: "Kubernetes Secret 안전하게 관리하기", date: "2026-03-02", readTime: 11, tags: ["k8s", "security"] },
    { slug: "aws-lambda-cold-start", title: "AWS Lambda Cold Start 줄이기 — 7가지 방법", date: "2025-12-22", readTime: 11, tags: ["aws", "lambda"] },
    { slug: "gcp-vs-aws-iam", title: "GCP vs AWS IAM — 같은 듯 다른 권한 모델", date: "2025-12-08", readTime: 9, tags: ["gcp", "iam"] },
    { slug: "ecs-fargate", title: "ECS Fargate 깊이 있게 — 다른 길의 컨테이너", date: "2025-11-24", readTime: 14, tags: ["ecs", "container"] },
    { slug: "argo-cd", title: "Argo CD 실전 운영 — GitOps의 표준", date: "2025-11-10", readTime: 16, tags: ["argocd", "gitops"] },
  ];
  const tints = [M_COLORS.sage, M_COLORS.butter, M_COLORS.rose, M_COLORS.lavender];
  const otherCats = window.CATEGORIES.filter(c => c.name !== cat);

  return (
    <MobileShell scrollHeight={2300}>
      <MobileTopBar />

      {/* Breadcrumb */}
      <div style={{ padding: "16px 20px 0", fontSize: 12, color: M_COLORS.dim, display: "flex", gap: 6 }}>
        <a href="#" style={{ color: M_COLORS.dim, textDecoration: "none" }}>Home</a><span>/</span>
        <a href="#" style={{ color: M_COLORS.dim, textDecoration: "none" }}>Posts</a><span>/</span>
        <span style={{ color: M_COLORS.accent, fontWeight: 500 }}>{cat}</span>
      </div>

      {/* Hero */}
      <section style={{ padding: "16px 20px 0" }}>
        <div style={{ background: M_COLORS.ink, color: "white", borderRadius: 28, padding: "32px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 280, height: 280, borderRadius: 999, background: `radial-gradient(circle, ${M_COLORS.accent} 0%, transparent 70%)`, opacity: 0.55 }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Category</div>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "10px 0 14px" }}>{cat}.</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: "0 0 20px" }}>AWS · GCP · Kubernetes · Terraform. 운영 가능한 인프라를 짓는 데 필요한 것들.</p>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              <span><strong style={{ color: "white", fontSize: 15 }}>26</strong> 편</span>
              <span><strong style={{ color: "white", fontSize: 15 }}>3</strong> 시리즈</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <section style={{ padding: "20px 20px 8px" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {["Latest", "Popular", "Series"].map((n, i) => (
            <button key={n} style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, border: "none", background: i === 0 ? M_COLORS.ink : "rgba(15,15,15,0.06)", color: i === 0 ? "white" : M_COLORS.ink, cursor: "pointer", flexShrink: 0 }}>{n}</button>
          ))}
        </div>
      </section>

      {/* Article list — full-width cards, varied tints */}
      <section style={{ padding: "8px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((a, i) => {
          const isFirst = i === 0;
          return (
            <a key={a.slug} href="#" style={{ background: isFirst ? M_COLORS.ink : tints[i % tints.length], color: isFirst ? "white" : M_COLORS.ink, padding: 22, borderRadius: 22, textDecoration: "none", display: "block" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: isFirst ? "rgba(255,255,255,0.6)" : M_COLORS.dim, marginBottom: 10 }}>{cat} · {window.formatDate(a.date)}</div>
              <div style={{ fontSize: isFirst ? 22 : 17, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.015em", marginBottom: isFirst ? 12 : 10 }}>{a.title}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.tags.map(t => <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: isFirst ? "rgba(255,255,255,0.12)" : "rgba(15,15,15,0.07)" }}>#{t}</span>)}
                </div>
                <span style={{ fontSize: 11, color: isFirst ? "rgba(255,255,255,0.7)" : M_COLORS.dim }}>{a.readTime}m →</span>
              </div>
            </a>
          );
        })}
      </section>

      {/* Other cats */}
      <section style={{ padding: "24px 20px 32px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M_COLORS.dim, marginBottom: 10 }}>Other categories</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {otherCats.map(c => (
            <a key={c.name} href="#" style={{ padding: "7px 12px", borderRadius: 999, background: M_COLORS.card, fontSize: 12.5, color: M_COLORS.ink, textDecoration: "none", display: "inline-flex", gap: 6 }}>
              {c.name} <span style={{ color: M_COLORS.dim, fontSize: 11 }}>{c.count}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Pagination */}
      <section style={{ padding: "0 20px 32px", display: "flex", justifyContent: "center", gap: 6 }}>
        {[1,2,3,4].map(n => (
          <button key={n} style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: n === 1 ? M_COLORS.ink : "rgba(15,15,15,0.06)", color: n === 1 ? "white" : M_COLORS.ink, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{n}</button>
        ))}
        <button style={{ padding: "0 14px", height: 36, borderRadius: 999, border: "none", background: "rgba(15,15,15,0.06)", color: M_COLORS.ink, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>→</button>
      </section>
    </MobileShell>
  );
}

// ------------------ Series ------------------
function MobileSeries() {
  _useMobileTokens();
  const seriesName = "Golang Concurrency";
  const eps = [
    { num: 1, title: "Goroutine 기초 — 가벼운 스레드의 정체", date: "2026.03.14", readTime: 10, status: "done" },
    { num: 2, title: "Channel 완전 정복", date: "2026.03.28", readTime: 14, status: "done", current: true },
    { num: 3, title: "Select / sync 패턴", date: "Coming up", readTime: 12, status: "next" },
    { num: 4, title: "Context 사용법 — 취소와 시한", date: "TBD", readTime: 9, status: "planned" },
    { num: 5, title: "실전 패턴: Worker Pool, Pipeline", date: "TBD", readTime: 16, status: "planned" },
  ];
  const doneCount = eps.filter(e => e.status === "done").length;
  const progress = (doneCount / eps.length) * 100;

  return (
    <MobileShell scrollHeight={2200}>
      <MobileTopBar />

      <div style={{ padding: "16px 20px 0", fontSize: 12, color: M_COLORS.dim, display: "flex", gap: 6 }}>
        <a href="#" style={{ color: M_COLORS.dim, textDecoration: "none" }}>Home</a><span>/</span>
        <a href="#" style={{ color: M_COLORS.dim, textDecoration: "none" }}>Series</a><span>/</span>
        <span style={{ color: M_COLORS.accent, fontWeight: 500 }}>{seriesName}</span>
      </div>

      {/* Hero — stacked: title, then progress dial */}
      <section style={{ padding: "16px 20px 0" }}>
        <div style={{ background: M_COLORS.lavender, borderRadius: 28, padding: "28px 24px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: M_COLORS.ink, opacity: 0.6 }}>Series · Go</div>
          <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.035em", margin: "12px 0 14px" }}>{seriesName}.</h1>
          <p style={{ fontSize: 14, color: M_COLORS.ink, opacity: 0.78, lineHeight: 1.55, margin: "0 0 20px" }}>Go의 동시성 모델을 처음부터. goroutine과 channel부터 worker pool까지, 다섯 편으로 정리.</p>

          {/* Progress dial — inline */}
          <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 18, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(15,15,15,0.1)" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={M_COLORS.accent} strokeWidth="6" strokeDasharray={`${(progress / 100) * 188} 188`} strokeLinecap="round" transform="rotate(-90 36 36)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{doneCount}/{eps.length}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(progress)}% 발행 완료</div>
              <div style={{ fontSize: 12, color: M_COLORS.dim, marginTop: 2 }}>다음: 4월 11일</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <a href="#" style={{ flex: 1, padding: "12px 16px", borderRadius: 999, background: M_COLORS.ink, color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>처음부터 →</a>
            <a href="#" style={{ flex: 1, padding: "12px 16px", borderRadius: 999, background: "rgba(15,15,15,0.08)", color: M_COLORS.ink, fontSize: 13, fontWeight: 500, textDecoration: "none", textAlign: "center" }}>이어 읽기</a>
          </div>
        </div>
      </section>

      {/* Episode timeline */}
      <section style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>편별 목록</h2>
          <div style={{ fontSize: 11, color: M_COLORS.dim }}>2 · 3 예정</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {eps.map((e, i) => {
            const isDone = e.status === "done";
            const isCurrent = e.current;
            const isNext = e.status === "next";
            const dotBg = isDone ? (isCurrent ? M_COLORS.accent : M_COLORS.ink) : (isNext ? M_COLORS.butter : "rgba(15,15,15,0.1)");
            const dotColor = isDone ? "white" : (isNext ? M_COLORS.ink : M_COLORS.dim);
            const cardBg = isCurrent ? M_COLORS.butter : (isDone ? M_COLORS.card : "transparent");
            const cardBorder = !isDone && !isNext ? "1px dashed rgba(15,15,15,0.2)" : "none";
            return (
              <div key={e.num} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 999, background: dotBg, color: dotColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                    {isDone ? (isCurrent ? "★" : "✓") : e.num}
                  </div>
                  {i < eps.length - 1 && <div style={{ width: 2, flex: 1, background: isDone ? M_COLORS.ink : "rgba(15,15,15,0.1)", marginTop: 4, minHeight: 30 }} />}
                </div>
                <a href="#" style={{ display: "block", padding: "12px 14px", borderRadius: 16, background: cardBg, border: cardBorder, textDecoration: "none", color: M_COLORS.ink, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: M_COLORS.dim, marginBottom: 4 }}>
                    <span>EP {String(e.num).padStart(2, "0")}</span>
                    <span>·</span>
                    <span>{e.date}</span>
                    {isCurrent && <span style={{ padding: "1px 8px", borderRadius: 999, background: M_COLORS.accent, color: "white", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>READING</span>}
                    {isNext && <span style={{ padding: "1px 8px", borderRadius: 999, background: M_COLORS.ink, color: "white", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>NEXT</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em", color: isDone ? M_COLORS.ink : (isNext ? M_COLORS.ink : M_COLORS.dim) }}>{e.title}</div>
                  {isDone && <div style={{ fontSize: 11, color: M_COLORS.dim, marginTop: 6 }}>{e.readTime} min read</div>}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Other series */}
      <section style={{ padding: "24px 20px 32px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 12px" }}>다른 시리즈</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "Terraform 완벽 가이드", count: 5, done: 5, tint: M_COLORS.sage },
            { name: "MQTT v5", count: 4, done: 1, tint: M_COLORS.rose },
            { name: "Spring Boot 입문", count: 6, done: 4, tint: M_COLORS.butter },
          ].map(s => (
            <a key={s.name} href="#" style={{ background: s.tint, padding: 18, borderRadius: 20, textDecoration: "none", color: M_COLORS.ink, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: M_COLORS.ink, opacity: 0.6, marginBottom: 4 }}>Series</div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>{s.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 5, background: "rgba(15,15,15,0.1)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${(s.done / s.count) * 100}%`, height: "100%", background: M_COLORS.ink }} />
                  </div>
                  <span style={{ color: M_COLORS.dim, fontSize: 11 }}>{s.done}/{s.count}</span>
                </div>
              </div>
              <span style={{ fontSize: 18 }}>→</span>
            </a>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

window.MobileHome = MobileHome;
window.MobileArticle = MobileArticle;
window.MobileCategory = MobileCategory;
window.MobileSeries = MobileSeries;
