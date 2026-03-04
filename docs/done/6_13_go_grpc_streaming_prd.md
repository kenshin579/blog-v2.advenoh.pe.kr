# gRPC Streaming RPC 패턴 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (2/3)
> 참조: `6_12_go_grpc_prd.md` (선행 글)

---

## 1. 개요

gRPC의 3가지 Streaming RPC 패턴 (Server Streaming, Client Streaming, Bidirectional Streaming)을 실전 예제와 함께 다룬다. 선행 글(`6_12`)에서 구현한 TodoList Unary RPC를 기반으로, 별도 프로젝트(`todolist-streaming/`)에서 Streaming으로 확장한다.

**대상 독자**: gRPC Unary RPC를 이해한 개발자 (6_12 글 읽은 독자)
**난이도**: 중급~고급
**예제 코드**: `tutorials-go/grpc/todolist-streaming/` (별도 프로젝트, TodoList 도메인 확장)

---

## 2. 블로그 구조

### 2.1 Streaming RPC 개요
- Unary vs Streaming 비교 다이어그램
- 4가지 RPC 패턴 개요 (Unary, Server Streaming, Client Streaming, Bidirectional)
- 각 패턴별 실전 활용 사례 정리

### 2.2 3가지 Streaming 패턴 구현

#### 2.2.1 Server Streaming
- proto 정의: `rpc ListTodos(ListTodosRequest) returns (stream Todo)`
- 서버 구현: `Send()` 메서드로 필터링된 Todo를 하나씩 전송
- 클라이언트 구현: `Recv()` 루프로 스트림 수신, `io.EOF` 처리
- 활용 사례: 대량 데이터 페이징, 실시간 피드, 로그 테일링

#### 2.2.2 Client Streaming
- proto 정의: `rpc BatchCreateTodos(stream CreateTodoRequest) returns (BatchCreateResponse)`
- 클라이언트: `Send()`로 여러 Todo 전송 + `CloseAndRecv()`로 결과 수신
- 서버: `Recv()` 루프로 수신 + `SendAndClose()`로 집계 결과 응답
- 활용 사례: 파일 업로드, 배치 데이터 전송, 센서 데이터 수집

#### 2.2.3 Bidirectional Streaming
- proto 정의: `rpc TodoUpdates(stream TodoAction) returns (stream TodoEvent)`
- 양방향 동시 스트림 처리: 클라이언트가 Todo 작업을 보내면 서버가 실시간 이벤트 응답
- 활용 사례: 채팅, 실시간 협업, 주식 시세 구독

### 2.3 Bidirectional Streaming 고루틴 패턴
- **Send/Recv 고루틴 분리**: 양방향 스트림을 독립적으로 처리
- **Directional Channel 활용**: `chan<-` / `<-chan`으로 send/recv 간 데이터 흐름 제어
- **고루틴 종료 관리**: `errgroup` 또는 `sync.WaitGroup`으로 안전한 종료
- **클라이언트 측 패턴**: send 고루틴 + recv 고루틴, 한쪽 종료 시 다른 쪽 정리
- **서버 측 파이프라인 패턴**: recv 루프 → channel → 처리 → send 루프

### 2.4 에러 처리, 취소, 인터셉터

#### 2.4.1 에러 처리와 취소
- `io.EOF` 처리 패턴 (정상 스트림 종료)
- `context.WithTimeout()`으로 스트림 타임아웃
- 클라이언트/서버 측 스트림 취소
- graceful shutdown: 스트림 종료 시 리소스 정리

#### 2.4.2 Stream 인터셉터
- `StreamServerInterceptor` 구현
- Unary Interceptor와의 차이점
- 스트림 래퍼 패턴: `grpc.ServerStream` 인터페이스 래핑
- 로깅, 메트릭 수집 인터셉터 예제

### 2.5 성능 비교: Unary 반복 호출 vs Streaming
- **벤치마크 시나리오**: 100/1000/10000개 Todo 항목 처리
- **Unary 반복 호출**: 매 요청마다 HTTP/2 프레임 오버헤드
- **Server Streaming**: 단일 연결에서 연속 전송, 헤더 오버헤드 최소화
- **Client Streaming**: 배치 전송 vs 개별 CreateTodo 반복 호출
- **비교 항목**: 총 소요시간, 네트워크 왕복 횟수, 메모리 사용량
- **벤치마크 코드**: `benchmark_test.go`에 `testing.B` 활용
- **결론**: 언제 Unary로 충분하고, 언제 Streaming이 필요한지 가이드라인

---

## 3. 샘플 코드 계획

기존 `tutorials-go/grpc/todolist/`의 TodoList 도메인을 확장하되, **별도 프로젝트로 분리**하여 작성.
기존 `tutorials-go/golang/third-party/grpc/route_guide/` 스트리밍 패턴 참고.

```
tutorials-go/grpc/todolist-streaming/
├── proto/
│   └── todo_streaming.proto       # 3가지 Streaming RPC 정의
├── buf.yaml
├── buf.gen.yaml
├── gen/
│   └── todopb/                    # 자동 생성 코드
├── server/
│   └── main.go                    # Streaming 서버 구현
├── client/
│   └── main.go                    # Streaming 클라이언트 (고루틴 패턴 포함)
├── interceptor/
│   └── stream_logging.go          # Stream 인터셉터
├── server_test.go                 # bufconn 기반 Streaming 테스트
├── benchmark_test.go              # Unary vs Streaming 성능 비교
└── Makefile                       # buf generate, 서버/클라이언트 실행
```

### proto 정의 요약

```protobuf
service TodoStreaming {
  // Server Streaming: 필터 조건으로 Todo 목록 스트림
  rpc ListTodos(ListTodosRequest) returns (stream Todo);

  // Client Streaming: 여러 Todo를 배치로 생성
  rpc BatchCreateTodos(stream CreateTodoRequest) returns (BatchCreateResponse);

  // Bidirectional Streaming: 실시간 Todo 작업 & 이벤트
  rpc TodoUpdates(stream TodoAction) returns (stream TodoEvent);
}
```

---

## 4. 논의 사항 (리뷰 완료)

- [x] 기존 TodoList 예제 확장 vs 별도 예제 → **별도 프로젝트** (`todolist-streaming/`)로 분리, TodoList 도메인 확장
- [x] 3가지 Streaming을 모두 다룰지 → **3가지 모두** 상세히 다룸
- [x] Bidirectional Streaming 고루틴 패턴 깊이 → **directional channel + errgroup 패턴** 포함
- [x] 성능 비교 포함 여부 → **2.7절에 벤치마크 포함** (Unary 반복 vs Streaming)
