# RAG 기반 개발 문서 Q&A 챗봇 - 블로그 PRD

## 1. 개요

### 1.1 목적
RAG(Retrieval-Augmented Generation)와 Prompt Engineering을 활용한 개발 문서 Q&A 챗봇에 대한 블로그 시리즈를 작성한다.

### 1.2 대상 독자
- RAG 개념을 처음 접하는 개발자
- LangChain으로 RAG 파이프라인을 구현하고 싶은 개발자
- 프롬프트 엔지니어링 기법을 실무에 적용하고 싶은 개발자

### 1.3 참조 프로젝트
- **Repo**: https://github.com/kenshin579/rag-chatbot
- **프로젝트 PRD**: `docs/start/5_chatbot_project_prd.md` 참조

---

## 2. 블로그 포스트 목차

### 시리즈 구성 (2편)

#### 편 1: LLM 적응 기법과 RAG 개념

```
# 1. LLM 적응 기법 개요 (Adaptation Techniques)
  ## 1.1 LLM의 한계
    - 환각(hallucination) 문제
    - 최신 정보 반영 불가
    - 도메인 특화 지식 부족
  ## 1.2 적응 기법 비교: Fine-tuning vs Prompt Engineering vs RAG
    - 각 접근법의 목적과 특징
    - 비용, 구현 난이도, 효과 비교
    - 언제 어떤 기법을 선택할지

# 2. Fine-tuning 기법
  ## 2.1 전통적 Fine-tuning
    - 전체 파라미터 업데이트 방식
    - 한계: 높은 비용, 대규모 데이터 필요
  ## 2.2 Parameter-Efficient Fine-Tuning (PEFT)
    - Adapters: 소규모 모듈 삽입 방식
    - LoRA (Low-Rank Adaptation): 저랭크 행렬 분해
    - QLoRA: 양자화 + LoRA 결합
  ## 2.3 Fine-tuning vs RAG 선택 가이드
    - 각 접근법의 장단점 비교표
    - 실무 판단 기준

# 3. RAG 아키텍처 개요
  ## 3.1 RAG란 무엇인가?
    - Retrieval + Augmented + Generation 각 단계 설명
    - Naive RAG vs Advanced RAG vs Modular RAG
  ## 3.2 RAG 전체 설계 (Overall Design)
    - 전체 파이프라인 아키텍처 다이어그램
    - 각 컴포넌트의 역할과 데이터 흐름
    - 설계 시 고려사항 (latency, 정확도, 비용 트레이드오프)

# 4. RAG 파이프라인 - Retrieval
  ## 4.1 문서 파싱 (Document Parsing)
    - Rule-based 파싱: 정규식, 구조 기반 추출
    - AI-based 파싱: LLM/ML 기반 문서 이해 (unstructured, LlamaParse)
    - LangChain Document Loaders 활용
  ## 4.2 청킹 전략 (Chunking)
    - fixed-size, recursive, semantic chunking 비교
    - chunk_size와 chunk_overlap 파라미터 튜닝
    - 청킹 전략이 검색 품질에 미치는 영향
  ## 4.3 인덱싱 (Indexing)
    - 키워드 인덱싱 (BM25, TF-IDF)
    - Full-text 인덱싱 (Elasticsearch)
    - Knowledge-based 인덱싱 (지식 그래프)
    - 벡터 인덱싱 (임베딩 모델)
      - 임베딩 모델 비교: OpenAI, Sentence Transformers, Cohere
      - 벡터 공간에서의 의미적 유사도
  ## 4.4 벡터 저장소 (Vector Store)
    - ChromaDB, FAISS, Pinecone, Weaviate 비교
    - 인덱싱 알고리즘: flat, IVF, HNSW

# 5. RAG 파이프라인 - Generation
  ## 5.1 검색 방법 (Search Methods)
    - Exact Nearest Neighbor (brute-force)
    - Approximate Nearest Neighbor (ANN): LSH, HNSW, IVF
    - Exact vs ANN 트레이드오프 (정확도 vs 속도)
  ## 5.2 검색된 컨텍스트 기반 답변 생성
    - 검색 결과를 LLM에 전달하는 방식
    - 컨텍스트 윈도우와 검색 결과 수(top_k) 관계

# 6. 기본 RAG 챗봇 구현
  ## 6.1 프로젝트 구조 설계
  ## 6.2 문서 인덱싱 파이프라인 구현
  ## 6.3 검색 + 생성 체인 구현
  ## 6.4 FastAPI REST API 구현
  ## 6.5 채팅 UI 구현 (React + Next.js)
  ## 6.6 실행 및 테스트

# 7. 참고
```

#### 편 2: 프롬프트 엔지니어링과 RAG 최적화

```
# 1. 프롬프트 엔지니어링 기법
  ## 1.1 Zero-shot vs Few-shot Prompting
  ## 1.2 Chain-of-Thought (CoT) 프롬프팅
  ## 1.3 Role-specific Prompting
    - 시스템 프롬프트 설계 패턴
    - 개발 문서 Q&A에 최적화된 프롬프트 작성
  ## 1.4 RAG 전용 프롬프트 설계
    - 검색된 컨텍스트를 효과적으로 활용하는 프롬프트
    - "답을 모를 때" 처리 전략

# 2. RAG 최적화 기법
  ## 2.1 검색 품질 향상
    - Hybrid Search (키워드 + 시맨틱)
    - Re-ranking (Cohere Rerank, Cross-encoder)
    - Multi-query Retrieval
  ## 2.2 컨텍스트 윈도우 관리
    - 검색 결과 수 최적화 (top_k 튜닝)
    - 컨텍스트 압축 (Contextual Compression)
  ## 2.3 대화 히스토리 관리
    - ConversationBufferMemory vs ConversationSummaryMemory
    - 멀티턴 대화에서의 컨텍스트 유지

# 3. RAFT (Retrieval Augmented Fine-Tuning)
  ## 3.1 RAFT 개념
    - RAG + Fine-tuning 결합 학습 기법
    - Oracle 문서와 Distractor 문서를 활용한 학습
  ## 3.2 RAFT vs 기존 RAG 비교
    - 도메인 특화 시나리오에서의 성능 차이
    - 적용 사례와 한계

# 4. RAG 품질 평가
  ## 4.1 평가 지표
    - Context Relevance (검색된 문서의 관련성)
    - Faithfulness (답변의 충실도 - 환각 여부)
    - Answer Correctness (답변 정확도)
  ## 4.2 RAGAS를 활용한 자동 평가
    - 평가 데이터셋 구성
    - 평가 파이프라인 구현
  ## 4.3 평가 결과 분석 및 개선 전략

# 5. 프로덕션 고려사항
  ## 5.1 비용 최적화 (캐싱, 모델 선택)
  ## 5.2 보안 (프롬프트 인젝션 방어)
  ## 5.3 모니터링 및 로깅

# 6. 참고
```

---

## 3. 작성 순서

| 단계 | 작업 | 선행 조건 |
|------|------|-----------|
| B1 | 프로젝트 M1~M3 완료 (기본 RAG 동작) | 프로젝트 PRD M1~M3 |
| B2 | 블로그 1편 작성 (RAG 개념 + 기본 구현) | B1 |
| B3 | 프로젝트 M4~M5 완료 (최적화 + 평가) | B2, 프로젝트 PRD M4~M5 |
| B4 | 블로그 2편 작성 (프롬프트 엔지니어링 + 최적화) | B3 |

> 프로젝트 구현이 먼저 완료된 후 해당 내용을 기반으로 블로그를 작성한다.

---

## 4. 블로그 작성 규칙

- **샘플 코드**: 블로그 내부가 아닌 `rag-chatbot` 프로젝트에서 참조/링크
- **다이어그램**: Mermaid 형식으로 작성 (ASCII art 금지)
- **Draft 위치**: `docs/start/{글-제목}/index.md`에 초안 작성
- **Publish**: 리뷰 후 `contents/{카테고리}/`로 이동

---

## 5. 참고 자료

- [bytebyteai.com - Build a Customer Support Chatbot using RAGs](https://bytebyteai.com/)
- [LangChain RAG Documentation](https://docs.langchain.com/oss/python/langchain/rag)
- [Real Python - Build an LLM RAG Chatbot With LangChain](https://realpython.com/build-llm-rag-chatbot-with-langchain/)
- [Building a Production-Ready RAG Chatbot with FastAPI and LangChain](https://blog.futuresmart.ai/building-a-production-ready-rag-chatbot-with-fastapi-and-langchain)
- [RAGAS - RAG Assessment](https://docs.ragas.io/)
- [RAG examples from real companies](https://www.evidentlyai.com/blog/rag-examples)
- [5 Essential Steps to Build a RAG Chatbot with LangChain](https://www.chatrag.ai/blog/2026-02-02-5-essential-steps-to-build-a-rag-chatbot-with-langchain-and-why-most-teams-get-stuck)
