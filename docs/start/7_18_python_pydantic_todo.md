# TODO: Pydantic v2 완벽 가이드

## 1단계: 프로젝트 셋업
- [x] `tutorials-python/python/pydantic/` 디렉토리 생성
- [x] `pyproject.toml` 또는 `requirements.txt` 작성 (pydantic v2, pydantic-settings, pytest)
- [x] 가상환경 구성 및 의존성 설치

## 2단계: 샘플 코드 작성
- [x] `test_basemodel.py` - BaseModel 기본, ValidationError, model_fields, model_json_schema
- [x] `test_field_types.py` - Field 제약조건, Annotated 패턴, 커스텀 타입 (EmailStr, HttpUrl)
- [x] `test_nested_model.py` - 중첩 모델, 재귀 모델, model_validate 깊은 중첩
- [x] `test_validator.py` - field_validator (before/after), model_validator (after/wrap)
- [x] `test_serialization.py` - model_dump, model_dump_json, field_serializer, model_validate, strict 모드
- [x] `test_settings.py` - BaseSettings, .env 파일 로딩, env_prefix, 다중 환경 설정
- [x] `test_fastapi_integration.py` - 요청/응답 모델 분리, TestClient 검증

## 3단계: 테스트 검증
- [x] `pytest` 전체 테스트 통과 확인 (51 passed)

## 4단계: 블로그 글 작성
- [ ] `docs/start/python-pydantic-v2-guide/index.md` 초안 작성
- [ ] 1장: 개요 - Pydantic 소개, v1→v2 변경점
- [ ] 2장: BaseModel과 필드 정의 (기본, 제약조건, 중첩)
- [ ] 3장: Validator (field_validator, model_validator)
- [ ] 4장: 직렬화와 역직렬화 (model_dump, model_validate)
- [ ] 5장: Settings 관리 (BaseSettings, .env)
- [ ] 6장: 실전 활용 (FastAPI 통합, 성능 벤치마크)
- [ ] 7장: 마무리
- [ ] 각 섹션에 GitHub 샘플 코드 링크 추가
- [ ] frontmatter 작성 (title, description, date, tags, series)

## 5단계: 리뷰 및 PR
- [ ] 글 내용 최종 검토
- [ ] feature 브랜치 생성 및 commit
- [ ] PR 생성 (gh CLI + HEREDOC)
