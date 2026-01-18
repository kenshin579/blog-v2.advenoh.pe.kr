# MQTT v5 가이드 시리즈 목차 스타일 통일 PRD

## 1. 개요

### 1.1 목적
`contents/database/mqtt-v5-guide-*` 폴더의 마크다운 파일들의 목차(Heading) 스타일을 기존 블로그 스타일과 통일한다.

### 1.2 범위
- **대상 폴더**: `contents/database/mqtt-v5-guide-*`
- **대상 파일**: 5개 `index.md`
- **변경 대상**: Heading (H1, H2, H3) 스타일

### 1.3 대상 파일 목록
| 파일 경로 |
|----------|
| `contents/database/mqtt-v5-guide-1-introduction/index.md` |
| `contents/database/mqtt-v5-guide-2-topic-message/index.md` |
| `contents/database/mqtt-v5-guide-3-qos-session-reconnect/index.md` |
| `contents/database/mqtt-v5-guide-4-advanced-security/index.md` |
| `contents/database/mqtt-v5-guide-5-go-implementation/index.md` |

## 2. 현황 분석

### 2.1 기존 블로그 스타일 (올바른 형식)

```markdown
# 1. 들어가며
# 2. 개발 환경
# 3. 주제 제목
## 3.1 소제목
### 3.1.1 세부 제목
## 3.2 소제목
# 4. 참고
```

**특징:**
- H1: `# 숫자. 제목` 형식
- H2: `## 숫자.숫자 제목` 형식
- H3: `### 숫자.숫자.숫자 제목` 형식
- 모든 heading에 일관된 번호 체계 적용

### 2.2 MQTT v5 파일 현재 스타일 (문제점)

```markdown
# 0장. 스터디 목표와 전제
## 이 스터디에서 다루는 것      ← 번호 없음
## 왜 MQTT를 배워야 할까요?     ← 번호 없음
# 1장. MQTT v5 개요             ← "X장." 형식
## 1.1 MQTT란 무엇인가
### 한 줄 정의                  ← 번호 없음
### Broker 중심 구조            ← 번호 없음
## 참고 자료                    ← 번호 없음
```

### 2.3 문제점 요약

| 문제 | 현재 | 목표 |
|------|------|------|
| H1 번호 형식 | `# X장. 제목` | `# X. 제목` |
| H1 시작 번호 | 0부터 시작 | 1부터 시작 |
| H2 번호 누락 | `## 제목` (번호 없음) | `## X.X 제목` |
| H3 번호 누락 | `### 제목` (번호 없음) | `### X.X.X 제목` |
| 시리즈 장 번호 | 전체 연속 (0~11장) | 파일별 독립 (1~N) |

## 3. 파일별 변환 계획

### 3.1 mqtt-v5-guide-1-introduction

**현재 구조:**
```
# 0장. 스터디 목표와 전제
## 이 스터디에서 다루는 것
## 왜 MQTT를 배워야 할까요?
# 1장. MQTT v5 개요
## 1.1 MQTT란 무엇인가
### 한 줄 정의
### Broker 중심 구조
### HTTP와의 근본적인 차이
## 1.2 MQTT v5가 해결하려는 문제
### v3의 한계
### v5에서 추가된 핵심 기능
# 2장. MQTT v5 기본 아키텍처
## 2.1 구성 요소
### Client (클라이언트)
### Broker (브로커)
### Topic (토픽)
## 2.2 메시지 흐름
### Publish 흐름 (메시지 보내기)
### Subscribe 흐름 (메시지 받기)
### Broker 내부 역할
## 참고 자료
```

**변환 후:**
```
# 1. 스터디 목표와 전제
## 1.1 이 스터디에서 다루는 것
## 1.2 왜 MQTT를 배워야 하는가
# 2. MQTT v5 개요
## 2.1 MQTT란 무엇인가
### 2.1.1 한 줄 정의
### 2.1.2 Broker 중심 구조
### 2.1.3 HTTP와의 근본적인 차이
## 2.2 MQTT v5가 해결하려는 문제
### 2.2.1 v3의 한계
### 2.2.2 v5에서 추가된 핵심 기능
# 3. MQTT v5 기본 아키텍처
## 3.1 구성 요소
### 3.1.1 Client (클라이언트)
### 3.1.2 Broker (브로커)
### 3.1.3 Topic (토픽)
## 3.2 메시지 흐름
### 3.2.1 Publish 흐름 (메시지 보내기)
### 3.2.2 Subscribe 흐름 (메시지 받기)
### 3.2.3 Broker 내부 역할
# 4. 참고
```

### 3.2 mqtt-v5-guide-2-topic-message

**현재 구조:**
```
# 3장. Topic 설계
## 3.1 Topic 구조와 규칙
### 계층적 네이밍
### 네이밍 규칙
## 3.2 Wildcard
### + (Single-Level Wildcard)
### # (Multi-Level Wildcard)
### 왜 Subscribe 전용인가?
## 3.3 Topic 설계 Best Practice
### Command / Event / State 분리
### 버전 관리 전략
### 과도한 Wildcard의 문제
# 4장. 메시지 구조 (v5)
...
```

**변환 후:**
```
# 1. Topic 설계
## 1.1 Topic 구조와 규칙
### 1.1.1 계층적 네이밍
### 1.1.2 네이밍 규칙
## 1.2 Wildcard
### 1.2.1 + (Single-Level Wildcard)
### 1.2.2 # (Multi-Level Wildcard)
### 1.2.3 왜 Subscribe 전용인가?
## 1.3 Topic 설계 Best Practice
### 1.3.1 Command / Event / State 분리
### 1.3.2 버전 관리 전략
### 1.3.3 과도한 Wildcard의 문제
# 2. 메시지 구조 (v5)
...
```

### 3.3 mqtt-v5-guide-3-qos-session-reconnect

**변환 규칙:**
- `# 5장. QoS 완전 정복` → `# 1. QoS 완전 정복`
- `# 6장. Session & 연결 관리` → `# 2. Session & 연결 관리`
- `# 7장. 재연결 전략` → `# 3. 재연결 전략`
- 모든 H2, H3에 번호 부여

### 3.4 mqtt-v5-guide-4-advanced-security

**변환 규칙:**
- `# 8장. MQTT v5 고급 기능` → `# 1. MQTT v5 고급 기능`
- `# 9장. 보안` → `# 2. 보안`
- 모든 H2, H3에 번호 부여

### 3.5 mqtt-v5-guide-5-go-implementation

**변환 규칙:**
- `# 10장. Go + Paho (v5) 사용법` → `# 1. Go + Paho (v5) 사용법`
- `# 11장. 운영 관점 MQTT v5` → `# 2. 운영 관점 MQTT v5`
- `# 12장. 판단 기준` → `# 3. 판단 기준`
- 모든 H2, H3에 번호 부여

## 4. 변환 규칙 요약

### 4.1 H1 변환 규칙
| 현재 패턴 | 변환 후 |
|----------|---------|
| `# X장. 제목` | `# N. 제목` (파일 내 순서대로 1부터) |
| `# 0장. 제목` | `# 1. 제목` |

### 4.2 H2 변환 규칙
| 현재 패턴 | 변환 후 |
|----------|---------|
| `## X.Y 제목` | `## N.M 제목` (상위 H1 번호에 맞춤) |
| `## 제목` (번호 없음) | `## N.M 제목` (번호 추가) |

### 4.3 H3 변환 규칙
| 현재 패턴 | 변환 후 |
|----------|---------|
| `### 제목` (번호 없음) | `### N.M.K 제목` (번호 추가) |

## 5. 구현 방안

### 5.1 수동 변환 권장
- Heading 구조가 파일마다 다르고, 의미에 따라 번호 부여가 필요
- 자동화보다 수동 변환이 정확성 보장

### 5.2 작업 순서
1. 각 파일의 현재 heading 목록 추출
2. 새로운 번호 체계로 매핑 테이블 작성
3. 파일별 순차 변환
4. 변환 후 heading 구조 검증

## 6. 검증 방안

### 6.1 변환 후 검증
```bash
# Heading 패턴 확인 (올바른 형식)
grep -E "^# [0-9]+\. " contents/database/mqtt-v5-guide-*/index.md
grep -E "^## [0-9]+\.[0-9]+ " contents/database/mqtt-v5-guide-*/index.md
grep -E "^### [0-9]+\.[0-9]+\.[0-9]+ " contents/database/mqtt-v5-guide-*/index.md

# 잘못된 패턴 검출 (있으면 안 됨)
grep -E "^# [0-9]+장\." contents/database/mqtt-v5-guide-*/index.md
grep -E "^## [^0-9]" contents/database/mqtt-v5-guide-*/index.md | grep -v "^##\s*$"
```

### 6.2 블로그 렌더링 확인
- 개발 서버에서 TOC(목차) 정상 표시 확인
- Heading 링크 정상 동작 확인

## 7. 예상 변경량

| 파일 | 예상 H1 변경 | 예상 H2 변경 | 예상 H3 변경 |
|------|-------------|-------------|-------------|
| guide-1 | 3개 | ~10개 | ~15개 |
| guide-2 | 2개 | ~8개 | ~12개 |
| guide-3 | 3개 | ~10개 | ~15개 |
| guide-4 | 2개 | ~8개 | ~12개 |
| guide-5 | 3개 | ~10개 | ~15개 |
| **합계** | **~13개** | **~46개** | **~69개** |

## 8. 롤백 방안

```bash
git checkout HEAD -- contents/database/mqtt-v5-guide-*/
```
