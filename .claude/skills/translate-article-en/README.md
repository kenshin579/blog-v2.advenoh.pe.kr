# translate-article-en 사용법

한국어 블로그 글(`contents/{category}/{slug}/index.md`)을 영어로 번역해 같은 폴더에 `index_en.md`를 생성하는 스킬이다. 로컬에서 **수동으로** 실행한다(빌드 타임 자동 번역 아님).

## 실행 방법

블로그 저장소(`blog-v2.advenoh.pe.kr/`)에서 Claude Code 세션을 띄운 뒤 그 안에서 호출한다. `.claude/skills/`의 프로젝트 스킬이라 이 디렉토리에서 실행하면 자동 인식된다.

### 1) 슬래시로 호출
```
/translate-article-en go/타입-변환-type-conversion
```

### 2) 자연어로 호출
```
translate-article-en 스킬로 contents/go/jq-명령어-json-처리기-사용법 글을 영어로 번역해줘
```

## 대상 지정 방법

| 지정 | 예시 | 동작 |
|------|------|------|
| 글 slug | `go/타입-변환-type-conversion` | 해당 글 1건 번역 |
| `index.md` 경로 | `contents/go/.../index.md` | 그 글 1건 번역 |
| 카테고리 폴더 | `contents/mac` | 폴더 내 글 일괄 번역 — **한 번에 최대 5개** |

- **폴더 지정 시**: `index_en.md`가 없는 글을 우선해 최대 5개만 번역하고, 남은 글 목록을 보고한다. 다시 실행하면 이어서 번역된다.
- 이미 `index_en.md`가 있으면 덮어쓰기 전에 확인한다.

## 동작 흐름

1. 대상 `index.md`를 읽는다
2. 규칙대로 영어로 번역한다 (자세한 규칙은 `SKILL.md` 참고)
3. 같은 폴더에 `index_en.md`로 저장한다 (이미지·링크 공유)
4. `npm run generate:manifest`로 매니페스트에 영어 항목 반영
5. (발행 전) `npm run build`로 `/en/{slug}/` 렌더 확인

## 번역 규칙 요약

자세한 내용은 같은 폴더의 `SKILL.md` 참고.

- **번역**: 본문, `title`/`description`, 섹션 heading, Mermaid 노드 텍스트, **코드 안의 한글(주석·한글 문자열)**
- **보존**: 코드 로직·식별자·문법, `tags`/`date`/`update`/`series`, 이미지/링크/URL, 문단·빈 줄·들여쓰기
- 코드 내 **기능적으로 의미 있는 한글값**(매칭 키, 테스트 기대 출력 등)은 보존

## 주의

- 출력 파일명은 반드시 `index_en.md`(언더스코어). `index.en.md` 아님.
- 한 번에 모든 글을 자동 번역하지 않는다 — 코드 보존·품질을 글마다 확인하기 위한 수동 방식.
