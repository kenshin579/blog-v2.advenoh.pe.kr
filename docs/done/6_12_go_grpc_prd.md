# gRPC 서비스 구현과 Protobuf 활용 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (1/3)
> 참조: `6_golang_topic_prd.md` P3-1

---

## 1. 개요

Go에서 gRPC 서비스를 구현하고 Protocol Buffers(Protobuf)로 API를 정의하는 방법. REST API와의 차이점, Unary RPC, 인터셉터, gRPC-Gateway를 다룬다. Streaming RPC는 별도 글로 분리한다.

**대상 독자**: REST API 경험이 있고 gRPC를 처음 접하는 개발자
**난이도**: 중급
**예제 코드**: 신규 작성 필요 (`tutorials-go/grpc/todolist/` 예정)
**예상 작업량**: 샘플 코드 ~750줄 (10개 파일), 블로그 글 ~1500단어

---

## 2. 블로그 구조

### 2.1 gRPC란?
- Google이 만든 고성능 RPC 프레임워크
- HTTP/2 기반, Protobuf 직렬화
- REST vs gRPC 비교 (JSON vs Binary, HTTP/1.1 vs HTTP/2)
- 활용 사례: 마이크로서비스 간 통신, 모바일 백엔드

### 2.2 개발 환경 설정과 Protobuf 정의

#### protoc 기반 설정
- `protoc` 컴파일러 설치 및 Go 코드 생성
- `protoc-gen-go`, `protoc-gen-go-grpc` 플러그인

#### buf 도구 소개
- protoc의 대안: 더 간편한 설정, 린팅, Breaking Change 감지
- `buf.yaml`, `buf.gen.yaml` 설정
- `buf generate` 명령어로 코드 생성
- protoc vs buf 비교

#### Protobuf 문법
- `.proto` 파일 기본 문법 (syntax, package, message, service)
- 스칼라 타입, 반복 필드, 중첩 메시지
- TodoList 서비스 정의 예제

### 2.3 TodoList 서비스 구현

#### Unary RPC
- 서버 구현: `RegisterXxxServer()`, 인터페이스 구현
- TodoList CRUD: CreateTodo, GetTodo, ListTodos, UpdateTodo, DeleteTodo
- 클라이언트 구현: `grpc.NewClient()`, 자동 생성된 클라이언트 사용
- 에러 처리: `status.Error()`, gRPC 상태 코드

#### 인터셉터 (Middleware)
- Unary Interceptor: 로깅 인터셉터 예제
- 체인 인터셉터: 여러 인터셉터 조합

#### 테스트
- `bufconn`: 네트워크 없이 gRPC 테스트
- 서비스 로직 단위 테스트

### 2.4 gRPC 생태계

#### gRPC-Gateway
- REST API 자동 생성: gRPC 서비스에서 REST 엔드포인트 노출
- proto 파일에 HTTP 어노테이션 추가 (`google.api.http`)
- Gateway 서버 구현
- curl로 REST API 호출 테스트

#### Connect-Go 소개
- Buf 팀이 만든 gRPC 호환 프레임워크
- 표준 `net/http`와 호환, HTTP/1.1 지원
- gRPC, gRPC-Web, Connect 프로토콜 동시 지원
- 기존 gRPC와의 차이점 간단 비교 (별도 글 가능)

---

## 3. 샘플 코드 계획

신규 작성 필요. 기존 레포에 `golang/third-party/grpc/helloworld/`, `grpc/route_guide/` 예제 참고 가능.

```
tutorials-go/grpc/todolist/
├── proto/
│   └── todo.proto             # TodoList 서비스 정의 (+ HTTP 어노테이션)
├── buf.yaml                    # buf 설정
├── buf.gen.yaml                # buf 코드 생성 설정
├── gen/
│   └── todopb/                # 자동 생성 코드 (pb.go, grpc.pb.go, gw.pb.go)
├── server/
│   └── main.go               # gRPC 서버 + 서비스 구현
├── client/
│   └── main.go               # gRPC 클라이언트
├── interceptor/
│   └── logging.go            # 로깅 인터셉터
├── gateway/
│   └── main.go               # gRPC-Gateway REST 서버
├── Makefile                    # buf generate, 서버 실행
└── server_test.go             # bufconn 테스트
```

---

## 4. 논의 사항 (리뷰 완료)

- [x] 예제 서비스 주제 → **TodoList** (실용적, CRUD 패턴 보여주기 좋음)
- [x] gRPC-Gateway → **포함** (2.5절에 추가)
- [x] Streaming RPC → **별도 글로 분리** (`6_13_go_grpc_streaming_prd.md` 생성)
- [x] Connect-Go → **소개 섹션 추가** (2.6절, 간단 비교)
- [x] buf 도구 → **포함** (2.2절에서 protoc과 비교하며 소개)
- [x] 작업량 → 샘플 코드 ~750줄 (10개 파일), 블로그 ~1500단어. 기존 helloworld/route_guide 예제 참고 가능
