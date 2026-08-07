# 인터랙티브 퀴즈 설계

- 작성일: 2026-08-07
- 대상 저장소: `blog-v2.advenoh.pe.kr`

## 1. 목표

블로그 글의 퀴즈를 서술형 `<details>` 접기에서 실제 퀴즈 형식으로 바꾼다. 독자가 보기를 클릭하면 즉시 정답/오답 판정과 해설이 나오고, 세트를 다 풀면 점수가 집계된다.

## 2. 현재 상태

- 퀴즈가 있는 글은 2편이다: `contents/go/go-fx-의존성-주입/`, `contents/cloud/grafana-완벽-가이드-1-prometheus와-grafana-기초/` (각각 `index.md` + `index_en.md`, 세트당 10문항)
- 형식은 전부 서술형이다. `# 5. 퀴즈` 섹션에 `<details><summary>` 질문을 적고 펼치면 답이 나온다. 선택지·판정·점수가 없다.
- 본문 HTML은 빌드 시 생성되어 `MermaidRenderer`(클라이언트 컴포넌트)가 `dangerouslySetInnerHTML`로 렌더하고, `code.language-mermaid` 블록을 찾아 SVG로 교체한다. 인터랙티브 요소를 정적 HTML에 붙이는 검증된 선례다.

## 3. 범위

### 포함

- 문제 유형 4종: 객관식(mcq), OX(ox), 코드 결과 맞히기(code), 빈칸 채우기(blank)
- 세트 단위 점수 집계와 다시 풀기
- 기존 2편(한/영 총 4파일, 40문항)의 서술형 문항을 새 형식으로 변환
- CLAUDE.md에 퀴즈 작성 가이드 절 추가
- 검색 인덱스에서 퀴즈 블록 제외

### 제외 (YAGNI)

- 점수 저장(localStorage 등). 진행 상태는 메모리에만 유지하고 새로고침하면 초기화된다
- 글 전체 통합 점수. 점수는 ` ```quiz ` 블록(세트) 단위로만 집계한다
- 서버 통계, 랭킹, 공유 기능
- 서술형 문항 유형. 기존 서술형은 4유형으로 변환하며 새 형식에 서술형은 없다

## 4. 선택한 접근: 코드펜스 + 클라이언트 컴포넌트 교체 (Mermaid 패턴)

검토한 대안과 선택 이유:

| 안 | 작성 위치 | 변환 시점 | 판단 |
|----|----------|----------|------|
| **1안 (선택)** | `index.md`의 ` ```quiz ` 블록 | 독자 브라우저 | Mermaid와 동일 패턴. 파일 하나만 만지고 파이프라인 수정 없음 |
| 2안 | 별도 `quiz.yaml` + 본문 마커 | 빌드+렌더 | 글과 문항이 분리되어 작성·수정 시 두 파일을 오가야 함 |
| 3안 | ` ```quiz ` 블록 | 빌드(rehype 플러그인) | no-JS/RSS에서 가장 깔끔하지만 신규 배관의 유지보수 비용이 과함 |

1안의 트레이드오프: JS를 끈 브라우저와 RSS에서 YAML 원문(답 포함)이 코드 블록으로 노출된다. 블로그 독자 사실상 전원이 JS 켠 브라우저라는 점에서 감수한다. 검색 인덱스 노출은 생성 스크립트에서 필터링으로 막는다.

## 5. 작성 형식

블록 하나가 퀴즈 세트 하나다. 문항은 YAML 배열이고 4가지 유형을 섞어 쓸 수 있다. 블록을 글 중간에 여러 개 둘 수 있으며(장 끝 미니 퀴즈), 세트마다 점수가 따로 집계된다.

````markdown
```quiz
- type: mcq
  q: "fx.Provide에 생성자를 등록했는데 실행되지 않는 이유는?"
  choices:
    - "등록 순서가 잘못되어서"
    - "fx.Invoke가 없어서"
    - "생성자가 에러를 반환해서"
    - "fx.Supply를 빠뜨려서"
  answer: 1
  explain: "fx.Provide는 lazy 등록이라 그 타입을 요구하는 fx.Invoke가 있어야 실행된다. (2.2절)"

- type: ox
  q: "Bloom Filter는 false negative가 발생할 수 있다"
  answer: false
  explain: "넣은 원소의 비트는 0으로 돌아가지 않는다. (1.3절)"

- type: code
  q: "이 코드의 출력은?"
  lang: go
  code: |
    s := []int{1, 2, 3}
    fmt.Println(s[1:])
  choices: ["[1 2 3]", "[2 3]", "[2]", "컴파일 에러"]
  answer: 1
  explain: "s[1:]은 인덱스 1부터 끝까지의 슬라이스다."

- type: blank
  q: "Prometheus가 타겟의 메트릭을 가져가는 방식을 ___ 방식이라 한다"
  answer: ["pull", "풀"]
  explain: "타겟이 밀어내는 push가 아니라 서버가 긁어가는 pull이다. (2.1절)"
```
````

### 유형별 필드

| 유형 | 필수 필드 | 비고 |
|------|----------|------|
| `mcq` | `q`, `choices`, `answer`, `explain` | `answer`는 0부터 세는 정답 인덱스 |
| `ox` | `q`, `answer`, `explain` | `answer`는 `true`/`false` |
| `code` | `q`, `lang`, `code`, `choices`, `answer`, `explain` | mcq에 코드 블록이 붙은 형태. `code`는 YAML 블록 스칼라(`|`) |
| `blank` | `q`, `answer`, `explain` | `q`의 빈칸은 `___`(밑줄 3개). `answer`는 허용 답 배열. 비교 시 앞뒤 공백 제거·소문자화 |

`explain`은 전 유형 공통 필수다. 정답 여부와 함께 표시되며, 관련 절 안내("(2.2절)")를 담는다.

### 다국어

문항은 `index.md` / `index_en.md` 각자의 블록에 언어별로 쓴다. UI 문구(점수, 다시 풀기, 정답, 오답 등)는 `lib/i18n` 사전에 키를 추가해 쓴다.

## 6. 렌더링 구조

Mermaid와 같은 바꿔치기 패턴이되, 퀴즈는 상태(선택·점수)를 가지므로 innerHTML 교체가 아니라 React portal로 붙인다.

### 컴포넌트

| 단위 | 책임 |
|------|------|
| `components/article/article-body.tsx` (신규) | 본문 HTML을 `dangerouslySetInnerHTML`로 렌더하고 mermaid·quiz 후처리를 함께 수행하는 컨테이너 |
| `components/article/mermaid-renderer.tsx` (수정) | 컨테이너에서 호출되는 후처리로 역할 축소. SVG 교체 로직은 그대로 |
| `components/article/quiz-renderer.tsx` (신규) | `code.language-quiz` 탐색 → YAML 파싱 → 마운트 포인트 생성 → `createPortal`로 `<Quiz>` 렌더 |
| `components/article/quiz.tsx` (신규) | 퀴즈 세트 UI. 문항 상태, 판정, 점수 집계, 다시 풀기 |

`article-body.tsx`를 신설하는 이유: 현재 본문 HTML을 `MermaidRenderer`가 소유하는데, 퀴즈 렌더러가 같은 DOM을 따로 만지면 두 컴포넌트의 생명주기가 얽힌다. 컨테이너 하나가 HTML을 소유하고 후처리 둘을 조율한다.

### 의존성

- `yaml` 패키지 추가 (클라이언트 파싱용)

### 오류 처리

- YAML 파싱 실패 또는 필수 필드 누락: 콘솔 경고를 남기고 원래 코드 블록을 그대로 둔다. Mermaid의 실패 처리와 같다. 문항 하나가 깨져도 세트 전체를 버리지 않고, 깨진 문항만 건너뛴다.

## 7. UI 동작

- 문항마다: 보기 클릭(blank는 입력 후 확인 버튼) → 즉시 정답/오답 표시 + `explain` 노출 → 답 변경 불가
- 전 문항 응답 시 세트 하단에 점수 카드("8 / 10 맞았습니다")와 다시 풀기 버튼
- 다시 풀기: 해당 세트의 모든 상태 초기화
- 진행 상태는 메모리에만 유지. 저장 없음
- 스타일: 기존 shadcn/ui 프리미티브(Button, Input, Card 계열)와 본문 톤을 따르고 라이트/다크 대응
- `code` 유형의 코드 표시는 본문 코드 블록과 같은 하이라이팅 톤을 따른다

## 8. 부수 작업

- **검색 인덱스**: `scripts/generate-search-index.ts`에서 인덱싱 전에 ` ```quiz ` 펜스 블록을 제거한다
- **RSS**: `scripts/generate-feeds.ts`를 확인해 피드 본문에 YAML이 실리면 같은 필터를 적용한다
- **기존 글 변환**: go-fx, grafana 각 10문항(한/영 총 40문항)을 4유형 혼합으로 재작성하고 `<details>` 서술형을 제거한다. 문항 수는 세트당 10을 유지한다
- **CLAUDE.md**: 퀴즈 작성 가이드 절 추가 — 블록 형식, 유형별 필드, 권장 문항 수(10), `explain`에 관련 절 안내를 넣는 관례

## 9. 완료 기준

- 4유형 문항이 렌더되고 판정·해설·점수·다시 풀기가 동작한다
- go-fx, grafana 글(한/영)에서 새 퀴즈가 동작하고 `<details>` 서술형이 남아 있지 않다
- `npm run build` 성공, 빌드된 HTML에서 퀴즈 블록이 코드 블록으로 존재한다 (클라이언트 교체 전 상태)
- `search-index.json`에 퀴즈 YAML 텍스트가 들어 있지 않다
- 라이트/다크 모드 양쪽에서 스타일 확인
- CLAUDE.md에 작성 가이드가 있다
