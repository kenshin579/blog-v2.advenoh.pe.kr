# RAG 기반 블로그 Q&A 챗봇 - 블로그 편 2 TODO

## 선행 조건

- [ ] 블로그 편 1 완료 (publish)
- [ ] 6_chatbot_project M4~M5 완료 (최적화 + 평가)

---

## 편 2: 프롬프트 엔지니어링과 RAG 최적화

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

- [ ] 코드 예제 확인
- [ ] Mermaid 다이어그램 IDE 렌더링 확인
- [ ] UTF-8 인코딩 확인 (`file -I`)
- [ ] `docs/start/` → `contents/llm/`으로 이동
- [ ] PR 생성 및 MergeReady label 추가
