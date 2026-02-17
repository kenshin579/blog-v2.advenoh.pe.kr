# 챗봇 답변 피드백 기능 TODO

## M1: API 클라이언트 수정

- [x] `lib/chat-api.ts`: `ChatResponse`에 `message_id: string` 필드 추가
- [x] `lib/chat-api.ts`: `FeedbackRequest` 인터페이스 추가
- [x] `lib/chat-api.ts`: `sendFeedback()` 함수 추가 (`POST /feedback`)

## M2: 메시지 모델 및 데이터 저장

- [x] `components/chat/MessageList.tsx`: `Message` 인터페이스에 `message_id?`, `question?` 필드 추가
- [x] `components/chat/MessageList.tsx`: `MessageListProps`에 `blogId` 추가
- [x] `components/chat/ChatWindow.tsx`: API 응답의 `message_id`를 메시지에 저장
- [x] `components/chat/ChatWindow.tsx`: 원래 `question`을 메시지에 저장
- [x] `components/chat/ChatWindow.tsx`: `<MessageList>`에 `blogId="blog-v2"` 전달

## M3: 피드백 UI 구현

- [x] `components/chat/MessageList.tsx`: `feedbackMap` 상태 추가 (`idle`/`sending`/`done`)
- [x] `components/chat/MessageList.tsx`: `handleFeedback()` 함수 구현
- [x] `components/chat/MessageList.tsx`: AI 답변 하단에 피드백 버튼 (👍👎) 렌더링
- [x] `components/chat/MessageList.tsx`: 전송 중 → 버튼 비활성화 + "전송 중..." 표시
- [x] `components/chat/MessageList.tsx`: 완료 → "피드백 감사합니다 👍/👎" 표시
- [x] `components/chat/MessageList.tsx`: 실패 시 → `idle`로 복구 (재시도 가능)

## M4: 테스트 (MCP Playwright)

- [x] 챗봇 열기 → 질문 입력 → 답변 수신 확인
- [x] AI 답변 하단에 "도움이 됐나요? 👍 👎" 표시 확인
- [x] 👍 클릭 → "피드백 감사합니다 👍" 표시 확인
- [x] 피드백 완료 후 버튼 재클릭 불가 확인
