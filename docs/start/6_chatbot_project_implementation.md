# RAG 기반 블로그 Q&A 챗봇 - 구현 문서

## 1. Backend (Python FastAPI)

### 1.1 프로젝트 셋업

- **패키지 관리**: `uv` 사용 (`pyproject.toml`)
- **Python**: 3.12+
- **디렉토리**: `ai-chatbot.advenoh.pe.kr/`

```toml
# pyproject.toml 핵심 의존성
[project]
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "langchain>=0.3.0",
    "langchain-openai>=0.3.0",
    "langchain-chroma>=0.2.0",
    "chromadb>=0.5.0",
    "openai>=1.0",
    "pydantic>=2.0",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
eval = ["ragas>=0.2.0"]
```

### 1.2 설정 관리 (`backend/app/config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k: int = 5

    # 멀티 블로그 Collection 설정
    blog_collections: dict[str, str] = {
        "blog-v2": "IT 블로그",
        "investment": "투자 블로그",
    }

    model_config = {"env_file": ".env"}
```

### 1.3 문서 로딩 및 청킹 (`backend/app/rag/document_loader.py`, `backend/app/rag/chunker.py`)

- 블로그 Markdown 파일 로딩 (`contents/` 디렉토리)
- YAML frontmatter 파싱 → metadata로 보존 (title, date, tags, category)
- `RecursiveCharacterTextSplitter`로 청킹 (chunk_size=1000, overlap=200)

```python
# document_loader.py 핵심 로직
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_blog_documents(contents_dir: str, blog_id: str) -> list[Document]:
    """블로그 Markdown 파일을 로드하고 frontmatter를 metadata로 파싱"""
    loader = DirectoryLoader(contents_dir, glob="**/*.md", loader_cls=TextLoader)
    documents = loader.load()
    # frontmatter 파싱 후 metadata에 blog_id 추가
    for doc in documents:
        doc.metadata["blog_id"] = blog_id
    return documents
```

### 1.4 벡터 저장소 (`backend/app/rag/vector_store.py`)

- ChromaDB Collection 분리로 멀티 블로그 지원
- `blog_id`를 Collection 이름으로 사용

```python
import chromadb
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

class VectorStoreManager:
    def __init__(self, host: str, port: int, embedding_model: str):
        self.client = chromadb.HttpClient(host=host, port=port)
        self.embeddings = OpenAIEmbeddings(model=embedding_model)

    def get_store(self, blog_id: str) -> Chroma:
        """blog_id에 해당하는 Collection 반환"""
        return Chroma(
            client=self.client,
            collection_name=blog_id,
            embedding_function=self.embeddings,
        )

    def index_documents(self, blog_id: str, documents: list[Document]):
        """문서를 해당 Collection에 인덱싱"""
        store = self.get_store(blog_id)
        store.add_documents(documents)

    def delete_collection(self, blog_id: str):
        """Collection 삭제 (재인덱싱 시 사용)"""
        self.client.delete_collection(name=blog_id)
```

### 1.5 RAG 체인 (`backend/app/rag/chain.py`)

- `blog_id`로 Collection 선택 → 검색 → LLM 생성
- 대화 히스토리 지원 (ConversationBufferMemory)

```python
from langchain.chains import ConversationalRetrievalChain
from langchain_openai import ChatOpenAI

def create_rag_chain(vector_store: Chroma, model: str) -> ConversationalRetrievalChain:
    llm = ChatOpenAI(model=model, temperature=0)
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
    )
```

### 1.6 API 엔드포인트 (`backend/app/api/routes.py`)

```python
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """RAG 기반 Q&A - blog_id로 Collection 선택"""
    if request.blog_id not in settings.blog_collections:
        raise HTTPException(status_code=400, detail=f"Unknown blog_id: {request.blog_id}")

    store = vector_store_manager.get_store(request.blog_id)
    chain = create_rag_chain(store, settings.openai_model)
    result = chain.invoke({
        "question": request.question,
        "chat_history": request.chat_history or [],
    })
    return ChatResponse(
        answer=result["answer"],
        sources=[{
            "title": doc.metadata.get("title", ""),
            "url": doc.metadata.get("url", ""),
        } for doc in result["source_documents"]],
    )

@router.post("/index/{blog_id}")
async def index_documents(blog_id: str):
    """블로그 문서 인덱싱 트리거"""
    ...

@router.get("/health")
async def health():
    return {"status": "ok"}
```

### 1.7 Pydantic 모델 (`backend/app/api/models.py`)

```python
from pydantic import BaseModel

class ChatRequest(BaseModel):
    blog_id: str                          # "blog-v2" | "investment"
    question: str
    chat_history: list[tuple[str, str]] | None = None  # [(질문, 답변), ...]

class Source(BaseModel):
    title: str
    url: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
```

### 1.8 프롬프트 템플릿 (`backend/app/prompts/templates.py`)

```python
SYSTEM_PROMPT = """당신은 블로그 콘텐츠 전문 Q&A 어시스턴트입니다.
주어진 블로그 글 내용을 기반으로 질문에 답변합니다.

규칙:
- 블로그 글에 없는 내용은 "블로그에서 관련 내용을 찾지 못했습니다"라고 답변
- 답변 마지막에 참조한 블로그 글 제목을 출처로 표시
- 한국어로 답변
"""
```

---

## 2. Frontend - 독립 채팅 UI (React + Next.js)

`ai-chatbot.advenoh.pe.kr`에서 서빙되는 독립 채팅 페이지. RAG API 기능을 바로 검증할 수 있다.

> 각 블로그에 ChatWindow 컴포넌트를 통합하는 작업은 별도 PRD: `7_blog_chat_integration_prd.md`

### 2.1 채팅 UI 구조 (`frontend/`)

- Next.js 15 App Router 사용
- shadcn/ui 컴포넌트 (블로그와 동일 디자인 시스템)
- FastAPI 서버에 `/chat` API 호출
- `blog_id` 선택 드롭다운으로 블로그 전환 가능 (검증용)

### 2.2 핵심 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `ChatWindow.tsx` | 채팅 전체 레이아웃 (메시지 목록 + 입력) |
| `MessageList.tsx` | 질문/답변 메시지 렌더링, 소스 인용 링크 |
| `ChatInput.tsx` | 질문 입력 필드 + 전송 버튼 |

### 2.3 API 호출

```typescript
// frontend/src/lib/api.ts
interface ChatRequest {
  blog_id: string;
  question: string;
  chat_history?: [string, string][];
}

interface ChatResponse {
  answer: string;
  sources: { title: string; url: string }[];
}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return res.json();
}
```

---

## 3. 문서 인덱싱 스크립트 (`backend/scripts/index_documents.py`)

```python
"""블로그 문서 인덱싱 CLI"""
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--blog-id", required=True, choices=["blog-v2", "investment"])
    parser.add_argument("--contents-dir", required=True, help="블로그 contents/ 경로")
    args = parser.parse_args()

    # 1. 문서 로딩
    documents = load_blog_documents(args.contents_dir, args.blog_id)
    # 2. 청킹
    chunks = chunker.split_documents(documents)
    # 3. 벡터 저장소에 인덱싱
    vector_store_manager.index_documents(args.blog_id, chunks)

# 사용 예시:
# python backend/scripts/index_documents.py --blog-id blog-v2 --contents-dir ../blog-v2.advenoh.pe.kr/contents/
# python backend/scripts/index_documents.py --blog-id investment --contents-dir ../investment.advenoh.pe.kr/contents/
```

---

## 4. 인덱싱 자동 갱신 (GitHub Actions)

각 블로그 repo에 워크플로우를 추가하여 `contents/` 변경 시 자동으로 재인덱싱한다.

### 4.1 워크플로우 (`blog-v2.advenoh.pe.kr/.github/workflows/reindex-rag.yml`)

```yaml
name: RAG 재인덱싱

on:
  push:
    branches: [main]
    paths:
      - 'contents/**'

jobs:
  reindex:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger RAG reindex
        run: |
          curl -X POST \
            "https://ai-chatbot.advenoh.pe.kr/index/blog-v2" \
            -H "Authorization: Bearer ${{ secrets.RAG_INDEX_TOKEN }}" \
            -H "Content-Type: application/json"
```

### 4.2 인덱싱 API 인증

- `POST /index/{blog_id}`에 Bearer 토큰 인증 추가 (외부 호출 방지)
- 토큰은 블로그 repo의 GitHub Secrets(`RAG_INDEX_TOKEN`)에 저장

### 4.3 인덱싱 API 구현 (`backend/app/api/routes.py`)

```python
@router.post("/index/{blog_id}")
async def reindex(blog_id: str, token: str = Depends(verify_token)):
    """블로그 문서 전체 재인덱싱"""
    if blog_id not in settings.blog_collections:
        raise HTTPException(status_code=400, detail=f"Unknown blog_id: {blog_id}")

    # 1. 기존 Collection 삭제
    vector_store_manager.delete_collection(blog_id)
    # 2. 문서 로딩 + 청킹
    documents = load_blog_documents(settings.contents_dirs[blog_id], blog_id)
    chunks = chunker.split_documents(documents)
    # 3. 재인덱싱
    vector_store_manager.index_documents(blog_id, chunks)

    return {"status": "ok", "blog_id": blog_id, "indexed_chunks": len(chunks)}
```

---

## 5. 배포

### 5.1 Docker 이미지

- Python multi-stage 빌드 (`python:3.12-slim`)
- FastAPI + uvicorn (포트 8080)
- `kenshin579/rag-chatbot:{version}`

### 5.2 Helm Chart

**rag-chatbot**: `charts/charts/rag-chatbot/` 에 Chart 직접 생성

**chromadb**: 기존 [amikos-tech/chromadb-chart](https://github.com/amikos-tech/chromadb-chart) 사용

```bash
helm repo add chroma https://amikos-tech.github.io/chromadb-chart/
helm repo update
```

- `charts/charts/chromadb/` 에 `Chart.yaml` (dependency) + `values.yaml` (커스텀 설정)만 작성
- ArgoCD ApplicationSet에 rag-chatbot, chromadb 두 앱 모두 등록 (`bootstrap/macmini-app.yaml`)
- Gateway HTTPRoute: `ai-chatbot.advenoh.pe.kr` → `rag-chatbot-service:80`

### 5.3 환경 변수

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 (Secret) |
| `OPENAI_MODEL` | 사용 모델 (기본: gpt-4o-mini) |
| `CHROMA_HOST` | ChromaDB 서버 호스트 (기본: `chromadb-service.infra.svc.cluster.local`) |
| `CHROMA_PORT` | ChromaDB 서버 포트 (기본: `8000`) |
| `LANGCHAIN_TRACING_V2` | LangSmith 트레이싱 활성화 (`true`) |
| `LANGCHAIN_API_KEY` | LangSmith API 키 (Secret) |
| `LANGCHAIN_PROJECT` | LangSmith 프로젝트명 (`ai-chatbot`) |

---

## 6. LangSmith 트레이싱

환경변수만 설정하면 LangChain이 자동으로 모든 호출을 트레이싱한다.

```python
# backend/.env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-api-key
LANGCHAIN_PROJECT=ai-chatbot
```

**LangSmith에서 확인 가능한 지표:**
- 각 쿼리의 전체 실행 트레이스 (검색 → 프롬프트 → LLM 응답)
- 검색된 문서의 유사도 점수
- 응답 시간 (retrieval, generation 각각)
- 토큰 사용량 / 비용 추적
- 실패율, 에러 로그

> 사용자 피드백(👍👎), Admin 대시보드, 쿼리 로그는 별도 PRD: `8_chatbot_monitoring_prd.md`

---

## 7. 평가 (RAGAS)

### 7.1 평가 메트릭

- **Faithfulness**: 답변이 검색된 문서에 기반하는지
- **Answer Relevancy**: 답변이 질문에 관련성 있는지
- **Context Precision**: 검색된 문서의 관련성

### 7.2 평가 데이터셋

```python
# backend/app/evaluation/dataset.py
eval_dataset = [
    {
        "question": "Go에서 goroutine이란?",
        "ground_truth": "goroutine은 Go 런타임이 관리하는 경량 스레드...",
        "blog_id": "blog-v2",
    },
    # ...
]
```

---

## 8. 개발 시 참고사항

### 8.1 MCP Context7

구현 시 최신 라이브러리 API 확인을 위해 MCP Context7 사용:
- `langchain`, `langchain-openai`, `chromadb`, `fastapi`, `ragas`

### 8.2 테스트

- 단위 테스트: `pytest` (chunker, retriever, chain)
- UI 테스트: **MCP Playwright** 사용 (채팅 입력 → 응답 확인 E2E 테스트)
