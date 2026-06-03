# Blog v2 다국어(EN/KO) 지원 설계

- 작성일: 2026-06-03
- 대상: `blog-v2.advenoh.pe.kr` (Next.js App Router, 정적 export, Netlify 배포)
- 목표: 한국어 중심 IT 블로그에 영어 지원을 추가해 영어권 독자에게 콘텐츠와 UI를 모두 영어로 제공

## 배경 / 동기

Google Analytics 분석 결과 영어 사용자가 가장 큰 세그먼트로 나타났다.

- 언어별 활성 사용자: English ~1,200 > Korean ~350 > Chinese ~180 > Japanese 소수
- 국가별 활성 사용자: Singapore ~1,100, South Korea 365, China 167, United States 32, Vietnam 8 등

영어권이 부가 독자가 아니라 사실상 주력 독자층이므로, 글 콘텐츠뿐 아니라 사이트 UI 전체를 영어로 제공하는 완전 현지화를 도입한다.

## 요구사항

- 대상 언어: 영어(en), 한국어(ko)
- 글 콘텐츠 + UI 전체 현지화
- 헤더에 언어 토글(EN | KR)
- 첫 로딩 시 브라우저 언어 자동 감지
- 언어 선택 시 **그 언어로 작성된 콘텐츠만** 노출 (영어 모드 = 영어 글만, 한국어 모드 = 한국어 글만)
- 번역은 별도 skill로 로컬에서 수동 실행하여 영어 md를 생성 (자동 빌드 번역 아님)

## 현재 구조 (변경 전)

- 스택: Next.js App Router + `output: 'export'`(정적), `trailingSlash: true`, Netlify(`publish = out`)
- 콘텐츠: `contents/{category}/{slug}/index.md` (frontmatter: title/description/date/update/tags/series/seriesOrder)
- manifest: `scripts/generate-content-manifest.ts` → `public/content-manifest.json`
- 라우팅: `app/[slug]/page.tsx` — slug은 카테고리를 뺀 글 제목(마지막 경로). URL은 `/{글제목}/` 형태
- 콘텐츠 로딩: `lib/articles.ts` (manifest 캐싱 + `getArticle` 등)
- 기존 영어 처리(임시방편): `-en` 접미사 별도 디렉토리 3건(`contents/cloud/ksqldb-소개-en`, `kafka-cli-명령어-모음-en`, `jaeger에-대한-소개-en`). 한국어 글과 연결·언어 토글·hreflang 없이 별개 글로 노출됨

## 설계

### 1. 콘텐츠 구조

- `contents/{category}/{slug}/index.md` — 한국어 (기존 그대로, 마이그레이션 없음)
- `contents/{category}/{slug}/index_en.md` — 영어 (번역 skill이 생성)
- 이미지는 같은 디렉토리에서 두 언어가 공유 (중복 없음)
- 영어본 frontmatter: `title`/`description` 번역, `tags` 유지, `date`/`update`/`series`/`seriesOrder` 원본 유지
- 짝(pairing)은 같은 디렉토리 = 같은 글로 자동 결정 (별도 링크 필드 불필요)

### 2. URL & 라우팅

- 한국어: `/{글제목}/` (기존 URL 그대로 유지 → 기존 SEO/색인/외부링크 보존)
- 영어: `/en/{글제목}/`
- 카테고리·태그·시리즈·목록·검색 페이지도 `/en/` 하위에 영어판 생성
- 정적 export이므로 `generateStaticParams`에서 `index_en.md`가 존재하는 글만 `/en/...` 경로를 생성

### 3. 언어 감지 + 토글 + 기억

- **첫 진입 감지**: Netlify 리다이렉트의 `Language` 조건으로 `/`에 진입한 영어권 방문자를 `/en/`으로 302 리다이렉트 (Accept-Language 기반, 엣지 처리라 화면 깜빡임 없음). 서버 없는 정적 사이트에 가장 적합
- **헤더 토글(EN | KR)**: 현재 글의 반대 언어 짝으로 이동. 짝(`index_en.md`)이 없으면 해당 언어의 홈/목록으로 이동
- **수동 선택 기억**: 토글로 고른 언어를 `localStorage`에 저장하여 다음 방문 시 자동 감지보다 우선 적용 (클라이언트 보정)

### 4. 목록 & manifest (언어 필터링)

- `generate-content-manifest.ts`가 `index.md`(ko)와 `index_en.md`(en)를 각각 스캔하여 항목마다 `lang` 필드를 부여
- 단일 manifest에 `lang` 필드 부여 후 로딩 함수에서 언어 필터 (언어별 manifest 분리보다 단순)
- 목록/카테고리/태그/시리즈/검색 인덱스 모두 활성 언어로 필터 → 영어 모드엔 `index_en.md`가 있는 글만, 한국어 모드엔 한국어 글만 노출

### 5. UI 문자열 현지화

- 헤더/네비/버튼/라벨("관련 글", "이전/다음", "목차", 카테고리명, 날짜 포맷 등) 문자열을 `lib/i18n/{ko,en}.ts` 사전으로 분리
- 활성 언어를 경로(`/en` 여부) 또는 Context에서 판별해 사전 조회
- 카테고리/시리즈명 한↔영 매핑 테이블 (예: `cloud`→"Cloud", `데이터베이스`→"Database")

### 6. SEO (hreflang / sitemap / RSS)

- 짝이 있는 글은 `<link rel="alternate" hreflang="ko|en|x-default">` 상호 링크
- sitemap·feeds(`generate-feeds.ts`)가 ko·en URL을 모두 포함, 언어별 RSS(`/rss.xml`, `/en/rss.xml`) 제공
- 영어 메타데이터(title/description/OpenGraph)는 `index_en.md` frontmatter 사용

### 7. 번역 skill (로컬 수동 실행)

입력 `index.md`(한국어) → 출력 `index_en.md`(영어)

번역 대상:
- 본문 산문 → 자연스러운 영어 기술문서 톤
- frontmatter `title`·`description`
- Mermaid 다이어그램 노드 텍스트 (단 `<br/>` 등 HTML 태그 금지·문법 깨짐 주의)
- **코드 블록 내부의 한글** (주석, 한글 문자열 리터럴, 한글 샘플 데이터) → 영어

보존 대상:
- 코드 문법·로직 (한글 외 코드는 그대로)
- frontmatter `tags`·`date`·`update`·`series`·`seriesOrder`
- 이미지 참조·링크·URL

주의:
- 코드 내 한글이 **기능적으로 의미 있는 경우**(매칭 키, 출력이 정확히 일치해야 하는 테스트 기대값 등)는 번역 시 동작이 깨질 수 있으므로 신중히 처리. 애매하면 원문을 주석으로 병기
- 리스트 항목 끝 마침표 제거 등 블로그 마크다운 컨벤션 반영
- 한국어 평어체↔영어 매핑은 불필요 (영어는 영어 관용 스타일로 작성)
- `series`명은 영어 표기로 매핑 (매핑 테이블 공유)

### 8. 기존 `-en` 디렉토리 마이그레이션

- 기존 `-en` 디렉토리 3건을 원본 글의 `index_en.md`로 통합:
  - `contents/cloud/ksqldb-소개-en` → `contents/cloud/ksqldb-소개/index_en.md`
  - `contents/cloud/kafka-cli-명령어-모음-en` → `contents/cloud/kafka-cli-명령어-모음/index_en.md`
  - `contents/cloud/jaeger에-대한-소개-en` → `contents/cloud/jaeger에-대한-소개/index_en.md`
- 통합 후 `-en` 디렉토리 삭제, 중복 이미지 정리

## 작업 순서 (단계)

1. 콘텐츠 구조 정립 + manifest `lang` 확장 (`index_en.md` 스캔)
2. 라우팅 `/en` 추가 + 언어별 목록 필터링
3. UI 문자열 사전(`lib/i18n`) + 헤더 토글 + Netlify 언어 감지 + `localStorage` 기억
4. SEO: hreflang, sitemap, 언어별 RSS
5. 번역 skill 작성 (로컬 수동 실행)
6. 기존 `-en` 디렉토리 3건 통합·정리

## 비범위 (Out of Scope)

- 영어/한국어 외 추가 언어(중국어/일본어 등) — 추후 동일 패턴으로 확장 가능하되 이번 범위 아님
- 빌드 타임 자동 번역 — 번역은 skill로 수동 실행
- 댓글/검색 등 외부 위젯의 현지화 (해당 위젯이 자체 언어 설정을 따름)

## 결정 근거 요약

- URL: 기존 한국어 URL을 루트에 보존(영어만 `/en/`)하여 기존 SEO 자산을 깨지 않음
- 콘텐츠: 같은 디렉토리 페어링으로 짝 연결 자동화 + 이미지 공유 + 마이그레이션 최소화
- 감지: 정적 export 제약상 Netlify 엣지 `Language` 리다이렉트가 깜빡임 없이 가장 단순
