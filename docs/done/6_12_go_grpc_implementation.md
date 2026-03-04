# gRPC 서비스 구현과 Protobuf 활용 - 구현 계획서

> PRD: `6_12_go_grpc_prd.md`

---

## 1. 샘플 코드 작성 (tutorials-go)

**위치**: `tutorials-go/grpc/todolist/`

### 1.1 프로젝트 초기 설정

| 파일 | 내용 |
|---|---|
| `go.mod` | 모듈 초기화 (`tutorials-go/grpc/todolist`) |
| `buf.yaml` | buf 모듈 설정 (name, lint, breaking 룰) |
| `buf.gen.yaml` | 코드 생성 플러그인 설정 (protoc-gen-go, protoc-gen-go-grpc, grpc-gateway) |
| `Makefile` | `buf generate`, 서버/클라이언트/게이트웨이 실행 타겟 |

### 1.2 Protobuf 정의

**`proto/todo/v1/todo.proto`**
- TodoService 정의 (5개 Unary RPC)
  - `CreateTodo(CreateTodoRequest) returns (CreateTodoResponse)`
  - `GetTodo(GetTodoRequest) returns (GetTodoResponse)`
  - `ListTodos(ListTodosRequest) returns (ListTodosResponse)`
  - `UpdateTodo(UpdateTodoRequest) returns (UpdateTodoResponse)`
  - `DeleteTodo(DeleteTodoRequest) returns (DeleteTodoResponse)`
- Message 정의: `Todo` (id, title, completed, created_at)
- gRPC-Gateway용 HTTP 어노테이션 포함

```protobuf
import "google/api/annotations.proto";

service TodoService {
  rpc CreateTodo(CreateTodoRequest) returns (CreateTodoResponse) {
    option (google.api.http) = {
      post: "/v1/todos"
      body: "*"
    };
  }
  rpc GetTodo(GetTodoRequest) returns (GetTodoResponse) {
    option (google.api.http) = {
      get: "/v1/todos/{id}"
    };
  }
  // ...
}
```

### 1.3 서버 구현

**`server/main.go`**
- gRPC 서버 생성 + TCP 리스너 (`:50051`)
- TodoService 등록
- 로깅 인터셉터 체인

**`server/service.go`**
- `TodoServiceServer` 인터페이스 구현
- 인메모리 저장소 (`sync.Mutex` + `map[string]*todopb.Todo`)
- CRUD 로직 + gRPC 상태 코드 에러 처리 (`codes.NotFound`, `codes.InvalidArgument`)

### 1.4 클라이언트 구현

**`client/main.go`**
- `grpc.NewClient()` 연결
- CreateTodo → ListTodos → UpdateTodo → GetTodo → DeleteTodo 시나리오 실행

### 1.5 인터셉터

**`interceptor/logging.go`**
- `grpc.UnaryServerInterceptor` 구현
- 요청 메서드명, 처리 시간, 에러 여부 로깅

### 1.6 gRPC-Gateway

**`gateway/main.go`**
- `runtime.NewServeMux()` + `RegisterTodoServiceHandlerFromEndpoint()`
- HTTP `:8080` → gRPC `:50051` 프록시
- JSON ↔ Protobuf 자동 변환

### 1.7 테스트

**`server_test.go`**
- `bufconn` 기반 인메모리 gRPC 연결
- CRUD 흐름 통합 테스트: Create → Get → List → Update → Delete
- 에러 케이스: 존재하지 않는 Todo 조회 → `codes.NotFound`

---

## 2. 블로그 글 작성

**위치**: `blog-v2.advenoh.pe.kr/docs/start/6_12_go_grpc/index.md`

### 2.1 글 구조

```
1. gRPC란?
   - REST vs gRPC 비교 표
   - HTTP/2 + Protobuf 장점

2. 개발 환경 설정과 Protobuf 정의
   2.1 protoc 기반 설정
   2.2 buf 도구 소개 (protoc vs buf 비교)
   2.3 Protobuf 문법 + TodoList 서비스 정의

3. TodoList 서비스 구현
   3.1 Unary RPC (서버 + 클라이언트 + 에러 처리)
   3.2 인터셉터 (로깅 미들웨어)
   3.3 테스트 (bufconn)

4. gRPC 생태계
   4.1 gRPC-Gateway (REST 자동 노출)
   4.2 Connect-Go 소개 (간단 비교)
```

### 2.2 Frontmatter

```yaml
title: "Go gRPC 서비스 구현과 Protobuf 활용"
description: "Go에서 gRPC 서비스를 구현하고 Protocol Buffers로 API를 정의하는 방법을 TodoList 예제로 알아봅니다. buf 도구, 인터셉터, gRPC-Gateway, Connect-Go까지 다룹니다."
date: 2026-03-XX
tags:
  - golang
  - go
  - grpc
  - protobuf
  - grpc-gateway
  - buf
  - connect-go
series: "Golang 시리즈"
```

### 2.3 코드 블록 규칙
- 블로그 내 코드는 핵심 부분만 인라인으로 포함
- 전체 코드는 GitHub 저장소 링크로 참조
- 링크 형식: `github.com/kenshin579/tutorials-go/grpc/todolist/`

---

## 3. 핵심 구현 포인트

### bufconn 테스트 패턴
```go
func bufDialer(context.Context, string) (net.Conn, error) {
    return lis.DialContext(context.Background())
}

func TestTodoService_CRUD(t *testing.T) {
    lis = bufconn.Listen(bufSize)
    s := grpc.NewServer()
    todopb.RegisterTodoServiceServer(s, NewTodoService())
    go s.Serve(lis)

    conn, _ := grpc.NewClient("passthrough:///bufnet",
        grpc.WithContextDialer(bufDialer),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    client := todopb.NewTodoServiceClient(conn)
    // CRUD 테스트...
}
```

### gRPC-Gateway 프록시 패턴
```go
func main() {
    mux := runtime.NewServeMux()
    opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
    todopb.RegisterTodoServiceHandlerFromEndpoint(ctx, mux, "localhost:50051", opts)
    http.ListenAndServe(":8080", mux)
}
```
