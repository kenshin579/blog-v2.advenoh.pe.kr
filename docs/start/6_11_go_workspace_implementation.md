# Go Workspace로 멀티 모듈 프로젝트 관리하기 - 구현 문서

> PRD: `6_11_go_workspace_prd.md`

---

## 1. 작업 범위

- 기존 코드(`tutorials-go/golang/workspace/`)를 기반으로 블로그 글 작성
- 신규 코드 작성 없음 (기존 adder + service 예제 활용)
- `workspace-oldway/` 코드는 블로그에서 참조하지 않음

---

## 2. 블로그 글 구성

### 2.1 글 위치

**경로**: `blog-v2.advenoh.pe.kr/docs/start/go-workspace-멀티-모듈-프로젝트-관리하기/index.md`

### 2.2 참조할 소스 코드 (핵심 발췌)

| 섹션 | 참조 파일 | 발췌 포인트 |
|---|---|---|
| §2 기본 사용법 | `workspace/go.work` | go.work 파일 구조 |
| §3 예제 | `adder/adder.go`, `adder/go.mod` | 공유 라이브러리 모듈 |
| §3 예제 | `service/main.go`, `service/go.mod` | adder 의존 서비스 모듈 |

### 2.3 frontmatter

```yaml
title: "Go Workspace로 멀티 모듈 프로젝트 관리하기"
description: "Go 1.18에서 도입된 go.work를 활용하여 멀티 모듈 프로젝트를 효율적으로 개발하는 방법을 알아봅니다"
date: 2026-03-04
update: 2026-03-04
tags:
  - golang
  - go
  - workspace
  - go-work
  - multi-module
  - 고랭
  - 워크스페이스
```
