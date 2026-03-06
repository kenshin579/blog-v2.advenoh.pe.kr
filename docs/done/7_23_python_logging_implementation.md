# 구현 계획: Python 로깅 제대로 하기

## 1. 블로그 글 구조

### 파일 위치
- 블로그 글: `docs/start/7_23_python_logging/index.md`
- 샘플 코드: `../tutorials-python/python/logging/` (별도 저장소)

### 글 구성 (목차)

```
1. 들어가며
2. logging 표준 라이브러리
  2.1 logging 모듈 기본 (Logger, Handler, Formatter)
  2.2 로그 레벨
  2.3 핸들러 종류
  2.4 포맷터 커스터마이징
  2.5 logging.config (dictConfig, fileConfig)
3. 서드파티 로깅 라이브러리
  3.1 structlog (구조화된 로깅)
  3.2 loguru (간편한 로깅)
  3.3 logging vs structlog vs loguru 비교
4. 실전 패턴
5. 마무리
```

## 2. 샘플 코드 구현

### 디렉토리 구조

```
tutorials-python/python/logging/
├── requirements.txt
├── 01_basic_logging.py          # basicConfig, getLogger, 로거 계층
├── 02_log_levels.py             # 레벨별 출력, 필터링
├── 03_handlers.py               # StreamHandler, FileHandler, RotatingFileHandler, TimedRotatingFileHandler
├── 04_formatters.py             # 포맷 속성, datefmt, colorlog
├── 05_dict_config.py            # dictConfig 기반 설정
├── 06_yaml_config.py            # YAML 파일 로드 설정
├── logging_config.yaml          # YAML 설정 파일
├── 07_structlog_basic.py        # structlog 기본 사용법
├── 08_structlog_binding.py      # structlog 바인딩, 프로세서
├── 09_loguru_basic.py           # loguru 기본 사용법
├── 10_loguru_advanced.py        # @logger.catch, lazy, InterceptHandler
├── 11_fastapi_logging.py        # FastAPI 미들웨어 로깅
└── 12_json_correlation_id.py    # JSON 포맷 + 상관관계 ID
```

### requirements.txt

```
structlog
loguru
colorlog
pyyaml
fastapi
uvicorn
```

## 3. 각 섹션별 핵심 구현 사항

### 2.1 logging 모듈 기본
- `logging.getLogger(__name__)` 패턴으로 모듈별 로거 생성
- 로거 계층 구조 시연: `root` → `app` → `app.services`
- `propagate=True/False` 차이를 콘솔 출력으로 비교
- `basicConfig()` vs 수동 설정(addHandler) 차이 코드

### 2.2 로그 레벨
- 5개 레벨별 출력 예제
- 로거 레벨 vs 핸들러 레벨 필터링 차이 시연
- 환경별 레벨 설정: `os.environ.get("LOG_LEVEL", "INFO")`

### 2.3 핸들러 종류
- 4가지 핸들러 각각의 동작 예제
- 복수 핸들러 등록: 콘솔(DEBUG) + 파일(WARNING) 동시 출력

### 2.4 포맷터 커스터마이징
- 주요 포맷 속성 조합 예제
- `colorlog.ColoredFormatter` 활용 컬러 출력

### 2.5 dictConfig
- 딕셔너리 기반 설정 전체 구조 예제
- YAML 파일에서 로드하는 패턴

### 3.1 structlog
- `structlog.get_logger()` 기본 사용
- 프로세서 파이프라인 구성: `add_log_level` → `TimeStamper` → `JSONRenderer`
- `structlog.stdlib` 통합 예제
- `logger.bind(user_id=123)` 컨텍스트 바인딩

### 3.2 loguru
- 설정 없이 즉시 사용하는 예제
- `logger.add("file.log", rotation="10 MB")` 파일 핸들러
- `@logger.catch` 데코레이터
- `InterceptHandler`로 기존 logging 모듈과 통합

### 3.3 비교표
- 설정 복잡도, 구조화 지원, 성능, 생태계, 프로젝트 규모별 추천

| 항목 | logging | structlog | loguru |
|------|---------|-----------|--------|
| 설정 복잡도 | 높음 | 중간 | 낮음 |
| 구조화 로깅 | 수동 | 네이티브 | 부분 지원 |
| 성능 | 기준 | 유사 | 유사 |
| 표준 라이브러리 | O | X | X |
| 추천 규모 | 대규모/레거시 | 대규모/MSA | 소-중규모 |

### 4. 실전 패턴
- FastAPI 미들웨어: 요청/응답 로깅 (method, path, status, duration)
- JSON 포맷: `python-json-logger` 또는 structlog JSONRenderer
- 상관관계 ID: `uuid4()` 기반 요청 추적, contextvars 활용
- ELK 연동 개요: 아키텍처 다이어그램 (Mermaid)

## 4. 블로그 글 작성 가이드

### frontmatter

```yaml
---
title: "Python 로깅 제대로 하기 - logging, structlog, loguru 비교"
description: "Python logging 모듈 기본부터 structlog, loguru 비교, FastAPI 실전 패턴까지"
date: 2026-03-XX
tags:
  - python
  - logging
  - structlog
  - loguru
  - fastapi
---
```

### 다이어그램
- 로거 계층 구조: Mermaid flowchart
- 프로세서 파이프라인: Mermaid flowchart LR
- ELK 아키텍처: Mermaid flowchart LR
