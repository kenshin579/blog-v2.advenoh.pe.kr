# 설계 문서: Expo로 시작하는 React Native 앱 개발 (Todo 앱 실습)

- **작성일**: 2026-05-28
- **대상 저장소**: `blog-v2.advenoh.pe.kr` (블로그 글), `tutorials-go` (실습 코드)
- **참고**: https://docs.expo.dev/

## 1. 목적

Expo를 사용해 React Native 앱을 처음부터 만드는 과정을 다루는 입문 + 실습 블로그 글 1편을 작성한다.
React 문법 설명이 아니라 **Expo로 개발하는 흐름**(프로젝트 생성 → 실행 → 구조 이해 → 기능 구현 → 네이티브 모듈 활용)에 초점을 둔다.

## 2. 글 정의

| 항목 | 내용 |
|------|------|
| 형태 | 입문 + 실습 단일 글 (균형형, 무게중심은 실습) |
| 대상 독자 | 웹/React 경험자. "React는 알지만 Expo/모바일은 처음"인 개발자 |
| 결과물 | blank TypeScript 템플릿 기반 단일 화면 Todo 앱 (추가/완료/삭제 + 데이터 영속화) |
| 초점 | React 문법이 아닌 Expo 개발 워크플로우 |
| 템플릿 | `create-expo-app --template blank` (TypeScript). Expo Router는 "이런 것도 있다" 수준으로만 언급 |

## 3. 글 아웃라인

번호 헤딩 스타일(블로그 기존 컨벤션)을 준수한다.

```
# 1. 들어가며           — 동기, 만들 것(Todo), 대상 독자
# 2. Expo란? 왜 Expo인가 — React Native와의 관계, 네이티브 빌드 없는 개발, Expo Go, 핵심 장점
# 3. 시작하기            — Node 준비 → create-expo-app --template blank(TS) → expo start
#                         → 실행 옵션(Expo Go / iOS 시뮬레이터 / Android 에뮬레이터 / 웹)
#                         → 첫 화면 확인
# 4. 프로젝트 구조        — App.tsx, app.json, package.json, assets / Fast Refresh
# 5. Todo 앱 만들기 (본론)
#   5.1 화면 골격 (View / Text / SafeAreaView)
#   5.2 입력 받기 (TextInput + useState)
#   5.3 목록 렌더링 (FlatList)
#   5.4 추가 / 완료 / 삭제 기능
#   5.5 스타일링 (StyleSheet)
# 6. 한 걸음 더          — AsyncStorage로 데이터 유지 (Expo의 네이티브 모듈 설치 흐름 시연)
# 7. 마치며              — 정리 + 다음 단계 키워드(Expo Router, EAS Build 배포)
# 8. 참고                — Expo 공식 문서, GitHub 소스 링크
```

- 다이어그램이 필요한 곳(예: 2장의 React Native / Expo / Expo Go 관계)은 **Mermaid**로 작성한다. ASCII art 금지.
- Mermaid 노드 텍스트에 `<br/>` 등 HTML 태그를 쓰지 않는다.

## 4. 실습 코드

- **위치**: `tutorials-go/web/expo-todo-app/` (`web/sns-login`처럼 독립 프로젝트로 둔다)
- **구성**: blank TypeScript Expo 프로젝트 전체 + `App.tsx`(Todo 구현) + `README.md`
- **연동**: 블로그 글에서는 핵심 코드를 인라인 코드 블록으로 보여주되, 완성본 전체는 GitHub 링크로 참조한다.
- **기능 범위**:
  - Todo 추가 (TextInput + 추가 버튼)
  - 완료 토글 (탭하면 완료/취소)
  - 삭제
  - AsyncStorage로 영속화 (앱 재시작 후에도 목록 유지)

## 5. 검증 & 워크플로우

- **코드 우선 원칙**: 코드를 먼저 작성하고 검증한 뒤 블로그 글을 작성한다.
  - 검증 방법: `npm install` 후 `npx tsc --noEmit`(타입체크)로 확인.
  - 스크린샷은 최소화한다. 이 Mac 환경에서 Expo 구동이 가능하면 1~2장 캡처, 어려우면 생략하고 추후 보강한다.
- **블로그 초안 위치**: `blog-v2.advenoh.pe.kr/docs/start/expo로-시작하는-react-native-앱-개발/index.md`
  - `contents/`에 직접 넣지 않는다. 카테고리(web / javascript / mobile 등)는 발행 시점(`contents/`로 이동할 때) 결정한다.
- **인코딩**: 모든 마크다운 파일은 UTF-8. 작성 후 `file -I`로 확인한다.
- **Git**: blog-v2와 tutorials-go 각각 feature 브랜치에서 작업 후 PR 생성. main/master 직접 커밋 금지.

## 6. frontmatter (안)

```yaml
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
```

- `category`는 frontmatter에 넣지 않는다 (디렉토리 구조로 결정).

## 7. 범위 밖 (YAGNI)

- Expo Router 기반 멀티 화면/탭 네비게이션 (키워드 언급만)
- EAS Build / 스토어 배포 (다음 단계 키워드만)
- 외부 API 연동, 인증, 백엔드 연동
- 상태 관리 라이브러리(Redux 등) — useState로 충분
