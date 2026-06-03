---
name: translate-article-en
description: Use when translating a Korean blog article (contents/{category}/{slug}/index.md) into English to create its index_en.md counterpart for the multilingual blog
---

# Translate Article to English (index_en.md)

## Overview

이 블로그는 한국어 원문 `index.md`와 영어 번역본 `index_en.md`를 같은 디렉토리에 둔다(이미지 공유). 이 스킬은 한국어 `index.md`를 받아 같은 디렉토리에 `index_en.md`를 생성한다. 핵심 원칙: **콘텐츠·의미는 영어로, 코드 로직과 식별자는 보존, 코드 안의 한글은 영어로**.

## When to Use

- 특정 글의 영어 버전을 만들 때 (`contents/.../index.md` → 같은 폴더 `index_en.md`)
- 이미 `index_en.md`가 있으면 덮어쓰기 전에 사용자에게 확인

## 대상 지정

- **단일 글**: slug(`go/타입-변환-type-conversion`) 또는 `index.md` 경로
- **폴더(카테고리)**: 그 안의 글들을 순회하되 **한 번에 최대 5개까지만** 번역한다.
  - `index_en.md`가 아직 없는 글을 우선 대상으로 한다(이미 번역된 글은 건너뜀).
  - 5개를 초과하면 처음 5개만 처리하고, **남은 글 목록과 "다시 실행하면 이어서 번역됨"을 사용자에게 보고**한다.
  - 사용자가 "전부 번역해줘"라고 명시해도, 한 번에 5개씩 끊어서 진행 상황을 보고하며 처리한다(코드 보존·품질을 배치마다 확인하기 위함).

## Procedure

1. 대상 `contents/{category}/{slug}/index.md`를 읽는다.
2. 아래 규칙에 따라 영어로 번역한다.
3. 같은 디렉토리에 `index_en.md`로 저장한다 (이미지·경로 그대로).
4. `npm run generate:manifest`를 실행해 매니페스트에 영어 항목이 잡히는지 확인한다.
5. (선택) `npm run build`로 `/en/{slug}/` 렌더 확인.

## Translation Rules

| 항목 | 처리 |
|------|------|
| 본문 산문 | 영어로 번역 (자연스러운 기술문서 톤) |
| frontmatter `title` / `description` | 영어로 번역 |
| frontmatter `tags` | **그대로 유지** (번역/추가/삭제 안 함 — 검색 일관성) |
| frontmatter `date` / `update` / `series` / `seriesOrder` | **원본 값 유지** |
| 섹션 heading | 영어로 번역 (`# 참고` → `# References`, `# 들어가며` → `# Introduction` 등) |
| 코드 블록의 코드/식별자/문법 | **보존** (변수명·함수명·키워드 변경 금지) |
| 코드 블록 안의 한글 (주석·한글 문자열·한글 샘플데이터) | **영어로 번역** |
| Mermaid 노드 텍스트 | 영어로 번역 (`<br/>` 등 HTML 태그 추가 금지 — 파서 에러) |
| 이미지 참조 `![](...)` / `<img>` / 링크 / URL | **그대로 보존** (이미지 공유) |
| GitHub 등 외부 링크 | 그대로 유지 |
| 문단 구조·빈 줄·코드 들여쓰기(탭/스페이스) | **원문 그대로 보존** (재배치·정규화 금지) |

`title`과 `description`이 원문에서 동일하더라도, 영어본에서는 `title`은 간결한 제목, `description`은 한 문장 요약으로 자연스럽게 작성한다(둘이 같아도 무방하나 description은 검색 스니펫이므로 의미를 담는 편이 좋다).

## 코드 블록 처리 (가장 주의)

코드는 동작이 깨지면 안 된다. **로직·식별자·문법은 한 글자도 바꾸지 말 것.** 다만 코드 안의 한글만 영어로 바꾼다.

```go
// 예제에서는 int 형을 변환한다   →   // Convert an int value in this example
var 결과 = 1  // (식별자가 한글이면) 그대로 둘지 신중히 — 출력/매칭에 쓰이면 보존, 단순 지역변수면 영어화 가능하나 기본은 보존
```

- 주석(`//`, `#`, `/* */`): 한글 → 영어
- 한글 문자열 리터럴: 영어로 번역하되, **기능적으로 의미 있는 값**(매칭 키, 테스트 기대 출력, `//Output:` 블록의 기대값)은 보존. 애매하면 원문을 주석으로 병기.
- 식별자(변수·함수명)에 한글이 있으면 기본 보존(다른 코드/링크와의 정합성). 확실히 안전할 때만 영어화.

## Frontmatter 예시

원문:
```yaml
title: "타입 변환 (Type Conversion)"
description: "타입 변환 (Type Conversion)"
tags:
  - golang
  - 형변환
```
영어본:
```yaml
title: "Type Conversion in Go"
description: "How explicit type conversion works in Go."
tags:
  - golang
  - 형변환
```
(tags는 그대로. title/description은 자연스러운 영어로 — 원문이 단순 반복이면 의미를 살려 의역.)

## Common Mistakes

- ❌ 코드 식별자/로직을 영어로 바꿔 예제가 깨짐 → ✅ 코드는 보존, 한글 주석만 번역
- ❌ tags를 영어로 번역 → ✅ 그대로 유지
- ❌ `index.en.md`로 저장 → ✅ **`index_en.md`** (언더스코어)
- ❌ 이미지 파일명을 영어로 바꿈 → ✅ 원본 경로 그대로 (이미지 공유)
- ❌ Mermaid 노드에 `<br/>` 추가 → ✅ 줄바꿈 필요 시 노드 분리/단순화
- ❌ 리스트 항목 끝에 마침표 추가 → ✅ 이 블로그 컨벤션상 리스트 항목 끝 마침표 없음
- ❌ 번역 후 매니페스트 갱신 누락 → ✅ `npm run generate:manifest` 실행

## After Translating

```bash
npm run generate:manifest
node -e "const m=require('./public/content-manifest.json'); console.log(m.articles.filter(a=>a.lang==='en').map(a=>a.slug))"
```
영어 항목 목록에 새 slug이 보이면 성공. 발행 전 `npm run build`로 `/en/{slug}/` 렌더를 확인한다.
