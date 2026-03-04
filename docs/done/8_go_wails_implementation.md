# Go Wails로 데스크톱 앱 만들기 - 구현 문서

> PRD: `8_go_wails_prd.md`

---

## 1. 프로젝트 구성

### 1.1 프로젝트 위치

**경로**: `tutorials-go/desktop/wails-todo/`

```
desktop/wails-todo/
├── build/                      # Wails 빌드 설정 (자동 생성)
├── backend/                    # Go 백엔드
│   ├── app.go                  # App 구조체, Wails 바인딩 메서드
│   ├── todo.go                 # Todo 구조체, JSON 파일 저장/로드
│   └── menu.go                 # 시스템 메뉴 설정
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── App.tsx             # 메인 컴포넌트
│   │   ├── components/
│   │   │   ├── TodoInput.tsx   # Todo 입력
│   │   │   ├── TodoList.tsx    # Todo 목록
│   │   │   └── TodoItem.tsx    # 개별 Todo 항목
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── wailsjs/                # 자동 생성 (Go 바인딩)
├── main.go                     # 앱 진입점
├── wails.json                  # Wails 설정
└── go.mod
```

### 1.2 프로젝트 초기화

```bash
# Wails CLI 설치
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 프로젝트 생성
cd tutorials-go/desktop
wails init -n wails-todo -t react-ts

# backend 폴더 생성 후 app.go 이동
mkdir wails-todo/backend
mv wails-todo/app.go wails-todo/backend/
```

---

## 2. 백엔드 구현 (Go)

### 2.1 Todo 구조체 및 저장 (`backend/todo.go`)

```go
package backend

import (
	"encoding/json"
	"os"
	"time"
)

type Todo struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"createdAt"`
}

type TodoStore struct {
	filePath string
	todos    []Todo
}

func NewTodoStore(filePath string) *TodoStore {
	store := &TodoStore{filePath: filePath}
	store.load()
	return store
}

func (s *TodoStore) load() {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		s.todos = []Todo{}
		return
	}
	json.Unmarshal(data, &s.todos)
}

func (s *TodoStore) save() error {
	data, err := json.MarshalIndent(s.todos, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0644)
}
```

### 2.2 App 바인딩 메서드 (`backend/app.go`)

```go
package backend

import (
	"context"
	"fmt"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx   context.Context
	store *TodoStore
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.store = NewTodoStore("todos.json")
}

// CRUD 메서드 — 프론트엔드에서 호출

func (a *App) GetTodos() []Todo {
	return a.store.todos
}

func (a *App) AddTodo(title string) Todo {
	todo := Todo{
		ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
		Title:     title,
		Done:      false,
		CreatedAt: time.Now(),
	}
	a.store.todos = append(a.store.todos, todo)
	a.store.save()
	return todo
}

func (a *App) ToggleTodo(id string) {
	for i, t := range a.store.todos {
		if t.ID == id {
			a.store.todos[i].Done = !a.store.todos[i].Done
			break
		}
	}
	a.store.save()
}

func (a *App) DeleteTodo(id string) {
	for i, t := range a.store.todos {
		if t.ID == id {
			// 삭제 전 확인 다이얼로그
			result, _ := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
				Type:          runtime.QuestionDialog,
				Title:         "삭제 확인",
				Message:       fmt.Sprintf("'%s'을(를) 삭제하시겠습니까?", t.Title),
				DefaultButton: "No",
			})
			if result == "Yes" {
				a.store.todos = append(a.store.todos[:i], a.store.todos[i+1:]...)
				a.store.save()
			}
			return
		}
	}
}

// 네이티브 기능: 파일 다이얼로그

func (a *App) ExportTodos() error {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Todo 목록 내보내기",
		DefaultFilename: "todos.json",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return err
	}
	data, _ := json.MarshalIndent(a.store.todos, "", "  ")
	return os.WriteFile(path, data, 0644)
}

func (a *App) ImportTodos() ([]Todo, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Todo 목록 불러오기",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return a.store.todos, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return a.store.todos, err
	}
	var imported []Todo
	if err := json.Unmarshal(data, &imported); err != nil {
		return a.store.todos, err
	}
	a.store.todos = imported
	a.store.save()
	return a.store.todos, nil
}
```

### 2.3 시스템 메뉴 (`backend/menu.go`)

```go
package backend

import (
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
)

func (a *App) CreateMenu() *menu.Menu {
	appMenu := menu.NewMenu()

	fileMenu := appMenu.AddSubmenu("파일")
	fileMenu.AddText("불러오기...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		a.ImportTodos()
		runtime.EventsEmit(a.ctx, "todos:reload")
	})
	fileMenu.AddText("내보내기...", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		a.ExportTodos()
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("종료", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.Quit(a.ctx)
	})

	return appMenu
}
```

### 2.4 앱 진입점 (`main.go`)

```go
package main

import (
	"embed"

	"github.com/kenshin579/tutorials-go/desktop/wails-todo/backend"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := backend.NewApp()

	err := wails.Run(&options.App{
		Title:  "Wails Todo",
		Width:  800,
		Height: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.Startup,
		Menu:       app.CreateMenu(),
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		panic(err)
	}
}
```

---

## 3. 프론트엔드 구현 (React + TypeScript)

### 3.1 App.tsx

```tsx
import { useState, useEffect } from "react";
import { GetTodos, AddTodo, ToggleTodo, DeleteTodo } from "../wailsjs/go/backend/App";
import { EventsOn } from "../wailsjs/runtime/runtime";
import { backend } from "../wailsjs/go/models";
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";

function App() {
  const [todos, setTodos] = useState<backend.Todo[]>([]);

  const loadTodos = async () => {
    const result = await GetTodos();
    setTodos(result);
  };

  useEffect(() => {
    loadTodos();
    // 메뉴에서 불러오기 시 리로드
    EventsOn("todos:reload", loadTodos);
  }, []);

  const handleAdd = async (title: string) => {
    await AddTodo(title);
    loadTodos();
  };

  const handleToggle = async (id: string) => {
    await ToggleTodo(id);
    loadTodos();
  };

  const handleDelete = async (id: string) => {
    await DeleteTodo(id);
    loadTodos();
  };

  return (
    <div className="app">
      <h1>Wails Todo</h1>
      <TodoInput onAdd={handleAdd} />
      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  );
}

export default App;
```

### 3.2 컴포넌트

**TodoInput.tsx**: 텍스트 입력 + Enter/버튼으로 추가
**TodoList.tsx**: Todo 배열 렌더링
**TodoItem.tsx**: 체크박스(토글) + 제목 + 삭제 버튼

---

## 4. 빌드

```bash
# 개발 모드 (HMR)
wails dev

# 프로덕션 빌드
wails build

# macOS .app 결과물: build/bin/wails-todo.app
# 바이너리 크기 확인
ls -lh build/bin/
```
