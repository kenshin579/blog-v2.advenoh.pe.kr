# Go Wails로 데스크톱 앱 만들기 - TODO

> PRD: `8_go_wails_prd.md`
> 구현 문서: `8_go_wails_implementation.md`

---

## Phase 1: 환경 설정 및 프로젝트 생성

- [x] Wails CLI 설치 (v2.11.0)
- [x] `wails doctor`로 환경 점검 (Go 1.26.0, Node.js 25.6.1, Xcode 16.4)
- [x] `tutorials-go/desktop/` 디렉토리 생성
- [x] `wails init -n wails-todo -t react-ts`로 프로젝트 생성
- [x] `backend/` 폴더 생성, `app.go`를 `backend/`로 이동
- [x] `main.go` import 경로 수정 (`backend` 패키지 참조)

## Phase 2: 백엔드 - Todo CRUD

- [x] `backend/todo.go` 작성
  - [x] Todo 구조체 정의 (ID, Title, Done, CreatedAt)
  - [x] TodoStore 구조체 (JSON 파일 저장/로드)
  - [x] `Load()`, `Save()`, `LoadFromFile()`, `ExportToFile()` 메서드
- [x] `backend/app.go` 작성
  - [x] App 구조체, `Startup()` (context + TodoStore 초기화)
  - [x] `GetTodos()` — 전체 조회
  - [x] `AddTodo(title)` — 추가
  - [x] `ToggleTodo(id)` — 완료 토글
  - [x] `DeleteTodo(id)` — 삭제 (확인 다이얼로그 포함)
  - [x] `ExportTodos()` — SaveFileDialog
  - [x] `ImportTodos()` — OpenFileDialog

## Phase 3: 프론트엔드 - React UI

- [x] `frontend/src/App.tsx` 작성 (Go 바인딩 호출, 상태 관리)
- [x] `frontend/src/components/TodoInput.tsx` 작성 (입력 + 추가)
- [x] `frontend/src/components/TodoList.tsx` 작성 (목록 렌더링)
- [x] `frontend/src/components/TodoItem.tsx` 작성 (체크박스 + 삭제)
- [x] `frontend/src/App.css` Todo 앱용 스타일 작성

## Phase 4: 네이티브 기능

- [x] 파일 다이얼로그 구현 (ExportTodos, ImportTodos)
- [x] `backend/menu.go` 작성 (시스템 메뉴)
  - [x] 파일 > 불러오기 (Cmd+O)
  - [x] 파일 > 내보내기 (Cmd+S)
  - [x] 파일 > 종료 (Cmd+Q)
- [x] `main.go`에 `Menu: app.CreateMenu()` 옵션 추가
- [x] 이벤트 시스템 연동 (`EventsEmit` / `EventsOn` "todos:reload")

## Phase 5: 빌드 및 검증

- [x] `wails build`로 프로덕션 바이너리 생성
- [x] 바이너리 크기: 7.5MB (앱 전체 7.8MB)
- [x] `go build ./...` 빌드 성공

## Phase 6: 블로그 글 작성

- [x] `docs/start/go-wails-desktop-app/index.md` 초안 작성
  - [x] §1 들어가며 (Wails 소개, Electron/Tauri 비교표, v2 vs v3)
  - [x] §2 환경 설정 (CLI 설치, wails doctor, 프로젝트 생성)
  - [x] §3 프로젝트 구조 (디렉토리 레이아웃, go:embed, wails.json)
  - [x] §4 Go-JavaScript 바인딩 (동작 원리, 메서드 호출, 이벤트)
  - [x] §5 실전 예제: Todo 앱 (백엔드 CRUD + 프론트엔드 + HMR)
  - [x] §6 네이티브 기능 활용 (파일 다이얼로그, 메뉴, 다이얼로그, 윈도우 제어)
  - [x] §7 빌드 및 배포 (단일 바이너리, 플랫폼별 빌드)
  - [x] §8 마무리
  - [x] §9 참고
- [x] 코드 블록에 tutorials-go GitHub 링크 참조
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] `file -I`로 UTF-8 인코딩 확인
