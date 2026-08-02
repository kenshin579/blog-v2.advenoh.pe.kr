# 수학 공식(LaTeX) 렌더링 지원 설계

- 날짜: 2026-08-02
- 상태: 승인됨

## 목표

`contents/` 마크다운 글 본문에서 LaTeX 수식(`$...$` 인라인, `$$...$$` 디스플레이)을 사용할 수 있게 한다. 기존에는 수식이 필요한 글에서 코드블록으로 대체해 왔다.

## 결정 사항

### 렌더링 방식: 빌드 타임 KaTeX

`remark-math` + `rehype-katex` 조합으로 빌드 시 수식을 HTML/MathML로 미리 렌더링한다.

- 클라이언트 JS 0KB — 완전 정적 export 철학과 일치 (rehype-prism-plus와 같은 패턴)
- 대안으로 검토한 MathJax SVG(출력 크고 빌드 느림), 클라이언트 KaTeX(FOUC + JS 부담)는 기각

### 인라인 문법: remark-math 기본값 (`$...$` 허용)

- GitHub/Obsidian/Jupyter와 동일한 표준 작성 경험
- 오탐 위험 측정 완료: 기존 글 364개 중 코드블록 밖 `$...$` 쌍은 글 1개(ko/en 2파일)뿐이며, 인라인 코드로 감싸 해결
- 향후 산문에서 달러 금액을 `$5 ~ $10`처럼 쓰면 수식으로 오인될 수 있음 — `\$` 이스케이프 또는 인라인 코드로 회피

### 디스플레이 문법: ` ```math ` 코드펜스 (markora 호환)

글쓴이가 JetBrains IDE에서 **markora**로 마크다운을 편집하므로, markora가 수식으로 인식하는 표기에 맞춘다.

- markora는 디스플레이 수식을 `$$...$$`가 아니라 **` ```math ` 코드펜스**로 직렬화한다 (`frontend/src/markdown/customParse.ts:57`, `postParse`에서 역방향도 동일)
- `remark-math` v6는 ` ```math ` 펜스를 디스플레이 수식으로 이미 처리한다 — **파이프라인 추가 변경 불필요**
- `$$...$$`도 blog에서는 렌더되지만 markora에서는 평문으로 보이므로 쓰지 않는다
- 인라인 `$...$`는 양쪽 동일. markora 정규식(`customParse.ts:108`)이 더 엄격해 여는 `$` 뒤·닫는 `$` 앞 공백을 금지하고 `$10` 같은 통화를 배제한다. 그 제약을 지키면 양쪽 모두에서 안전하다

## 변경 내용

### 1. 파이프라인 — `lib/markdown.ts`

의존성 3개 추가: `remark-math`, `rehype-katex`, `katex`

```
remarkParse → remarkGfm → remarkMath(신규) → remarkRehype → rehypeRaw
→ rehypeKatex(신규) → rehypeSlug → rehypeAutolinkHeadings → rehypePrism → rehypeStringify
```

- `rehypeKatex`는 **rehypePrism보다 앞에** 배치한다. 수식이 `<code class="language-math">` 형태의 중간 표현을 거치므로, prism이 먼저 돌면 수식 코드를 하이라이팅 대상으로 오인할 수 있다.
- 옵션은 기본값 사용. 문법 오류 시 빨간 텍스트로 렌더링되어 dev에서 바로 발견 가능.

### 2. CSS — 글 페이지에만 로드

`app/[slug]/page.tsx`, `app/en/[slug]/page.tsx`에 `import 'katex/dist/katex.min.css'` 추가.

- 목록/홈 페이지에는 로드되지 않음
- KaTeX 폰트는 Next.js가 빌드 시 정적 자산으로 번들링
- 다크 모드: KaTeX가 `currentColor`를 상속하므로 자동 대응

### 3. 기존 콘텐츠 수정 (1건)

`contents/java/맥-환경에서-여러-jdk-버전-설치하고-변경하기/` ko/en 2파일의 `PATH=$PATH:$JAVA_HOME/bin`을 인라인 코드로 감싼다 (원래도 코드로 표기했어야 하는 부분).

### 4. 첫 적용 사례 — Bloom Filter 글 수식 전환

`docs/read/bloom-filter-완벽-가이드-개념부터-go-구현까지/index.md`의 코드블록 수식을 LaTeX로 전환한다 (이 글이 수식 지원의 원래 동기).

- 디스플레이 수식 3개 (` ```text ` → ` ```math `):
  - `p = (1 - e^(-kn/m))^k` → `p = \left(1 - e^{-kn/m}\right)^k`
  - `k = (m/n) * ln2` → `k = \frac{m}{n} \ln 2`
  - `m = -n * ln(p) / (ln2)^2` → `m = -\frac{n \ln p}{(\ln 2)^2}`
- 인라인 수식 22개 → `$...$`. 3.1절 유도 4단계, 3.2절 k 산출 공식, 4.3절 해시 관련 상한(`2^{32}` 등), 4.5·5.3절 통계값
- 인라인에는 `\frac` 대신 슬래시 형태(`1 - 1/m`)를 쓴다 — 브라우저 확인 결과 `\frac`이 행 높이를 튀게 만들었다
- 수식이 아닌 코드블록·인라인 코드는 그대로 유지: 벤치마크 출력, redis CLI, Cuckoo Filter 의사코드, Go 식(`h1 + i*h2`, `pos%64` 등)

### 5. 문서화

- 블로그 `CLAUDE.md`에 수식 작성 가이드 추가: 문법, `\$` 이스케이프 주의사항

## 건드리지 않는 것 (YAGNI)

| 항목 | 결정 | 근거 |
|------|------|------|
| RSS (`scripts/generators/rss.ts`) | 경량 파이프라인 유지 | RSS 리더에는 `$...$` 원문 노출 — 허용 가능한 트레이드오프 |
| 검색 인덱스 | 변경 없음 | TeX 원문이 그대로 인덱싱되어도 문제없음 |
| TOC | 변경 없음 | 제목에 수식을 넣으면 TOC 정규식이 매칭하지 못해 목차에서 빠짐 — 알려진 제약. 제목에는 수식을 쓰지 않는다 |
| KaTeX 확장(mhchem 등) | 미도입 | 필요해지면 별도 작업 |

## 검증

1. 테스트 글로 육안 확인 (`npm run dev`) — `docs/read/`의 글은 dev 서버가 렌더링하지 않으므로, 수식 전환한 bloom filter 글을 `contents/` 하위에 임시 복사해 확인하고 커밋 전에 제거한다:
   - 인라인 `$...$` / 디스플레이 `$$...$$`
   - 한글 산문과 수식 혼용
   - 코드펜스·인라인 코드 안의 `$`가 변환되지 **않는지**
   - 라이트/다크 모드 전환
2. `npm run check`(tsc) + `npm run build` 통과
3. `$`를 많이 쓰는 기존 글(shell/Makefile 계열) 렌더링 회귀 확인
