# uber/fx로 의존성 주입 구현하기 - 구현 계획

> PRD: `6_8_go_fx_di_prd.md`

---

## 1. 현황 분석

### 1.1 이미 구현된 것

| 항목 | 위치 | 상태 |
|------|------|------|
| fx 기본 DI (Provide, Invoke) | `go-clean-arch-v2/cmd/main.go` | ✅ 완료 |
| Lifecycle (OnStart/OnStop) | `go-clean-arch-v2/cmd/main.go` | ✅ 완료 |
| Config 생성자 | `go-clean-arch-v2/pkg/config/config.go` | ✅ 완료 |
| Database 생성자 | `go-clean-arch-v2/pkg/database/db.go` | ✅ 완료 |
| Article CRUD (Handler/UseCase/Repo) | `go-clean-arch-v2/article/` | ✅ 완료 |
| Author Repository | `go-clean-arch-v2/author/` | ✅ 완료 |
| Domain 인터페이스 | `go-clean-arch-v2/domain/` | ✅ 완료 |

### 1.2 신규 구현 필요

| 항목 | 위치 (예정) | 상태 |
|------|------------|------|
| fx.Module 패턴 예제 | `project-layout/go-clean-arch-v2/fx_test.go` | ❌ |
| fx.Decorate 패턴 예제 | `project-layout/go-clean-arch-v2/fx_test.go` | ❌ |
| fx.Annotate / Named 의존성 예제 | `project-layout/go-clean-arch-v2/fx_test.go` | ❌ |
| fxtest 테스트 예제 | `project-layout/go-clean-arch-v2/fx_test.go` | ❌ |
| 블로그 글 (index.md) | `docs/start/go-fx-의존성-주입/index.md` | ❌ |

### 1.3 의존성

현재: `go.uber.org/fx v1.13.1` (이미 go.mod에 존재)
- fx 최신 버전 확인 후 필요 시 업데이트 (fx.Module은 v1.17+, fx.Decorate는 v1.18+ 필요)

---

## 2. 샘플 코드 구현

### 2.1 fx 고급 패턴 테스트 파일

`project-layout/go-clean-arch-v2/fx_test.go`에 독립적인 테스트로 작성:

```go
TestFx_Module()           // fx.Module로 도메인별 그룹화
TestFx_Decorate()         // fx.Decorate로 기존 의존성 래핑
TestFx_Annotate_Named()   // fx.Annotate + Named 의존성
TestFx_Replace_Mock()     // fx.Replace로 테스트 시 Mock 주입
TestFx_Supply()           // fx.Supply로 값 직접 제공
```

### 2.2 fx.Module 패턴

기존 `cmd/main.go`의 flat Provide를 Module로 재구성하는 예제:

```go
var ArticleModule = fx.Module("article",
    fx.Provide(
        article.NewArticleHandler,
        article.NewArticleUsecase,
        article.NewMysqlArticleRepository,
    ),
)
```

### 2.3 fx.Decorate 패턴

Repository를 로깅/캐시로 래핑하는 예제:

```go
fx.Decorate(func(repo domain.ArticleRepository) domain.ArticleRepository {
    return NewLoggingArticleRepository(repo)
})
```

---

## 3. 블로그 글 구조

### 3.1 파일 위치

`blog-v2.advenoh.pe.kr/docs/start/go-fx-의존성-주입/index.md`

### 3.2 글 구조

```
# 1. 들어가며
# 2. uber/fx로 의존성 주입 구현하기
  ## 2.1 Go에서 DI가 필요한 이유
  ## 2.2 fx 기본 개념
  ## 2.3 Clean Architecture에서의 fx 적용
  ## 2.4 Lifecycle 관리
  ## 2.5 fx.Module 패턴
  ## 2.6 fx.Decorate 패턴
  ## 2.7 고급 패턴
  ## 2.8 테스트에서의 fx
  ## 2.9 의존성 그래프 시각화
  ## 2.10 실전 팁
# 3. 마무리
# 4. 참고
```

---

## 4. 기술적 고려사항

### 4.1 fx 버전 요구사항

- `fx.Module`: v1.17.0+ 필요
- `fx.Decorate`: v1.18.0+ 필요
- `fx.Annotate`: v1.14.0+ 필요
- 현재 v1.13.1 → **최신 버전으로 업데이트 필요**

### 4.2 테스트 인프라

- fx 고급 패턴 테스트는 DB 없이 인터페이스 기반으로 작성
- `fxtest.New()` 활용하여 앱 시작/종료 검증
