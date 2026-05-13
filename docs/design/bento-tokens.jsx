// Bento design tokens — single source of truth driven by Tweaks.
// Components read `useBentoTokens()` to get the resolved palette + radius scale.
// When Tweaks change, the root re-renders and all components see new tokens.

const BENTO_PRESETS = {
  orange:   { accent: "#FF5B22", accentSoft: "#FFD9C9" },
  blue:     { accent: "#3B5BFF", accentSoft: "#D5DEFF" },
  green:    { accent: "#16A968", accentSoft: "#CDEFDD" },
  violet:   { accent: "#7C3AED", accentSoft: "#E0D5F0" },
  magenta:  { accent: "#E91E63", accentSoft: "#F8C9DA" },
};

// Light & dark base palettes
function buildBentoTokens(tw) {
  const accentPair = BENTO_PRESETS[tw.accent] || BENTO_PRESETS.orange;
  const dark = !!tw.dark;

  const base = dark
    ? {
        bg: "#161512",
        card: "#1F1D1A",
        cardAlt: "#26231F",
        ink: "#F4F1EA",
        dim: "#8C857A",
        cream: "#26231F",
        // pastels — desaturated for dark
        sage:     "#3A4A3A",
        rose:     "#4A2F2F",
        lavender: "#3A3050",
        butter:   "#4A4220",
        // overlays
        overlayWeak: "rgba(255,255,255,0.06)",
        overlayMid:  "rgba(255,255,255,0.10)",
        borderSoft:  "rgba(255,255,255,0.08)",
        // hero
        heroDark:    "#0B0B0B",
      }
    : {
        bg: "#F2EFEA",
        card: "#FFFFFF",
        cardAlt: "#FAF7F2",
        ink: "#0F0F0F",
        dim: "#6B6B6B",
        cream: "#F8F4ED",
        sage:     "#D9E4D4",
        rose:     "#F5D5CB",
        lavender: "#E0D5F0",
        butter:   "#F5E6A8",
        overlayWeak: "rgba(15,15,15,0.06)",
        overlayMid:  "rgba(15,15,15,0.10)",
        borderSoft:  "rgba(15,15,15,0.08)",
        heroDark:    "#0F0F0F",
      };

  // radius scale (small / med / large) — driven by single tweak
  const r = tw.radius;
  const radius = {
    sm: Math.round(r * 0.5),   // tiny chips inside cards
    md: Math.round(r * 0.75),  // small cards, tags
    lg: r,                      // standard card
    xl: Math.round(r * 1.33),  // hero cards
  };

  // font scale
  const fs = tw.fontScale;

  return {
    ...base,
    ...accentPair,
    accent2: base.ink,
    radius,
    fs,           // multiplier
    dark,
    sansHead: "'Pretendard Variable', Pretendard, system-ui, sans-serif",
    sansBody: "'Pretendard Variable', Pretendard, system-ui, sans-serif",
    serif: "'Instrument Serif', Georgia, serif",
    mono: "JetBrains Mono, ui-monospace, monospace",
  };
}

// React context — Provider sits in HTML, components consume via useBentoTokens
const BentoCtx = React.createContext(null);

function BentoTokensProvider({ tweaks, children }) {
  const tokens = React.useMemo(() => buildBentoTokens(tweaks), [tweaks]);
  return <BentoCtx.Provider value={tokens}>{children}</BentoCtx.Provider>;
}

function useBentoTokens() {
  const t = React.useContext(BentoCtx);
  if (!t) {
    // Fallback to defaults so a component used standalone still renders
    return buildBentoTokens({ accent: "orange", dark: false, radius: 24, fontScale: 1 });
  }
  return t;
}

window.BentoCtx = BentoCtx;
window.BentoTokensProvider = BentoTokensProvider;
window.useBentoTokens = useBentoTokens;
window.buildBentoTokens = buildBentoTokens;
window.BENTO_PRESETS = BENTO_PRESETS;
