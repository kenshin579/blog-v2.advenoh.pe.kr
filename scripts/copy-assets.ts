import fs from 'fs';
import path from 'path';

/**
 * 이미지 파일 확장자
 */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

/**
 * 파일이 이미지인지 확인
 */
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * 디렉토리 재귀 탐색하여 이미지 파일 찾기
 */
function findImages(dir: string, baseDir: string, images: Map<string, string>) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findImages(fullPath, baseDir, images);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      // contents/ 이후의 상대 경로 계산
      const relativePath = path.relative(baseDir, fullPath);
      images.set(relativePath, fullPath);
    }
  }
}

/**
 * 슬라이드 데크 파일명 → public 하위 경로 prefix
 * ko: public/{글폴더}/slides/index.html
 * en: public/en/{글폴더}/slides/index.html
 */
const SLIDE_VARIANTS = [
  { file: 'slides.html', prefix: '', lang: 'ko' as const },
  { file: 'slides_en.html', prefix: 'en', lang: 'en' as const },
];

interface SlideSource {
  /** contents 아래 원본 절대 경로 */
  sourcePath: string;
  /** 이 데크가 속한 글의 주소. 돌아가기 링크의 목적지 */
  articleUrl: string;
  lang: 'ko' | 'en';
}

/**
 * contents/{category}/{글폴더}/slides*.html 을 찾아
 * [목적지 상대 경로, SlideSource] 맵으로 반환한다.
 *
 * 목적지에서 category 를 떼는 규칙은 라우트가 쓰는
 * lib/articles.ts 의 getArticleTitleFromSlug() 와 동일하다.
 * (script 는 단독 node 프로세스이므로 의존성 최소화 위해 inline)
 */
function findSlides(contentsDir: string): Map<string, SlideSource> {
  const slides = new Map<string, SlideSource>();

  const categories = fs
    .readdirSync(contentsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryPath = path.join(contentsDir, category);
    const articleDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const articleDir of articleDirs) {
      for (const { file, prefix, lang } of SLIDE_VARIANTS) {
        const sourcePath = path.join(categoryPath, articleDir, file);
        if (!fs.existsSync(sourcePath)) continue;

        const destPath = path.join(prefix, articleDir, 'slides', 'index.html');
        // 글 주소에는 카테고리가 들어가지 않는다 (라우트 규칙과 동일).
        // 한글 폴더명은 인코딩하지 않는다 — lib/markdown.ts 의 임베드 src 와 같은 방식이다.
        const articleUrl = prefix ? `/${prefix}/${articleDir}/` : `/${articleDir}/`;
        slides.set(destPath, { sourcePath, articleUrl, lang });
      }
    }
  }

  return slides;
}

/**
 * 배포되는 슬라이드에 주입할 테마 동기화 스크립트.
 * 슬라이드 원본(contents 아래 slides.html)은 건드리지 않는다 — 원본은 외부 의존성 없는
 * 자기완결형으로 유지하고, public/ 으로 복사되는 사본에만 이 기능을 얹는다.
 *
 * 슬라이드는 블로그와 같은 오리진에서 서빙되므로 localStorage 를 공유한다.
 * 그래서 블로그의 next-themes 값을 그대로 읽을 수 있다.
 */
const THEME_SYNC_MARKER = 'data-slides-theme-sync';

const THEME_SYNC_SCRIPT = `<!-- 아래 블록은 scripts/copy-assets.ts 가 배포 시 주입한다. 원본 slides.html 에는 없다. -->
<script ${THEME_SYNC_MARKER}>
(function () {
  "use strict";
  var BLOG_KEY = "theme";      /* next-themes 기본 storageKey */
  var DECK_KEY = "deck-theme"; /* 슬라이드 자체 저장 키 */

  function prefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* 블로그 테마를 light/dark 로 확정한다. "system" 이거나 값이 없으면 OS 설정을 따른다. */
  function resolveBlogTheme() {
    var v = null;
    try { v = localStorage.getItem(BLOG_KEY); } catch (e) {}
    if (v === "light" || v === "dark") { return v; }
    return prefersDark() ? "dark" : "light";
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    /* 슬라이드 자체 초기화 코드가 문서 하단에서 deck-theme 를 읽어 속성을 다시 설정한다.
       미리 같은 값으로 맞춰 두면 서로 싸우지 않고, 이전에 슬라이드에서 토글해 둔 값이
       블로그 값으로 덮여 "다시 열면 블로그 기준" 규칙이 성립한다. */
    try { localStorage.setItem(DECK_KEY, theme); } catch (e) {}
  }

  /* 슬라이드의 테마 전환 경로를 그대로 탄다.
     toggleTheme() 이 표지 스파크라인을 다시 그리는 drawHero() 를 부르는데,
     그 함수들이 IIFE 안에 있어 밖에서 직접 호출할 수 없기 때문이다. */
  function switchTo(theme) {
    if (document.documentElement.getAttribute("data-theme") === theme) { return; }
    var btn = document.getElementById("btnTheme");
    if (btn) { btn.click(); } else { apply(theme); }
  }

  apply(resolveBlogTheme());

  /* 블로그에서 테마를 바꾸면 같은 오리진의 이 문서로 storage 이벤트가 온다.
     (값을 바꾼 문서 자신에게는 오지 않는다)
     임베드된 경우에는 부모가 본문 innerHTML 을 다시 써서 iframe 자체가 재생성되므로
     이 리스너보다 재로드가 먼저 일어난다. 이 리스너는 슬라이드를 별도 탭에 띄워 둔
     상태에서 블로그 탭의 테마를 바꾸는 경우를 위한 것이다. */
  window.addEventListener("storage", function (e) {
    if (e.key !== BLOG_KEY) { return; }
    switchTo(resolveBlogTheme());
  });

  /* 블로그가 "system" 인 동안 OS 테마가 바뀌는 경우 */
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      var v = null;
      try { v = localStorage.getItem(BLOG_KEY); } catch (e) {}
      if (v === "light" || v === "dark") { return; } /* 명시 설정이면 OS 변화를 무시 */
      switchTo(prefersDark() ? "dark" : "light");
    });
  } catch (e) {}
})();
</script>
`;

/**
 * </head> 바로 앞에 테마 동기화 스크립트를 끼워 넣는다.
 * 첫 페인트 전에 테마가 확정되어야 깜빡임이 없다.
 */
function injectThemeSync(html: string, label: string): string {
  // 방어적 가드다. copySlides 는 매번 원본(마커 없음)에서 새로 읽으므로 현재 호출
  // 경로에서는 발동하지 않는다. 실제 멱등성은 "원본 불변 + 결정적 변환"에서 나온다.
  if (html.includes(THEME_SYNC_MARKER)) return html;

  const idx = html.lastIndexOf('</head>');
  if (idx === -1) {
    console.warn(`⚠️  ${label}: </head> 를 찾을 수 없어 테마 동기화 스크립트를 주입하지 못했습니다`);
    return html;
  }

  return html.slice(0, idx) + THEME_SYNC_SCRIPT + html.slice(idx);
}

/**
 * 배포되는 슬라이드에 주입할 "글로 돌아가기" 링크.
 * 원본(contents 아래 slides.html)은 건드리지 않는다 — 테마 동기화와 같은 원칙이다.
 *
 * 데크는 글 본문에 iframe 으로도 박힌다. 그 경우 이 링크는 자기를 감싼 글로 가는
 * 링크가 되어 클릭하면 iframe 안에 글이 중첩된다. 그래서 프레임 안에서는 숨긴다.
 * 검사를 </head> 안에서 하는 이유는 첫 페인트 전에 끝내기 위해서다 — body 에서
 * 지우면 가장 흔한 화면인 글 임베드에서 링크가 한 번 깜빡였다 사라진다.
 */
const BACK_LINK_MARKER = 'data-slides-back-link';

/** 라벨 원본: lib/i18n/dictionaries.ts 의 t.slides. 이 스크립트는 tsx 로 도는
 *  독립 프로세스라 @/ 별칭을 해석하지 못해 여기에 복제해 둔다. */
const BACK_LABEL: Record<'ko' | 'en', string> = {
  ko: '← 글 보기',
  en: '← Article',
};

const BACK_LINK_HEAD = `<!-- 아래 블록은 scripts/copy-assets.ts 가 배포 시 주입한다. 원본 slides.html 에는 없다. -->
<style ${BACK_LINK_MARKER}>
.deck-back {
  font-family: var(--f-mono);
  font-size: 11.5px;
  letter-spacing: .08em;
  color: var(--ink-faint);
  text-decoration: none;
  white-space: nowrap;
  transition: color .15s;
}
.deck-back:hover { color: var(--accent); }
.deck-back:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
[data-framed] .deck-back { display: none; }
</style>
<script ${BACK_LINK_MARKER}>
/* 임베드(iframe) 안이면 돌아가기 링크를 감춘다. 첫 페인트 전에 확정해야 깜빡임이 없다. */
(function () {
  try {
    if (window.self !== window.top) {
      document.documentElement.setAttribute("data-framed", "");
    }
  } catch (e) {
    /* 크로스 오리진 접근 차단도 프레임 안이라는 뜻이다 */
    document.documentElement.setAttribute("data-framed", "");
  }
})();
</script>
`;

/**
 * </head> 앞에 스타일·스크립트를, .chrome 안 맨 앞에 링크를 넣는다.
 * .chrome 은 flex row 라 항목이 하나 느는 것뿐이다.
 */
function injectBackLink(html: string, source: SlideSource, logLabel: string): string {
  if (html.includes(BACK_LINK_MARKER)) return html;

  const headIdx = html.lastIndexOf('</head>');
  if (headIdx === -1) {
    console.warn(`⚠️  ${logLabel}: </head> 를 찾을 수 없어 돌아가기 링크를 주입하지 못했습니다`);
    return html;
  }
  let out = html.slice(0, headIdx) + BACK_LINK_HEAD + html.slice(headIdx);

  const anchor = '<span class="deck-id">';
  const chromeIdx = out.indexOf(anchor);
  if (chromeIdx === -1) {
    console.warn(`⚠️  ${logLabel}: .chrome 의 deck-id 를 찾을 수 없어 돌아가기 링크를 넣지 못했습니다`);
    return out;
  }

  const link = `<a class="deck-back" href="${source.articleUrl}">${BACK_LABEL[source.lang]}</a>\n    `;
  out = out.slice(0, chromeIdx) + link + out.slice(chromeIdx);

  return out;
}

/**
 * 슬라이드를 주입과 함께 복사한다.
 * 내용이 바뀌므로 copyFiles() 의 fs.copyFileSync 경로를 쓸 수 없고,
 * mtime/size 스킵도 적용하지 않는다 (주입으로 크기가 달라져 매번 다시 쓴다).
 * 슬라이드는 글당 1~2개뿐이라 비용이 무시할 수준이다.
 */
function copySlides(slides: Map<string, SlideSource>, destRoot: string) {
  let copiedCount = 0;

  for (const [relativePath, source] of slides) {
    const destPath = path.join(destRoot, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    try {
      const raw = fs.readFileSync(source.sourcePath, 'utf-8');
      const html = injectBackLink(injectThemeSync(raw, relativePath), source, relativePath);
      fs.writeFileSync(destPath, html, 'utf-8');
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${relativePath}:`, error);
    }
  }

  return copiedCount;
}

/**
 * 자산 맵을 목적지 루트로 복사한다.
 * key = 목적지 루트 기준 상대 경로, value = 원본 절대 경로
 */
function copyFiles(files: Map<string, string>, destRoot: string) {
  let copiedCount = 0;
  let skippedCount = 0;

  for (const [relativePath, sourcePath] of files) {
    const destPath = path.join(destRoot, relativePath);
    const destDir = path.dirname(destPath);

    // 대상 디렉토리 생성
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // 파일이 이미 존재하고 내용이 같으면 스킵
    if (fs.existsSync(destPath)) {
      const sourceStats = fs.statSync(sourcePath);
      const destStats = fs.statSync(destPath);

      if (sourceStats.size === destStats.size &&
          sourceStats.mtimeMs === destStats.mtimeMs) {
        skippedCount++;
        continue;
      }
    }

    // 파일 복사
    try {
      fs.copyFileSync(sourcePath, destPath);
      // 원본 파일의 mtime 보존
      const stats = fs.statSync(sourcePath);
      fs.utimesSync(destPath, stats.atime, stats.mtime);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${relativePath}:`, error);
    }
  }

  return { copiedCount, skippedCount };
}

/**
 * 메인 실행
 */
function main() {
  const contentsDir = path.join(process.cwd(), 'contents');
  const publicDir = path.join(process.cwd(), 'public');
  const publicImagesDir = path.join(publicDir, 'images');

  console.log('🔍 Scanning for images in contents/...');
  const images = new Map<string, string>();
  findImages(contentsDir, contentsDir, images);

  console.log(`✅ Found ${images.size} images`);

  if (images.size > 0) {
    console.log('📋 Copying images to public/images/...');
    const { copiedCount, skippedCount } = copyFiles(images, publicImagesDir);

    console.log(`✅ Copy complete!
  - Copied: ${copiedCount} files
  - Skipped: ${skippedCount} files (unchanged)
  - Total: ${images.size} files
  `);
  } else {
    console.log('ℹ️  No images to copy from contents/');
  }

  // 슬라이드 데크 복사 (public/{글폴더}/slides/index.html)
  console.log('\n🔍 Scanning for slides in contents/...');
  const slides = findSlides(contentsDir);
  console.log(`✅ Found ${slides.size} slide decks`);

  if (slides.size > 0) {
    const copiedCount = copySlides(slides, publicDir);
    console.log(`✅ Slides copied: ${copiedCount} (테마 동기화 스크립트 주입)`);
  } else {
    console.log('ℹ️  No slides to copy from contents/');
  }

  // Copy default image
  console.log('\n🔍 Copying default image...');
  const defaultImageSource = path.join(
    process.cwd(),
    'attached_assets',
    'generated_images',
    'default.png'
  );
  const defaultImageDestDir = path.join(publicImagesDir, 'default');
  const defaultImageDest = path.join(defaultImageDestDir, 'default.png');

  // Check if source file exists
  if (!fs.existsSync(defaultImageSource)) {
    console.error(`❌ Default image not found: ${defaultImageSource}`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(defaultImageDestDir)) {
    fs.mkdirSync(defaultImageDestDir, { recursive: true });
  }

  // Copy default image
  try {
    fs.copyFileSync(defaultImageSource, defaultImageDest);
    console.log(`✅ Default image copied to ${defaultImageDest}`);
  } catch (error) {
    console.error(`❌ Failed to copy default image:`, error);
  }
}

main();
