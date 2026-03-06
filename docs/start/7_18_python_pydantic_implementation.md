# 구현 계획: Pydantic v2 완벽 가이드

## 블로그 글 구조

### 파일 경로
- 블로그 글: `docs/start/python-pydantic-v2-guide/index.md`
- 샘플 코드: `../tutorials-python/python/pydantic/`

### 카테고리/시리즈
- 시리즈: FastAPI 풀스택 개발 (7-1)
- 카테고리: `python`

---

## 핵심 구현 사항

### 1. 샘플 코드 작성 (`tutorials-python/python/pydantic/`)

#### 1.1 프로젝트 셋업
- `pyproject.toml` 또는 `requirements.txt`에 의존성 추가
  - `pydantic>=2.0`
  - `pydantic-settings`
  - `pydantic[email]` (EmailStr 사용 시)
- pytest 기반 테스트 구성

#### 1.2 BaseModel 기본 (`test_basemodel.py`)
- 기본 모델 정의 및 인스턴스 생성
- `ValidationError` 발생 케이스
- `model_fields`, `model_json_schema()` 활용

#### 1.3 필드 타입과 제약조건 (`test_field_types.py`)
- `Field(min_length, max_length)` 문자열 제약
- `Field(gt, le)` 숫자 범위 제약
- `Field(default, alias)` 별칭 설정
- `Annotated[int, Field(ge=0)]` 패턴
- 커스텀 타입: `EmailStr`, `HttpUrl`

#### 1.4 중첩 모델 (`test_nested_model.py`)
- 모델 안에 모델 (`Order` → `OrderItem`)
- 재귀 모델 (트리 구조)
- `model_validate`로 깊은 중첩 데이터 처리

#### 1.5 Validator (`test_validator.py`)
- `@field_validator`: 단일 필드 검증, `mode="before"` vs `mode="after"`
- `@model_validator(mode="after")`: 필드 간 교차 검증
- `@model_validator(mode="wrap")`: 전체 검증 흐름 제어

#### 1.6 직렬화/역직렬화 (`test_serialization.py`)
- `model_dump()`: dict 변환, include/exclude 필터링
- `model_dump_json()`: JSON 문자열 변환
- `model_dump(by_alias=True)`: 별칭 직렬화
- `@field_serializer`: 커스텀 직렬화
- `model_validate()`, `model_validate_json()`: 역직렬화
- `strict=True` 엄격 모드

#### 1.7 Settings 관리 (`test_settings.py`)
- `BaseSettings`로 환경변수 매핑
- `.env` 파일 로딩
- `env_prefix`, `env_nested_delimiter` 설정
- 다중 환경 설정 패턴

#### 1.8 FastAPI 통합 예시 (`test_fastapi_integration.py`)
- 요청/응답 모델 분리 패턴
- FastAPI TestClient로 검증

### 2. 블로그 글 작성

- PRD 목차 순서대로 작성
- 각 섹션마다 샘플 코드 GitHub 링크 포함
- v1 → v2 마이그레이션 포인트 강조
- 성능 벤치마크는 간단한 비교표로 제시

---

## 기술 스택
- Python 3.11+
- Pydantic v2
- pydantic-settings
- pytest
- FastAPI (통합 예시)
