# gRPC 서비스 구현과 Protobuf 활용 - TODO

> PRD: `6_12_go_grpc_prd.md`
> 구현 계획서: `6_12_go_grpc_implementation.md`

---

## 1단계: 프로젝트 초기 설정

- [x] `tutorials-go/grpc/todolist/` 디렉토리 생성
- [x] `go.mod` 초기화
- [x] `buf.yaml` 작성
- [x] `buf.gen.yaml` 작성 (protoc-gen-go, protoc-gen-go-grpc, grpc-gateway)
- [x] `Makefile` 작성 (buf generate, 실행 타겟)

## 2단계: Protobuf 정의 및 코드 생성

- [x] `proto/todo/v1/todo.proto` 작성 (TodoService CRUD 5개 + HTTP 어노테이션)
- [x] `buf generate` 실행하여 Go 코드 자동 생성
- [x] `gen/` 디렉토리에 생성된 코드 확인 (todo.pb.go, todo_grpc.pb.go, todo.pb.gw.go)

## 3단계: 서버 구현

- [x] `server/service.go` 작성 - TodoServiceServer 구현 (인메모리 저장소)
- [x] `server/run.go` 작성 - gRPC 서버 + TCP 리스너 (`:50051`)
- [x] 에러 처리: `codes.NotFound`, `codes.InvalidArgument` 적용

## 4단계: 클라이언트 구현

- [x] `cmd/client/main.go` 작성 - CRUD 시나리오 실행

## 5단계: 인터셉터

- [x] `interceptor/logging.go` 작성 - 로깅 Unary 인터셉터
- [x] 서버에 인터셉터 체인 적용 (`grpc.ChainUnaryInterceptor`)

## 6단계: gRPC-Gateway

- [x] `cmd/gateway/main.go` 작성 - REST 프록시 서버 (`:8080`)
- [x] gRPC 서버 + Gateway 동시 실행 확인
- [x] curl로 REST API 호출 테스트 (POST, GET, PUT, DELETE)

## 7단계: 테스트

- [x] `server_test.go` 작성 - bufconn 기반 통합 테스트
- [x] CRUD 흐름 테스트 통과 확인
- [x] 에러 케이스 테스트 (NotFound, InvalidArgument)
- [x] `go test -v ./...` 전체 테스트 통과 (3/3 PASS)

## 8단계: 블로그 글 작성

- [x] `docs/start/6_12_go_grpc/index.md` 초안 작성
- [x] Frontmatter 작성 (title, description, date, tags, series)
- [x] 2.1 gRPC란? (REST vs gRPC 비교 표)
- [x] 2.2 개발 환경 설정과 Protobuf 정의 (protoc, buf, 문법)
- [x] 2.3 TodoList 서비스 구현 (Unary RPC, 인터셉터, 테스트)
- [x] 2.4 gRPC 생태계 (Gateway, Connect-Go)
- [x] GitHub 저장소 코드 링크 추가
- [x] UTF-8 인코딩 확인 (`file -I`) → charset=utf-8 ✅

## 9단계: 최종 검증

- [x] 글 전체 읽기 흐름 확인
- [x] 코드 블록 문법 하이라이팅 확인
- [x] 샘플 코드 ↔ 블로그 내용 일치 확인 (인터셉터 로그 포맷 수정 완료)
