# RAG 기반 블로그 Q&A 챗봇 - 블로그 Implementation

## 1. 블로그 시리즈 개요

- **편수**: 2편
- **카테고리**: `llm` (또는 `ai`)
- **Draft 위치**: `docs/start/{글-제목}/index.md`
- **Publish 위치**: `contents/{카테고리}/{글-제목}/index.md`
- **참조 프로젝트**: https://github.com/kenshin579/rag-chatbot

---

## 2. 편 1: LLM 적응 기법과 RAG 개념

### 2.1 리서치 항목

| 주제 | 핵심 내용 | 참고 자료 |
|------|----------|----------|
| LLM 한계 | hallucination, 지식 cutoff, 도메인 지식 부족 | OpenAI 공식 문서, 논문 |
| Adaptation 기법 비교 | Fine-tuning vs Prompt Engineering vs RAG 비교표 | bytebyteai.com |
| PEFT/LoRA/QLoRA | 파라미터 효율적 학습 원리, 적용 사례 | Hugging Face PEFT 문서 |
| RAG 아키텍처 | Naive/Advanced/Modular RAG 차이 | LangChain 문서 |
| 문서 파싱 | Rule-based vs AI-based (unstructured, LlamaParse) | unstructured.io 문서 |
| 청킹 전략 | fixed-size, recursive, semantic 비교, 품질 영향 | LangChain Text Splitters |
| 인덱싱 방식 | BM25, Full-text, Knowledge-based, 벡터 | Elasticsearch, ChromaDB 문서 |
| 벡터 저장소 | ChromaDB, FAISS, Pinecone, Weaviate 비교 | 각 공식 문서 |
| 검색 방법 | Exact NN vs ANN (LSH, HNSW, IVF) | FAISS 문서 |

### 2.2 다이어그램 (Mermaid)

- LLM 적응 기법 비교 다이어그램 (Fine-tuning vs PE vs RAG)
- RAG 전체 파이프라인 아키텍처
- Retrieval 단계 상세 흐름 (파싱 → 청킹 → 인덱싱 → 벡터 저장)
- Generation 단계 흐름 (검색 → 컨텍스트 결합 → LLM 응답)

### 2.3 코드 예제 (rag-chatbot 프로젝트에서 참조)

- 문서 로딩 및 파싱: `app/rag/document_loader.py`
- 청킹 구현: `app/rag/chunker.py`
- 임베딩 생성: `app/rag/embedder.py`
- 벡터 저장소 CRUD: `app/rag/vector_store.py`
- RAG 체인: `app/rag/chain.py`
- FastAPI 엔드포인트: `app/api/routes.py`
- 채팅 UI: `ui/src/components/`
- 인덱싱 스크립트: `scripts/index_documents.py`

---

> 편 2 (프롬프트 엔지니어링과 RAG 최적화)는 `9_chatbot_blog2_*.md` 참조

---

## 3. 블로그 작성 규칙

- **코드**: 블로그 내 코드 블록은 핵심 부분만 발췌, 전체 코드는 GitHub 링크로 참조
- **다이어그램**: Mermaid 형식만 사용 (ASCII art 금지)
- **비교표**: 기술 비교 시 표(table) 형식 활용
- **인코딩**: UTF-8 필수, 작성 후 `file -I` 로 확인
- **frontmatter**: title, date, update, description, tags, category 포함

### 3.1 frontmatter 예시

```yaml
---
title: "RAG 기반 블로그 Q&A 챗봇 만들기 (1) - LLM 적응 기법과 RAG 개념"
description: "LLM 적응 기법(Fine-tuning, PEFT, LoRA)과 RAG 아키텍처를 비교하고, LangChain으로 기본 RAG 챗봇을 구현하는 방법을 소개한다"
date: TBD
update: TBD
tags:
  - rag
  - langchain
  - llm
  - chatbot
  - chromadb
  - openai
category: llm
---
```
