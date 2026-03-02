# PRD: Pydantic v2 완벽 가이드

## 개요
BaseModel, validator, 직렬화/역직렬화, Settings 관리까지 Pydantic v2를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: FastAPI 풀스택 개발
- **번호**: 5-1
- **난이도**: 중급
- **우선순위**: ★★★

## 다룰 내용
1. Pydantic v2란? (v1 대비 변경점)
2. BaseModel 기본 사용법
3. 필드 타입과 제약조건 (Field, conint, constr)
4. Validator (`@field_validator`, `@model_validator`)
5. 직렬화 (`model_dump`, `model_dump_json`)
6. 역직렬화 (`model_validate`, `model_validate_json`)
7. 중첩 모델
8. Settings 관리 (`BaseSettings`, .env 연동)
9. Pydantic + FastAPI 통합
10. 성능 벤치마크 (v1 vs v2)

## 샘플 코드
- `tutorials-python/python/pydantic/`

## 참고
- https://docs.pydantic.dev/latest/
- https://docs.pydantic.dev/latest/migration/
