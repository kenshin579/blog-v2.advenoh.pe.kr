# RAG 기반 블로그 Q&A 챗봇 - TODO

### M1. 프로젝트 셋업 및 인덱싱 파이프라인

- [ ] 프로젝트 초기화 (`backend/` - `uv init`, `pyproject.toml` 작성)
- [ ] `backend/.env.example` 작성 (OPENAI_API_KEY 등)
- [ ] `Makefile` 작성 (dev, test, index, build 명령어)
- [ ] `backend/app/config.py` - Settings 클래스 구현 (pydantic-settings)
- [ ] `backend/app/rag/document_loader.py` - Markdown 로딩 + YAML frontmatter 파싱
- [ ] `backend/app/rag/chunker.py` - RecursiveCharacterTextSplitter 구현
- [ ] `backend/app/rag/embedder.py` - OpenAI text-embedding-3-small 연동
- [ ] `backend/app/rag/vector_store.py` - ChromaDB HttpClient 연결 + Collection 관리 (blog_id별 분리)
- [ ] `backend/scripts/index_documents.py` - CLI 인덱싱 스크립트
- [ ] blog-v2 `contents/` 문서 인덱싱 테스트
- [ ] `backend/tests/test_chunker.py` - 청킹 단위 테스트

### M2. RAG 체인 및 FastAPI 엔드포인트

- [ ] `backend/app/rag/retriever.py` - blog_id 기반 검색 로직
- [ ] `backend/app/rag/chain.py` - ConversationalRetrievalChain 구현
- [ ] `backend/app/prompts/templates.py` - 시스템 프롬프트 작성
- [ ] `backend/app/api/models.py` - ChatRequest, ChatResponse Pydantic 모델
- [ ] `backend/app/api/routes.py` - `/chat` 엔드포인트 (blog_id 필수)
- [ ] `backend/app/api/routes.py` - `/index/{blog_id}` 인덱싱 엔드포인트
- [ ] `backend/app/api/routes.py` - `/health` 헬스체크
- [ ] `backend/app/main.py` - FastAPI 앱 엔트리포인트
- [ ] 대화 히스토리 (멀티턴) 지원
- [ ] 소스 인용 (참조 블로그 글 제목 + URL 반환)
- [ ] `backend/tests/test_retriever.py` - 검색 단위 테스트
- [ ] `backend/tests/test_chain.py` - RAG 체인 통합 테스트

### M3. 독립 채팅 UI (ai-chatbot.advenoh.pe.kr)

- [ ] `frontend/` Next.js 15 프로젝트 초기화
- [ ] shadcn/ui 설정
- [ ] `blog_id` 선택 드롭다운 (검증용 블로그 전환)
- [ ] `ChatWindow.tsx` - 채팅 전체 레이아웃
- [ ] `MessageList.tsx` - 질문/답변 메시지 렌더링
- [ ] `ChatInput.tsx` - 입력 필드 + 전송 버튼
- [ ] FastAPI `/chat` API 연동
- [ ] 소스 인용 링크 표시
- [ ] 대화 히스토리 UI 상태 관리
- [ ] 로딩 상태 / 에러 핸들링
- [ ] MCP Playwright로 E2E 테스트 (채팅 입력 → 응답 확인)

### M4. LangSmith 트레이싱

- [ ] LangSmith 계정 생성 및 API 키 발급
- [ ] `backend/.env`에 LangSmith 환경변수 추가 (`LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`)
- [ ] LangSmith 트레이싱 동작 확인 (쿼리 → 트레이스 기록 확인)
- [ ] LangSmith 대시보드에서 응답 시간, 토큰 사용량 확인

> 사용자 피드백(👍👎), Admin 대시보드, 쿼리 로그는 `8_chatbot_monitoring_prd.md` 참조

### M5. 검색 품질 개선

- [ ] 프롬프트 최적화 (답변 정확도, 한국어 품질)
- [ ] Hybrid Search 적용 (키워드 + 시맨틱 검색)
- [ ] 검색 결과 재순위화 (Reranker)
- [ ] 청킹 전략 튜닝 (chunk_size, overlap 최적값)

### M6. RAGAS 평가 파이프라인

- [ ] `backend/app/evaluation/dataset.py` - 평가 데이터셋 작성
- [ ] `backend/app/evaluation/evaluator.py` - RAGAS 평가 구현
- [ ] `backend/scripts/evaluate.py` - 평가 실행 스크립트
- [ ] Faithfulness, Answer Relevancy, Context Precision 측정
- [ ] 평가 결과 리포트 생성

### M7. 인덱싱 자동 갱신 (GitHub Actions)

- [ ] `backend/app/api/routes.py` - `/index/{blog_id}` Bearer 토큰 인증 추가
- [ ] blog-v2 repo에 `.github/workflows/reindex-rag.yml` 워크플로우 작성
- [ ] GitHub Secrets에 `RAG_INDEX_TOKEN` 등록
- [ ] `contents/` 변경 → merge → 자동 재인덱싱 E2E 테스트

### M8. 배포

**ChromaDB 서버 (기존 Helm Chart 사용)**
- [ ] `helm repo add chroma https://amikos-tech.github.io/chromadb-chart/`
- [ ] `charts/charts/chromadb/Chart.yaml` 작성 (dependency로 `chroma/chromadb` 참조)
- [ ] `charts/charts/chromadb/values.yaml` 작성 (포트 8000, PVC, 리소스 등)
- [ ] ArgoCD ApplicationSet에 chromadb 추가
- [ ] ChromaDB 서버 배포 및 접속 확인

**RAG 챗봇 서버**
- [ ] `backend/Dockerfile` 작성 (Python 3.12 multi-stage)
- [ ] Docker 이미지 빌드 및 Push (`kenshin579/rag-chatbot`)
- [ ] `charts/charts/rag-chatbot/` Helm Chart 생성
- [ ] `values.yaml` 작성 (리소스, 환경변수, 헬스체크, `CHROMA_HOST`/`CHROMA_PORT`)
- [ ] ArgoCD ApplicationSet에 rag-chatbot 추가
- [ ] Gateway HTTPRoute 추가 (`ai-chatbot.advenoh.pe.kr`)
- [ ] 배포 후 MCP Playwright로 프로덕션 E2E 테스트

---

> 각 블로그에 ChatWindow 통합 및 investment Collection 추가는 `7_blog_chat_integration_prd.md` 참조
