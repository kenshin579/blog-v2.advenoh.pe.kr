# gRPC Streaming RPC 패턴 - TODO

> PRD: `6_13_go_grpc_streaming_prd.md`
> 구현 문서: `6_13_go_grpc_streaming_implementation.md`

---

## Phase 1: 프로젝트 셋업

- [x] `tutorials-go/grpc/todolist-streaming/` 디렉토리 생성
- [x] `buf.yaml`, `buf.gen.yaml` 설정 (기존 todolist 참고)
- [x] `proto/todo_streaming.proto` 작성 (3가지 Streaming + Unary 벤치마크용)
- [x] `buf generate`로 Go 코드 생성
- [x] `Makefile` 작성 (generate, run-server, run-client)

## Phase 2: Server Streaming 구현

- [x] 서버: `ListTodos()` 구현 - `Send()` 루프로 필터링된 Todo 전송
- [x] 클라이언트: `Recv()` 루프 + `io.EOF` 처리
- [x] 테스트: bufconn 기반 Server Streaming 테스트

## Phase 3: Client Streaming 구현

- [x] 서버: `BatchCreateTodos()` 구현 - `Recv()` 루프 + `SendAndClose()`
- [x] 클라이언트: `Send()` 루프 + `CloseAndRecv()`
- [x] 테스트: bufconn 기반 Client Streaming 테스트

## Phase 4: Bidirectional Streaming + 고루틴 패턴

- [x] 서버: `TodoUpdates()` 구현 - recv → 처리 → send 루프
- [x] 클라이언트: send/recv 고루틴 분리 패턴 (directional channel)
- [x] 클라이언트: errgroup 패턴 버전 추가
- [x] 테스트: bufconn 기반 Bidirectional Streaming 테스트

## Phase 5: 인터셉터 & 에러 처리

- [x] `interceptor/stream_logging.go` - StreamServerInterceptor + wrappedStream
- [x] 서버에 Stream 인터셉터 등록
- [x] context timeout 적용 테스트
- [x] 전체 테스트 통과 확인: `go test ./...`

## Phase 6: 성능 벤치마크

- [x] `benchmark_test.go` 작성
  - [x] `BenchmarkUnaryCreateTodos` (Unary 반복 호출)
  - [x] `BenchmarkStreamingCreateTodos` (Client Streaming 배치)
  - [x] `BenchmarkUnaryGetTodos` (Unary 전체 조회)
  - [x] `BenchmarkStreamingGetTodos` (Server Streaming 조회)
- [x] `go test -bench=. -benchmem` 실행 및 결과 기록

## Phase 7: 블로그 글 작성

- [x] `docs/start/go-grpc-streaming/index.md` 초안 작성
  - [x] frontmatter (title, description, date, tags, series)
  - [x] §1 들어가며 (Unary 한계 → Streaming 필요성)
  - [x] §2.1 Streaming RPC 개요 (Mermaid 다이어그램, 4가지 패턴 비교)
  - [x] §2.2 3가지 Streaming 구현 (Server / Client / Bidi 코드 발췌)
  - [x] §2.3 Bidirectional 고루틴 패턴 (directional channel, errgroup)
  - [x] §2.4 에러 처리 & 인터셉터 (timeout, EOF, wrappedStream)
  - [x] §2.5 성능 비교 (벤치마크 결과 표)
  - [x] §3 마무리
  - [x] §참고
- [x] 코드 블록에 tutorials-go GitHub 링크 참조
- [x] `file -I`로 UTF-8 인코딩 확인
