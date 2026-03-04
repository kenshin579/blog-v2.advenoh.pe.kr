# uber/fx로 의존성 주입 구현하기 - TODO

> PRD: `6_8_go_fx_di_prd.md`
> 구현 계획: `6_8_go_fx_di_implementation.md`

---

## 1단계: fx 버전 업데이트 및 환경 준비

- [x] `go.uber.org/fx` 최신 버전으로 업데이트 (v1.13.1 → v1.24.0)
- [x] 기존 `go-clean-arch-v2` 코드 빌드 확인

---

## 2단계: fx 고급 패턴 샘플 코드 작성

- [x] `project-layout/go-clean-arch-v2/fx_test.go` 생성
- [x] `TestFx_Provide_Invoke` - 기본 Provide/Invoke 패턴
- [x] `TestFx_Supply` - fx.Supply로 값 직접 제공
- [x] `TestFx_Module` - fx.Module로 도메인별 의존성 그룹화
- [x] `TestFx_Decorate` - fx.Decorate로 기존 의존성 래핑
- [x] `TestFx_Annotate_Named` - fx.Annotate + Named 의존성
- [x] `TestFx_Replace_Mock` - fx.Replace로 Mock 주입
- [x] `TestFx_Lifecycle` - Lifecycle OnStart/OnStop 테스트
- [x] 전체 7개 테스트 통과 확인

---

## 3단계: 블로그 글 작성

- [x] `docs/start/go-fx-의존성-주입/index.md` 생성
- [x] 1. 들어가며
- [x] 2.1 Go에서 DI가 필요한 이유
- [x] 2.2 fx 기본 개념 (Provide, Invoke, Supply)
- [x] 2.3 Clean Architecture에서의 fx 적용
- [x] 2.4 Lifecycle 관리 (OnStart/OnStop)
- [x] 2.5 fx.Module 패턴
- [x] 2.6 fx.Decorate 패턴
- [x] 2.7 고급 패턴 (Annotate, Named)
- [x] 2.8 테스트에서의 fx (fxtest, Replace)
- [x] 2.9 의존성 그래프 시각화 (Mermaid)
- [x] 2.10 실전 팁
- [x] 3. 마무리
- [x] 4. 참고 (링크 정리)

---

## 4단계: 최종 검증

- [x] 전체 테스트 통과 확인 (7개 PASS)
- [x] 블로그 글 내 코드 스니펫과 실제 코드 일치 확인
- [x] 블로그 글 인코딩 확인 (`file -I index.md` → utf-8 ✅)
- [ ] PR 생성
