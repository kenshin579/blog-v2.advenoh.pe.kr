// Theme: Bento Grid — modular cards of varying sizes, like Apple keynote / Linear
function ThemeBento() {
  const articles = window.SAMPLE_ARTICLES;
  const categories = window.CATEGORIES;
  const featured = articles[0];

  const C = window.useBentoTokens();
  const sansHead = C.sansHead;
  const sansBody = C.sansBody;

  return (
    <div style={{ width: "100%", minHeight: "100%", background: C.bg, color: C.ink, fontFamily: sansBody, padding: "32px 40px" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, fontFamily: sansHead }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>frank<span style={{ color: C.dim }}>.blog</span></div>
        </div>
        <nav style={{ display: "flex", gap: 4, padding: 4, background: "rgba(15,15,15,0.06)", borderRadius: 999 }}>
          {[["Home", true], ["Posts"], ["Series"], ["Tags"]].map(([n, a]) => (
            <a key={n} href="#" style={{ padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, color: a ? "white" : C.ink, background: a ? C.ink : "transparent", textDecoration: "none" }}>{n}</a>
          ))}
        </nav>
        <button style={{ padding: "8px 18px", borderRadius: 999, background: C.ink, color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>RSS</button>
      </header>

      {/* Hero band */}
      <div style={{ padding: "16px 4px 32px" }}>
        <div style={{ fontFamily: sansHead, fontSize: 76, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em", color: C.ink, marginBottom: 16 }}>
          Field notes <span style={{ fontStyle: "italic", fontWeight: 400 }}>from</span><br/>
          <span style={{ background: `linear-gradient(180deg, transparent 60%, ${C.butter} 60%)` }}>a working engineer.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, color: C.dim, marginTop: 24 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: C.accent }} />178 posts published</span>
          <span>—</span>
          <span>since Jan 2018</span>
          <span>—</span>
          <span>Cloud · JVM · Go · Database</span>
        </div>
      </div>

      {/* BENTO GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "minmax(140px, auto)", gap: 16 }}>
        {/* Featured big card */}
        <article style={{ gridColumn: "span 7", gridRow: "span 3", background: C.ink, color: "white", borderRadius: 32, padding: 36, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: 999, background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)`, opacity: 0.6 }} />
          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", marginBottom: 24 }}>
              <span style={{ padding: "4px 12px", borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "white" }}>★ FEATURED</span>
              <span>{featured.category}</span>
              <span>·</span>
              <span>{window.formatDate(featured.date)}</span>
              <span>·</span>
              <span>{featured.readTime} min read</span>
            </div>
            <h2 style={{ fontFamily: sansHead, fontSize: 56, fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", margin: "auto 0 16px" }}>{featured.title}</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", lineHeight: 1.55, margin: "0 0 28px", maxWidth: 560 }}>{featured.excerpt}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {featured.tags.map(t => <span key={t} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}>{t}</span>)}
              </div>
              <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 999, background: C.accent, color: "white", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Read article →</a>
            </div>
          </div>
        </article>

        {/* Stats card */}
        <div style={{ gridColumn: "span 5", gridRow: "span 1", background: C.cream, borderRadius: 24, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[["178", "posts"], ["7", "series"], ["8y", "writing"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: sansHead, fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em", color: C.ink }}>{n}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Category card with shapes */}
        <div style={{ gridColumn: "span 5", gridRow: "span 2", background: C.sage, borderRadius: 24, padding: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 12, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Topics</div>
          <div style={{ fontFamily: sansHead, fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 8, lineHeight: 1.1 }}>178편을<br/>10개의 결로</div>
          <div style={{ position: "absolute", inset: "auto 0 0 24px", right: 24, bottom: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.slice(0, 8).map(c => (
              <div key={c.name} style={{ padding: "8px 14px", borderRadius: 999, background: "rgba(15,15,15,0.08)", fontSize: 13, fontWeight: 500, display: "inline-flex", gap: 8, alignItems: "center" }}>
                {c.name} <span style={{ color: C.dim, fontSize: 11 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Series spotlight */}
        <div style={{ gridColumn: "span 4", gridRow: "span 2", background: C.lavender, borderRadius: 24, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, color: C.ink, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Series</div>
          <div style={{ fontFamily: sansHead, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 8, lineHeight: 1.1 }}>Golang Concurrency</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
            {["Goroutine 기초", "Channel 완전 정복", "Select / sync 패턴", "Context 사용법"].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: i < 2 ? C.ink : C.dim }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: i < 2 ? C.ink : "rgba(15,15,15,0.1)", color: i < 2 ? "white" : C.dim, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>{i + 1}</span>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Biweekly posts — series 카드와 같은 스타일, biweekly 태그 글만 */}
        <div style={{ gridColumn: "span 4", gridRow: "span 2", background: C.accent, color: "white", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85 }}>Biweekly</div>
          <div style={{ fontFamily: sansHead, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 8, lineHeight: 1.1 }}>격주에 한 편씩</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
            {articles.slice(0, 4).map((a, i) => (
              <div key={a.slug} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: i < 2 ? "white" : "rgba(255,255,255,0.7)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: i < 2 ? "white" : "rgba(255,255,255,0.18)", color: i < 2 ? C.accent : "rgba(255,255,255,0.85)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>{i + 1}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity heatmap card */}
        <div style={{ gridColumn: "span 4", gridRow: "span 2", background: C.card, borderRadius: 24, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>Last 12 months</div>
          <div style={{ fontFamily: sansHead, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "8px 0 16px" }}>꾸준함의 기록</div>
          <div style={{ flex: 1, display: "grid", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 3 }}>
            {Array.from({ length: 7 * 26 }).map((_, i) => {
              const v = (i * 13) % 100;
              const op = v < 50 ? 0.06 : v < 75 ? 0.25 : v < 90 ? 0.55 : 0.9;
              return <div key={i} style={{ background: C.accent, opacity: op, borderRadius: 3 }} />;
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: C.dim, display: "flex", justifyContent: "space-between" }}><span>22 streak</span><span>peak 4 / week</span></div>
        </div>

        {/* Recent posts — small cards */}
        {articles.slice(1, 5).map((a, i) => {
          const tints = [C.rose, C.butter, C.sage, C.lavender];
          return (
            <article key={a.slug} style={{ gridColumn: "span 3", gridRow: "span 2", background: i === 0 ? C.card : tints[i % tints.length], borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 240 }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{a.category}</div>
                <h3 style={{ fontFamily: sansHead, fontSize: 19, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.02em", margin: 0, color: C.ink }}>{a.title}</h3>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 12, color: C.dim }}>
                <span>{window.formatDate(a.date)}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.ink, fontWeight: 500 }}>{a.readTime}m →</span>
              </div>
            </article>
          );
        })}

        {/* Wide list card */}
        <div style={{ gridColumn: "span 8", gridRow: "span 2", background: C.card, borderRadius: 24, padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>Latest</div>
              <div style={{ fontFamily: sansHead, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4 }}>이번 달 글</div>
            </div>
            <a href="#" style={{ fontSize: 13, color: C.dim, textDecoration: "none" }}>See all 178 →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {articles.slice(5, 9).map((a, i) => (
              <a key={a.slug} href="#" style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 60px", gap: 16, padding: "14px 0", borderTop: `1px solid rgba(15,15,15,0.06)`, alignItems: "center", color: C.ink, textDecoration: "none" }}>
                <span style={{ fontSize: 12, color: C.dim, fontVariantNumeric: "tabular-nums" }}>{window.formatDate(a.date).slice(5)}</span>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{a.title}</span>
                <span style={{ fontSize: 12, color: C.dim }}>{a.category}</span>
                <span style={{ fontSize: 12, color: C.dim, textAlign: "right" }}>{a.readTime}m</span>
              </a>
            ))}
          </div>
        </div>

        {/* Quote card */}
        <div style={{ gridColumn: "span 4", gridRow: "span 2", background: C.ink, color: "white", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontFamily: sansHead, fontSize: 64, lineHeight: 0.7, color: C.accent }}>“</div>
          <div style={{ fontFamily: sansHead, fontSize: 18, fontWeight: 500, lineHeight: 1.45, letterSpacing: "-0.01em" }}>잘 정리된 노트는<br/><em>미래의 나에게 보내는</em><br/>가장 좋은 선물.</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>— writing principle</div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 48, padding: "20px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.dim }}>
        <span>© 2018–2026 Frank Advenoh</span>
        <div style={{ display: "flex", gap: 18 }}>
          <a href="#" style={{ color: C.dim, textDecoration: "none" }}>RSS</a>
          <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Twitter</a>
          <a href="#" style={{ color: C.dim, textDecoration: "none" }}>GitHub</a>
          <a href="#" style={{ color: C.dim, textDecoration: "none" }}>Email</a>
        </div>
      </footer>
    </div>
  );
}

window.ThemeBento = ThemeBento;
