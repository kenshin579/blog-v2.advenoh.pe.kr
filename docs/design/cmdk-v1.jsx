// Command-K v1 — Bento aesthetic
// Cream background, rounded cards, pastel chips, warm tone
// 720×560 modal on a dimmed page background

const CmdKV1 = () => {
  const t = useBentoTokens();
  const [query, setQuery] = React.useState("kuber");

  // Simulated search results based on query "kuber"
  const results = [
    {
      type: "article",
      title: "Kubernetes 환경에서 Secret 안전하게 관리하기",
      category: "Cloud",
      date: "2026-03-02",
      readTime: 11,
      tint: t.sage,
      highlight: [0, 10], // chars 0-10 are "Kubernetes"
    },
    {
      type: "article",
      title: "Kubernetes Helm Chart 입문",
      category: "Cloud",
      date: "2025-11-14",
      readTime: 8,
      tint: t.lavender,
      highlight: [0, 10],
    },
    {
      type: "article",
      title: "Kubernetes Pod의 라이프사이클 정리",
      category: "Cloud",
      date: "2025-08-22",
      readTime: 6,
      tint: t.butter,
      highlight: [0, 10],
    },
  ];

  const tagResults = [
    { tag: "kubernetes", count: 12 },
    { tag: "kubectl", count: 4 },
  ];

  const recentSearches = ["terraform", "goroutine", "jpa n+1", "mqtt qos"];
  const recentlyViewed = [
    { title: "Terraform 완벽 가이드", category: "Cloud", date: "2026-04-08" },
    { title: "Golang Concurrency 2: Channel", category: "Go", date: "2026-03-28" },
    { title: "JPA N+1 문제 해결방법", category: "Database", date: "2026-02-04" },
  ];

  const showEmpty = query.trim().length === 0;

  // Highlight matched chars in title
  const renderHighlighted = (text, range) => {
    if (!range) return text;
    const [s, e] = range;
    return (
      <>
        <span style={{ background: t.accentSoft, color: t.ink, padding: "1px 2px", borderRadius: 4 }}>
          {text.slice(s, e)}
        </span>
        {text.slice(e)}
      </>
    );
  };

  return (
    <div
      style={{
        width: 1280,
        height: 880,
        background: t.bg,
        position: "relative",
        fontFamily: t.sansBody,
        color: t.ink,
        overflow: "hidden",
      }}
    >
      {/* Faded blog content behind modal */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.35, filter: "blur(2px)" }}>
        {/* Mock header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: t.ink }} />
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Frank Advenoh</div>
          </div>
          <div style={{ display: "flex", gap: 28, fontSize: 14 }}>
            <span>Posts</span><span>Series</span><span>Tags</span><span>About</span>
          </div>
        </div>
        {/* Mock bento grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "0 56px" }}>
          <div style={{ height: 200, borderRadius: 24, background: t.ink, gridColumn: "1 / 3" }} />
          <div style={{ height: 200, borderRadius: 24, background: t.accent }} />
          <div style={{ height: 160, borderRadius: 20, background: t.sage }} />
          <div style={{ height: 160, borderRadius: 20, background: t.lavender }} />
          <div style={{ height: 160, borderRadius: 20, background: t.butter }} />
        </div>
      </div>

      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: t.dark ? "rgba(0,0,0,0.6)" : "rgba(15,15,15,0.4)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 100,
          transform: "translateX(-50%)",
          width: 720,
          background: t.card,
          borderRadius: t.radius.xl,
          boxShadow: "0 30px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.1)",
          overflow: "hidden",
          border: `1px solid ${t.borderSoft}`,
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "22px 28px",
            borderBottom: `1px solid ${t.borderSoft}`,
          }}
        >
          {/* search icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.dim} strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="글 제목, 본문, 태그로 검색..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 19,
              fontFamily: t.sansBody,
              color: t.ink,
              background: "transparent",
              letterSpacing: "-0.01em",
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
              background: t.overlayWeak,
              borderRadius: 8,
              color: t.dim,
              letterSpacing: "0.05em",
            }}
          >
            ESC
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px", maxHeight: 460, overflow: "auto" }}>
          {showEmpty ? (
            <>
              {/* Recently viewed */}
              <SectionLabel t={t} icon="clock">최근 본 글</SectionLabel>
              {recentlyViewed.map((r, i) => (
                <ResultRow key={i} t={t} icon="article" title={r.title} meta={`${r.category} · ${r.date}`} />
              ))}

              <div style={{ height: 8 }} />

              {/* Popular searches */}
              <SectionLabel t={t} icon="trend">인기 검색어</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "6px 12px 14px" }}>
                {["kubernetes", "terraform", "goroutine", "jpa", "spring boot", "mqtt", "serverless"].map((tag, i) => (
                  <button
                    key={i}
                    style={{
                      border: "none",
                      background: i === 0 ? t.accent : t.overlayWeak,
                      color: i === 0 ? "#fff" : t.ink,
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: t.sansBody,
                      cursor: "pointer",
                    }}
                  >
                    {i < 3 && <span style={{ marginRight: 6, opacity: 0.7 }}>{i + 1}</span>}
                    {tag}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Articles section */}
              <SectionLabel t={t} icon="article">
                Articles <span style={{ color: t.dim, fontWeight: 500 }}>· {results.length}</span>
              </SectionLabel>
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: t.radius.md,
                    background: i === 0 ? t.accentSoft : "transparent",
                    cursor: "pointer",
                    border: i === 0 ? `1.5px solid ${t.accent}` : "1.5px solid transparent",
                  }}
                >
                  {/* Tile icon */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: t.radius.sm,
                      background: r.tint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: t.ink,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {r.title[0]}
                  </div>

                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, letterSpacing: "-0.01em" }}>
                      {renderHighlighted(r.title, r.highlight)}
                    </div>
                    <div style={{ fontSize: 12, color: t.dim, display: "flex", gap: 10 }}>
                      <span>{r.category}</span>
                      <span>·</span>
                      <span>{r.date}</span>
                      <span>·</span>
                      <span>{r.readTime} min</span>
                    </div>
                  </div>

                  {i === 0 && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "4px 8px",
                        background: t.accent,
                        color: "#fff",
                        borderRadius: 6,
                        letterSpacing: "0.05em",
                      }}
                    >
                      ↵ OPEN
                    </div>
                  )}
                </div>
              ))}

              <div style={{ height: 12 }} />

              {/* Tags section */}
              <SectionLabel t={t} icon="tag">Tags</SectionLabel>
              {tagResults.map((tg, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: t.radius.md,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44,
                      borderRadius: t.radius.sm,
                      background: t.overlayWeak,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: t.dim,
                      fontFamily: t.mono,
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    #
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                      #{renderHighlighted(tg.tag, [0, 5])}
                    </div>
                    <div style={{ fontSize: 12, color: t.dim, marginTop: 2 }}>
                      {tg.count}편
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: t.dim }}>→</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 22px",
            background: t.cardAlt,
            borderTop: `1px solid ${t.borderSoft}`,
            fontSize: 11.5,
            color: t.dim,
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            <FooterKey t={t} keys={["↑", "↓"]}>이동</FooterKey>
            <FooterKey t={t} keys={["↵"]}>선택</FooterKey>
            <FooterKey t={t} keys={["⌘", "K"]}>닫기</FooterKey>
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 11 }}>
            178 articles indexed
          </div>
        </div>
      </div>
    </div>
  );
};

// — helpers —
function SectionLabel({ t, icon, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px 6px",
        fontSize: 11,
        fontWeight: 600,
        color: t.dim,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <SectionIcon name={icon} color={t.dim} />
      {children}
    </div>
  );
}

function SectionIcon({ name, color }) {
  const props = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "clock") return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if (name === "trend") return <svg {...props}><path d="M3 17l6-6 4 4 7-7"/><path d="M14 7h6v6"/></svg>;
  if (name === "article") return <svg {...props}><path d="M5 3h11l3 3v15H5z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>;
  if (name === "tag") return <svg {...props}><path d="M20 12L12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5" fill={color}/></svg>;
  return null;
}

function ResultRow({ t, icon, title, meta }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: t.radius.md,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 44, height: 44,
          borderRadius: t.radius.sm,
          background: t.overlayWeak,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <SectionIcon name={icon} color={t.dim} />
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-0.01em" }}>{title}</div>
        <div style={{ fontSize: 12, color: t.dim, marginTop: 2 }}>{meta}</div>
      </div>
      <div style={{ fontSize: 13, color: t.dim }}>→</div>
    </div>
  );
}

function FooterKey({ t, keys, children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", gap: 3 }}>
        {keys.map((k, i) => (
          <kbd
            key={i}
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 6px",
              minWidth: 18,
              textAlign: "center",
              background: t.card,
              border: `1px solid ${t.borderSoft}`,
              borderRadius: 5,
              color: t.ink,
            }}
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{children}</span>
    </div>
  );
}

window.CmdKV1 = CmdKV1;
