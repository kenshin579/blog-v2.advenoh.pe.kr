# 블로그 ChatWindow 통합 (blog-v2) - TODO

## 선행 조건

- [ ] `ai-chatbot.advenoh.pe.kr` API 서버 배포 완료
- [ ] blog-v2 Collection 인덱싱 완료
- [ ] `/chat` API 엔드포인트 정상 동작 확인

---

### M1: API 서버 CORS 설정

- [ ] `ai-chatbot.advenoh.pe.kr`에 `blog-v2.advenoh.pe.kr` 도메인 CORS 허용 추가
- [ ] `localhost:3000` 개발 환경 CORS 허용 추가
- [ ] CORS 설정 동작 확인 (브라우저 콘솔에서 preflight 요청 확인)

### M2: ChatWindow 컴포넌트 구현

#### 환경 설정

- [x] `.env.local`에 `NEXT_PUBLIC_CHAT_API_URL` 환경 변수 추가

#### API 클라이언트

- [x] `lib/chat-api.ts` 생성 (sendChatMessage 함수, 타입 정의)

#### 컴포넌트 구현

- [x] `components/chat/ChatButton.tsx` - 플로팅 채팅 버튼
- [x] `components/chat/ChatWindow.tsx` - 채팅 창 컨테이너
- [x] `components/chat/MessageList.tsx` - 메시지 목록 (질문/답변)
- [x] `components/chat/ChatInput.tsx` - 입력 필드 + 전송 버튼
- [x] `components/chat/SourceLinks.tsx` - 참조 블로그 글 링크 목록

#### 레이아웃 통합

- [x] `app/layout.tsx`에 ChatButton 컴포넌트 추가

#### UI/UX 확인

- [x] 다크/라이트 모드 테마 연동 확인
- [x] 모바일 반응형 확인 (전체 화면 전환)
- [x] 메시지 자동 스크롤 동작 확인
- [x] 로딩 상태 (타이핑 인디케이터) 확인
- [x] 에러 처리 (API 실패 시 에러 메시지 표시) 확인

### M3: 배포 및 E2E 테스트

- [x] `npm run build` 빌드 성공 확인
- [x] `npm run check` 타입 체크 통과 확인
- [x] **MCP Playwright 테스트**:
  - [x] 플로팅 버튼 클릭 → ChatWindow 오픈 확인
  - [x] 질문 입력 → 답변 수신 확인
  - [x] 소스 인용 링크 표시 확인
  - [x] 멀티턴 대화 동작 확인
  - [x] 모바일 반응형 확인
- [x] PR 생성 (#174) 및 배포
