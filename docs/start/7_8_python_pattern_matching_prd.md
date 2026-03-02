# PRD: Python 패턴 매칭 (match/case)

## 개요
Python 3.10+ structural pattern matching의 문법과 실전 활용 사례를 다루는 블로그 포스팅.

## 시리즈
- **시리즈**: Python 문법 Tips
- **번호**: 4-2
- **난이도**: 중급
- **우선순위**: ★☆☆

## 다룰 내용
1. match/case 기본 문법
   - `match subject:` / `case pattern:` 구조
   - 단순 값 매칭 예시 (HTTP status code 분기)
   - Python 3.10+ 필수 사항
2. 리터럴 패턴, 캡처 패턴, 와일드카드 패턴
   - 리터럴: `case 200:`, `case "hello":` (정확한 값 매칭)
   - 캡처: `case x:` (변수에 바인딩)
   - 와일드카드: `case _:` (catch-all, 값 무시)
   - 상수 매칭 주의: `case Status.OK:` (점 표기 필수)
3. 시퀀스 패턴, 매핑 패턴
   - 시퀀스: `case [first, *rest]:` (리스트/튜플 디스트럭처링)
   - 매핑: `case {"type": "user", "name": name}:` (딕셔너리 매칭)
   - 중첩 시퀀스: `case [["a", x], ["b", y]]:`
4. 클래스 패턴
   - `case Point(x=0, y=y):` (속성 기반 매칭)
   - `__match_args__`로 위치 인자 매칭 지원
   - dataclass와의 자연스러운 조합
5. OR 패턴 (`|`)
   - `case 401 | 403 | 404:` (여러 패턴 합치기)
   - OR 패턴에서 캡처 변수 일관성 규칙
6. guard 조건 (`if`)
   - `case x if x > 0:` (패턴 매칭 + 추가 조건)
   - 복잡한 조건 로직과 조합
7. 중첩 패턴
   - 패턴 안에 패턴: `case {"users": [{"name": name}, *_]}:`
   - 깊은 구조의 JSON 데이터 추출
8. 실전 활용
   - 커맨드 파서: CLI 인자 분기 처리
   - 상태 머신: 이벤트 기반 상태 전환
   - JSON/API 응답 데이터 파싱 패턴
   - AST 노드 처리 패턴
9. if/elif vs match/case 비교
   - 가독성 비교 (동일 로직, 두 방식 코드 나란히)
   - match/case가 유리한 경우 vs if/elif가 나은 경우
   - 성능 차이 여부

## 샘플 코드
- `tutorials-python/python/pattern-matching/`

## 참고
- https://docs.python.org/3/whatsnew/3.10.html#pep-634-structural-pattern-matching
- https://peps.python.org/pep-0634/
