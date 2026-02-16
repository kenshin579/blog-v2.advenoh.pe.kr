# RAG 기반 블로그 Q&A 챗봇 - 블로그 TODO

## 선행 조건

- [ ] rag-chatbot 프로젝트 M1~M3 완료 (기본 RAG 동작 확인)

---

## 편 1: LLM 적응 기법과 RAG 개념

### 리서치

- [x] LLM 한계 정리 (hallucination, knowledge cutoff, 도메인 지식)
- [x] Adaptation 기법 비교 조사 (Fine-tuning vs Prompt Engineering vs RAG)
- [x] Fine-tuning 기법 리서치 (PEFT, LoRA, QLoRA 원리 및 사례)
- [x] RAG 아키텍처 유형 조사 (Naive RAG vs Advanced RAG vs Modular RAG)
- [x] 문서 파싱 방법론 리서치 (Rule-based vs AI-based: unstructured, LlamaParse)
- [x] 청킹 전략 비교 리서치 (fixed-size, recursive, semantic)
- [x] 인덱싱 방식 리서치 (BM25, Full-text, Knowledge-based, 벡터)
- [x] 벡터 저장소 비교 리서치 (ChromaDB, FAISS, Pinecone, Weaviate)
- [x] 검색 방법 리서치 (Exact NN vs ANN: LSH, HNSW, IVF)

### 다이어그램 작성 (Mermaid)

- [x] LLM 적응 기법 비교 다이어그램
- [x] RAG 전체 파이프라인 아키텍처
- [x] Retrieval 단계 상세 흐름
- [x] Generation 단계 흐름

### 블로그 초안 작성

- [x] frontmatter 작성 (title, description, tags, category)
- [x] 섹션 1: LLM 적응 기법 개요 작성
- [x] 섹션 2: Fine-tuning 기법 작성 (PEFT, LoRA, QLoRA)
- [x] 섹션 3: RAG 아키텍처 개요 작성
- [x] 섹션 4: RAG 파이프라인 - Retrieval 작성
- [x] 섹션 5: RAG 파이프라인 - Generation 작성
- [x] 섹션 6: 기본 RAG 챗봇 구현 작성 (코드 예제 참조)
- [x] 섹션 7: 참고 자료 정리

### 검토

- [x] 코드 예제가 rag-chatbot 프로젝트와 일치하는지 확인
- [x] Mermaid 다이어그램 IDE 렌더링 확인
- [x] UTF-8 인코딩 확인 (`file -I`)
- [ ] `docs/start/` → `contents/llm/`으로 이동
- [ ] PR 생성 및 MergeReady label 추가

---

## 편 2: 프롬프트 엔지니어링과 RAG 최적화

### 선행 조건

- [ ] 블로그 편 1 완료
- [ ] rag-chatbot 프로젝트 M4~M5 완료 (최적화 + 평가)

### 리서치

- [ ] Zero-shot / Few-shot Prompting 기법 및 예제
- [ ] Chain-of-Thought (CoT) 프롬프팅 원리 및 적용
- [ ] Role-specific / User-context Prompting 패턴
- [ ] RAG 전용 프롬프트 설계 (컨텍스트 활용, "모를 때" 처리)
- [ ] Hybrid Search 리서치 (BM25 + 벡터 결합)
- [ ] Re-ranking 리서치 (Cohere Rerank, Cross-encoder)
- [ ] RAFT 기법 리서치 (RAG + Fine-tuning 결합, Oracle/Distractor)
- [ ] RAGAS 평가 지표 리서치 (Context Relevance, Faithfulness, Answer Correctness)
- [ ] 프롬프트 인젝션 방어 전략

### 다이어그램 작성 (Mermaid)

- [ ] 프롬프트 엔지니어링 기법 분류 다이어그램
- [ ] Hybrid Search + Re-ranking 흐름
- [ ] RAFT 학습 프로세스
- [ ] RAGAS 평가 파이프라인

### 블로그 초안 작성

- [ ] frontmatter 작성 (title, description, tags, category)
- [ ] 섹션 1: 프롬프트 엔지니어링 기법 작성
- [ ] 섹션 2: RAG 최적화 기법 작성 (Hybrid Search, Re-ranking, 대화 히스토리)
- [ ] 섹션 3: RAFT 작성
- [ ] 섹션 4: RAG 품질 평가 작성 (RAGAS)
- [ ] 섹션 5: 프로덕션 고려사항 작성
- [ ] 섹션 6: 참고 자료 정리

### 검토

- [ ] 코드 예제가 rag-chatbot 프로젝트와 일치하는지 확인
- [ ] Mermaid 다이어그램 IDE 렌더링 확인
- [ ] UTF-8 인코딩 확인 (`file -I`)
- [ ] `docs/start/` → `contents/llm/`으로 이동
- [ ] PR 생성 및 MergeReady label 추가
