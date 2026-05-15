// Sample article data drawn from the real blog
const SAMPLE_ARTICLES = [
  {
    slug: "claude-code-superpowers-완벽-가이드",
    category: "AI",
    title: "Claude Code Superpowers 완벽 가이드",
    date: "2026-04-21",
    excerpt: "Claude Code의 superpowers 기능을 활용해 반복 작업을 자동화하고 워크플로우를 한 단계 끌어올리는 실전 가이드.",
    tags: ["claude-code", "ai", "productivity"],
    readTime: 12,
    accent: "#7C3AED",
  },
  {
    slug: "terraform-완벽-가이드",
    category: "Cloud",
    title: "Terraform 완벽 가이드 — 기본 개념부터 GitOps 실전까지",
    date: "2026-04-08",
    excerpt: "Infrastructure as Code의 표준이 된 Terraform을 처음부터 운영 환경 GitOps까지 단계별로 정리합니다.",
    tags: ["terraform", "iac", "gitops", "cloud"],
    readTime: 22,
    accent: "#6366F1",
  },
  {
    slug: "golang-concurrency-2-channel",
    category: "Go",
    title: "Golang Concurrency 2: Channel 완전 정복",
    date: "2026-03-28",
    excerpt: "버퍼 채널, 단방향 채널, close 시그널까지. 실무에서 자주 마주치는 채널 패턴을 코드로 분해해봅니다.",
    tags: ["go", "concurrency", "channel"],
    readTime: 14,
    series: "Golang Concurrency",
    seriesOrder: 2,
    accent: "#00ADD8",
  },
  {
    slug: "mqtt-v5-완벽-가이드-1",
    category: "Database",
    title: "MQTT v5 완벽 가이드 1 — 입문과 기본 아키텍처",
    date: "2026-03-15",
    excerpt: "IoT 메시징의 사실상 표준 MQTT v5의 전체 그림. broker, topic, QoS, session까지 한 번에.",
    tags: ["mqtt", "iot", "messaging"],
    readTime: 9,
    series: "MQTT v5",
    seriesOrder: 1,
    accent: "#8E44AD",
  },
  {
    slug: "kubernetes-secret-안전하게-관리하기",
    category: "Cloud",
    title: "Kubernetes 환경에서 Secret 안전하게 관리하기",
    date: "2026-03-02",
    excerpt: "외부에 노출되면 안 되는 자격증명을 Kubernetes에서 관리하는 4가지 패턴 비교. SealedSecrets, External Secrets, Vault.",
    tags: ["kubernetes", "secret", "security"],
    readTime: 11,
    accent: "#326CE5",
  },
  {
    slug: "git-서브모듈이란",
    category: "Git",
    title: "Git 서브모듈이란 — 실전 예제로 배우는 활용법",
    date: "2026-02-18",
    excerpt: "여러 레포를 하나의 워크스페이스로 묶는 Git Submodule. 흔한 실수와 안전한 워크플로우.",
    tags: ["git", "submodule"],
    readTime: 7,
    accent: "#F05032",
  },
  {
    slug: "jpa-n1-문제-해결방법",
    category: "Database",
    title: "JPA N+1 문제 해결방법",
    date: "2026-02-04",
    excerpt: "Lazy 로딩이 N번의 추가 쿼리를 발생시키는 그 문제. fetch join, @EntityGraph, batch size까지 비교.",
    tags: ["jpa", "java", "performance"],
    readTime: 8,
    accent: "#F89820",
  },
  {
    slug: "pypi-업로드-가이드",
    category: "Python",
    title: "PyPI 업로드 가이드 — 나만의 Python 패키지 배포하기",
    date: "2026-01-22",
    excerpt: "pyproject.toml 작성부터 twine으로 업로드, 버전 관리까지. 처음 배포하는 사람을 위한 체크리스트.",
    tags: ["python", "pypi", "packaging"],
    readTime: 10,
    accent: "#3776AB",
  },
  {
    slug: "go-pprof-프로파일링",
    category: "Go",
    title: "Go pprof 프로파일링으로 성능 문제 진단하기",
    date: "2026-01-09",
    excerpt: "CPU와 메모리 병목을 찾는 Go의 표준 도구 pprof. 실제 트래픽에서 핫스팟을 찾아내는 방법.",
    tags: ["go", "performance", "profiling"],
    readTime: 13,
    accent: "#00ADD8",
  },
];

const CATEGORIES = [
  { name: "Cloud", count: 26 },
  { name: "Java", count: 24 },
  { name: "Go", count: 22 },
  { name: "Database", count: 18 },
  { name: "AI", count: 8 },
  { name: "Spring", count: 13 },
  { name: "Python", count: 10 },
  { name: "Git", count: 6 },
  { name: "DevOps", count: 5 },
  { name: "Mac", count: 6 },
];

const TOTAL_POSTS = 178;
const TOTAL_SERIES = 7;

window.SAMPLE_ARTICLES = SAMPLE_ARTICLES;
window.CATEGORIES = CATEGORIES;
window.TOTAL_POSTS = TOTAL_POSTS;
window.TOTAL_SERIES = TOTAL_SERIES;

// Korean date formatter
window.formatDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
window.formatDateLong = (iso) => {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// Generative SVG cover for each article (deterministic by slug + accent)
window.coverSvg = (article, variant = "geometric") => {
  const a = article.accent;
  const key = article.slug.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (n) => ((key * (n + 7)) % 100) / 100;

  if (variant === "mono") {
    // Terminal-style ascii grid
    const chars = ["·", "·", "·", "+", "—", "│", "/"];
    let g = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 16; x++) {
        const c = chars[Math.floor(r(x * y + x + y) * chars.length)];
        g += `<text x="${x * 24 + 12}" y="${y * 22 + 26}" font-family="JetBrains Mono, monospace" font-size="14" fill="${a}" opacity="${0.25 + r(x + y * 3) * 0.5}">${c}</text>`;
      }
    }
    return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="180" fill="#0A0A0A"/>${g}<text x="20" y="160" font-family="JetBrains Mono, monospace" font-size="11" fill="${a}" opacity="0.7">~/${article.category.toLowerCase()} $</text></svg>`;
  }

  if (variant === "editorial") {
    // Soft duo-tone with big numeral
    const num = String(((key % 99) + 1)).padStart(2, "0");
    return `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g${key}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.95"/><stop offset="1" stop-color="${a}" stop-opacity="0.65"/></linearGradient></defs>
      <rect width="400" height="220" fill="url(#g${key})"/>
      <text x="380" y="200" text-anchor="end" font-family="'Instrument Serif', Georgia, serif" font-size="180" font-style="italic" fill="white" fill-opacity="0.18">${num}</text>
      <text x="20" y="36" font-family="'JetBrains Mono', monospace" font-size="11" fill="white" fill-opacity="0.75" letter-spacing="2">${article.category.toUpperCase()}</text>
      <line x1="20" y1="46" x2="60" y2="46" stroke="white" stroke-opacity="0.6" stroke-width="1.5"/>
    </svg>`;
  }

  // geometric
  const shapes = [];
  const palette = [a, "#FFFFFF", "#F4F1EA"];
  for (let i = 0; i < 5; i++) {
    const x = r(i) * 400;
    const y = r(i * 3) * 220;
    const s = 30 + r(i * 5) * 90;
    const fill = palette[i % palette.length];
    const op = 0.15 + r(i * 7) * 0.5;
    if (i % 3 === 0) shapes.push(`<circle cx="${x}" cy="${y}" r="${s}" fill="${fill}" fill-opacity="${op}"/>`);
    else if (i % 3 === 1) shapes.push(`<rect x="${x}" y="${y}" width="${s * 1.6}" height="${s * 0.4}" fill="${fill}" fill-opacity="${op}"/>`);
    else shapes.push(`<path d="M${x} ${y} L${x + s} ${y + s * 0.6} L${x - s * 0.4} ${y + s}Z" fill="${fill}" fill-opacity="${op}"/>`);
  }
  return `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="220" fill="${a}"/>${shapes.join("")}</svg>`;
};

window.svgDataUri = (svgString) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
