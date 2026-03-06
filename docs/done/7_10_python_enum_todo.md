# TODO: Python Enum 활용법

## 1단계: 샘플 코드 작성 (`tutorials-python/python/enum/`)

- [x] `01_basic_enum.py` — Enum 정의, 멤버 접근, name/value, 이터레이션, 싱글턴
- [x] `02_auto_value.py` — auto(), _generate_next_value_(), StrEnum+auto()
- [x] `03_int_str_enum.py` — IntEnum, StrEnum 예제 및 일반 Enum과 비교
- [x] `04_flag_enum.py` — Flag, IntFlag, UNIX 퍼미션 스타일 권한 시스템
- [x] `05_custom_methods.py` — 커스텀 메서드, @property, __str__/__format__
- [x] `06_comparison_serialize.py` — ==/is 비교, JSON 직렬화, DB 저장 패턴
- [x] `07_practical_patterns.py` — 상태 머신, API 응답 코드, 설정값 관리, match/case
- [x] 각 파일 실행 확인 (`python 파일명.py`)

## 2단계: 블로그 글 작성 (`docs/start/python-enum-활용법/index.md`)

- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] `# 1. Enum 기본 문법` 작성
  - [x] 1.1 Enum 정의와 멤버 접근
  - [x] 1.2 auto() 자동 값 할당
- [x] `# 2. Enum 타입 종류` 작성
  - [x] 2.1 IntEnum, StrEnum
  - [x] 2.2 Flag, IntFlag
- [x] `# 3. Enum 커스터마이징` 작성
  - [x] 3.1 커스텀 메서드와 프로퍼티
  - [x] 3.2 __str__, __format__ 오버라이드
- [x] `# 4. 비교와 직렬화` 작성
  - [x] 4.1 ==, is 비교 동작 차이
  - [x] 4.2 JSON 직렬화/역직렬화
  - [x] 4.3 DB 저장 패턴
- [x] `# 5. 실전 패턴` 작성
  - [x] 5.1 상태 머신
  - [x] 5.2 API 응답 코드
  - [x] 5.3 설정값 관리
  - [x] 5.4 match/case와 Enum 조합
- [x] `# 6. 마무리` 작성 (Enum 타입별 선택 가이드 표)
- [x] `# 7. 참고` 작성

## 3단계: 검증

- [x] 블로그 글에서 샘플 코드 참조/링크 확인
- [x] UTF-8 인코딩 확인 (`file -I index.md`)
- [x] `npm run build`로 빌드 확인
- [x] 목차(TOC) 자동 생성 정상 확인
- [x] 코드 하이라이팅 정상 확인
