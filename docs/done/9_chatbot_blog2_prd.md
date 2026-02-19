# RAG 기반 블로그 Q&A 챗봇 - 블로그 편 2 PRD

## 1. 개요

### 1.1 목적
RAG 기반 블로그 시리즈의 2편으로, 프롬프트 엔지니어링 기법과 RAG 최적화 방법을 다룬다.

### 1.2 대상 독자
- 기본 RAG를 구현해본 개발자 (편 1 완료)
- 프롬프트 엔지니어링 기법을 실무에 적용하고 싶은 개발자
- RAG 품질 평가 및 최적화에 관심 있는 개발자

### 1.3 선행 조건
- 블로그 편 1 완료
- 6_chatbot_project (RAG 챗봇 프로젝트) M4~M5 완료 (최적화 + 평가)

---

## 2. 블로그 목차

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

## 3. 작성 규칙

- **샘플 코드**: `tutorials-python/ai/rag/` 에서 참조/링크
- **다이어그램**: Mermaid 형식으로 작성 (ASCII art 금지)
- **Draft 위치**: `docs/start/{글-제목}/index.md`에 초안 작성
- **Publish**: 리뷰 후 `contents/{카테고리}/`로 이동

---

## 4. 참고 자료

- [OpenAI Cookbook - Prompt Engineering](https://cookbook.openai.com/)
- [LangChain RAG Documentation](https://docs.langchain.com/oss/python/langchain/rag)
- [Cohere Rerank Documentation](https://docs.cohere.com/docs/rerank)
- [RAGAS - RAG Assessment](https://docs.ragas.io/)
- [Microsoft RAFT Paper](https://arxiv.org/abs/2403.10131)
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
