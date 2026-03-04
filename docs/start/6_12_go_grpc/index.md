---
title: "Go gRPC 서비스 구현과 Protobuf 활용"
description: "Go에서 gRPC 서비스를 구현하고 Protocol Buffers로 API를 정의하는 방법을 TodoList 예제로 알아봅니다. buf 도구, 인터셉터, gRPC-Gateway, Connect-Go까지 다룹니다."
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - grpc
  - protobuf
  - grpc-gateway
  - buf
  - connect-go
  - 고랭
---

REST API에 익숙한 개발자가 gRPC를 처음 접하면 "왜 JSON 대신 바이너리를 쓰는가?"라는 의문이 든다. 이 글에서는 Go로 **TodoList gRPC 서비스**를 구현하면서 Protobuf 정의부터 인터셉터, gRPC-Gateway까지 실전에 필요한 내용을 다룬다.

> 이 글의 전체 샘플 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/grpc/todolist)에서 확인할 수 있다.

# 1.gRPC란?

gRPC는 Google이 만든 고성능 RPC(Remote Procedure Call) 프레임워크다. HTTP/2 기반으로 동작하며, Protocol Buffers(Protobuf)를 기본 직렬화 포맷으로 사용한다.

| 항목 | REST API | gRPC |
|---|---|---|
| 프로토콜 | HTTP/1.1 | HTTP/2 |
| 데이터 포맷 | JSON (텍스트) | Protobuf (바이너리) |
| API 정의 | OpenAPI/Swagger (선택) | `.proto` 파일 (필수) |
| 코드 생성 | 선택 | 자동 (서버/클라이언트) |
| 스트리밍 | 제한적 (SSE, WebSocket) | 네이티브 지원 |
| 브라우저 지원 | 네이티브 | gRPC-Web 필요 |

**주요 활용 사례:**
- 마이크로서비스 간 내부 통신 (낮은 지연, 높은 처리량)
- 모바일/IoT 백엔드 (바이너리 직렬화로 대역폭 절약)
- 실시간 스트리밍 서비스

# 2.개발 환경 설정과 Protobuf 정의

## 2.1 protoc 기반 설정

전통적인 방식은 `protoc` 컴파일러와 Go 플러그인을 사용한다.

```bash
# protoc 설치 (macOS)
brew install protobuf

# Go 플러그인 설치
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 코드 생성
protoc --go_out=. --go-grpc_out=. proto/todo/v1/todo.proto
```

## 2.2 buf 도구 소개

**buf**는 protoc의 현대적 대안이다. 설정이 간편하고, 린팅과 Breaking Change 감지를 기본 제공한다.

```bash
# buf 설치
brew install buf
```

| 항목 | protoc | buf |
|---|---|---|
| 설정 | CLI 플래그 (길고 복잡) | YAML 설정 파일 |
| 린팅 | 없음 | 내장 (`buf lint`) |
| Breaking Change 감지 | 없음 | 내장 (`buf breaking`) |
| 의존성 관리 | 수동 (proto 파일 복사) | BSR (Buf Schema Registry) |

**buf.yaml** - 모듈 설정:

```yaml
version: v2
modules:
  - path: proto
deps:
  - buf.build/googleapis/googleapis
lint:
  use:
    - STANDARD
```

**buf.gen.yaml** - 코드 생성 설정:

```yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen
    opt: paths=source_relative
  - remote: buf.build/grpc/go
    out: gen
    opt: paths=source_relative
  - remote: buf.build/grpc-ecosystem/gateway
    out: gen
    opt: paths=source_relative
```

```bash
# 의존성 업데이트 + 코드 생성
buf dep update
buf generate
```

## 2.3 Protobuf 문법과 TodoList 서비스 정의

`.proto` 파일은 서비스 인터페이스와 메시지 타입을 정의한다. TodoList CRUD를 예로 보자.

```protobuf
syntax = "proto3";

package todo.v1;

import "google/api/annotations.proto";
import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

// Todo 메시지 정의
message Todo {
  string id = 1;
  string title = 2;
  bool completed = 3;
  google.protobuf.Timestamp created_at = 4;
}

// 서비스 정의 (5개 Unary RPC)
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

  rpc ListTodos(ListTodosRequest) returns (ListTodosResponse) {
    option (google.api.http) = {
      get: "/v1/todos"
    };
  }

  rpc UpdateTodo(UpdateTodoRequest) returns (UpdateTodoResponse) {
    option (google.api.http) = {
      put: "/v1/todos/{id}"
      body: "*"
    };
  }

  rpc DeleteTodo(DeleteTodoRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = {
      delete: "/v1/todos/{id}"
    };
  }
}
```

`google.api.http` 어노테이션은 gRPC-Gateway에서 REST 엔드포인트를 자동 생성할 때 사용한다.

`buf generate`를 실행하면 다음 파일이 생성된다:
- `todo.pb.go` - 메시지 타입 (직렬화/역직렬화)
- `todo_grpc.pb.go` - gRPC 서버/클라이언트 인터페이스
- `todo.pb.gw.go` - gRPC-Gateway HTTP 핸들러

# 3.TodoList 서비스 구현

## 3.1 Unary RPC

### 서버 구현

자동 생성된 `TodoServiceServer` 인터페이스를 구현한다. 인메모리 저장소로 간단하게 만든다.

```go
type TodoService struct {
    todopb.UnimplementedTodoServiceServer
    mu    sync.Mutex
    todos map[string]*todopb.Todo
}

func (s *TodoService) CreateTodo(ctx context.Context, req *todopb.CreateTodoRequest) (*todopb.CreateTodoResponse, error) {
    if req.GetTitle() == "" {
        return nil, status.Error(codes.InvalidArgument, "title is required")
    }

    s.mu.Lock()
    defer s.mu.Unlock()

    todo := &todopb.Todo{
        Id:        uuid.New().String(),
        Title:     req.GetTitle(),
        Completed: false,
        CreatedAt: timestamppb.New(time.Now()),
    }
    s.todos[todo.Id] = todo

    return &todopb.CreateTodoResponse{Todo: todo}, nil
}
```

`UnimplementedTodoServiceServer`를 임베딩하면 구현하지 않은 RPC는 `Unimplemented` 에러를 반환한다. 향후 proto에 새 RPC가 추가되어도 컴파일이 깨지지 않는다.

에러 처리는 `status.Error()`에 gRPC 상태 코드를 사용한다. 주요 코드:
- `codes.InvalidArgument` - 잘못된 요청
- `codes.NotFound` - 리소스 없음
- `codes.Internal` - 서버 내부 에러

### 클라이언트 구현

```go
conn, err := grpc.NewClient("localhost:50051",
    grpc.WithTransportCredentials(insecure.NewCredentials()),
)
defer conn.Close()

client := todopb.NewTodoServiceClient(conn)

// Create
resp, err := client.CreateTodo(ctx, &todopb.CreateTodoRequest{Title: "Learn gRPC"})
```

`grpc.NewClient()`로 연결을 만들고, 자동 생성된 클라이언트로 RPC를 호출한다. 일반 함수 호출처럼 사용할 수 있다.

## 3.2 인터셉터 (Middleware)

gRPC 인터셉터는 HTTP 미들웨어와 같은 역할이다. 로깅 인터셉터 예제:

```go
func UnaryLogging() grpc.UnaryServerInterceptor {
    return func(
        ctx context.Context,
        req interface{},
        info *grpc.UnaryServerInfo,
        handler grpc.UnaryHandler,
    ) (interface{}, error) {
        start := time.Now()
        resp, err := handler(ctx, req)
        st, _ := status.FromError(err)
        log.Printf("method=%s duration=%s code=%s error=%v",
            info.FullMethod, time.Since(start), st.Code(), err)
        return resp, err
    }
}
```

서버에 체인으로 적용한다:

```go
s := grpc.NewServer(
    grpc.ChainUnaryInterceptor(
        interceptor.UnaryLogging(),
        // 추가 인터셉터...
    ),
)
```

## 3.3 테스트 (bufconn)

`bufconn`은 실제 네트워크 없이 gRPC 서버를 테스트할 수 있게 해준다. 인메모리 리스너를 사용한다.

```go
var lis *bufconn.Listener

func init() {
    lis = bufconn.Listen(1024 * 1024)
    s := grpc.NewServer()
    todopb.RegisterTodoServiceServer(s, server.NewTodoService())
    go s.Serve(lis)
}

func bufDialer(ctx context.Context, _ string) (net.Conn, error) {
    return lis.DialContext(ctx)
}

func TestTodoService_CRUD(t *testing.T) {
    conn, _ := grpc.NewClient("passthrough:///bufnet",
        grpc.WithContextDialer(bufDialer),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    client := todopb.NewTodoServiceClient(conn)

    // Create → Get → List → Update → Delete 흐름 테스트
    createResp, err := client.CreateTodo(ctx, &todopb.CreateTodoRequest{Title: "Test Todo"})
    require.NoError(t, err)
    assert.Equal(t, "Test Todo", createResp.GetTodo().GetTitle())
    // ...
}
```

# 4.gRPC 생태계

## 4.1 gRPC-Gateway

gRPC-Gateway는 gRPC 서비스에서 **REST API를 자동 생성**해준다. proto 파일의 HTTP 어노테이션을 기반으로 HTTP ↔ gRPC 변환을 처리한다.

```go
func main() {
    mux := runtime.NewServeMux()
    opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
    todopb.RegisterTodoServiceHandlerFromEndpoint(ctx, mux, "localhost:50051", opts)
    http.ListenAndServe(":8080", mux)
}
```

gRPC 서버(`:50051`)와 Gateway(`:8080`)를 동시에 실행하면 동일한 서비스를 gRPC와 REST 양쪽으로 접근할 수 있다.

```bash
# REST로 Todo 생성
curl -X POST http://localhost:8080/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn gRPC-Gateway"}'

# REST로 Todo 목록 조회
curl http://localhost:8080/v1/todos
```

## 4.2 Connect-Go 소개

**Connect-Go**는 Buf 팀이 만든 gRPC 호환 프레임워크다. 기존 gRPC와 몇 가지 차이가 있다.

| 항목 | gRPC-Go | Connect-Go |
|---|---|---|
| HTTP 호환성 | HTTP/2 전용 | HTTP/1.1 + HTTP/2 |
| 프로토콜 | gRPC | gRPC, gRPC-Web, Connect |
| 라우터 | 자체 서버 | 표준 `net/http` |
| 브라우저 지원 | gRPC-Web 프록시 필요 | 네이티브 |

Connect-Go는 `net/http`와 완전 호환되어 기존 HTTP 미들웨어를 그대로 사용할 수 있다. gRPC 클라이언트와도 호환되므로 점진적 마이그레이션이 가능하다.

# 마무리

이 글에서는 Go로 gRPC TodoList 서비스를 구현하면서 다음을 다뤘다:
- **Protobuf** 정의와 **buf** 도구를 활용한 코드 생성
- **Unary RPC** 서버/클라이언트 구현과 에러 처리
- **인터셉터**로 로깅 미들웨어 구현
- **gRPC-Gateway**로 REST API 자동 노출
- **Connect-Go** 대안 프레임워크 소개

다음 글에서는 **Streaming RPC** 패턴 (Server, Client, Bidirectional Streaming)을 다룰 예정이다.

## 참고

- [gRPC 공식 문서](https://grpc.io/docs/languages/go/)
- [Protocol Buffers 공식 문서](https://protobuf.dev/)
- [buf 공식 문서](https://buf.build/docs/)
- [gRPC-Gateway](https://grpc-ecosystem.github.io/grpc-gateway/)
- [Connect-Go](https://connectrpc.com/docs/go/getting-started/)
