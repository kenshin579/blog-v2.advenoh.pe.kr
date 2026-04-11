# 웹 기반 SSH 로봇 관리 시스템 - TODO

## 1단계: 테스트 환경 구성

- [x] `tutorials-go/web-ssh-terminal/` 디렉토리 생성
- [x] `docker-compose.yaml` 작성 (SSH 서버 2대: port 2222, 2223)
- [x] `docker compose up -d`로 SSH 서버 실행
- [x] SSH 접속 테스트 (웹 터미널을 통해 확인)

## 2단계: Go 백엔드 구현

- [x] `backend/` 디렉토리 생성 + `go mod init web-ssh-terminal`
- [x] 의존성 설치 (`echo/v4`, `gorilla/websocket`, `x/crypto/ssh`, `yaml.v3`, `godotenv`)
- [x] `internal/model/robot.go` — Robot 구조체 정의
- [x] `internal/config/config.go` — YAML 설정 로더
- [x] `config.yaml` — 테스트용 로봇 목록 (localhost:2222, 2223)
- [x] `.env` — 테스트 비밀번호 (`ROBOT_ROBOT_1_PASSWORD=testpass`)
- [x] `internal/handler/robot.go` — `GET /api/robots` (목록 + TCP 상태 체크)
- [x] `internal/handler/terminal.go` — `GET /ws/terminal` (WebSocket + SSH 브릿지)
  - [x] gorilla/websocket Upgrader 설정
  - [x] x/crypto/ssh 연결 (비밀번호 + keyboard-interactive / 공개키 분기)
  - [x] PTY 요청 + Shell 시작
  - [x] SSH stdout → WebSocket 전송 (goroutine)
  - [x] WebSocket → SSH stdin 전송 (goroutine)
  - [x] 리사이즈 JSON 메시지 → `session.WindowChange()`
- [x] `main.go` — Echo 서버 셋업 (CORS, 라우트 등록)
- [x] `go run main.go`로 서버 실행 확인
- [x] `curl http://localhost:8090/api/robots`로 API 응답 확인

## 3단계: React 프론트엔드 구현

- [x] `frontend/` 디렉토리 생성 (`npm create vite@latest -- --template react-ts`)
- [x] Tailwind CSS 설치 + 설정
- [x] `@xterm/xterm`, `@xterm/addon-fit`, `react-router-dom` 설치
- [x] `vite.config.ts` — Go 백엔드 프록시 설정 (`/api`, `/ws`)
- [x] `src/api/robots.ts` — `GET /api/robots` 호출 유틸리티
- [x] `src/components/StatusBadge.tsx` — Online/Offline 뱃지
- [x] `src/components/RobotCard.tsx` — 로봇 카드 (이름, IP, 상태, Connect)
- [x] `src/components/RobotList.tsx` — 카드 그리드 레이아웃
- [x] `src/components/Terminal.tsx` — xterm.js 래퍼
  - [x] xterm.js 초기화 + FitAddon
  - [x] WebSocket 연결 + 메시지 바인딩
  - [x] 키 입력 → WebSocket 전송
  - [x] 리사이즈 이벤트 → resize JSON 전송
  - [x] 언마운트 시 cleanup (ws.close, term.dispose)
- [x] `src/pages/HomePage.tsx` — 로봇 목록 페이지
- [x] `src/pages/TerminalPage.tsx` — 터미널 페이지 (헤더 바, 상태 바)
- [x] `src/App.tsx` — React Router 라우팅 (`/`, `/terminal/:robotId`)

## 4단계: 통합 테스트 (MCP chrome-devtools)

- [x] Docker Compose SSH 서버 실행 확인
- [x] Go 백엔드 + React 프론트엔드 동시 실행
- [x] MCP chrome-devtools로 UI 테스트:
  - [x] `/` 페이지 접속 → 로봇 카드 2개 표시 확인
  - [x] Online 상태 뱃지 표시 확인
  - [x] 로봇 카드 Connect 클릭 → `/terminal/:robotId` 이동 확인
  - [x] 터미널 영역에 SSH 프롬프트 표시 확인
  - [x] 터미널에 `ls -la` 명령어 입력 → 출력 표시 확인
  - [x] ← Back 클릭 → 로봇 목록 복귀 확인
  - [ ] Disconnect 클릭 → 연결 종료 확인
- [ ] 브라우저 리사이즈 시 터미널 자동 조절 확인
- [ ] 동작 스크린샷 캡처

## 5단계: 블로그 Draft 작성

- [x] `docs/start/go-web-ssh-터미널-로봇-관리/` 디렉토리 생성
- [x] `index.md` frontmatter 작성 (title, description, date, tags)
- [x] 섹션 1: 소개 — 왜 웹 기반 SSH 터미널인가?
- [x] 섹션 2: 아키텍처 — 전체 흐름 다이어그램 (Mermaid)
- [x] 섹션 3: 프로젝트 셋업 — Go + React 프로젝트 구조
- [x] 섹션 4: Go 백엔드 — WebSocket+SSH 브릿지 핸들러 코드 설명
- [x] 섹션 5: React 프론트엔드 — xterm.js 터미널 + 로봇 목록
- [x] 섹션 6: 실행 및 데모 — Docker Compose + 접속 테스트
- [x] 섹션 7: 대안 비교 — Guacamole, Wetty, ttyd, Gotty
- [x] 섹션 8: 개선 아이디어 + 정리
- [ ] 커버 이미지 준비 (`cover.png`) — 사용자 직접 준비 필요

## 6단계: 검증 및 PR

- [x] `file -I` 로 UTF-8 인코딩 확인 (블로그 글)
- [ ] Mermaid 다이어그램 렌더링 확인
- [ ] `go test ./...` — Go 백엔드 테스트 (해당 시)
- [x] feature 브랜치 생성 (`feat/699-web-ssh-terminal` on tutorials-go)
- [ ] 커밋 (샘플 코드 + 블로그 글)
- [ ] `gh pr create` + HEREDOC으로 PR 생성
- [ ] reviewer 지정 (kenshin579)
