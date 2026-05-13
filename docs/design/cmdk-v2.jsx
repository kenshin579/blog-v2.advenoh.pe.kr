// Command-K v2 — Monochrome minimal
// Tighter, sharper, more "tool"-feeling
// Black-and-white core with single accent for current selection
// Heavier mono usage, sharper corners (radius.sm only), inline preview pane

const CmdKV2 = () => {
  const t = useBentoTokens();
  const [query, setQuery] = React.useState("");

  const recentlyViewed = [
    { title: "Terraform 완벽 가이드 — GitOps 실전까지", category: "Cloud", date: "Apr 08", id: 1 },
    { title: "Golang Concurrency 2 — Channel 완전 정복", category: "Go", date: "Mar 28", id: 2 },
    { title: "JPA N+1 문제 해결방법", category: "Database", date: "Feb 04", id: 3 },
    { title: "Git 서브모듈이란", category: "Git", date: "Feb 18", id: 4 },
  ];

  const popularSearches = [
    { q: "kubernetes", n: 142 },
    { q: "terraform", n: 98 },
    { q: "goroutine", n: 76 },
    { q: "jpa n+1", n: 54 },
    { q: "spring boot", n: 48 },
  ];

  const searchHistory = ["aws lambda cold start", "go context cancel", "k8s ingress nginx"];

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
      {/* Faded blog content */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.25, filter: "blur(3px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "28px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: t.ink }} />
            <div style={{ fontSize: 22, fontWeight: 700 }}>Frank Advenoh</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "0 56px" }}>
          <div style={{ height: 220, borderRadius: 24, background: t.ink, gridColumn: "1 / 3" }} />
          <div style={{ height: 220, borderRadius: 24, background: t.accent }} />
        </div>
      </div>

      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: t.dark ? "rgba(0,0,0,0.7)" : "rgba(15,15,15,0.5)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 110,
          transform: "translateX(-50%)",
          width: 760,
          background: t.card,
          borderRadius: 14,
          boxShadow: "0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Top bar — search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${t.borderSoft}`,
          }}
        >
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 12,
              fontWeight: 600,
              color: t.accent,
              letterSpacing: "0.05em",
            }}
          >
            ›
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            autoFocus
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              fontFamily: t.mono,
              color: t.ink,
              background: "transparent",
              caretColor: t.accent,
            }}
          />
          <span
            style={{
              fontFamily: t.mono,
              fontSize: 11,
              color: t.dim,
              padding: "3px 7px",
              border: `1px solid ${t.borderSoft}`,
              borderRadius: 4,
            }}
          >
            esc
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "12px 0", maxHeight: 480, overflow: "auto" }}>
          {/* Recently viewed */}
          <V2Section t={t} label="recently viewed" count={recentlyViewed.length}>
            {recentlyViewed.map((r, i) => (
              <V2Row key={r.id} t={t} active={i === 0}>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: i === 0 ? t.accent : t.dim, width: 24 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: i === 0 ? 600 : 500, letterSpacing: "-0.005em" }}>
                  {r.title}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim, width: 70, textAlign: "right" }}>
                  {r.category}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim, width: 56, textAlign: "right" }}>
                  {r.date}
                </span>
                {i === 0 && (
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 10,
                      color: t.accent,
                      width: 14,
                      textAlign: "center",
                    }}
                  >
                    ↵
                  </span>
                )}
                {i !== 0 && <span style={{ width: 14 }} />}
              </V2Row>
            ))}
          </V2Section>

          {/* Popular searches */}
          <V2Section t={t} label="popular this week" count={popularSearches.length}>
            {popularSearches.map((p, i) => (
              <V2Row key={p.q} t={t} active={false}>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim, width: 24 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 13, fontWeight: 500, flex: 1 }}>
                  {p.q}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim }}>
                  {p.n} searches
                </span>
                <span style={{ width: 14 }} />
              </V2Row>
            ))}
          </V2Section>

          {/* Search history */}
          <V2Section t={t} label="your history" count={searchHistory.length}>
            {searchHistory.map((q, i) => (
              <V2Row key={i} t={t} active={false}>
                <span style={{ width: 24, color: t.dim, fontFamily: t.mono, fontSize: 11 }}>
                  ↻
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 13, color: t.dim, flex: 1 }}>
                  {q}
                </span>
                <button
                  style={{
                    border: "none",
                    background: "transparent",
                    color: t.dim,
                    fontFamily: t.mono,
                    fontSize: 10,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
                <span style={{ width: 14 }} />
              </V2Row>
            ))}
          </V2Section>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 20px",
            background: t.cardAlt,
            borderTop: `1px solid ${t.borderSoft}`,
            fontFamily: t.mono,
            fontSize: 11,
            color: t.dim,
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            <V2Key keys={["↑", "↓"]} t={t}>navigate</V2Key>
            <V2Key keys={["↵"]} t={t}>open</V2Key>
            <V2Key keys={["tab"]} t={t}>filter</V2Key>
            <V2Key keys={["esc"]} t={t}>close</V2Key>
          </div>
          <div>
            <span style={{ color: t.accent }}>●</span> indexed · 178 posts
          </div>
        </div>
      </div>
    </div>
  );
};

// — helpers —
function V2Section({ t, label, count, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 22px 6px",
          fontFamily: t.mono,
          fontSize: 10,
          color: t.dim,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>{String(count).padStart(2, "0")}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function V2Row({ t, active, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 22px",
        background: active ? t.overlayWeak : "transparent",
        borderLeft: active ? `2px solid ${t.accent}` : "2px solid transparent",
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
}

function V2Key({ keys, t, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {keys.map((k, i) => (
          <kbd
            key={i}
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              padding: "1px 5px",
              minWidth: 16,
              textAlign: "center",
              background: t.card,
              border: `1px solid ${t.borderSoft}`,
              borderRadius: 3,
              color: t.ink,
              fontWeight: 600,
            }}
          >
            {k}
          </kbd>
        ))}
      </span>
      <span>{children}</span>
    </span>
  );
}

window.CmdKV2 = CmdKV2;
