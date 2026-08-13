# 1. 본문

픽스처용 더미 본문이다.

# 2. 퀴즈

```quiz
- type: mcq
  q: "샘플 객관식 하나. 무엇이 맞나?"
  choices: ["첫째 보기 문장이다", "둘째 보기 문장이다", "셋째 보기 문장이다", "넷째 보기 문장이다"]
  answer: 0
  explain: "첫째가 맞다. (1.1)"

- type: ox
  q: "샘플 OX 하나. 이 문장은 참인가?"
  answer: true
  explain: "참이다. (1.2)"

- type: mcq
  q: "샘플 객관식 둘. 무엇이 맞나?"
  choices: ["가나다라마바", "사아자차카타", "파하가나다라", "마바사아자차"]
  answer: 1
  explain: "둘째가 맞다. (1.3)"

- type: code
  q: "이 코드는 무엇을 출력하나?"
  lang: go
  code: |
    fmt.Println("hello")
  choices: ["hello를 출력한다", "world를 출력한다", "빈 줄을 출력한다", "컴파일 에러가 난다"]
  answer: 0
  explain: "hello를 출력한다. (1.4)"

- type: blank
  q: "빈칸 문항 하나. 하늘의 색은 ___ 이다."
  answer: ["파랑"]
  explain: "그렇다. (1.5)"

- type: mcq
  q: "샘플 객관식 셋. 무엇이 맞나?"
  choices: ["기역니은디귿", "리을미음비읍", "시옷이응지읒", "치읓키읔티읕"]
  answer: 2
  explain: "셋째가 맞다. (1.6)"

- type: ox
  q: "샘플 OX 둘. 이 문장도 참인가?"
  answer: false
  explain: "아니다. (1.7)"

- type: code
  q: "이 코드의 결과는 무엇인가?"
  lang: go
  code: |
    x := 2 + 3
    fmt.Println(x)
  choices: ["23을 출력한다", "5를 출력한다", "0을 출력한다", "런타임에 멈춘다"]
  answer: 1
  explain: "덧셈 결과다. (1.8)"

- type: blank
  q: "빈칸 문항 둘. 무지개 색의 수는 ___ 이다."
  answer: ["일곱"]
  explain: "그렇다. (1.9)"

- type: mcq
  q: "샘플 객관식 넷. 무엇이 맞나?"
  choices: ["봄여름가을겨", "겨울봄여름가", "가을겨울봄여", "여름가을겨울"]
  answer: 3
  explain: "넷째가 맞다. (1.10)"
```
