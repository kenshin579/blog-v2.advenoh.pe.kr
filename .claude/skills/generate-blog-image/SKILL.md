---
name: generate-blog-image
description: 블로그 글(index.md)의 내용을 분석하여 OpenAI API로 썸네일/히어로 이미지를 생성한다. 블로그 이미지 생성이 필요할 때 사용한다.
user_invocable: true
---

You are a blog thumbnail image generator specialist.
블로그 글의 내용을 분석하거나 사용자의 짧은 프롬프트를 받아, 주제에 최적화된 썸네일 이미지를 생성한다.

## 사용법

두 가지 입력 모드를 지원한다:

**모드 A: md 파일 경로**
```
/generate-blog-image contents/database/mqtt-v5-완벽-가이드
```

**모드 B: 짧은 프롬프트**
```
/generate-blog-image mqtt 관련 이미지 생성해줘
/generate-blog-image kubernetes pod 스케줄링 다이어그램
```

## 동작 흐름

### Step 1: 입력 모드 판별

인자를 분석하여 모드를 결정한다:
- `contents/`, `docs/`, `.md` 포함, 또는 해당 경로에 파일이 존재하면 → **모드 A**
- 그 외 → **모드 B**

### Step 2: 주제 분석

**모드 A:**
- 인자 경로에서 `index.md` 파일을 읽는다 (경로에 `index.md`가 없으면 자동 추가)
- 프로젝트 루트 기준 상대 경로를 절대 경로로 변환
- frontmatter와 본문에서 추출:
  - **title**: 글 제목
  - **tags**: 태그 목록
  - **description**: 설명
  - **핵심 시각 요소**: 본문에서 아키텍처, 다이어그램, 주요 개념 등 시각화 가능한 요소 2-3개

**모드 B:**
- 사용자 프롬프트에서 주제, 기술 키워드, 원하는 분위기를 파악

### Step 3: 2개의 서로 다른 시각적 컨셉 생성

추출한 주제에서 **2가지 다른 관점**의 이미지 프롬프트를 만든다.

**컨셉 변형 전략** (2개를 선택):
1. **아키텍처 뷰**: 시스템 구조, 컴포넌트 관계, 데이터 흐름을 추상적으로 시각화
2. **개념 추상화 뷰**: 핵심 개념을 메타포/비유로 표현 (예: MQTT → 우체국 시스템)
3. **기술 심볼 뷰**: 관련 기술의 상징적 요소를 조합한 구성

각 프롬프트는 아래 구조를 따른다:

```
A [style description] blog hero image about [주제].

Visual concept: [해당 컨셉의 구체적 시각 묘사. 배치, 구성, 핵심 요소를 상세히 기술한다.]

Style: [주제에 가장 어울리는 스타일을 선택한다. 아래 스타일 가이드 참조.]
No text, no letters, no words, no labels, no numbers in the image.
```

### Step 4: 사용자 확인

생성한 2개 프롬프트를 사용자에게 보여주고 확인을 받는다:
- 컨셉 1: [요약]
- 컨셉 2: [요약]

사용자가 수정을 원하면 반영한다.

### Step 5: 이미지 생성 (2장)

`mcp__imagegen__text-to-image` 도구를 사용하여 각 컨셉별 1장씩, 총 2장을 생성한다.

각 호출 시 파라미터:
- **text**: Step 3에서 생성한 프롬프트
- **model**: `gpt-image-1`
- **size**: `1536x1024`
- **quality**: `medium`
- **output_format**: `png`

### Step 6: 이미지 저장 및 사용자 선택

생성된 이미지 2장을 저장한다:

**모드 A 저장 경로**: `{index.md 디렉토리}/`
- `thumbnail_candidate_1.png`
- `thumbnail_candidate_2.png`

**모드 B 저장 경로**: `~/Desktop/`
- `blog-image-{timestamp}_1.png`
- `blog-image-{timestamp}_2.png`

imagegen-mcp가 임시 경로에 저장한 경우, `cp` 명령으로 목표 경로에 복사한다.

사용자에게 2장의 이미지 경로를 알려주고 선택을 요청한다:
- **1번 선택**: 해당 이미지를 `thumbnail.png`로 rename, 나머지 삭제
- **2번 선택**: 해당 이미지를 `thumbnail.png`로 rename, 나머지 삭제
- **재생성**: Step 3으로 돌아가 새로운 컨셉으로 재생성
- **둘 다 유지**: candidate 파일 그대로 유지

## 스타일 가이드

**고정 스타일을 사용하지 않는다.** 주제에 가장 어울리는 스타일을 AI가 판단하여 선택한다.

주제별 추천 스타일 참고:

| 주제 분류 | 추천 스타일 |
|-----------|-------------|
| 인프라/클라우드 (K8s, Docker) | Isometric 3D illustration, 청색/보라 계열, 깔끔한 배경 |
| 메시징/프로토콜 (MQTT, Kafka) | Flat design, 노드와 화살표 흐름, 다크 배경 |
| 프로그래밍 언어 (Go, Java, JS) | 미니멀 일러스트, 언어 상징색 활용, 밝은 배경 |
| 데이터베이스 (SQL, Redis) | 데이터 구조 추상화, 기하학적 패턴, 모던 색상 |
| AI/ML (딥러닝, LLM) | 뉴럴 네트워크 추상화, 그라데이션, 미래지향적 |
| 알고리즘/자료구조 | 기하학적 도형, 그래프/트리 추상화, 밝고 깨끗한 톤 |
| DevOps/CI/CD | 파이프라인 흐름, 기어/화살표, 청록색 계열 |
| 웹 기술 (React, WebRTC) | 모던 그래디언트, 컴포넌트 추상화, 생동감 있는 색상 |

**공통 규칙:**
- 텍스트, 글자, 숫자, 라벨은 절대 포함하지 않는다
- Professional, developer-oriented aesthetic
- 블로그 썸네일로 적합한 구도 (중앙 집중 or 균형 잡힌 배치)
- 시각적 복잡도는 중간 (너무 단순하지도, 복잡하지도 않게)

## 주제별 시각화 힌트

프롬프트 작성 시 주제에 따라 다음 요소를 활용한다:

- **메시징/프로토콜** (MQTT, Kafka 등): 노드 간 메시지 흐름, 브로커 중심 구조, 화살표
- **데이터베이스**: 테이블 구조, 관계선, 데이터 흐름
- **클라우드/인프라** (Docker, K8s 등): 컨테이너, 오케스트레이션, 네트워크 토폴로지
- **프로그래밍 언어**: 해당 언어의 상징적 요소, 코드 패턴의 추상적 표현
- **알고리즘**: 데이터 구조의 시각적 표현, 처리 과정 흐름
- **DevOps**: 파이프라인, CI/CD 흐름, 자동화 워크플로우
- **AI/ML**: 뉴런 연결, 레이어 구조, 학습 과정 추상화
