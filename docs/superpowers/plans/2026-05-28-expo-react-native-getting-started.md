# Expo로 시작하는 React Native 앱 개발 (Todo 앱) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo(blank TS 템플릿)로 단일 화면 Todo 앱을 만들어 검증한 뒤, 그 과정을 다루는 입문+실습 블로그 글 1편을 작성한다.

**Architecture:** 두 저장소에 걸친 작업. (1) `tutorials-go/web/expo-todo-app`에 독립 Expo 프로젝트로 Todo 앱을 작성·타입체크 검증한다. (2) `blog-v2.advenoh.pe.kr/docs/start/`에 블로그 초안을 작성하고 핵심 코드는 인라인, 완성본은 GitHub 링크로 참조한다. 데모 앱이므로 단위 테스트 대신 `tsc --noEmit` 타입체크 + 실행 확인을 검증 기준으로 삼는다.

**Tech Stack:** Expo (blank TypeScript 템플릿), React Native, TypeScript, `@react-native-async-storage/async-storage`, 블로그(Markdown + YAML frontmatter, Mermaid).

**전제(Prerequisites):** Node.js LTS + npm 설치 확인 (`node -v`, `npm -v`). 실행 확인은 iOS 시뮬레이터(Xcode) 또는 Expo Go(실기기) 중 가능한 것으로 한다.

**참고 스펙:** `blog-v2.advenoh.pe.kr/docs/superpowers/specs/2026-05-28-expo-react-native-getting-started-design.md`

---

## File Structure

### tutorials-go (실습 코드)
- Create: `tutorials-go/web/expo-todo-app/` — `create-expo-app --template blank`(TS) 산출물 일체
- Modify: `tutorials-go/web/expo-todo-app/App.tsx` — Todo 앱 핵심 구현
- Create: `tutorials-go/web/expo-todo-app/README.md` — 실행 방법 + 블로그 글 링크

### blog-v2 (블로그 글)
- Create: `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/index.md` — 글 초안
- (선택) Create: `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/*.png` — 스크린샷

---

## Phase A — 실습 코드 (tutorials-go)

### Task 1: Expo 프로젝트 scaffold 및 실행 확인

**Files:**
- Create: `tutorials-go/web/expo-todo-app/` (scaffold 일체)

- [ ] **Step 1: tutorials-go feature 브랜치 생성**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git switch master && git pull
git switch -c feat/expo-todo-app
```

- [ ] **Step 2: Node/npm 버전 확인**

Run: `node -v && npm -v`
Expected: Node LTS(예: v20+) 및 npm 버전 출력. 없으면 설치 후 진행.

- [ ] **Step 3: blank TS 템플릿으로 프로젝트 생성**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web
npx create-expo-app@latest expo-todo-app --template blank-typescript
```
참고: 템플릿 이름은 `blank-typescript`(TS 버전). 대화형 프롬프트가 나오면 기본값 수락.

- [ ] **Step 4: 의존성 설치 확인 및 타입체크**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/expo-todo-app
npx tsc --noEmit
```
Expected: 에러 없이 종료(초기 템플릿은 타입 에러 없음).

- [ ] **Step 5: 실행 확인 (환경 가능 시)**

Run: `npx expo start` 후 `i`(iOS 시뮬레이터) 또는 Expo Go 앱으로 QR 스캔.
Expected: 기본 "Open up App.tsx to start working on your app!" 화면 표시. 확인 후 `Ctrl+C`로 종료.
환경상 실행이 불가하면 이 스텝은 건너뛰고 추후 사용자가 확인 (스펙의 "스크린샷 최소화" 방침).

- [ ] **Step 6: scaffold 커밋**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add web/expo-todo-app
git commit -m "feat: Expo blank TS 템플릿으로 expo-todo-app scaffold

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Todo 앱 핵심 구현 (useState만 사용)

**Files:**
- Modify: `tutorials-go/web/expo-todo-app/App.tsx`

이 단계에서는 영속화 없이 메모리 상태(useState)만으로 추가/완료/삭제가 동작하는 Todo를 만든다. (AsyncStorage는 Task 3에서 추가)

- [ ] **Step 1: App.tsx를 아래 내용으로 교체**

`tutorials-go/web/expo-todo-app/App.tsx`:
```tsx
import { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');

  const addTodo = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      { id: Date.now().toString(), text: trimmed, done: false },
      ...prev,
    ]);
    setText('');
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>할 일 목록</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="무엇을 해야 하나요?"
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>아직 할 일이 없어요 🎉</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity
              style={styles.itemTextWrap}
              onPress={() => toggleTodo(item.id)}
            >
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
                {item.done ? '✅ ' : '⬜️ '}
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.delete}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#2f6feb',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  delete: {
    color: '#e5484d',
    fontSize: 14,
    marginLeft: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
});
```

- [ ] **Step 2: 타입체크로 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/expo-todo-app
npx tsc --noEmit
```
Expected: 에러 없이 종료.

- [ ] **Step 3: 실행 확인 (환경 가능 시)**

Run: `npx expo start` → 시뮬레이터/Expo Go에서 확인. 항목 추가, 탭하여 완료 토글, 삭제 동작 확인.
Expected: 추가/완료(취소선)/삭제 정상 동작. 불가 시 건너뛴다.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add web/expo-todo-app/App.tsx
git commit -m "feat: Todo 추가/완료/삭제 기능 구현 (useState)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: AsyncStorage로 데이터 영속화

**Files:**
- Modify: `tutorials-go/web/expo-todo-app/App.tsx`

`expo install`로 네이티브 모듈을 추가하는 흐름(블로그 6장)을 보여준다. 앱을 재시작해도 목록이 유지되도록 한다.

- [ ] **Step 1: AsyncStorage 패키지 설치**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/expo-todo-app
npx expo install @react-native-async-storage/async-storage
```
참고: `npm install`이 아니라 `npx expo install`을 쓰면 Expo SDK 버전과 호환되는 버전이 설치된다 — 이 점이 블로그 6장의 핵심 메시지.

- [ ] **Step 2: App.tsx 상단 import에 AsyncStorage 추가**

기존 `import { StatusBar } from 'expo-status-bar';` 아래에 추가:
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
```

- [ ] **Step 3: type 선언 아래에 STORAGE_KEY 상수 추가**

`type Todo = { ... };` 블록 바로 아래에 추가:
```tsx
const STORAGE_KEY = '@expo_todo_app/todos';
```

- [ ] **Step 4: useState 선언부 수정 및 useEffect 두 개 추가**

`export default function App() {` 내부 상태 선언을 아래로 교체:
```tsx
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);

  // 앱 시작 시 저장된 todo 불러오기
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setTodos(JSON.parse(raw));
      } catch (e) {
        console.warn('todo 불러오기 실패', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // todos가 바뀔 때마다 저장 (최초 로드 완료 후)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos)).catch((e) =>
      console.warn('todo 저장 실패', e),
    );
  }, [todos, loaded]);
```

- [ ] **Step 5: React import에 useEffect 추가**

최상단 `import { useState } from 'react';`를 아래로 교체:
```tsx
import { useEffect, useState } from 'react';
```

- [ ] **Step 6: 타입체크로 검증**

Run:
```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/web/expo-todo-app
npx tsc --noEmit
```
Expected: 에러 없이 종료.

- [ ] **Step 7: 실행 확인 (환경 가능 시)**

Run: `npx expo start` → 항목 추가 후 앱을 완전히 종료했다 다시 열어 목록이 유지되는지 확인.
Expected: 재시작 후에도 todo 유지. 불가 시 건너뛴다.

- [ ] **Step 8: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add web/expo-todo-app
git commit -m "feat: AsyncStorage로 Todo 목록 영속화

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: README 작성 및 PR

**Files:**
- Create: `tutorials-go/web/expo-todo-app/README.md`

- [ ] **Step 1: README.md 작성**

`tutorials-go/web/expo-todo-app/README.md`:
```markdown
# expo-todo-app

Expo(blank TypeScript 템플릿)로 만든 간단한 Todo 앱.

블로그 글: [Expo로 시작하는 React Native 앱 개발: Todo 앱 만들기](https://blog-v2.advenoh.pe.kr)

## 기능
- 할 일 추가 / 완료 토글 / 삭제
- AsyncStorage로 데이터 영속화 (앱 재시작 후에도 유지)

## 실행

```bash
npm install
npx expo start
```

- `i`: iOS 시뮬레이터, `a`: Android 에뮬레이터, `w`: 웹
- 실기기: Expo Go 앱으로 QR 코드 스캔

## 타입체크

```bash
npx tsc --noEmit
```
```

- [ ] **Step 2: 인코딩 확인**

Run: `file -I /Users/user/src/workspace_blogv2/tutorials-go/web/expo-todo-app/README.md`
Expected: `charset=utf-8`

- [ ] **Step 3: 커밋 및 푸시**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git add web/expo-todo-app/README.md
git commit -m "docs: expo-todo-app README 추가

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push -u origin feat/expo-todo-app
```

- [ ] **Step 4: PR 생성** (사용자 승인 후)

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
gh pr create --title "feat: Expo Todo 앱 예제 추가 (web/expo-todo-app)" --body "$(cat <<'EOF'
## Summary
- Expo blank TS 템플릿 기반 Todo 앱 예제 추가 (`web/expo-todo-app`)
- 추가/완료/삭제 + AsyncStorage 영속화
- 블로그 글 "Expo로 시작하는 React Native 앱 개발"의 실습 코드

## Test plan
- [ ] `npx tsc --noEmit` 통과
- [ ] `npx expo start`로 시뮬레이터/Expo Go 실행 확인
- [ ] 추가/완료/삭제 동작 및 재시작 후 목록 유지 확인
EOF
)"
```

---

## Phase B — 블로그 글 (blog-v2)

브랜치 `docs/expo-react-native-getting-started`는 이미 생성되어 있다(스펙 커밋 시). 글 초안은 한 파일에 작성하되, 섹션별로 나눠 작성 후 검증한다.

### Task 5: 초안 파일 생성 + frontmatter + 1~4장

**Files:**
- Create: `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/index.md`

- [ ] **Step 1: 브랜치 확인**

Run:
```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git branch --show-current
```
Expected: `docs/expo-react-native-getting-started`. 아니면 `git switch docs/expo-react-native-getting-started`.

- [ ] **Step 2: 디렉토리 생성 및 frontmatter + 1~4장 작성**

`docs/start/expo로-시작하는-react-native-앱-개발/index.md`에 작성한다. frontmatter는 아래 그대로 사용:
```yaml
---
title: "Expo로 시작하는 React Native 앱 개발: Todo 앱 만들기"
description: "Expo로 React Native 개발 환경을 만들고 간단한 Todo 앱을 처음부터 만들어봅니다."
date: 2026-05-28
update: 2026-05-28
tags:
  - expo
  - react-native
  - react
  - mobile
  - typescript
  - todo
  - 모바일
  - 앱개발
  - 프론트엔드
---
```
이어서 본문 1~4장을 작성한다. 작성 지침:
  - **# 1. 들어가며**: React는 알지만 모바일은 처음인 독자 대상임을 밝히고, blank TS 템플릿으로 Todo 앱을 만들 것이라 예고. 완성 코드 GitHub 링크 미리 안내.
  - **# 2. Expo란? 왜 Expo인가**: React Native와의 관계, Xcode/Android Studio 네이티브 빌드 없이 개발 가능, Expo Go로 실기기 즉시 실행, OTA/EAS 등 생태계를 2~3문장으로. 관계 설명에 **Mermaid flowchart** 사용 (예: `개발자 코드(JS/TS)` → `Expo` → `React Native` → `iOS/Android 네이티브`). 노드 텍스트에 HTML 태그 금지.
  - **# 3. 시작하기**: `npx create-expo-app@latest my-app --template blank-typescript` → `cd my-app` → `npx expo start`. 실행 옵션(`i`/`a`/`w`, Expo Go QR) 설명. 첫 화면 확인(스크린샷 있으면 삽입).
  - **# 4. 프로젝트 구조**: `App.tsx`(앱 진입점), `app.json`(Expo 설정), `package.json`, `assets/` 핵심만. Fast Refresh로 저장 즉시 반영되는 점 언급.

- [ ] **Step 3: 인코딩 확인**

Run: `file -I "docs/start/expo로-시작하는-react-native-앱-개발/index.md"`
Expected: `charset=utf-8`. 깨졌으면 heredoc으로 재작성.

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add "docs/start/expo로-시작하는-react-native-앱-개발/index.md"
git commit -m "docs: Expo 입문 글 초안 - frontmatter 및 1~4장 작성

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 5장 — Todo 앱 만들기 (본론)

**Files:**
- Modify: `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/index.md`

- [ ] **Step 1: 5장 본문 작성 (코드 인라인)**

`# 5. Todo 앱 만들기` 섹션을 5.1~5.5 하위 헤딩으로 작성한다. Task 2의 `App.tsx` 코드를 단계적으로 쪼개어 인라인 코드 블록으로 제시:
  - **5.1 화면 골격**: `SafeAreaView`/`View`/`Text` import와 기본 레이아웃, `StyleSheet.create`로 컨테이너/타이틀 스타일. RN에는 `div`/`p` 대신 `View`/`Text`를 쓴다는 점, 스타일이 객체라는 점 강조.
  - **5.2 입력 받기**: `TextInput` + `useState`로 입력값 바인딩(`value`/`onChangeText`), `Todo` 타입 정의, `addTodo` 함수.
  - **5.3 목록 렌더링**: `FlatList`의 `data`/`keyExtractor`/`renderItem`/`ListEmptyComponent`. 웹의 `.map()`과 비교해 가상화 리스트라는 점 짧게.
  - **5.4 추가/완료/삭제**: `toggleTodo`, `deleteTodo`와 `TouchableOpacity`로 탭 처리.
  - **5.5 스타일링**: 최종 `styles` 전체와 완성 화면(스크린샷 있으면 삽입).
  - 섹션 끝에 "전체 코드는 [GitHub](https://github.com/kenshin579/tutorials-go/tree/master/web/expo-todo-app)에서 볼 수 있습니다" 링크 추가.

- [ ] **Step 2: 인코딩 확인 및 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I "docs/start/expo로-시작하는-react-native-앱-개발/index.md"
git add "docs/start/expo로-시작하는-react-native-앱-개발/index.md"
git commit -m "docs: Expo 입문 글 - 5장 Todo 앱 만들기 작성

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: 6~8장 — 한 걸음 더 / 마치며 / 참고

**Files:**
- Modify: `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/index.md`

- [ ] **Step 1: 6~8장 작성**

  - **# 6. 한 걸음 더: AsyncStorage로 데이터 유지하기**: `npx expo install @react-native-async-storage/async-storage` (왜 `npm install`이 아니라 `expo install`인지 = SDK 호환 버전 자동 선택). Task 3의 import/STORAGE_KEY/두 개의 useEffect 코드 인라인. "네이티브 모듈을 eject 없이 추가하는 것"이 Expo의 강점임을 강조.
  - **# 7. 마치며**: 한 일 정리(생성→실행→구조→Todo→영속화). 다음 단계로 Expo Router(파일 기반 라우팅), EAS Build(스토어 배포)를 키워드만 소개.
  - **# 8. 참고**: Expo 공식 문서(https://docs.expo.dev/), `create-expo-app` 문서, AsyncStorage 문서, GitHub 소스(https://github.com/kenshin579/tutorials-go/tree/master/web/expo-todo-app) 링크.

- [ ] **Step 2: Mermaid 블록 검증**

글 내 모든 ```mermaid 블록을 점검: 노드 텍스트에 `<br/>`/`<br>` 등 HTML 태그가 없는지, 문법 오류가 없는지 확인.
Run: `grep -n "<br" "docs/start/expo로-시작하는-react-native-앱-개발/index.md" || echo "HTML 태그 없음 (정상)"`
Expected: `HTML 태그 없음 (정상)`

- [ ] **Step 3: 링크/구조 점검**

Run: `grep -n "^#" "docs/start/expo로-시작하는-react-native-앱-개발/index.md"`
Expected: 1~8장 헤딩이 순서대로 존재.

- [ ] **Step 4: 인코딩 확인 및 커밋**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
file -I "docs/start/expo로-시작하는-react-native-앱-개발/index.md"
git add "docs/start/expo로-시작하는-react-native-앱-개발/index.md"
git commit -m "docs: Expo 입문 글 - 6~8장(영속화/마치며/참고) 작성

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: 글 최종 점검 및 PR

**Files:**
- (검토만) `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/index.md`

- [ ] **Step 1: 전체 글 통독 점검**

index.md를 처음부터 끝까지 읽어 다음을 확인:
  - frontmatter에 `category` 없음(디렉토리로 결정)
  - 코드 블록 언어 표기(```tsx, ```bash) 정확
  - GitHub 링크가 실제 경로(`master/web/expo-todo-app`)와 일치
  - 1~4장 코드와 5~6장에서 제시한 코드가 Task 2/3의 `App.tsx`와 일치(변수명 `todos`/`addTodo`/`toggleTodo`/`deleteTodo`, `STORAGE_KEY` 등)

- [ ] **Step 2: 푸시**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git push -u origin docs/expo-react-native-getting-started
```

- [ ] **Step 3: PR 생성** (사용자 승인 후)

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
gh pr create --title "docs: Expo로 시작하는 React Native 앱 개발 입문 글 작성" --body "$(cat <<'EOF'
## Summary
- Expo blank TS 템플릿으로 Todo 앱을 만드는 입문+실습 글 초안 추가
- 위치: `docs/start/expo로-시작하는-react-native-앱-개발/index.md` (발행 시 contents/로 이동)
- 실습 코드: tutorials-go `web/expo-todo-app` (별도 PR)

## Test plan
- [ ] Mermaid 블록 렌더링 확인 (HTML 태그 없음)
- [ ] 코드 블록과 실습 저장소 코드 일치 확인
- [ ] 인코딩 UTF-8 확인
EOF
)"
```

---

## Self-Review (작성자 점검 완료)

**1. Spec coverage:**
- 글 형태/대상/결과물/초점 → Task 5~7 (frontmatter + 1~8장) ✓
- 아웃라인 1~8장 → Task 5(1~4), Task 6(5), Task 7(6~8) ✓
- 실습 코드 위치 `tutorials-go/web/expo-todo-app` → Task 1~4 ✓
- 코드 우선 + tsc 검증 → Task 1·2·3 타입체크 스텝 ✓
- 초안 위치 `docs/start/...` + 카테고리 발행 시 결정 → Task 5 + Task 8 점검 ✓
- frontmatter 안 → Task 5 그대로 반영 ✓
- Mermaid만 사용/HTML 태그 금지 → Task 5(2장)·Task 7(검증) ✓
- 스크린샷 최소화 → Task 1·2·3 실행 스텝을 "환경 가능 시"로 명시 ✓
- 범위 밖(Expo Router/EAS/API) → Task 7에서 키워드 언급만 ✓

**2. Placeholder scan:** TBD/TODO/"적절히 처리" 류 없음. 코드 스텝은 전체 코드 포함 ✓

**3. Type consistency:** `Todo` 타입, `todos`/`setTodos`/`text`/`loaded`, `addTodo`/`toggleTodo`/`deleteTodo`, `STORAGE_KEY`가 Task 2·3·6·7에서 동일하게 사용됨 ✓
