# PRD: Pydantic v2 완벽 가이드

## 개요
BaseModel, validator, 직렬화/역직렬화, Settings 관리까지 Pydantic v2를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 7-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. Pydantic v2란? (v1 대비 변경점)
   - Rust 기반 pydantic-core로 재작성 → 성능 대폭 향상
   - 주요 API 변경: `.dict()` → `.model_dump()`, `.parse_obj()` → `.model_validate()`
   - `ConfigDict`로 Config 클래스 대체
   - 마이그레이션 도구: `bump-pydantic` CLI
2. BaseModel 기본 사용법
   - 모델 정의: 필드에 타입 힌트 선언
   - 인스턴스 생성 시 자동 검증 (유효하지 않으면 `ValidationError`)
   - `model_fields`: 필드 메타데이터 접근
   - `model_json_schema()`: JSON Schema 자동 생성
3. 필드 타입과 제약조건
   - `Field(min_length=1, max_length=100)`: 문자열 제약
   - `Field(gt=0, le=100)`: 숫자 범위 제약
   - `Field(default=..., alias="fieldName")`: 별칭 설정
   - `Annotated[int, Field(ge=0)]` 패턴 (Python 3.9+)
   - 커스텀 타입: `EmailStr`, `HttpUrl`, `IPvAnyAddress` 등
4. Validator (`@field_validator`, `@model_validator`)
   - `@field_validator("name")`: 단일 필드 검증/변환
   - `mode="before"` vs `mode="after"`: 검증 시점 제어
   - `@model_validator(mode="after")`: 여러 필드 간 교차 검증
   - `@model_validator(mode="wrap")`: 전체 검증 흐름 제어
5. 직렬화 (`model_dump`, `model_dump_json`)
   - `model_dump()`: dict 변환 (include/exclude 필터링)
   - `model_dump_json()`: JSON 문자열 직접 변환
   - `model_dump(by_alias=True)`: 별칭으로 직렬화
   - `@field_serializer`: 커스텀 직렬화 로직
6. 역직렬화 (`model_validate`, `model_validate_json`)
   - `Model.model_validate(dict_data)`: dict → 모델 변환
   - `Model.model_validate_json(json_str)`: JSON → 모델 직접 변환
   - `strict=True`: 엄격 모드 (자동 타입 변환 비활성화)
7. 중첩 모델
   - 모델 안에 모델: `class Order(BaseModel): items: list[OrderItem]`
   - 재귀 모델: 트리 구조 표현
   - `model_validate`의 깊은 중첩 데이터 처리
8. Settings 관리 (`BaseSettings`, .env 연동)
   - `pydantic-settings` 패키지 설치
   - `BaseSettings`: 환경변수 → 모델 필드 자동 매핑
   - `.env` 파일 로딩: `model_config = SettingsConfigDict(env_file=".env")`
   - `env_prefix`, `env_nested_delimiter` 설정
   - 다중 환경 설정 관리 패턴 (dev/staging/prod)
9. Pydantic + FastAPI 통합 (모델 정의 관점 - 라우팅 활용은 FastAPI 입문 편 참조)
   - 요청 모델 / 응답 모델 분리 패턴 (`CreateUser` vs `UserResponse`)
   - `response_model_exclude` 등 FastAPI 전용 옵션
   - Swagger/ReDoc 문서 자동 생성과의 연동
10. 성능 벤치마크 (v1 vs v2)
    - 직렬화/역직렬화 속도 비교
    - 메모리 사용량 비교
    - 벤치마크 코드 예시

## 샘플 코드
- `tutorials-python/python/pydantic/`

## 참고
- https://docs.pydantic.dev/latest/
- https://docs.pydantic.dev/latest/migration/
