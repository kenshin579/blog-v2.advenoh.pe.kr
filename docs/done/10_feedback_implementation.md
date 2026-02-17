# 챗봇 답변 피드백 기능 구현 문서

## 참고 구현

ai-chatbot 프론트엔드에 이미 동일한 기능이 구현되어 있으므로 패턴을 따른다:
- `ai-chatbot.advenoh.pe.kr/frontend/src/lib/api.ts` → `sendFeedback()`
- `ai-chatbot.advenoh.pe.kr/frontend/src/components/MessageList.tsx` → 피드백 UI
- `ai-chatbot.advenoh.pe.kr/frontend/src/components/ChatWindow.tsx` → `message_id`, `question` 저장

---

## 1. chat-api.ts 수정

### 1.1 ChatResponse에 message_id 추가

```typescript
export interface ChatResponse {
  answer: string;
  sources: SourceDocument[];
  message_id: string;  // 백엔드가 이미 반환하는 필드
}
```

### 1.2 sendFeedback 함수 추가

```typescript
export interface FeedbackRequest {
  message_id: string;
  blog_id: string;
  question: string;
  rating: "up" | "down";
}

export async function sendFeedback(params: FeedbackRequest): Promise<void> {
  const res = await fetch(`${CHAT_API_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Feedback API error: ${res.status}`);
  }
}
```

---

## 2. MessageList.tsx 수정

### 2.1 Message 인터페이스 확장

```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceDocument[];
  message_id?: string;   // 백엔드 응답 ID (피드백 전송용)
  question?: string;     // 원래 질문 (피드백 전송용)
}
```

### 2.2 MessageListProps 확장

```typescript
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  blogId: string;  // 피드백 전송 시 blog_id로 사용
}
```

### 2.3 피드백 상태 관리

```typescript
type FeedbackState = "idle" | "sending" | "done";

const [feedbackMap, setFeedbackMap] = useState<
  Record<string, { state: FeedbackState; rating?: "up" | "down" }>
>({});
```

- key: `message_id`
- `idle` → 버튼 활성화
- `sending` → 버튼 비활성화 + "전송 중..."
- `done` → "피드백 감사합니다 👍/👎"

### 2.4 피드백 UI

AI 답변 버블 하단 (`SourceLinks` 아래)에 렌더링:
- 조건: `msg.role === "assistant" && msg.message_id && msg.question`
- `idle`: "도움이 됐나요?" + 👍 👎 버튼
- `sending`: 버튼 비활성화 + "전송 중..."
- `done`: "피드백 감사합니다 👍/👎"
- 실패 시: `idle`로 복구 (재시도 가능)

---

## 3. ChatWindow.tsx 수정

### 3.1 응답에서 message_id, question 저장

현재 `assistantMsg` 생성 시 `crypto.randomUUID()`만 사용하고 있음. 백엔드 응답의 `message_id`와 원래 `question`을 추가로 저장:

```typescript
const assistantMsg: Message = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: res.answer,
  sources: res.sources,
  message_id: res.message_id,  // 추가
  question,                     // 추가
};
```

### 3.2 MessageList에 blogId 전달

```typescript
<MessageList messages={messages} isLoading={isLoading} blogId="blog-v2" />
```
