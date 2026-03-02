# gRPC 서비스 구현과 Protobuf 활용 PRD

> 시리즈: Golang 블로그 주제 Phase 5 - 신규 주제 (1/3)
> 참조: `6_golang_topic_prd.md` P3-1

---

## 1. 개요

Go에서 gRPC 서비스를 구현하고 Protocol Buffers(Protobuf)로 API를 정의하는 방법. REST API와의 차이점, Unary/Streaming RPC 패턴, 인터셉터를 활용한 미들웨어 패턴까지 다룬다.

**대상 독자**: REST API 경험이 있고 gRPC를 처음 접하는 개발자
**난이도**: 중급
**예제 코드**: 신규 작성 필요 (`tutorials-go/grpc/` 예정)

---

## 2. 블로그 구조

### 2.1 gRPC란?
- Google이 만든 고성능 RPC 프레임워크
- HTTP/2 기반, Protobuf 직렬화
- REST vs gRPC 비교 (JSON vs Binary, HTTP/1.1 vs HTTP/2)
- 활용 사례: 마이크로서비스 간 통신, 모바일 백엔드

### 2.2 Protobuf 정의
- `.proto` 파일 기본 문법 (syntax, package, message, service)
- 스칼라 타입, 반복 필드, 중첩 메시지
- `protoc` 컴파일러 설치 및 Go 코드 생성
- `protoc-gen-go`, `protoc-gen-go-grpc` 플러그인

### 2.3 Unary RPC 구현
- 서버 구현: `RegisterXxxServer()`, 인터페이스 구현
- 클라이언트 구현: `grpc.Dial()`, 자동 생성된 클라이언트 사용
- 에러 처리: `status.Error()`, gRPC 상태 코드

### 2.4 Streaming RPC
- **Server Streaming**: 서버가 여러 응답 전송
- **Client Streaming**: 클라이언트가 여러 요청 전송
- **Bidirectional Streaming**: 양방향 스트림
- 각 패턴의 활용 사례

### 2.5 인터셉터 (Middleware)
- Unary Interceptor: 로깅, 인증, 에러 핸들링
- Stream Interceptor
- 체인 인터셉터: 여러 인터셉터 조합

### 2.6 gRPC-Gateway (선택)
- REST API 자동 생성: gRPC 서비스에서 REST 엔드포인트 노출
- Swagger/OpenAPI 문서 자동 생성

### 2.7 테스트
- `bufconn`: 네트워크 없이 gRPC 테스트
- Mock 서비스 구현

---

## 3. 샘플 코드 계획

신규 작성 필요. 예상 구조:

```
tutorials-go/grpc/
├── proto/
│   └── greeter.proto          # 서비스 정의
├── gen/
│   └── greeter/               # 자동 생성 코드
├── server/
│   └── main.go               # gRPC 서버
├── client/
│   └── main.go               # gRPC 클라이언트
├── interceptor/
│   └── logging.go            # 인터셉터 예제
├── Makefile                    # protoc 빌드
└── README.md
```

---

## 4. 논의 사항

- [ ] 예제 서비스 주제: Greeter(간단) vs TodoList(실용적) vs ArticleService(기존 코드 연계)
- [ ] gRPC-Gateway까지 다룰지, 순수 gRPC만 다룰지
- [ ] Streaming RPC를 모두 다루면 글이 길어짐 → Unary만 다루고 Streaming은 별도 글로?
- [ ] Connect-Go (gRPC 대안) 언급 여부
- [ ] buf 도구 (protoc 대안) 소개 여부
- [ ] 코드 신규 작성이 필요하므로 작업량 확인
