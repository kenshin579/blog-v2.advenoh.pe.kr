# Go 1.25 변경사항 블로그 - Todo

## Phase 1: 환경 준비

- [x] `tutorials-go/golang/go1_25/` 디렉토리 생성
- [x] `tutorials-go/go.mod` Go 버전 확인 및 필요 시 업데이트 (1.25 이상)
- [x] Go 1.25 로컬 설치 확인 (`go version`)

## Phase 2: 샘플 코드 작성

- [x] `gomaxprocs_test.go` 작성 - GOMAXPROCS 조회 및 SetDefaultGOMAXPROCS
- [x] `flight_recorder_test.go` 작성 - FlightRecorder 생성 및 WriteTo 스냅샷
- [x] `nil_pointer_test.go` 작성 - 잘못된 패턴 vs 올바른 패턴
- [x] `synctest_test.go` 작성 - synctest.Test + synctest.Wait 가상 시간 테스트
- [x] `waitgroup_go_test.go` 작성 - 기존 Add/Done vs wg.Go() 비교
- [x] `reflect_type_assert_test.go` 작성 - TypeAssert[T] vs Interface().(T)
- [x] `csrf_protection_test.go` 작성 - CrossOriginProtection 미들웨어 테스트
- [x] `testing_attr_test.go` 작성 - t.Attr() 속성 기록
- [x] `vet_hostport_test.go` 작성 - Sprintf vs JoinHostPort 비교
- [x] `go test ./golang/go1_25/...` 전체 테스트 통과 확인

## Phase 3: 블로그 포스트 작성

- [x] `blog-v2.advenoh.pe.kr/contents/go/go-1-25-변경사항-whats-new-in-go-1-25/` 디렉토리 생성
- [x] `index.md` 파일 생성 및 frontmatter 작성
- [x] 1장: 개요 작성
- [x] 2장: 런타임 변경사항 작성 (GOMAXPROCS, Green Tea GC, Flight Recorder, Panic, VMA)
- [x] 3장: 컴파일러 개선 작성 (nil 포인터, DWARF5, 스택 슬라이스)
- [x] 4장: 표준 라이브러리 변경 작성 (synctest, json/v2, WaitGroup.Go, TypeAssert, CSRF, Attr, crypto, unicode)
- [x] 5장: 도구 변경사항 작성 (ignore, doc -http, version -json, Vet)
- [x] 6장: 플랫폼 변경사항 작성
- [x] 7장: 정리 및 요약 표 작성
- [x] 인코딩 확인 (`file -I index.md` → charset=utf-8)

## Phase 4: 검증

- [x] `tutorials-go/` 에서 `go test ./golang/go1_25/...` 최종 통과 확인
- [x] `blog-v2.advenoh.pe.kr/` 에서 `npm run build` 빌드 성공 확인
