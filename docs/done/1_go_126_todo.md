# Go 1.26 변경사항 블로그 - TODO

## Phase 1: 환경 준비
- [x] `tutorials-go/go.mod` Go 버전 1.26으로 업데이트
- [x] `tutorials-go/golang/go1_26/` 디렉토리 생성

## Phase 2: 샘플 코드 작성
- [x] `new_expr_test.go` - new(expr) 초기값 지정 예제
- [x] `recursive_generics_test.go` - 제네릭 자기참조 예제
- [x] `errors_astype_test.go` - errors.AsType 비교 예제
- [x] `reflect_iter_test.go` - reflect 반복자 예제
- [x] `buffer_peek_test.go` - bytes.Buffer.Peek 예제
- [x] `slog_multi_test.go` - slog.NewMultiHandler 예제
- [x] `io_readall_bench_test.go` - io.ReadAll 벤치마크
- [x] `fmt_errorf_bench_test.go` - fmt.Errorf 벤치마크
- [x] `artifact_dir_test.go` - testing.ArtifactDir 예제
- [x] `signal_context_test.go` - signal.NotifyContext + Cause 예제
- [x] `netip_compare_test.go` - netip.Prefix.Compare 예제
- [x] 전체 테스트 실행 확인 (`go test ./golang/go1_26/...`)

## Phase 3: 블로그 포스트 작성
- [x] 블로그 디렉토리 생성 (`go-1-26-변경사항-whats-new-in-go-1-26/`)
- [x] index.md frontmatter 작성
- [x] 1장: 언어 변경사항 작성 (new, 제네릭 자기참조)
- [x] 2장: 성능 개선 작성 (Green Tea GC, cgo, io.ReadAll, fmt.Errorf, 메모리 할당)
- [x] 3장: 표준 라이브러리 변경 작성 (7개 항목)
- [x] 4장: 보안 및 암호화 작성 (crypto/hpke, API 개선, 힙 무작위화, TLS)
- [x] 5장: 도구 개선 작성 (go fix, go mod init)
- [x] 6장: 실험적 기능 작성 (SIMD, goroutine leak, secret)
- [x] 7장: 기타 변경사항 작성
- [x] 8장: 정리 작성 (요약표, Go 1.27 예고)
- [x] UTF-8 인코딩 확인 (`file -I`)

## Phase 4: 검증
- [x] 튜토리얼 테스트 최종 확인 (`go test ./golang/go1_26/...`) - 30/30 PASS
- [x] 블로그 빌드 확인 (`npm run build`) - 148 articles, 156 pages 성공
