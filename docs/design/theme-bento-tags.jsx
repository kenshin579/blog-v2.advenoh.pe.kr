// Tags pages — /tags index + /tags/[name] detail
// Same visual language as Category/Series pages.

// Weighted tag list — cross-cutting topics
const TAG_DATA = [
  { name: "aws", count: 24, cats: ["Cloud", "DevOps"] },
  { name: "kubernetes", count: 22, cats: ["Cloud", "DevOps"] },
  { name: "postgres", count: 18, cats: ["Database"] },
  { name: "jvm", count: 16, cats: ["JVM"] },
  { name: "terraform", count: 15, cats: ["Cloud", "DevOps"] },
  { name: "docker", count: 14, cats: ["DevOps"] },
  { name: "golang", count: 14, cats: ["Go"] },
  { name: "performance", count: 13, cats: ["JVM", "Database", "Cloud"] },
  { name: "system-design", count: 12, cats: ["Algorithm", "Cloud"] },
  { name: "react", count: 12, cats: ["Frontend"] },
  { name: "typescript", count: 11, cats: ["Frontend"] },
  { name: "spring-boot", count: 11, cats: ["JVM"] },
  { name: "kafka", count: 10, cats: ["Cloud", "Database"] },
  { name: "microservices", count: 10, cats: ["Cloud", "JVM"] },
  { name: "mysql", count: 10, cats: ["Database"] },
  { name: "redis", count: 9, cats: ["Database"] },
  { name: "nextjs", count: 9, cats: ["Frontend"] },
  { name: "linux", count: 9, cats: ["DevOps"] },
  { name: "mongodb", count: 8, cats: ["Database"] },
  { name: "gc", count: 8, cats: ["JVM"] },
  { name: "serverless", count: 8, cats: ["Cloud"] },
  { name: "gitops", count: 7, cats: ["DevOps"] },
  { name: "nginx", count: 7, cats: ["DevOps"] },
  { name: "security", count: 7, cats: ["Cloud", "JVM"] },
  { name: "ddd", count: 6, cats: ["JVM"] },
  { name: "elasticsearch", count: 6, cats: ["Database"] },
  { name: "observability", count: 6, cats: ["DevOps"] },
  { name: "prometheus", count: 5, cats: ["DevOps"] },
  { name: "jwt", count: 5, cats: ["JVM", "Frontend"] },
  { name: "tdd", count: 5, cats: ["JVM"] },
  { name: "tailwind", count: 5, cats: ["Frontend"] },
  { name: "grpc", count: 5, cats: ["Go"] },
  { name: "vite", count: 4, cats: ["Frontend"] },
  { name: "grafana", count: 4, cats: ["DevOps"] },
  { name: "oauth", count: 4, cats: ["JVM"] },
  { name: "python", count: 4, cats: ["AI"] },
  { name: "claude-code", count: 4, cats: ["AI"] },
  { name: "agent", count: 3, cats: ["AI"] },
  { name: "webpack", count: 3, cats: ["Frontend"] },
];

// Tags index — /tags
function TagsIndexPage() {
  const C = window.useBentoTokens();
  const sansHead = C.sansHead;
  const totalTags = TAG_DATA.length;
  const totalRefs = TAG_DATA.reduce((s, t) => s + t.count, 0);
  const tints = [C.sage, C.butter, C.rose, C.lavender, C.cream];

  // Buckets by size
  const sorted = [...TAG_DATA].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 5);
  const max = sorted[0].count;
  const min = sorted[sorted.length - 1].count;
  const sizeFor = (n) => {
    const t = (n - min) / (max - min);
    return 14 + t * 38; // 14px..52px
  };
  const weightFor = (n) => {
    const t = (n - min) / (max - min);
    return 400 + Math.round(t * 3) * 100; // 400..700
  };

  // Group alphabetically
  const alphaGroups = {};
  [...TAG_DATA].sort((a, b) => a.name.localeCompare(b.name)).forEach(t => {
    const k = t.name[0].toUpperCase();
    (alphaGroups[k] = alphaGroups[k] || []).push(t);
  });

  return (
    <div style={{ width: "100%", minHeight: "100%", background: C.bg, color: C.ink, fontFamily: sansHead, padding: "32px 40px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 28px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>frank<span style={{ color: C.dim }}>.blog</span></div>
        </div>
        <nav style={{ display: "flex", gap: 4, padding: 4, background: "rgba(15,15,15,0.06)", borderRadius: 999 }}>
          {[["Home"], ["Posts"], ["Series"], ["Tags", true]].map(([n, a]) => (
            <a key={n} href="#" style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: a ? "white" : C.ink, background: a ? C.ink : "transparent", textDecoration: "none" }}>{n}</a>
          ))}
        </nav>
        <button style={{ padding: "8px 18px", borderRadius: 999, background: C.ink, color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>RSS</button>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 4px 16px", fontSize: 13, color: C.dim, display: "flex", gap: 8 }}>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Home</a><span>/</span>
        <span style={{ color: C.accent, fontWeight: 500 }}>Tags</span>
      </div>

      {/* Hero — Tag cloud as the hero */}
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* Massive weighted tag cloud */}
        <div style={{ background: C.ink, color: "white", borderRadius: 32, padding: "44px 48px", position: "relative", overflow: "hidden", minHeight: 460 }}>
          <div style={{ position: "absolute", top: -180, left: -100, width: 480, height: 480, borderRadius: 999, background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)`, opacity: 0.4 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Index</div>
            <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em", margin: "16px 0 18px" }}>Tags.</div>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: "0 0 28px", maxWidth: 480 }}>
              카테고리를 가로지르는 주제들. 같은 #kubernetes 태그라도 Cloud · DevOps · JVM 어디서나 발견됩니다.
            </p>
            {/* Weighted cloud */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px", alignItems: "baseline", maxWidth: 720 }}>
              {sorted.slice(0, 24).map((t) => (
                <a key={t.name} href="#" style={{
                  fontSize: sizeFor(t.count),
                  fontWeight: weightFor(t.count),
                  letterSpacing: "-0.02em",
                  color: t.count >= 14 ? "white" : "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  lineHeight: 1.05,
                  fontFamily: sansHead,
                }}>
                  #{t.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar pile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.butter, borderRadius: 24, padding: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ink, opacity: 0.6, marginBottom: 14 }}>At a glance</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{totalTags}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>전체 태그</div>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{totalRefs}</div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>총 사용 횟수</div>
              </div>
            </div>
          </div>
          <div style={{ background: C.cream, borderRadius: 24, padding: 22, flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.dim, marginBottom: 12 }}>Top 5 — most written</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {top.map((t, i) => (
                <a key={t.name} href="#" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid rgba(15,15,15,0.1)", fontSize: 15, color: C.ink, textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 6, background: C.accent, color: "white", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>#{t.name}</span>
                  </div>
                  <span style={{ color: C.dim, fontSize: 13 }}>{t.count}편</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter / sort bar */}
      <div style={{ maxWidth: 1280, margin: "32px auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: C.dim }}><strong style={{ color: C.ink, fontSize: 18 }}>{totalTags}</strong> 개의 태그</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["By count", "A → Z", "Recently used"].map((n, i) => (
            <button key={n} style={{ padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, border: "none", background: i === 0 ? C.ink : "rgba(15,15,15,0.06)", color: i === 0 ? "white" : C.ink, cursor: "pointer" }}>{n}</button>
          ))}
        </div>
      </div>

      {/* All tags — bento grid with varied sizes (by count) */}
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridAutoRows: "100px", gridAutoFlow: "dense", gap: 14 }}>
        {sorted.map((t, i) => {
          const tint = tints[i % tints.length];
          // Tier by count → size + typography
          let colSpan, rowSpan, nameSize, padding, showCats, countSize;
          if (t.count >= 20) {
            colSpan = 3; rowSpan = 2; nameSize = 44; padding = 28; showCats = true; countSize = 16;
          } else if (t.count >= 14) {
            colSpan = 2; rowSpan = 2; nameSize = 30; padding = 22; showCats = true; countSize = 14;
          } else if (t.count >= 10) {
            colSpan = 2; rowSpan = 1; nameSize = 22; padding = 18; showCats = true; countSize = 12;
          } else if (t.count >= 6) {
            colSpan = 1; rowSpan = 1; nameSize = 17; padding = 14; showCats = false; countSize = 11;
          } else {
            colSpan = 1; rowSpan = 1; nameSize = 15; padding = 12; showCats = false; countSize = 10;
          }
          return (
            <a key={t.name} href="#" style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, background: tint, borderRadius: 20, padding, textDecoration: "none", color: C.ink, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8, position: "relative", overflow: "hidden" }}>
              {/* XL tier — subtle accent glow */}
              {t.count >= 20 && (
                <div style={{ position: "absolute", bottom: -80, right: -80, width: 220, height: 220, borderRadius: 999, background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)`, opacity: 0.18 }} />
              )}
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontSize: nameSize, fontWeight: 700, letterSpacing: "-0.025em", color: C.ink, lineHeight: 1.1, wordBreak: "break-word" }}>#{t.name}</div>
                <div style={{ fontSize: countSize, padding: t.count >= 14 ? "4px 10px" : "3px 8px", borderRadius: 999, background: t.count >= 20 ? C.ink : "rgba(15,15,15,0.08)", color: t.count >= 20 ? "white" : C.ink, fontWeight: 600, flexShrink: 0 }}>{t.count}</div>
              </div>
              {showCats && (
                <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {t.cats.map(c => (
                    <span key={c} style={{ fontSize: t.count >= 20 ? 12 : 11, padding: t.count >= 20 ? "3px 10px" : "2px 8px", borderRadius: 999, background: "rgba(15,15,15,0.06)", color: C.dim, fontWeight: 500 }}>{c}</span>
                  ))}
                </div>
              )}
              {!showCats && t.cats.length > 0 && (
                <div style={{ position: "relative", display: "flex", gap: 4 }}>
                  {t.cats.slice(0, 3).map(c => (
                    <span key={c} style={{ width: 6, height: 6, borderRadius: 999, background: "rgba(15,15,15,0.25)" }} title={c} />
                  ))}
                </div>
              )}
            </a>
          );
        })}
      </div>

      {/* Alphabetical index — secondary view */}
      <div style={{ maxWidth: 1280, margin: "56px auto 0", padding: "28px 0 0", borderTop: "1px solid rgba(15,15,15,0.1)" }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 18px" }}>A — Z</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px 32px" }}>
          {Object.entries(alphaGroups).map(([letter, items]) => (
            <div key={letter}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginBottom: 8, fontFamily: C.mono, letterSpacing: "0.05em" }}>{letter}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {items.map(t => (
                  <a key={t.name} href="#" style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.ink, textDecoration: "none", padding: "2px 0" }}>
                    <span>#{t.name}</span>
                    <span style={{ color: C.dim, fontSize: 12 }}>{t.count}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tag detail — /tags/kubernetes
function TagDetailPage() {
  const C = window.useBentoTokens();
  const sansHead = C.sansHead;
  const articles = window.SAMPLE_ARTICLES;
  const tagName = "kubernetes";
  const tagInfo = TAG_DATA.find(t => t.name === tagName) || { name: tagName, count: 22, cats: ["Cloud", "DevOps"] };

  // Build a mix of articles "tagged" with kubernetes — mock cross-category list
  const list = [
    { slug: "k8s-prod-checklist", category: "Cloud", title: "Kubernetes 운영 체크리스트 — 1년치 시행착오 정리", date: "2026-04-04", excerpt: "리소스 limit, PDB, taint/toleration, HPA 튜닝까지. 처음 운영하는 사람을 위한 항목별 메모.", tags: ["kubernetes", "ops", "checklist"], readTime: 14 },
    { slug: "argo-cd-실전-운영", category: "DevOps", title: "Argo CD 실전 운영 — GitOps의 표준이 된 이유", date: "2026-03-21", excerpt: "Sync wave, App of Apps, secret 관리까지. 실 서비스에서 검증된 패턴.", tags: ["argocd", "gitops", "kubernetes"], readTime: 16 },
    { slug: "ecs-fargate-깊이-있게", category: "Cloud", title: "ECS Fargate vs Kubernetes — 언제 어떤 걸 쓸까", date: "2026-02-28", excerpt: "K8s만이 답은 아닙니다. 두 오케스트레이션의 트레이드오프.", tags: ["ecs", "kubernetes", "container"], readTime: 11 },
    { slug: "k8s-network-policy", category: "Cloud", title: "Network Policy로 파드 간 트래픽 막기", date: "2026-02-14", excerpt: "Calico, Cilium에서 NetworkPolicy 작성. zero-trust 클러스터의 시작.", tags: ["kubernetes", "network", "security"], readTime: 10 },
    { slug: "k8s-observability", category: "DevOps", title: "Kubernetes Observability — Prometheus + Loki + Tempo", date: "2026-01-31", excerpt: "지표·로그·트레이스 세 가지 신호를 한 화면에 띄우는 LGTM 스택.", tags: ["kubernetes", "prometheus", "observability"], readTime: 13 },
    { slug: "k8s-secret-management", category: "DevOps", title: "Secret 관리 — Sealed Secret vs External Secret", date: "2026-01-17", excerpt: "Git에 secret을 어떻게 안전하게 올릴까. 두 가지 표준 솔루션 비교.", tags: ["kubernetes", "security", "gitops"], readTime: 9 },
    { slug: "k8s-spring-boot-jvm", category: "JVM", title: "Spring Boot on Kubernetes — JVM 튜닝의 다른 길", date: "2025-12-20", excerpt: "Container-aware JVM, MaxRAMPercentage, GraalVM native까지.", tags: ["kubernetes", "jvm", "spring-boot"], readTime: 15 },
    { slug: "helm-chart-패턴", category: "Cloud", title: "Helm Chart 작성 패턴 — 재사용 가능한 차트 만들기", date: "2025-12-06", excerpt: "values 스키마, dependency, named template. 팀에서 공유하는 차트의 조건.", tags: ["kubernetes", "helm"], readTime: 12 },
  ];

  // Related tags from same cluster
  const related = [
    { name: "docker", count: 14 },
    { name: "terraform", count: 15 },
    { name: "helm", count: 6 },
    { name: "argocd", count: 7 },
    { name: "prometheus", count: 5 },
    { name: "istio", count: 4 },
    { name: "containerd", count: 3 },
  ];

  const catBreakdown = {};
  list.forEach(a => { catBreakdown[a.category] = (catBreakdown[a.category] || 0) + 1; });
  const catColor = { Cloud: C.sage, DevOps: C.lavender, JVM: C.butter, Database: C.rose, Frontend: C.cream, AI: C.cream };

  return (
    <div style={{ width: "100%", minHeight: "100%", background: C.bg, color: C.ink, fontFamily: sansHead, padding: "32px 40px 80px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 28px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>frank<span style={{ color: C.dim }}>.blog</span></div>
        </div>
        <nav style={{ display: "flex", gap: 4, padding: 4, background: "rgba(15,15,15,0.06)", borderRadius: 999 }}>
          {[["Home"], ["Posts"], ["Series"], ["Tags", true]].map(([n, a]) => (
            <a key={n} href="#" style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: a ? "white" : C.ink, background: a ? C.ink : "transparent", textDecoration: "none" }}>{n}</a>
          ))}
        </nav>
        <button style={{ padding: "8px 18px", borderRadius: 999, background: C.ink, color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>RSS</button>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 4px 16px", fontSize: 13, color: C.dim, display: "flex", gap: 8 }}>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Home</a><span>/</span>
        <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Tags</a><span>/</span>
        <span style={{ color: C.accent, fontWeight: 500 }}>#{tagName}</span>
      </div>

      {/* Hero — accent block with # prefix tag */}
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        <div style={{ background: C.accent, color: "white", borderRadius: 32, padding: "44px 48px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: -200, right: -120, width: 460, height: 460, borderRadius: 999, background: "rgba(0,0,0,0.18)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>Tag</div>
            <div style={{ display: "flex", alignItems: "baseline", margin: "16px 0 16px" }}>
              <span style={{ fontSize: 96, fontWeight: 400, letterSpacing: "-0.04em", lineHeight: 0.95, opacity: 0.55, fontFamily: C.serif, fontStyle: "italic" }}>#</span>
              <span style={{ fontSize: 96, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em" }}>{tagName}</span>
            </div>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.88)", lineHeight: 1.55, margin: "0 0 28px", maxWidth: 540 }}>
              컨테이너 오케스트레이션의 표준. 인프라부터 애플리케이션 튜닝까지 — 이 태그는 카테고리를 넘나듭니다.
            </p>
            <div style={{ display: "flex", gap: 24, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
              <span><strong style={{ color: "white", fontSize: 16 }}>{tagInfo.count}</strong> 편</span>
              <span><strong style={{ color: "white", fontSize: 16 }}>{Object.keys(catBreakdown).length}</strong> 카테고리에 걸쳐</span>
              <span><strong style={{ color: "white", fontSize: 16 }}>2020–</strong></span>
            </div>
          </div>
        </div>

        {/* Sidebar — category breakdown + related tags */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.cream, borderRadius: 24, padding: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.dim, marginBottom: 12 }}>By category</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, n]) => {
                const pct = (n / list.length) * 100;
                return (
                  <a key={cat} href="#" style={{ display: "block", textDecoration: "none", color: C.ink }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <span style={{ color: C.dim }}>{n}편</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(15,15,15,0.08)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: catColor[cat] || C.ink }} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.butter, borderRadius: 24, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ink, opacity: 0.6, marginBottom: 12 }}>Often appears with</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {related.map(r => (
                <a key={r.name} href="#" style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(15,15,15,0.08)", fontSize: 13, color: C.ink, textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center" }}>
                  #{r.name}<span style={{ color: C.dim, fontSize: 11 }}>{r.count}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ maxWidth: 1280, margin: "32px auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: C.dim }}><strong style={{ color: C.ink, fontSize: 18 }}>{tagInfo.count}</strong> 편이 이 태그를 가짐</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Latest", "Most read", "Cloud", "DevOps", "JVM"].map((n, i) => (
            <button key={n} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500, border: "none", background: i === 0 ? C.ink : "rgba(15,15,15,0.06)", color: i === 0 ? "white" : C.ink, cursor: "pointer" }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Articles — bento varied sizes, color-tinted by source category */}
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "minmax(120px, auto)", gap: 16 }}>
        {list.map((a, i) => {
          const span = i === 0 ? 12 : (i % 5 === 1 ? 7 : i % 5 === 2 ? 5 : 4);
          const rowSpan = 2;
          const tint = i === 0 ? C.ink : (catColor[a.category] || C.cream);
          const isDark = i === 0;
          return (
            <a key={a.slug} href="#" style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}`, background: tint, color: isDark ? "white" : C.ink, borderRadius: 24, padding: 24, textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: i === 0 ? 240 : 180, position: "relative", overflow: "hidden" }}>
              {i === 0 && (
                <div style={{ position: "absolute", top: -100, right: -100, width: 360, height: 360, borderRadius: 999, background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)`, opacity: 0.4 }} />
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,15,15,0.08)", color: isDark ? "white" : C.ink, fontWeight: 600 }}>{a.category}</span>
                  <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.6)" : C.dim }}>{window.formatDate(a.date)}</span>
                </div>
                <h3 style={{ fontSize: i === 0 ? 36 : (span >= 7 ? 24 : 19), fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, color: isDark ? "white" : C.ink }}>{a.title}</h3>
                {(i === 0 || span >= 7) && (
                  <p style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.78)" : C.dim, lineHeight: 1.55, margin: "12px 0 0", maxWidth: 540 }}>{a.excerpt}</p>
                )}
              </div>
              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.tags.slice(0, 3).map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: t === tagName ? (isDark ? C.accent : C.accent) : (isDark ? "rgba(255,255,255,0.1)" : "rgba(15,15,15,0.06)"), color: t === tagName ? "white" : (isDark ? "white" : C.ink), fontWeight: t === tagName ? 600 : 400 }}>#{t}</span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.7)" : C.dim, fontWeight: 500 }}>{a.readTime}m →</span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ maxWidth: 1280, margin: "32px auto 0", display: "flex", justifyContent: "center", gap: 6 }}>
        {[1, 2, 3].map(n => (
          <button key={n} style={{ width: 36, height: 36, borderRadius: 999, border: "none", background: n === 1 ? C.ink : "rgba(15,15,15,0.06)", color: n === 1 ? "white" : C.ink, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{n}</button>
        ))}
        <button style={{ padding: "0 16px", height: 36, borderRadius: 999, border: "none", background: "rgba(15,15,15,0.06)", color: C.ink, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Next →</button>
      </div>
    </div>
  );
}

window.TagsIndexPage = TagsIndexPage;
window.TagDetailPage = TagDetailPage;
