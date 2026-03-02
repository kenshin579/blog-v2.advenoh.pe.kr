# Go Delve 원격 디버깅 완벽 가이드 블로그 PRD

## 개요

Go 디버거 Delve(dlv)의 기초부터 Docker/Kubernetes 환경에서의 원격 디버깅까지 포괄하는 실전 가이드를 작성한다.
샘플 코드는 `tutorials-go/golang/debugging/remote-debugging/`에, 블로그 포스트는 `blog-v2.advenoh.pe.kr/docs/start/`에 작성한다.

## 참고 자료

- https://github.com/go-delve/delve - Delve 공식 GitHub
- https://github.com/go-delve/delve/blob/master/Documentation/usage/dlv.md - dlv CLI 레퍼런스
- https://github.com/go-delve/delve/blob/master/Documentation/api/json-rpc/README.md - JSON-RPC API 문서
- https://www.jetbrains.com/help/go/go-remote.html - GoLand 원격 디버깅 가이드
- https://kubernetes.io/docs/tasks/debug/debug-application/ - K8s 애플리케이션 디버깅

---

## 블로그 구성

### 블로그 메타 정보

- **폴더**: `blog-v2.advenoh.pe.kr/docs/start/go-delve-원격-디버깅-완벽-가이드/index.md`
- **제목**: "Go Delve 원격 디버깅 완벽 가이드 - Docker/Kubernetes 환경까지"
- **태그**: golang, go, delve, dlv, debugging, remote-debugging, docker, kubernetes, goland, goroutine, 디버깅, 원격디버깅

### 목차 구성

#### 1. 개요 - 왜 Delve인가
- Go 디버깅의 어려움: `fmt.Println` 디버깅의 한계
- Delve vs GDB: Go 런타임(goroutine, channel, defer)을 네이티브로 이해하는 Delve의 장점
- 이 글에서 다루는 범위: 로컬 디버깅 → 원격 디버깅 → Docker → Kubernetes

#### 2. Delve 설치 및 기본 사용법

##### 2.1 설치
- `go install github.com/go-delve/delve/cmd/dlv@latest`
- macOS: 코드서명 및 보안 설정 (developer tools 허용)
- 버전 확인: `dlv version`

##### 2.2 기본 명령어
- `dlv debug` - 소스코드 빌드 후 디버깅 시작
- `dlv exec` - 기컴파일된 바이너리 디버깅
- `dlv attach` - 실행 중인 프로세스에 attach
- `dlv test` - 테스트 함수 디버깅

##### 2.3 디버거 내 명령어
- `break`(b), `continue`(c), `next`(n), `step`(s), `stepout`(so)
- `print`(p), `locals`, `args` - 변수 조회
- `goroutines`, `goroutine` - goroutine 전환
- `stack`(bt), `frame` - 콜스택 확인
- `condition` - 조건부 브레이크포인트

#### 3. 원격 디버깅 (Remote Debugging)

##### 3.1 원격 디버깅 개념
- 서버(dlv)가 디버기(debuggee)를 호스팅하고, 클라이언트(IDE)가 네트워크를 통해 연결
- `--headless` 모드: UI 없이 디버그 서버만 실행
- `--accept-multiclient`: 여러 클라이언트 동시 연결 허용
- `--api-version=2`: API 버전 명시

##### 3.2 JSON-RPC 프로토콜
- **JSON-RPC** (`--headless`): Delve 고유 프로토콜, GoLand 기본 지원
- 포트 설정: `--listen=:2345` (기본값)

##### 3.3 원격 디버깅 실습
- 서버 측: `dlv debug --headless --listen=:2345 --api-version=2 --accept-multiclient`
- 클라이언트 측: `dlv connect localhost:2345`
- 코드 예제를 사용한 실습 시나리오

#### 4. GoLand 연동

##### 4.1 GoLand 원격 디버깅 설정
- Run/Debug Configuration → Go Remote 선택
- Host, Port 설정 (JSON-RPC 기반)
- 소스 코드 매핑 (Path Mappings)
- 브레이크포인트 설정 및 디버깅 시연
- 스크린샷: GoLand 설정 화면

#### 5. Docker 환경 원격 디버깅

##### 5.1 디버그용 Docker 이미지 빌드
- `Dockerfile.debug`: 멀티스테이지 빌드에서 Delve 포함
- 빌드 최적화 비활성화: `go build -gcflags="all=-N -l"`
- 컨테이너 내부에서 dlv headless 서버 실행

##### 5.2 docker-compose 구성
- `docker-compose.debug.yml`: 포트 매핑 (2345:2345), security_opt 설정
- `SYS_PTRACE` capability 추가 (ptrace 시스템콜 허용)
- `--security-opt=apparmor:unconfined` 설정

##### 5.3 GoLand에서 Docker 컨테이너 연결
- GoLand에서 localhost:2345로 연결
- 경로 매핑: 호스트 소스 경로 ↔ 컨테이너 내 소스 경로
- 전체 워크플로우 시연

#### 6. Kubernetes 환경 원격 디버깅

##### 6.1 디버그용 Pod 배포
- Deployment YAML: Delve 포함 이미지, containerPort 2345
- SecurityContext: `SYS_PTRACE` capability
- `readinessProbe` / `livenessProbe` 설정 주의사항 (디버깅 시 비활성화 권장)

##### 6.2 포트 포워딩
- `kubectl port-forward pod/<pod-name> 2345:2345`
- 또는 `kubectl port-forward svc/<service-name> 2345:2345`

##### 6.3 GoLand에서 K8s Pod 연결
- 포트 포워딩 후 로컬과 동일하게 GoLand에서 연결
- 경로 매핑 설정
- 전체 워크플로우: 이미지 빌드 → 배포 → 포트 포워딩 → 디버깅

#### 7. Goroutine 디버깅 테크닉

##### 7.1 goroutine 목록 조회
- `goroutines` 명령어: 전체 goroutine 상태 확인
- `-group` 옵션: goroutine 그룹핑 (by state, by user location)
- 특정 goroutine으로 전환: `goroutine <id>`

##### 7.2 goroutine 별 브레이크포인트
- goroutine ID 기반 조건부 브레이크포인트
- `condition <breakpoint-id> runtime.curg.goid == <goroutine-id>`

##### 7.3 채널 및 뮤텍스 상태 확인
- 채널 버퍼 내용 확인: `print ch`
- `sync.Mutex` / `sync.RWMutex` 상태 조회
- 데드락 상황 진단 방법

#### 8. 실전 팁 & 트러블슈팅

##### 8.1 빌드 플래그
- `-gcflags="all=-N -l"`: 최적화/인라이닝 비활성화 (디버깅 필수)
- `-gcflags` 범위: `all=` vs 특정 패키지만 적용
- 프로덕션 빌드와 디버그 빌드 분리 전략

##### 8.2 자주 발생하는 문제
- `could not attach to pid`: 권한 문제 (macOS: DevToolsSecurity, Linux: ptrace_scope)
- `connection refused`: 방화벽, 포트 충돌, listen 주소 확인
- `no symbol table`: 빌드 최적화로 심볼 제거됨 → `-gcflags` 확인
- Docker에서 `operation not permitted`: `SYS_PTRACE` 누락
- 변수 값이 `<optimized out>`: 인라이닝/최적화 비활성화 필요

##### 8.3 디버깅 성능 최적화
- `--check-go-version=false`: Go 버전 체크 생략
- `--log --log-output=rpc`: RPC 로그로 통신 문제 진단
- 원격 디버깅 시 네트워크 지연 최소화 방법

#### 9. 마무리
- 환경별 디버깅 방법 요약 표
- Delve 활용 시 핵심 체크리스트
- 추가 학습 자료 링크

---

## 샘플 코드 구성

### 디렉토리 구조

```
tutorials-go/golang/debugging/remote-debugging/
├── main.go                      # HTTP 서버 + 백그라운드 goroutine worker
├── main_test.go                 # 기본 동작 테스트
├── Dockerfile.debug             # Delve 포함 디버그용 Docker 이미지
├── docker-compose.debug.yml     # 디버그 환경 Docker Compose
├── k8s/
│   ├── deployment.yaml          # 디버그용 Deployment (dlv headless 실행)
│   └── service.yaml             # NodePort 또는 ClusterIP Service
└── README.md                    # 예제 실행 방법 설명
```

### 각 파일 요구사항

| 파일 | 핵심 내용 |
|------|----------|
| `main.go` | `net/http` 기반 HTTP 서버, `/health` 핸들러, `/process` 핸들러 (의도적 지연 포함), 백그라운드 goroutine worker (주기적 작업 수행), `sync.WaitGroup` 활용한 graceful shutdown |
| `main_test.go` | HTTP 핸들러 단위 테스트, goroutine worker 동작 확인 |
| `Dockerfile.debug` | 멀티스테이지 빌드: (1) Go 소스 빌드 (`-gcflags="all=-N -l"`), (2) Delve 설치, (3) `dlv exec --headless --listen=:2345 --api-version=2 --accept-multiclient ./app` 실행 |
| `docker-compose.debug.yml` | 포트 매핑 (8080:8080, 2345:2345), `security_opt: ["apparmor:unconfined"]`, `cap_add: ["SYS_PTRACE"]` |
| `k8s/deployment.yaml` | 디버그 이미지 사용, containerPort 2345/8080, SecurityContext에 `SYS_PTRACE`, readinessProbe 비활성화 |
| `k8s/service.yaml` | app 포트(8080) + debug 포트(2345) 노출 |

---

## 작업 순서

### Phase 1: 환경 준비
1. `tutorials-go/golang/debugging/remote-debugging/` 디렉토리 생성
2. Delve 설치 확인: `dlv version`
3. Docker / kubectl 환경 확인

### Phase 2: 샘플 코드 작성
4. `main.go` 작성 (HTTP 서버 + goroutine worker)
5. `main_test.go` 작성 및 테스트 통과 확인
6. `Dockerfile.debug` 작성 및 이미지 빌드 확인
7. `docker-compose.debug.yml` 작성 및 Docker 환경 디버깅 테스트
8. `k8s/` YAML 작성
9. `README.md` 작성

### Phase 3: 블로그 포스트 작성
11. `blog-v2.advenoh.pe.kr/docs/start/go-delve-원격-디버깅-완벽-가이드/index.md` 작성
12. frontmatter 작성 (title, description, date, update, tags)
13. 목차 순서대로 본문 작성
14. 샘플 코드를 블로그 본문에 인라인으로 포함
15. 다이어그램 작성 (Mermaid): 원격 디버깅 아키텍처, Docker/K8s 연결 구성도
16. 인코딩 확인 (`file -I`)

### Phase 4: 검증
17. 블로그 빌드 확인 (`npm run build`)
18. 튜토리얼 테스트 확인 (`go test ./golang/debugging/remote-debugging/...`)
19. Docker 환경 디버깅 테스트 재현
20. GoLand 연결 동작 확인

---

## 필요한 이미지/다이어그램 목록

| 번호 | 유형 | 설명 |
|------|------|------|
| 1 | Mermaid | 원격 디버깅 아키텍처 (dlv server ↔ IDE client 통신 흐름) |
| 2 | Mermaid | Docker 환경 원격 디버깅 구성도 (Host IDE → Docker Container) |
| 4 | Mermaid | Kubernetes 환경 원격 디버깅 구성도 (IDE → port-forward → Pod) |
| 5 | 스크린샷 | GoLand Go Remote 설정 화면 |
| 6 | 스크린샷 | Delve goroutine 목록 조회 결과 |

---

## 참고: Go Delve 원격 디버깅 핵심 요약

| 카테고리 | 항목 | 영향도 |
|---------|------|--------|
| 기초 | Delve 설치 및 CLI 사용법 | ★★★ |
| 기초 | 빌드 플래그 (`-gcflags="all=-N -l"`) | ★★★ |
| 원격 | headless 모드 (`--headless --listen=:2345`) | ★★★ |
| IDE | GoLand Go Remote 설정 | ★★★ |
| Docker | 디버그용 Dockerfile (멀티스테이지) | ★★★ |
| Docker | SYS_PTRACE capability 설정 | ★★★ |
| K8s | 디버그용 Deployment + port-forward | ★★☆ |
| K8s | SecurityContext / Probe 설정 | ★★☆ |
| Goroutine | goroutine 전환 및 조건부 브레이크포인트 | ★★☆ |
| 트러블슈팅 | 권한 문제, 연결 거부, 심볼 누락 | ★★★ |
