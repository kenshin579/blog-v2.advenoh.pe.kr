# 1. 본문

픽스처용 더미 본문이다.

# 2. 퀴즈

```quiz
- type: mcq
  q: "샘플 객관식 질문이다. 무엇이 맞나?"
  choices: ["첫 번째 보기 문장이다", "두 번째 보기 문장이다", "세 번째 보기 문장이다", "네 번째 보기 문장이다"]
  answer: 0
  explain: "첫 번째가 맞다. (1.1)"

- type: ox
  q: "샘플 OX 질문이다. 이 문장은 참인가?"
  answer: true
  explain: "참이다. (1.2)"

- type: code
  q: "이 코드는 무엇을 출력하나?"
  lang: go
  code: |
    fmt.Println("hello")
  choices: ["hello를 출력한다", "world를 출력한다", "빈 줄을 출력한다", "컴파일 에러가 난다"]
  answer: 0
  explain: "hello를 출력한다. (1.3)"

- type: blank
  q: "빈칸 문항이다. 하늘의 색은 ___ 이다."
  answer: ["파랑"]
  explain: "파랑이다. (1.4)"
```
