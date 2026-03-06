# TODO: Python ABC와 Protocol

## 1단계: 샘플 코드 작성 (tutorials-python)

- [x] `tutorials-python/python/abc-protocol/` 디렉토리 생성
- [x] `test_abc_basic.py` - ABC 기본 (추상 클래스 정의, 인스턴스 생성 불가, 일반+추상 메서드 혼합)
- [x] `test_abstractmethod.py` - @abstractmethod + @property/@classmethod/@staticmethod 조합, super() 호출
- [x] `test_collections_abc.py` - collections.abc 주요 ABC, __subclasshook__, register()
- [x] `test_protocol_basic.py` - Protocol 정의, 구조적 서브타이핑
- [x] `test_runtime_checkable.py` - @runtime_checkable, isinstance() 검사, 제한사항
- [x] `test_abc_vs_protocol.py` - 동일 인터페이스를 ABC/Protocol 두 방식으로 구현 비교
- [x] `test_patterns.py` - 실전 패턴 (플러그인 시스템, Repository 패턴)
- [x] 전체 테스트 실행 및 통과 확인

## 2단계: 블로그 글 작성 (blog-v2)

- [x] `docs/start/python-abc와-protocol/index.md` 생성
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] `# 1. 개요` - ABC와 Protocol 소개, 왜 필요한지
- [x] `# 2. ABC (Abstract Base Class)` 작성
  - [x] `## 2.1 ABC 기본 사용법` - 추상 클래스 정의, TypeError, 일반+추상 메서드 혼합
  - [x] `## 2.2 @abstractmethod 활용` - @property/@classmethod 조합, super() 패턴
  - [x] `## 2.3 collections.abc의 주요 ABC` - 주요 ABC 소개, __subclasshook__, register()
- [x] `# 3. Protocol (구조적 서브타이핑)` 작성
  - [x] `## 3.1 Protocol 기본 사용법` - Protocol 정의, duck typing 공식화
  - [x] `## 3.2 runtime_checkable Protocol` - @runtime_checkable, isinstance(), 제한사항
- [x] `# 4. ABC vs Protocol 비교` - 비교표, 선택 기준
- [x] `# 5. 실전 패턴` 작성
  - [x] `## 5.1 플러그인 시스템` - Protocol 기반 플러그인 인터페이스
  - [x] `## 5.2 Repository 패턴` - ABC 기반 데이터 접근 계층 추상화
- [x] `# 6. 마무리` 작성
- [x] UTF-8 인코딩 확인 (`file -I`)

## 3단계: 리뷰 및 정리

- [ ] 블로그 글에서 tutorials-python 코드 참조/링크 확인
- [ ] 코드 블록 내 코드가 테스트 파일과 일치하는지 확인
- [ ] PR 생성
