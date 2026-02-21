오케이 👍
실습 중심 + Go다운 구현 감각을 살리는 쪽으로 목차를 다시 다듬어볼게.
(발표/블로그로 써도 자연스럽게 이어지게 구성했어)

⸻

Strategy 패턴 스터디 목차 (Golang 실습 중심)

1. 개요
   •	Strategy 패턴이란?
   •	왜 Go에서 Strategy 패턴이 중요한가?
   •	Go의 인터페이스 철학과 Strategy 패턴의 궁합

⸻

2. Strategy 패턴이 필요한 상황
   •	if / switch 문이 늘어나는 Go 코드 예제
   •	요구사항 추가 시 코드가 망가지는 구조
   •	Go에서 자주 보이는 안티패턴

⸻

3. Strategy 패턴의 핵심 아이디어
   •	변하는 로직을 분리한다는 개념
   •	“행위”를 인터페이스로 추상화하기
   •	런타임에 전략을 교체한다는 의미

⸻

4. Go에서의 구성 요소
   •	Strategy 인터페이스 정의
   •	Concrete Strategy 구현체
   •	Context 구조체의 역할
   •	의존성 방향 정리 (Context → Interface)

⸻

5. 기본 실습 예제 (Step by Step)
   •	예제 도메인 소개 (예: 결제 방식 / 요금 계산)
   •	Strategy 적용 전 코드
   •	문제점 분석
   •	Strategy 패턴 적용
   •	인터페이스 + 구조체 분리

⸻

6. Go 스타일 Strategy 구현 패턴
   •	인터페이스 기반 Strategy
   •	함수 타입(Function Type) Strategy
   •	struct + method vs 함수 전략 비교
   •	언제 어떤 방식을 선택할까?

⸻

7. 실전 실습 예제
   •	예제 1: 결제 전략
   •	CreditCard / KakaoPay / NaverPay
   •	예제 2: 할인 정책 전략
   •	고정 할인 / 비율 할인 / 조건부 할인
   •	예제 3: 알고리즘 전략
   •	정렬 방식 교체
   •	경로 계산 방식 교체

⸻

8. Strategy 패턴과 Go의 DI
   •	생성자 주입 패턴
   •	전략을 외부에서 주입하는 구조
   •	전역 변수 없이 구성하는 방법
   •	wire / fx 없이도 깔끔하게 쓰는 법

⸻

9. Factory와 함께 쓰는 Strategy
   •	전략 선택 로직 분리 필요성
   •	Factory + Strategy 구조
   •	switch 문은 어디까지 허용할 것인가?

⸻

10. 테스트 관점에서의 Strategy 패턴
    •	전략별 단위 테스트 작성
    •	Mock Strategy 만들기
    •	Context 테스트 쉽게 만드는 법

⸻

11. 실무에서 자주 겪는 고민
    •	Strategy가 과한 경우
    •	인터페이스 남용 문제
    •	작은 서비스 vs 큰 서비스 기준

⸻

12. 리팩토링 실습
    •	기존 코드 → Strategy 패턴으로 점진적 리팩토링
    •	PR 단위로 안전하게 적용하는 방법
    •	팀 내 설득 포인트

⸻

13. Strategy vs State 패턴 (Go 관점)
    •	두 패턴의 구조적 차이
    •	코드로 비교해보기
    •	언제 Strategy, 언제 State인가?

⸻

14. 정리
    •	Go에서 Strategy 패턴을 쓰는 기준
    •	기억해야 할 핵심 포인트
    •	다음 스터디로 이어질 패턴 제안

⸻

이 목차면
•	Go 인터페이스 이해
•	실무 설계 감각
•	테스트 & 리팩토링

까지 한 번에 가져갈 수 있어.

다음 단계로는
👉 5번 기본 실습 예제 전체 코드부터 만들어볼까?
아니면 함수 타입 Strategy 예제를 먼저 파볼까?