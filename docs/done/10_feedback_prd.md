# 챗봇 답변 피드백 기능 추가 PRD

## 1. 개요

### 1.1 목적

blog-v2에 임베드된 챗봇의 답변에 대해 👍👎 피드백을 남길 수 있는 기능을 추가한다.

### 1.2 배경

- ai-chatbot 사이트에는 이미 챗봇 답변 피드백 기능이 구현되어 있음
- blog-v2 챗봇에는 동일 기능이 아직 없음
- 백엔드 `POST /feedback` API와 `feedbacks` 테이블은 이미 존재하므로 **프론트엔드만 수정**

### 1.3 참고 구현

- **ai-chatbot**: `frontend/src/components/MessageList.tsx` (피드백 UI), `frontend/src/lib/api.ts` (`sendFeedback`)

---

## 2. 현재 상태 vs 목표

### 2.1 현재 (blog-v2)

- `ChatResponse`에 `message_id` 없음
- `sendFeedback()` 함수 없음
- `MessageList.tsx`에 피드백 UI 없음

### 2.2 목표

- 챗봇 답변 하단에 "도움이 됐나요? 👍 👎" 표시
- 클릭 시 `POST /feedback` API로 전송
- 완료 후 "피드백 감사합니다 👍" 표시

---

## 3. 요구사항

### 3.1 chat-api.ts 수정

```typescript
// ChatResponse에 message_id 추가
export interface ChatResponse {
  answer: string;
  sources: SourceDocument[];
  message_id: string;  // 추가
}

// sendFeedback 함수 추가
export async function sendFeedback(params: {
  message_id: string;
  blog_id: string;
  question: string;
  rating: "up" | "down";
}): Promise<void>;
```

### 3.2 MessageList.tsx 수정

- `Message` 인터페이스에 `message_id`, `question` 필드 추가
- AI 답변 하단에 피드백 버튼 (👍👎) 렌더링
- `feedbackMap` 상태로 메시지별 피드백 상태 관리 (`idle` → `sending` → `done`)
- 피드백 완료 후 재클릭 방지

### 3.3 ChatWindow.tsx 수정

- API 응답의 `message_id`를 메시지 객체에 저장
- 사용자 질문(`question`)도 메시지 객체에 저장 (피드백 전송 시 필요)

---

## 4. 수정 범위

| 파일 | 변경 내용 | 유형 |
|------|----------|------|
| `lib/chat-api.ts` | `ChatResponse`에 `message_id` 추가, `sendFeedback()` 함수 추가 | 수정 |
| `components/chat/MessageList.tsx` | `Message`에 `message_id`/`question` 추가, 피드백 UI + 핸들러 추가 | 수정 |
| `components/chat/ChatWindow.tsx` | 응답의 `message_id`와 `question`을 메시지에 저장 | 수정 |

---

## 5. 수용 기준

- [ ] 챗봇 AI 답변 하단에 "도움이 됐나요? 👍 👎" 표시
- [ ] 👍/👎 클릭 시 `POST /feedback` API 호출 성공
- [ ] 피드백 전송 중 버튼 비활성화 + "전송 중..." 표시
- [ ] 피드백 완료 후 "피드백 감사합니다 👍/👎" 표시 (재클릭 불가)
- [ ] API 호출 실패 시 버튼 다시 활성화 (재시도 가능)
- [ ] MCP Playwright로 피드백 버튼 클릭 및 상태 변화 확인
