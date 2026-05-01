# 웹 권한 모델 비교 시리즈 (ACL/RBAC/ABAC) — 설계 문서

작성일: 2026-05-01
관련 이슈:
- 글: [`kenshin579/blog-v2.advenoh.pe.kr#474`](https://github.com/kenshin579/blog-v2.advenoh.pe.kr/issues/474)
- 코드: [`kenshin579/tutorials-go#704`](https://github.com/kenshin579/tutorials-go/issues/704)

## 1. 목적

웹 애플리케이션에서 자주 사용되는 세 가지 권한 모델 — ACL, RBAC, ABAC — 을 비교 학습하는 3부작 블로그 시리즈를 작성한다. 같은 메타 컨텍스트(사내 위키 / 협업 문서 도구) 위에서 각 편이 모델별로 자연스러운 시나리오를 다루며, 풀스택 샘플 코드(Go + React)로 차이를 입증한다.

## 2. 대상 독자

- Go 와 웹 프레임워크 경험이 있는 백엔드 개발자
- 권한 모델을 처음 진지하게 비교 학습하려는 사람
- "내 도메인엔 어떤 모델이 맞을까"의 의사결정 직관을 얻고 싶은 사람

## 3. 시리즈 구성

메타 컨텍스트는 **사내 위키 / 협업 문서 도구 (Notion·Confluence 풍)**. 각 편은 그 안의 다른 측면을 다룬다.

| 편 | 제목(가안) | 권한 모델 | 시나리오 |
|---|---|---|---|
| 1편 | ACL — 페이지 단위 공유 | Access Control List | 페이지마다 사용자에게 read/edit 권한을 직접 부여 (Notion식 페이지 공유) |
| 2편 | RBAC — 워크스페이스 역할 | Role-Based Access Control | admin/editor/viewer/guest 역할 기반 권한 |
| 3편 | ABAC — 분류와 속성 기반 정책 | Attribute-Based Access Control | 페이지 분류 + 사용자 부서·고용형태 + 시간대 등 속성 기반 정책 |

### 서사

1편(ACL)은 가장 단순한 출발점이다. 리소스마다 사용자를 직접 매핑한다. 사용자 수가 늘어나면 한계가 드러난다. → 2편(RBAC)에서 역할로 그룹핑해 같은 권한 부여 코드를 단순화한다. 같은 역할 안에서도 더 세밀한 조건이 필요한 경우 → 3편(ABAC)에서 속성·정책 기반으로 발전시킨다.

## 4. 기술 스택

### Backend (3편 공통)

| 구분 | 기술 |
|---|---|
| 언어 | Go (최신 안정 버전) |
| HTTP 프레임워크 | Echo v4 |
| ORM | GORM |
| DB | SQLite (각 편이 자체 DB 파일 보유) |
| 인증 | golang-jwt/jwt v5, bcrypt |

### Frontend (3편 공통)

| 구분 | 기술 |
|---|---|
| 언어 | TypeScript |
| 프레임워크 | React 19 |
| 빌드 | Vite |
| 라우팅 | React Router v7 |
| HTTP | Axios |
| 스타일 | Tailwind CSS v4 |

### 인증

- JWT access token만 발급(refresh 없음). 만료 시 재로그인.
- 미들웨어로 `Authorization: Bearer <token>` 검증 → `user_id` 및 필요한 속성을 컨텍스트 주입.

## 5. 저장소 구조

```
tutorials-go/wiki-permissions/
├── README.md            # 시리즈 개요 + 비교 표 + 각 디렉토리 가이드
├── 1-acl/
│   ├── README.md
│   ├── backend/         # Go + Echo + GORM + SQLite
│   │   ├── main.go
│   │   ├── domain/      # User, Page, ACLEntry
│   │   ├── repository/
│   │   ├── usecase/
│   │   ├── http/
│   │   │   ├── handler/
│   │   │   ├── middleware/  # JWT 인증, ACL 검증
│   │   │   └── router.go
│   │   ├── config/      # DB 초기화, 시드 데이터
│   │   └── pkg/jwt/
│   └── frontend/        # React 19 + TS
│       └── src/
│           ├── api/
│           ├── auth/
│           ├── pages/
│           └── components/
├── 2-rbac/              # 동일 골격, 권한 모델 부분만 다름
└── 3-abac/              # 동일 골격, 권한 모델 부분만 다름
```

각 편은 self-contained: 한 디렉토리만 클론해도 독립 실행 가능. SQLite 파일은 git ignore, 시작 시 시드 데이터로 자동 초기화.

## 6. 도메인 데이터 모델

### 공통 코어 (3편 모두)

- `User`: id, email, name, password_hash
- `Page`: id, title, content, owner_id (작성자)

### 1편 ACL — 추가

- `ACLEntry`: page_id, user_id, action ∈ {read, edit}

### 2편 RBAC — 추가

- `Role`: id, name (admin | editor | viewer | guest)
- `Permission`: id, resource, action
- `UserRole`: user_id, role_id (M:N)
- `RolePermission`: role_id, permission_id (M:N)

ACLEntry 없음. 사용자 → 역할 → 권한의 간접 매핑.

### 3편 ABAC — 추가 + 확장

- `User` 컬럼 추가: department_id, employment_type ∈ {fulltime, contract}
- `Page` 컬럼 추가: confidentiality ∈ {public, internal, confidential}, department_id
- `Department`: id, name
- 정책: **외부 라이브러리(OPA/Cedar) 사용하지 않고 Go 함수 기반의 미니 정책 평가기로 구현**. 라이브러리 학습 비용 없이 ABAC 본질(속성 기반 평가)에 집중하기 위함.

## 7. 시드 데이터 시나리오

### 공통 사용자 풀

| 사용자 | 부서(3편) | 고용형태(3편) |
|---|---|---|
| alice@example.com | Engineering | fulltime |
| bob@example.com | Engineering | fulltime |
| carol@example.com | Marketing | fulltime |
| dave@example.com | Marketing | contract |

### 공통 페이지 풀

| 페이지 | 분류(3편) | 부서(3편) | 작성자 |
|---|---|---|---|
| Engineering Roadmap | internal | Engineering | alice |
| Q4 Marketing Plan | confidential | Marketing | carol |
| Public Onboarding Guide | public | (none) | alice |

### 편마다 권한 데이터 차이

- **1편 ACL**: alice가 Engineering Roadmap 소유, bob에게 edit / carol에게 read 부여, dave는 권한 없음.
- **2편 RBAC**: alice=admin, bob=editor, carol=viewer, dave=guest. 역할별 권한 매트릭스로 페이지 액션 결정.
- **3편 ABAC**: 정책으로 평가 — "internal은 같은 부서만 read", "confidential은 같은 부서 정규직만 read+edit", "public은 모두 read".

같은 사람·같은 페이지에 모델만 바꿨을 때 누가 무엇을 할 수 있는지가 자연스럽게 비교된다.

## 8. 글 구성 템플릿

각 편 공통 골격:

1. 도입 — 사내 위키 시나리오 1단락
2. 개념 — 모델 정의 + Mermaid 다이어그램
3. 데이터 모델 — ER 다이어그램 + 핵심 GORM 모델 코드
4. 권한 검증 로직 — 미들웨어 + usecase 핵심 코드
5. 라우트 적용 — 선언적 미들웨어 사용 예
6. Frontend UX — 로그인 → 페이지 목록/상세 → 권한 게이팅 시연 (핵심 컴포넌트 2-3개만 본문, 나머지는 GitHub 링크)
7. 한계와 trade-off — 다음 편으로 자연스러운 연결
8. 마무리 — 전체 코드 링크

### 1편 추가 섹션

- 시리즈 개요
- ACL/RBAC/ABAC 비교 표 (요약)

### 3편 추가 섹션

- 시리즈 종합 비교
- "내 도메인엔 어떤 모델?" 의사결정 가이드

### 다이어그램

모두 Mermaid 사용. 편당 ER 다이어그램 1개 + 흐름도 1-2개 정도.

## 9. 테스트 정책

- Backend: 미들웨어/usecase 단위 테스트 작성 (주요 시나리오)
- 글에서는 핵심 1-2개 테스트만 짧게 인용 (전체는 GitHub 링크)
- Frontend 테스트는 이번 시리즈에서 생략 (분량 우선)

## 10. 발행 워크플로우

`blog-v2.advenoh.pe.kr/CLAUDE.md` 정책에 따른다.

1. **Draft**: `docs/start/{슬러그}/index.md`
2. **Review**: PR 생성 후 리뷰
3. **Merge Ready**: `docs/start/` → `docs/merge_ready/` 이동
4. **Publish**: `docs/merge_ready/` → `contents/web/{슬러그}/`. MergeReady 라벨로 자동 머지.

frontmatter 카테고리는 디렉토리 위치(`web/`)로 결정. 시리즈명은 `"웹 권한 모델 비교"` 또는 추후 확정. date는 발행 시점에 결정.

## 11. 브랜치 / PR 전략

### 점진적 PR (편마다 1개)

| 단계 | tutorials-go | blog-v2 |
|---|---|---|
| 1편 | feat 브랜치 + 코드 PR | docs 브랜치 + 글 PR |
| 2편 | feat 브랜치 + 코드 PR | docs 브랜치 + 글 PR |
| 3편 | feat 브랜치 + 코드 PR | docs 브랜치 + 글 PR |

브랜치명 예시:
- `tutorials-go`: `feature/704-wiki-permissions-acl`, `feature/704-wiki-permissions-rbac`, `feature/704-wiki-permissions-abac`
- `blog-v2`: `docs/#474-wiki-permissions-acl-post`, 등

모든 PR reviewer: `kenshin579`.

### 진행 순서

1. spec 머지
2. 1편 코드 PR → 머지 → 1편 글 draft → 글 PR → 머지 → 발행
3. 2편 동일 절차
4. 3편 동일 절차

## 12. 결정 사항 요약 (브레인스토밍에서 확정)

| 결정 항목 | 선택 |
|---|---|
| 글 스코프 | ACL/RBAC/ABAC 비교 (B안) |
| 시리즈 구조 | 3편, 각 모델 1편씩 (B안) |
| Backend 스택 | Go + Echo + GORM + **SQLite** (A안 + SQLite) |
| Frontend 포함 | 풀스택 (C안) |
| 도메인 매핑 | 같은 메타 컨텍스트 + 각 모델별 다른 시나리오 (Z안) |
| 메타 도메인 | 사내 위키 / 협업 문서 도구 (A안) |
| 인증 방식 | JWT access only (B안) |
| 저장소 구조 | 한 부모 + 모델별 서브디렉토리, 각자 독립 풀스택 (A안) |
| PR 분할 | 점진적 (편마다 1 PR씩) (X안) |

## 13. 후속 결정 사항 (구현 단계에서 확정)

- Go 구체 버전 (`tutorials-go` 기존 코드와의 호환성 고려)
- ABAC 정책 평가기의 구체 인터페이스 (조건 표현식 형태, 정책 등록 방법, public 페이지의 부서 처리)
- 인증 미들웨어가 컨텍스트에 주입할 속성 범위 (각 모델별 필요 속성)
- 각 편의 라우트/엔드포인트 명세
- 시드 데이터 완전화 — 본 spec에 명시되지 않은 페이지/사용자 조합의 권한 데이터
- Frontend 페이지 목록/상세 화면 구체 디자인 + 권한 게이팅 시나리오
- README.md 분량과 구조 (시리즈 개요 + 각 편 가이드)
- 시리즈 글 슬러그 최종 확정 + 시리즈명 frontmatter 값 확정

## 14. 트래킹

- 글 이슈: [`blog-v2.advenoh.pe.kr#474`](https://github.com/kenshin579/blog-v2.advenoh.pe.kr/issues/474)
- 코드 이슈: [`tutorials-go#704`](https://github.com/kenshin579/tutorials-go/issues/704)
- 본 spec PR: 작업 중인 브랜치 `docs/#474-wiki-permissions-spec`
