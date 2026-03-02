# PRD: Python 언더스코어의 모든 것

## 개요
Python에서 언더스코어(`_`)의 다양한 용법과 컨벤션을 정리하는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 문법 Tips
- **번호**: 4-1
- **난이도**: 초급
- **우선순위**: ★★☆

## 다룰 내용
1. `_` 단일 언더스코어 (인터프리터, 무시 변수, 국제화)
   - REPL에서 마지막 결과값 저장: `>>> 1 + 2` → `>>> _`
   - 무시 변수: `for _ in range(10):`, `x, _, z = tuple`
   - 국제화(i18n) 관례: `_("Hello")` → gettext 함수 별칭
2. `_name` 선행 단일 언더스코어 (내부 사용 컨벤션)
   - "내부 구현" 표시: 외부에서 접근 가능하지만 접근하지 말라는 의미
   - `from module import *` 시 제외됨
   - `__all__`과의 관계
3. `name_` 후행 단일 언더스코어 (키워드 충돌 방지)
   - `class_`, `type_`, `list_` 등 Python 키워드와 충돌 시 사용
   - PEP 8 공식 가이드라인
4. `__name` 선행 이중 언더스코어 (name mangling)
   - `_ClassName__name`으로 이름이 변환되는 원리
   - 상속 시 이름 충돌 방지 목적
   - `dir(obj)`로 mangled 이름 확인
   - 의도적 사용 vs 남용 주의
5. `__name__` 던더 (매직 메서드/속성)
   - 주요 매직 메서드 카테고리: 생성(`__init__`), 표현(`__repr__`, `__str__`), 비교(`__eq__`, `__lt__`), 연산(`__add__`)
   - 주요 매직 속성: `__name__`, `__doc__`, `__module__`, `__class__`
   - `if __name__ == "__main__":` 패턴의 동작 원리
6. 숫자 리터럴에서의 `_` (1_000_000)
   - Python 3.6+ 기능: 가독성 향상을 위한 자릿수 구분
   - 16진수/2진수에서도 사용: `0xFF_FF`, `0b1111_0000`
   - 위치 제한: 시작/끝/연속 불가
7. 실전에서 자주 헷갈리는 케이스 정리
   - `_var` vs `__var` vs `__var__` 한눈에 비교표
   - 언제 `_`를 쓰고 언제 `__`를 쓰는지 판단 기준
   - 흔한 실수와 안티패턴

## 샘플 코드
- `tutorials-python/python/underscore/`

## 참고
- https://docs.python.org/3/reference/lexical_analysis.html
- https://peps.python.org/pep-0008/
