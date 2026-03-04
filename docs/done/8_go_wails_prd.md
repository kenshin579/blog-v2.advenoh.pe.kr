# Go Wails로 데스크톱 앱 만들기 PRD

> 시리즈: Golang 블로그 주제
> 참조: https://wails.io/ko/

---

## 1. 개요

Go 백엔드 + 웹 프론트엔드(React/Vue/Svelte)로 크로스 플랫폼 데스크톱 앱을 만들 수 있는 Wails 프레임워크를 다룬다. Electron 대비 작은 바이너리, 낮은 메모리 사용량이 장점이며, Go 개발자가 웹 기술을 활용하여 네이티브 데스크톱 앱을 빌드하는 방법을 스터디한다.

**대상 독자**: Go 기초 문법을 아는 백엔드 개발자
**난이도**: 초중급
**예제 코드**: `tutorials-go/desktop/wails-todo/`
**Wails 버전**: v2 (안정 버전)

---

## 2. 블로그 목차

### # 1. 들어가며
- Wails란? (Go + 웹 기술 데스크톱 프레임워크)
- 왜 Wails인가? Electron, Tauri와의 비교

| 항목 | Wails | Electron | Tauri |
|---|---|---|---|
| 백엔드 언어 | Go | Node.js | Rust |
| 렌더링 | OS WebView | Chromium 내장 | OS WebView |
| 바이너리 크기 | ~10MB | ~150MB+ | ~5MB |
| 메모리 사용량 | 낮음 | 높음 (100-200MB) | 낮음 |
| 학습 곡선 | 낮음 | 낮음 | 높음 (Rust) |
| 생태계 | 작음 | 매우 큼 | 보통 |

- Wails v2 vs v3 (v3는 Alpha 상태, 이 글에서는 안정 버전 v2 사용)

### # 2. 환경 설정
- #### 2.1 사전 요구사항
  - Go 1.20+, Node.js 15+, npm/pnpm
  - 플랫폼별 추가 의존성 (macOS: Xcode CLI, Linux: gtk3/webkit2gtk, Windows: WebView2)
- #### 2.2 Wails CLI 설치
  - `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
  - `wails doctor`로 환경 점검
- #### 2.3 프로젝트 생성
  - `wails init -n wails-todo -t react-ts`
  - 템플릿 종류: react, react-ts, vue, vue-ts, svelte, svelte-ts, vanilla 등

### # 3. 프로젝트 구조
- Wails 프로젝트 디렉토리 레이아웃 설명

```
wails-todo/
├── build/                  # 빌드 설정 (아이콘, 앱 정보)
│   ├── appicon.png
│   └── windows/
├── backend/                # Go 백엔드 로직
│   ├── app.go              # Wails 바인딩 메서드 (CRUD)
│   ├── todo.go             # Todo 구조체, JSON 파일 저장
│   └── menu.go             # 시스템 메뉴 설정
├── frontend/               # 웹 프론트엔드 (React + TypeScript)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── wailsjs/            # 자동 생성된 Go 바인딩 (JS/TS)
│       ├── go/backend/     # Go 메서드 호출용
│       └── runtime/         # Wails 런타임 API
├── main.go                 # 앱 진입점 (wails.Run)
├── wails.json              # Wails 프로젝트 설정
└── go.mod
```

- `//go:embed all:frontend/dist` — 프론트엔드를 Go 바이너리에 임베드
- `wails.json` 설정 항목 (이름, 빌드 명령 등)

### # 4. Go-JavaScript 바인딩
- #### 4.1 바인딩 동작 원리
  - Go 구조체의 public 메서드 → JavaScript에서 호출 가능
  - `main.go`의 `Bind` 옵션에 구조체 등록
  - Wails가 자동으로 `frontend/wailsjs/go/` 에 JS/TS 바인딩 생성
- #### 4.2 백엔드 → 프론트엔드
  - Go 메서드 정의 (`backend/app.go`): `func (a *App) Greet(name string) string`
  - JS에서 호출: `import { Greet } from '../wailsjs/go/backend/App'`
- #### 4.3 이벤트 시스템
  - Go → JS 이벤트: `runtime.EventsEmit(ctx, "eventName", data)`
  - JS → Go 이벤트: `runtime.EventsOn("eventName", callback)`

### # 5. 실전 예제: Todo 앱
- #### 5.1 백엔드 구현 (Go)
  - Todo 구조체 정의
  - CRUD 메서드: `AddTodo`, `GetTodos`, `ToggleTodo`, `DeleteTodo`
  - 데이터 저장: JSON 파일 (앱 종료 후에도 유지)
- #### 5.2 프론트엔드 구현 (React + TypeScript)
  - Todo 입력/목록/토글/삭제 UI
  - Go 바인딩 호출로 CRUD 연동
- #### 5.3 개발 모드와 핫 리로드
  - `wails dev` — 프론트엔드 HMR + Go 자동 재빌드

### # 6. 네이티브 기능 활용
- #### 6.1 파일 다이얼로그
  - `runtime.OpenFileDialog()` — Todo 목록 JSON 불러오기
  - `runtime.SaveFileDialog()` — Todo 목록 내보내기
- #### 6.2 시스템 메뉴
  - 앱 메뉴 커스터마이징 (`menu.NewMenu()`, `menu.AddText()`)
  - 메뉴에서 파일 열기/저장/종료 연결
- #### 6.3 다이얼로그
  - `runtime.MessageDialog()` — 삭제 확인 다이얼로그
  - 알림/경고/확인 다이얼로그 종류
- #### 6.4 윈도우 제어
  - `runtime.WindowSetTitle()`, `runtime.WindowSetSize()`
  - 다크 모드 감지: `runtime.WindowGetAppearance()`

### # 7. 빌드 및 배포
- `wails build` — 단일 네이티브 바이너리 생성
- 플랫폼별 빌드: macOS (.app), Windows (.exe), Linux
- 크로스 컴파일 주의사항
- 바이너리 크기 최적화 팁

### # 8. 마무리

### # 9. 참고

---

## 3. 샘플 코드 참조

| 파일 | 내용 |
|---|---|
| `wails-todo/main.go` | 앱 진입점, Wails 옵션 설정 |
| `wails-todo/backend/app.go` | Wails 바인딩 메서드 (CRUD) |
| `wails-todo/backend/todo.go` | Todo 구조체, JSON 파일 저장 |
| `wails-todo/backend/menu.go` | 시스템 메뉴 설정 |
| `wails-todo/frontend/src/` | React + TypeScript 프론트엔드 |
| `wails-todo/frontend/wailsjs/` | 자동 생성된 Go-JS 바인딩 |

---

## 4. 논의 사항 (결정됨)

- [x] Wails v2 (안정 버전) 사용
- [x] 프론트엔드: React + TypeScript (`react-ts` 템플릿)
- [x] 예제 앱: Todo 앱 (CRUD + 이벤트 + 네이티브 기능)
- [x] 네이티브 기능 포함: 파일 다이얼로그, 시스템 메뉴, 확인 다이얼로그, 윈도우 제어 (§6)
- [x] 데이터 저장: JSON 파일
