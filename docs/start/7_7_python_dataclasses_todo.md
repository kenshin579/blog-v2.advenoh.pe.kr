# TODO: Python Dataclasses & attrs

## 1단계: 샘플 코드 작성 (tutorials-python)

- [ ] `tutorials-python/python/dataclasses/` 디렉토리 생성
- [ ] `requirements.txt` 작성 (attrs, cattrs)
- [ ] `01_basic_usage.py` - @dataclass 기본 사용법 예제
- [ ] `02_field_options.py` - field() 옵션 예제
- [ ] `03_post_init.py` - __post_init__, InitVar, 파생 필드 예제
- [ ] `04_frozen.py` - frozen=True, replace() 예제
- [ ] `05_inheritance.py` - 상속 필드 순서, slots=True 예제
- [ ] `06_comparison.py` - dataclass vs NamedTuple vs TypedDict 벤치마크
- [ ] `07_attrs_intro.py` - attrs @define/@frozen, validator, converter 예제
- [ ] `08_cattrs_serialization.py` - structure/unstructure, JSON 변환 예제
- [ ] 전체 샘플 코드 실행 및 출력 결과 확인

## 2단계: 블로그 글 작성

- [ ] `docs/start/python-dataclasses-and-attrs/index.md` 생성
- [ ] frontmatter 작성 (title, description, date, tags, series)
- [ ] 섹션 1: dataclass 기본 문법 (기본 사용법, field(), __post_init__)
- [ ] 섹션 2: dataclass 고급 기능 (frozen, 상속/slots)
- [ ] 섹션 3: dataclass vs NamedTuple vs TypedDict 비교표 + 벤치마크
- [ ] 섹션 4: attrs / cattrs 생태계 (비교표 + 직렬화 예시)
- [ ] Mermaid 의사결정 트리 다이어그램 작성 (섹션 3)
- [ ] tutorials-python GitHub 코드 링크 추가
- [ ] 전체 글 리뷰 및 오탈자 확인

## 3단계: PR 생성

- [ ] feature 브랜치 생성 (blog-v2.advenoh.pe.kr 저장소)
- [ ] tutorials-python 샘플 코드 커밋 (tutorials-python 저장소)
- [ ] 블로그 글 커밋 및 PR 생성
