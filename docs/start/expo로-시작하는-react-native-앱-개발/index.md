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

# 1. 들어가며

React로 웹은 만들어봤는데 모바일 앱은 어디서부터 시작해야 할지 막막했던 적이 있나요? React Native를 쓰면 우리가 이미 아는 React 문법으로 iOS/Android 앱을 만들 수 있습니다. 그런데 막상 시작하려고 하면 Xcode, Android Studio, 네이티브 빌드 설정 같은 장벽에 부딪힙니다.

이 장벽을 거의 없애주는 것이 바로 **Expo**입니다. 이 글에서는 Expo로 개발 환경을 만들고, 간단한 **Todo 앱**을 처음부터 끝까지 만들어 봅니다. 만들 기능은 다음과 같습니다.

- 할 일 추가 / 완료 토글 / 삭제
- 앱을 껐다 켜도 목록이 유지되도록 데이터 저장

이 글은 React(컴포넌트, JSX, `useState`)에 익숙한 분을 대상으로 하며, React 문법보다는 **"Expo로 어떻게 개발하는가"**에 초점을 맞춥니다. 완성된 전체 코드는 [GitHub 저장소](https://github.com/kenshin579/tutorials-go/tree/master/web/expo-todo-app)에서 볼 수 있습니다.

> 환경은 macOS 기준이며, [Node.js](https://nodejs.org/) LTS 버전이 설치되어 있다고 가정합니다.

# 2. Expo란? 왜 Expo인가

**React Native**는 JavaScript/TypeScript로 작성한 코드를 실제 네이티브 UI로 렌더링해주는 프레임워크입니다. 즉, 웹뷰로 흉내 낸 앱이 아니라 진짜 네이티브 앱이 만들어집니다.

문제는 순수 React Native만으로 시작하려면 Xcode와 Android Studio를 설치하고 네이티브 빌드 환경을 직접 구성해야 한다는 점입니다. 입문자에게는 이 초기 설정 자체가 가장 큰 벽입니다.

**Expo**는 React Native 위에 얹힌 도구와 서비스 모음으로, 이 벽을 크게 낮춰줍니다.

- **네이티브 빌드 환경 없이 시작**: 명령어 하나로 프로젝트를 만들고 바로 실행할 수 있습니다.
- **Expo Go**: 앱스토어/플레이스토어에 있는 Expo Go 앱을 설치하면, QR 코드만 찍어서 내 폰에서 즉시 앱을 띄워볼 수 있습니다. 별도 빌드가 필요 없습니다.
- **풍부한 SDK**: 카메라, 위치, 알림, 로컬 저장소 같은 네이티브 기능을 패키지 설치만으로 사용할 수 있습니다.
- **EAS Build**: 나중에 실제 앱을 빌드하고 스토어에 배포할 때는 클라우드 빌드 서비스를 이용할 수 있습니다.

코드와 실행 환경의 관계를 그림으로 보면 다음과 같습니다.

```mermaid
flowchart TD
    A["내 코드 (TypeScript / JSX)"] --> B["Expo (CLI · SDK · Expo Go)"]
    B --> C["React Native"]
    C --> D["iOS 네이티브"]
    C --> E["Android 네이티브"]
```

우리는 `App.tsx`에 코드를 작성하고, Expo가 이를 React Native로 연결해 각 플랫폼의 네이티브 화면으로 그려주는 구조입니다.

# 3. 시작하기: 프로젝트 생성부터 실행까지

먼저 Node가 설치되어 있는지 확인합니다.

```bash
node -v
```

이제 `create-expo-app`으로 프로젝트를 생성합니다. 여기서는 **blank TypeScript 템플릿**을 사용합니다.

```bash
npx create-expo-app@latest my-todo-app --template blank-typescript
```

> Expo의 기본 템플릿은 파일 기반 라우팅(Expo Router)과 탭 네비게이션이 포함되어 있어 입문용으로는 다소 무겁습니다. 그래서 빈 화면 하나로 시작하는 `blank-typescript` 템플릿을 골랐습니다. Expo Router는 7장에서 키워드만 짚고 넘어갑니다.

생성이 끝나면 프로젝트 폴더로 이동해 개발 서버를 띄웁니다.

```bash
cd my-todo-app
npx expo start
```

터미널에 QR 코드와 함께 실행 옵션 메뉴가 나타납니다. 상황에 맞게 하나를 고르면 됩니다.

- **Expo Go (가장 간편)**: 폰에 [Expo Go](https://expo.dev/go) 앱을 설치하고 터미널의 QR 코드를 스캔합니다.
- `i`: iOS 시뮬레이터에서 실행 (macOS + Xcode 필요)
- `a`: Android 에뮬레이터에서 실행 (Android Studio 필요)
- `w`: 웹 브라우저에서 실행

실행하면 "Open up App.tsx to start working on your app!"이라는 기본 화면이 보입니다. 여기까지 왔다면 개발 환경 준비는 끝났습니다.

# 4. 프로젝트 구조 살펴보기

생성된 프로젝트의 핵심 파일만 살펴보겠습니다.

```
my-todo-app/
├── App.tsx          # 앱의 진입점. 화면을 그리는 곳
├── app.json         # 앱 이름, 아이콘, 스플래시 등 Expo 설정
├── package.json     # 의존성 목록
├── tsconfig.json    # TypeScript 설정 (expo/tsconfig.base 확장)
└── assets/          # 아이콘, 스플래시 이미지 등 리소스
```

우리가 거의 모든 시간을 보낼 곳은 **`App.tsx`** 한 파일입니다. 웹의 `index.html`이나 루트 컴포넌트처럼, 앱을 열면 가장 먼저 이 컴포넌트가 화면에 그려집니다.

한 가지 더, Expo는 **Fast Refresh**를 지원합니다. `App.tsx`를 수정하고 저장하면 앱을 다시 시작할 필요 없이 변경 사항이 화면에 즉시 반영됩니다. 웹 개발의 HMR(Hot Module Replacement)과 같은 경험이라고 보면 됩니다.

이제 본격적으로 Todo 앱을 만들어 보겠습니다.
