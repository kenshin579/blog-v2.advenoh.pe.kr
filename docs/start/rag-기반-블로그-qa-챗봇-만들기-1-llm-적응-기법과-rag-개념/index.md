---
title: "RAG 기반 블로그 Q&A 챗봇 만들기 (1) - LLM 적응 기법과 RAG 개념"
description: "LLM 적응 기법(Fine-tuning, PEFT, LoRA)과 RAG 아키텍처를 비교하고, LangChain으로 기본 RAG 챗봇을 구현하는 방법을 소개한다"
date: 2026-02-16
update: 2026-02-16
tags:
  - rag
  - langchain
  - llm
  - chatbot
  - chromadb
  - openai
  - fine-tuning
  - lora
  - embedding
  - vector-store
category: llm
series: "RAG 기반 블로그 Q&A 챗봇 만들기"
---

> 이 글은 **RAG 기반 블로그 Q&A 챗봇 만들기** 시리즈의 첫 번째 편이다. LLM의 한계를 이해하고, 이를 극복하기 위한 적응 기법들을 비교한 뒤, RAG 파이프라인의 각 단계를 상세히 알아본다.
> - **편 1** (이 글): LLM 적응 기법과 RAG 개념
> - **편 2**: 프롬프트 엔지니어링과 RAG 최적화

# 1. LLM 적응 기법 개요

## 1.1 LLM의 한계

LLM(Large Language Model)은 대규모 텍스트 데이터로 사전학습되어 범용적인 언어 이해와 생성 능력을 갖추고 있다. 하지만 실무에서 LLM을 활용하려면 다음 세 가지 근본적인 한계를 이해해야 한다.

### 1.1.1 환각(Hallucination) 문제

환각이란 LLM이 **유창하고 그럴듯하게 들리지만, 사실과 다르거나 완전히 지어낸 정보를 생성하는 현상**이다. 모델이 "자신 있게 틀린 답을 말하는" 것이 핵심 문제다.

| 유형 | 정의 | 예시 |
|------|------|------|
| **Intrinsic Hallucination** | 입력 소스와 **모순되는** 출력 생성 | "아인슈타인은 독일 울름에서 태어났다" → "베를린에서 태어났다" |
| **Extrinsic Hallucination** | 소스에 없는 **검증 불가능한** 정보 생성 | 존재하지 않는 논문이나 판례를 인용 |
| **Fabrication** | 완전히 새로운 정보를 날조 | 실존하지 않는 URL, API 엔드포인트 생성 |

환각이 발생하는 주요 원인은 다음과 같다.

- **확률적 생성 메커니즘**: LLM은 "가장 사실적인 다음 토큰"이 아니라 "통계적으로 가장 가능성 높은 다음 토큰"을 선택한다
- **학습 데이터의 불완전성**: 인터넷에서 수집된 데이터 자체에 오류, 편향, 모순된 정보가 포함되어 있다
- **지식의 압축 손실**: 수조 개의 토큰에서 학습한 지식이 고정된 파라미터에 압축 저장되므로, 세부적인 사실이 왜곡되거나 혼합될 수 있다

실제로 Stanford 연구에 따르면, GPT-3.5는 법률 질의에 대해 69%, Meta의 Llama 2는 88%의 환각률을 보였다. 2023년에는 변호사가 ChatGPT가 생성한 6개의 가짜 판례를 연방법원에 제출하여 5,000달러 벌금을 부과받은 사건(Mata v. Avianca)도 있었다.

### 1.1.2 지식 단절(Knowledge Cutoff)

LLM의 학습 데이터는 **특정 시점까지의 정보만 포함**하기 때문에, 그 이후에 발생한 사건이나 업데이트된 정보에 대해 알지 못한다.

| 모델 | Knowledge Cutoff |
|------|-----------------|
| GPT-4o | 2024년 10월 |
| Claude 3.5 Sonnet | 2025년 4월 |
| Gemini 1.5 Pro | 2024년 11월 |
| Llama 3.1 | 2023년 12월 |

이로 인해 "2026년 1월 주요 뉴스", "Next.js 16의 새로운 기능", "최근 개정된 법률" 같은 질의에 대해 부정확한 답변을 생성하거나 답변 자체가 불가능하다.

### 1.1.3 도메인 특화 지식 부족

LLM은 공개된 인터넷 데이터로 학습되므로, 비공개 또는 특수 도메인 지식이 부재하다.

| 카테고리 | 예시 |
|----------|------|
| 기업 내부 문서 | 사내 위키, 내부 API 문서, 운영 매뉴얼, HR 정책 |
| 최신 API/SDK 문서 | 최근 출시된 라이브러리의 변경된 인터페이스 |
| 산업 특화 용어 | 의료 진단 코드, 금융 규정, 법률 조항 해석 |
| 조직 고유 컨텍스트 | 사내 코딩 컨벤션, 아키텍처 결정 기록(ADR), 장애 대응 절차 |

## 1.2 적응 기법 비교: Fine-tuning vs Prompt Engineering vs RAG

LLM의 한계를 극복하기 위한 세 가지 주요 적응 기법이 있다.

```mermaid
flowchart TB
    LLM["LLM의 한계<br/>(환각, 지식 단절, 도메인 지식 부족)"]

    LLM --> PE["Prompt Engineering<br/>프롬프트 최적화"]
    LLM --> RAG["RAG<br/>외부 지식 검색 + 생성"]
    LLM --> FT["Fine-tuning<br/>모델 파라미터 업데이트"]

    PE --> PE_DESC["모델 변경 없음<br/>입력 프롬프트만 최적화<br/>비용: 매우 낮음"]
    RAG --> RAG_DESC["모델 변경 없음<br/>외부 DB에서 정보 검색<br/>비용: 중간"]
    FT --> FT_DESC["모델 파라미터 업데이트<br/>도메인 데이터로 재학습<br/>비용: 높음"]

    style LLM fill:#ff6b6b,color:#fff
    style PE fill:#4ecdc4,color:#fff
    style RAG fill:#45b7d1,color:#fff
    style FT fill:#f9ca24,color:#333
```

### 각 접근법의 핵심 정의

**Prompt Engineering**은 모델의 파라미터를 변경하지 않고, **입력 프롬프트를 최적화**하여 원하는 출력을 유도하는 기법이다. Zero-shot, Few-shot, Chain-of-Thought(CoT), Role Prompting 등 다양한 기법이 있다.

**RAG(Retrieval-Augmented Generation)**는 LLM에 **외부 지식 베이스를 연결**하여, 질의 시점에 관련 문서를 검색하고 이를 컨텍스트로 제공하여 응답을 생성하는 기법이다.

**Fine-tuning**은 사전학습된 LLM을 **특정 도메인의 데이터셋으로 추가 학습**시켜, 모델의 내부 파라미터를 업데이트하는 기법이다.

### 비교표

| 비교 항목 | Prompt Engineering | RAG | Fine-tuning |
|-----------|-------------------|-----|-------------|
| **구현 시간** | 수 시간 ~ 수 일 | 수 일 ~ 수 주 | 수 주 ~ 수 개월 |
| **비용** | 매우 낮음 | 중간 (벡터DB 운영비) | 높음 (GPU + 추론 비용) |
| **기술적 난이도** | 낮음 | 중간 | 높음 (ML 전문 지식 필요) |
| **모델 변경** | 없음 | 없음 | 파라미터 업데이트 |
| **최신 정보 반영** | 수동 삽입 | DB 업데이트로 즉시 반영 | 재학습 필요 |
| **환각 감소** | 제한적 | 높음 (출처 기반 답변) | 중간 |
| **데이터 요구량** | 없음 ~ 소량 | 문서 코퍼스 | 대량의 라벨링 데이터 |
| **출력 스타일 제어** | 중간 | 낮음 | 높음 |

### 언제 어떤 기법을 선택할 것인가

**Prompt Engineering**: 빠른 프로토타이핑, 다양한 작업을 하나의 모델로 처리, 예산이 제한적일 때

**RAG**: 최신 정보가 중요한 경우, 사실 정확도가 핵심인 경우(법률, 의료, 금융), 데이터가 자주 변경되는 경우, 답변의 출처를 제시해야 할 때

**Fine-tuning**: 특정 작업에서 최고 성능이 필요한 경우, 일관된 출력 스타일 제어가 중요한 경우, 도메인 전문 용어 이해가 필수인 경우

> **실무 권장사항**: 시작은 항상 Prompt Engineering으로 기준점을 확보하고, 지식 보강이 필요하면 RAG를 도입하며, RAG로 부족할 때만 Fine-tuning을 추가하는 것이 비용 대비 효과적이다. 세 가지를 조합하여 사용하는 것이 실무의 정석이다.

---

# 2. Fine-tuning 기법

## 2.1 전통적 Fine-tuning

전통적 Fine-tuning은 사전학습된 모델의 **모든 파라미터를 특정 작업의 데이터로 업데이트**하는 방식이다.

| 문제 | 설명 |
|------|------|
| 막대한 계산 비용 | 7B 모델 기준 수십 GB GPU 메모리 필요, 70B 모델은 수백 GB |
| Catastrophic Forgetting | 새 데이터 학습 시 기존 일반 지식을 잊어버리는 현상 |
| 대량의 데이터 필요 | 과적합 방지를 위해 고품질 학습 데이터 대량 확보 필요 |
| 저장 공간 | 각 작업마다 전체 모델 복사본 저장 필요 (7B 모델 = 약 14GB/copy) |

## 2.2 Parameter-Efficient Fine-Tuning (PEFT)

PEFT는 **모델의 전체 파라미터 중 극히 일부만 학습**하거나, **소규모 외부 모듈을 추가**하여 효율적으로 적응시키는 방법론의 총칭이다. 원래 모델의 파라미터는 동결(freeze)하고, 새로 추가된 소수의 파라미터만 업데이트한다.

```mermaid
flowchart TB
    PEFT["PEFT<br/>(Parameter-Efficient Fine-Tuning)"]

    PEFT --> ADD["Additive Methods<br/>(추가 방식)"]
    PEFT --> SEL["Selective Methods<br/>(선택 방식)"]
    PEFT --> REP["Reparameterization<br/>(재매개변수화 방식)"]

    ADD --> ADAPTER["Adapter Tuning"]
    ADD --> PROMPT["Prompt Tuning"]
    ADD --> PREFIX["Prefix Tuning"]

    SEL --> LAYER["특정 레이어/파라미터만 학습"]

    REP --> LORA["LoRA"]
    REP --> QLORA["QLoRA"]
    REP --> DORA["DoRA"]

    style PEFT fill:#45b7d1,color:#fff
    style REP fill:#f9ca24,color:#333
```

PEFT의 핵심 장점은 다음과 같다.

- **메모리 효율성**: 전체 Fine-tuning 대비 메모리 사용량 10~20배 감소
- **Catastrophic Forgetting 완화**: 원본 가중치를 보존하므로 기존 지식 유지
- **저장 효율성**: 작업별로 소규모 어댑터만 저장 (수 MB ~ 수십 MB)
- **품질 유지**: 전체 Fine-tuning 대비 90~95% 수준의 성능 달성

### Adapters

Houlsby et al. (2019)이 제안한 방법으로, Transformer 블록 내부에 **소규모 병목(bottleneck) 모듈을 삽입**하는 방식이다.

```mermaid
flowchart TB
    INPUT["입력 (hidden dim: d)"] --> DOWN["Down-projection<br/>d → b (b ≪ d)"]
    DOWN --> ACT["Non-linearity<br/>(ReLU, GELU)"]
    ACT --> UP["Up-projection<br/>b → d"]
    UP --> ADD["+ Residual Connection"]
    INPUT --> ADD
    ADD --> OUTPUT["출력 (hidden dim: d)"]

    style DOWN fill:#ff6b6b,color:#fff
    style ACT fill:#ff6b6b,color:#fff
    style UP fill:#ff6b6b,color:#fff
```

원본 모델의 파라미터는 완전히 동결하고, 새로 삽입된 어댑터 모듈만 학습한다. GLUE 벤치마크에서 전체 파라미터의 **약 3%만 학습**하면서도 Full Fine-tuning과 거의 동일한 성능을 달성했다.

단점은 추론 시 추가 레이어를 통과해야 하므로 **추론 지연(latency)이 증가**한다는 점이다.

### LoRA (Low-Rank Adaptation)

Hu et al. (2021)이 제안한 방법으로, 기존 가중치 행렬의 업데이트를 **저랭크(low-rank) 행렬 분해**로 근사하는 기법이다.

사전학습된 가중치 행렬 `W₀ ∈ R^(d×k)`에 대해, 가중치 업데이트 `ΔW`를 저랭크 행렬의 곱으로 표현한다.

```
W = W₀ + ΔW = W₀ + B × A

- W₀: 사전학습된 가중치 (동결)
- B ∈ R^(d×r): 저랭크 행렬 (학습 대상)
- A ∈ R^(r×k): 저랭크 행렬 (학습 대상)
- r: 랭크(rank), r ≪ min(d, k)
```

파라미터 효율성을 계산해 보면, d = k = 4096이고 r = 8일 때 전체 업데이트는 16,777,216개 파라미터가 필요하지만, LoRA는 65,536개(**약 0.39%**)만으로 가능하다.

```mermaid
flowchart LR
    X["입력 x"] --> W0["W₀<br/>(동결)"]
    X --> A["A ∈ R^(r×k)<br/>(학습)"]
    A --> B["B ∈ R^(d×r)<br/>(학습)"]
    W0 --> PLUS["+"]
    B --> SCALE["× α/r"]
    SCALE --> PLUS
    PLUS --> H["출력 h"]

    style W0 fill:#95a5a6,color:#fff
    style A fill:#e74c3c,color:#fff
    style B fill:#e74c3c,color:#fff
```

LoRA가 작동하는 이유는 **내재적 랭크 가설(Intrinsic Rank Hypothesis)** 때문이다. 사전학습된 대규모 모델의 가중치 변화는 실제로 매우 낮은 내재적 차원을 가지며, 핵심적인 변화는 저차원 부분공간에서 포착될 수 있다.

| 장점 | 설명 |
|------|------|
| 추론 지연 없음 | 학습 후 `W₀ + BA`를 미리 합산하면 추가 연산 불필요 |
| 작업 전환 용이 | LoRA 가중치만 교체하면 다른 작업으로 전환 가능 |
| 파라미터 99% 감소 | 단일 GPU에서 대규모 모델 Fine-tuning 가능 |
| 원본 모델 보존 | W₀를 변경하지 않으므로 Catastrophic Forgetting 완화 |

주요 하이퍼파라미터로는 **Rank(r)** (보통 4, 8, 16, 32, 64), **Alpha(α)** (스케일링 팩터, ΔW에 α/r 곱함), **Target Modules** (보통 Q, V attention 행렬)이 있다.

### QLoRA (Quantized LoRA)

Dettmers et al. (2023)이 제안한 방법으로, **4비트 양자화된 기본 모델 위에 LoRA를 적용**하는 기법이다.

QLoRA의 3가지 핵심 혁신은 다음과 같다.

**1) 4-bit NormalFloat (NF4) 양자화**: 신경망 가중치가 정규분포를 따른다는 특성을 활용하여, 정규분포에 최적화된 4비트 데이터 타입으로 압축한다. 16비트 대비 메모리 75% 절감.

**2) Double Quantization (이중 양자화)**: 양자화 상수 자체도 다시 양자화하여 추가 메모리를 절약한다. 65B 모델 기준 약 3GB 추가 절감.

**3) Paged Optimizers**: 메모리 스파이크 발생 시 옵티마이저 상태를 GPU에서 CPU로 자동 페이징하여 OOM을 방지한다.

| 방법 | 65B 모델 Fine-tuning에 필요한 GPU 메모리 |
|------|----------------------------------------|
| Full Fine-tuning | ~780GB (A100 80GB x 10장 이상) |
| LoRA (FP16) | ~130GB (A100 80GB x 2장) |
| **QLoRA (NF4)** | **~48GB (A100 48GB 1장)** |

QLoRA의 실질적 의의는 **70B 파라미터 모델**을 24GB VRAM의 소비자용 GPU에서 Fine-tuning 가능하게 하여, 대규모 모델 커스터마이징의 **민주화**를 실현했다는 점이다.

## 2.3 Fine-tuning vs RAG 선택 가이드

| 비교 항목 | Fine-tuning | RAG |
|-----------|-------------|-----|
| 핵심 원리 | 모델 파라미터 업데이트 | 외부 지식 검색 + 컨텍스트 주입 |
| 최신 정보 반영 | 재학습 필요 (비용 높음) | DB 업데이트만으로 즉시 반영 |
| 환각 감소 | 도메인 내 정확도 향상 | 출처 기반 답변으로 크게 감소 |
| 출처 제시 | 불가능 (모델에 내재화) | 가능 (검색 문서 참조) |
| 데이터 프라이버시 | 학습 데이터가 모델에 영구 내재화 | 데이터가 외부 DB에 분리 보관 |
| 추론 속도 | 빠름 (추가 검색 없음) | 약간 느림 (검색 + 생성 2단계) |
| 출력 스타일 제어 | 우수 (톤, 형식 학습 가능) | 제한적 (프롬프트로만 제어) |
| 다중 도메인 지원 | 도메인별 별도 모델 필요 | 하나의 시스템으로 여러 도메인 커버 |

```mermaid
flowchart TB
    Q1{"데이터가 자주<br/>변경되는가?"}
    Q2{"특정 작업에서<br/>최고 성능이 필요한가?"}
    Q3{"답변의 출처를<br/>제시해야 하는가?"}
    Q4{"출력 스타일/톤을<br/>세밀하게 제어해야 하는가?"}
    Q5{"GPU 인프라와<br/>ML 전문 인력이 있는가?"}

    Q1 -->|YES| RAG1["RAG 우선 고려"]
    Q1 -->|NO| Q2
    Q2 -->|YES| FT1["Fine-tuning 고려"]
    Q2 -->|NO| Q3
    Q3 -->|YES| RAG2["RAG"]
    Q3 -->|NO| Q4
    Q4 -->|YES| FT2["Fine-tuning"]
    Q4 -->|NO| Q5
    Q5 -->|YES| BOTH["Fine-tuning + RAG 조합"]
    Q5 -->|NO| RAG3["RAG 또는<br/>Prompt Engineering"]

    style RAG1 fill:#45b7d1,color:#fff
    style RAG2 fill:#45b7d1,color:#fff
    style RAG3 fill:#45b7d1,color:#fff
    style FT1 fill:#f9ca24,color:#333
    style FT2 fill:#f9ca24,color:#333
    style BOTH fill:#2ecc71,color:#fff
```

---

# 3. RAG 아키텍처 개요

## 3.1 RAG란 무엇인가?

**RAG(Retrieval-Augmented Generation)**는 LLM의 응답 품질을 **외부 데이터 검색**을 통해 향상시키는 기술이다. "권위 있는 외부 데이터를 사용하여 모델 출력의 정확성, 관련성, 유용성을 개선하는 기법"으로, 이름에 담긴 세 단계가 핵심이다.

**Retrieval(검색)**: 사용자 질의를 벡터화하여 외부 지식 소스에서 관련 문서를 검색한다.

**Augmented(증강)**: 검색된 문서와 사용자 질의를 결합하여 LLM에 전달할 프롬프트를 구성한다.

**Generation(생성)**: 증강된 프롬프트를 기반으로 LLM이 근거 있는 응답을 생성한다.

```mermaid
flowchart LR
    subgraph "오프라인 인덱싱"
        DOC["원본 문서<br/>(PDF, 웹, DB)"] --> PARSE["문서 파싱"]
        PARSE --> CHUNK["청킹<br/>(Chunking)"]
        CHUNK --> EMBED["임베딩<br/>(Embedding)"]
        EMBED --> STORE["벡터 저장소<br/>(Vector Store)"]
    end

    subgraph "온라인 질의응답"
        QUERY["사용자 질의"] --> Q_EMBED["질의 임베딩"]
        Q_EMBED --> SEARCH["유사도 검색"]
        STORE --> SEARCH
        SEARCH --> CONTEXT["검색된 컨텍스트"]
        CONTEXT --> PROMPT["프롬프트 구성"]
        QUERY --> PROMPT
        PROMPT --> LLM["LLM"]
        LLM --> ANSWER["응답"]
    end

    style DOC fill:#3498db,color:#fff
    style STORE fill:#e74c3c,color:#fff
    style LLM fill:#2ecc71,color:#fff
    style ANSWER fill:#f39c12,color:#fff
```

## 3.2 Naive RAG vs Advanced RAG vs Modular RAG

RAG 아키텍처는 Naive → Advanced → Modular 순으로 발전해 왔다.

| 구분 | Naive RAG | Advanced RAG | Modular RAG |
|------|-----------|-------------|-------------|
| **파이프라인** | 단순 선형 (검색 → 생성) | 최적화된 선형 (전처리 → 검색 → 후처리 → 생성) | 모듈 조합형 (유연한 파이프라인) |
| **검색 품질** | 기본 벡터 유사도 | Re-ranking, Query Rewriting 적용 | 다중 검색 전략 조합 |
| **장점** | 구현 간단, 빠른 프로토타이핑 | 정확도 향상, 환각 감소 | 최대 유연성, 확장성 |
| **단점** | 낮은 정밀도/재현율 | 구현 복잡도 증가 | 설계/유지보수 복잡 |
| **적합한 경우** | PoC, 간단한 QA | 프로덕션 시스템 | 대규모 엔터프라이즈 |

### Naive RAG

가장 기초적인 RAG 형태다. 사용자 질문을 받아 문서를 검색하고, 아무런 조정 없이 그대로 LLM에 전달한다.

주요 한계점은 **낮은 정밀도**(검색된 청크가 질문과 정렬되지 않음), **낮은 재현율**(관련 청크를 모두 찾지 못함), **환각**(부정확한 컨텍스트로 인한 잘못된 응답)이다.

### Advanced RAG

Naive RAG의 한계를 극복하기 위해 검색 전후에 다양한 최적화 기법을 적용한다.

- **Pre-Retrieval**: Query Rewriting (질의를 검색에 최적화된 형태로 변환), Query Expansion (유사 질의 생성으로 검색 범위 확대), Query Routing (질의 유형에 따라 검색 전략 선택)
- **Post-Retrieval**: Re-ranking (검색 결과 관련성 재평가), Compression (불필요한 정보 제거), Filtering (메타데이터 기반 필터링)

### Modular RAG

가장 유연하고 확장 가능한 패러다임이다. Search Module, Memory Module, Fusion Module, Routing Module, Predict Module 등을 자유롭게 조합하여 사용한다.

## 3.3 RAG 전체 설계 (Overall Design)

이 블로그 시리즈에서 구현하는 RAG 챗봇의 전체 아키텍처는 다음과 같다.

```mermaid
flowchart TB
    subgraph "Document Processing Pipeline"
        MD["마크다운 문서<br/>(블로그 콘텐츠)"] --> LOADER["Document Loader<br/>(LangChain)"]
        LOADER --> SPLITTER["Text Splitter<br/>(RecursiveCharacterTextSplitter)"]
        SPLITTER --> EMBEDDER["Embedding Model<br/>(OpenAI text-embedding-3-small)"]
        EMBEDDER --> CHROMA["ChromaDB<br/>(벡터 저장소)"]
    end

    subgraph "Query Pipeline"
        USER["사용자 질의"] --> Q_EMB["질의 임베딩"]
        Q_EMB --> RETRIEVER["Retriever<br/>(유사도 검색)"]
        CHROMA --> RETRIEVER
        RETRIEVER --> DOCS["관련 문서 청크"]
    end

    subgraph "Generation Pipeline"
        DOCS --> TEMPLATE["프롬프트 템플릿"]
        USER --> TEMPLATE
        TEMPLATE --> GPT["LLM<br/>(GPT-4o)"]
        GPT --> RESPONSE["응답"]
    end

    subgraph "Application Layer"
        RESPONSE --> API["FastAPI<br/>(REST API)"]
        API --> UI["React + Next.js<br/>(채팅 UI)"]
    end

    style MD fill:#3498db,color:#fff
    style CHROMA fill:#e74c3c,color:#fff
    style GPT fill:#2ecc71,color:#fff
    style UI fill:#9b59b6,color:#fff
```

설계 시 고려사항은 다음과 같다.

- **Latency**: 검색 + 생성 2단계로 인한 응답 지연 최소화 (벡터 인덱싱 최적화, 스트리밍 응답)
- **정확도**: 청킹 전략과 임베딩 모델 선택이 검색 품질에 직접 영향
- **비용 트레이드오프**: 임베딩 모델 API 비용 vs 로컬 모델 운영 비용, LLM API 호출 비용 최적화

---

# 4. RAG 파이프라인 - Retrieval

## 4.1 문서 파싱 (Document Parsing)

문서 파싱은 RAG 파이프라인의 첫 번째 단계로, 다양한 형식의 문서에서 텍스트와 구조 정보를 추출하는 과정이다.

### Rule-based 파싱

전통적인 방식으로, 미리 정의된 규칙에 따라 문서에서 정보를 추출한다.

- **정규식 기반 추출**: 이메일, 날짜, 전화번호 등 패턴 매칭
- **구조 기반 추출**: HTML/XML 파서(BeautifulSoup), PDF 파서(PyPDF2, pdfplumber), 테이블 추출(tabula-py)

장점은 속도가 매우 빠르고, 동일 입력에 대해 결정론적 출력을 보장하며, API 비용이 없다는 점이다. 단점은 형식이 조금만 변해도 깨지기 쉽고(brittle), 이미지나 스캔 PDF를 처리할 수 없다는 점이다.

### AI-based 파싱

AI 모델을 활용하여 문서의 레이아웃과 의미를 이해하고 정보를 추출하는 방식이다.

| 도구 | 개발사 | 특징 |
|------|--------|------|
| **Unstructured.io** | Unstructured | 오픈소스, 다양한 포맷 지원, 자동화 파이프라인에 강함 |
| **LlamaParse** | LlamaIndex | Vision-Language 모델 활용, 복잡한 PDF 표/그래프 파싱 |
| **Docling** | IBM Research | 오픈소스, PDF/DOCX/PPTX/XLSX/HTML/이미지 등 다양한 포맷, OCR 내장 |
| **Amazon Textract** | AWS | 대규모 스캔 문서 처리, 양식 인식 |

### LangChain Document Loaders 활용

LangChain Document Loaders는 다양한 파일 형식을 `Document` 객체로 변환하는 통합 인터페이스를 제공한다.

```python
# PDF 로더
from langchain_community.document_loaders import PyPDFLoader
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# 웹 페이지 로더
from langchain_community.document_loaders import WebBaseLoader
loader = WebBaseLoader("https://example.com")
docs = loader.load()

# CSV 로더
from langchain_community.document_loaders import CSVLoader
loader = CSVLoader("data.csv")
docs = loader.load()
```

## 4.2 청킹 전략 (Chunking)

청킹은 긴 문서를 LLM이 처리할 수 있는 작은 단위로 분할하는 과정이다. 청킹 전략은 RAG 시스템의 **검색 품질에 직접적인 영향**을 미치는 핵심 단계다.

### Fixed-size Chunking (고정 크기 분할)

가장 단순한 방식으로, 정해진 문자/토큰 수에 따라 기계적으로 텍스트를 분할한다.

```python
from langchain_text_splitters import CharacterTextSplitter

text_splitter = CharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separator=""
)
chunks = text_splitter.split_text(text)
```

구현이 매우 간단하고 처리 속도가 빠르지만, 문맥 경계를 무시하여 문장 중간에서 잘릴 수 있다.

### Recursive Chunking (재귀적 분할)

계층적 구분자 목록(`['\n\n', '\n', ' ', '']`)을 사용하여 단계적으로 텍스트를 분할한다. 먼저 큰 구분자(단락)로 나누고, 청크가 너무 크면 다음 구분자(줄바꿈)로 재귀적으로 분할한다.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", " ", ""],
)
chunks = text_splitter.create_documents([text])
```

문서 구조(단락, 문장)를 보존하면서도 구현이 간단하여, **대부분의 RAG 애플리케이션에서 권장되는 기본 전략**이다. Chroma 테스트에서 400~512 토큰 설정으로 85~90% Recall을 달성했다.

### Semantic Chunking (의미 기반 분할)

임베딩 모델을 사용하여 문장 간 의미적 유사도를 계산하고, 유사도가 급격히 변하는 지점에서 청크를 분할한다.

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

text_splitter = SemanticChunker(
    OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=95,
)
chunks = text_splitter.create_documents([text])
```

의미적으로 일관된 청크를 생성하여 단순 방법 대비 Recall 최대 9% 향상을 보이지만, 모든 문장에 대해 임베딩 계산이 필요하여 비용과 시간이 증가한다.

### chunk_size와 chunk_overlap 파라미터 가이드

| 파라미터 | 설명 | 권장값 |
|----------|------|--------|
| **chunk_size** | 하나의 청크에 포함될 최대 문자(토큰) 수 | 256~512 토큰 |
| **chunk_overlap** | 인접한 두 청크가 공유하는 문자(토큰) 수 | chunk_size의 10~20% |

- 작은 chunk_size(128~256): 정밀한 사실 기반 질의에 유리
- 큰 chunk_size(256~512): 복잡한 추론이 필요한 질의에 유리
- 겹침이 많을수록 문맥 보존은 좋지만 저장 비용과 처리 시간 증가

| 문서 유형 | chunk_size | chunk_overlap |
|-----------|-----------|--------------|
| 기술 문서 | 400~500 토큰 | 50~100 |
| 고객 지원 로그 | 150~250 토큰 | 15~50 |
| 법률 문서 | 300~500 토큰 | 50~100 |
| FAQ | 128~256 토큰 | 20~50 |

## 4.3 인덱싱 (Indexing)

인덱싱은 청킹된 문서를 효율적으로 검색할 수 있도록 구조화하는 단계다. 크게 네 가지 방식이 있다.

### 키워드 인덱싱 (BM25, TF-IDF)

**TF-IDF**는 단어 빈도(TF)와 역문서 빈도(IDF)를 곱하여, 특정 문서에서 중요한 단어를 식별한다. 흔한 단어는 IDF가 낮아 가중치가 감소하고, 특정 문서에만 나타나는 핵심 단어는 높은 점수를 받는다.

**BM25**는 TF-IDF의 개선 버전으로, 현재 키워드 검색의 사실상 표준이다. 문서 길이 정규화와 TF 포화(saturation) 기능이 추가되어 더 정확한 결과를 제공한다.

BM25는 순수 통계적 방법으로 벡터 임베딩 없이 정확한 키워드 매칭을 수행하며, 정확한 용어 매칭이 중요한 전문 용어 검색이나 코드 검색에 적합하다.

### Full-text 인덱싱 (Elasticsearch)

Elasticsearch는 분산형 검색/분석 엔진으로, 풀텍스트 검색 + 벡터 검색 + 하이브리드 검색을 모두 지원한다. 필터링, 집계, 보안 기능 등 엔터프라이즈 기능이 내장되어 있다.

### Knowledge-based 인덱싱 (지식 그래프)

**GraphRAG** 접근법으로, 데이터를 엔티티(Entity)와 관계(Relationship)로 구조화한다. 전통적 문서 기반 RAG의 한계(좁은 컨텍스트 윈도우, 단절된 데이터)를 극복하며, 엔티티 간 관계가 중요한 도메인(의료, 법률, 금융)에 적합하다.

### 벡터 인덱싱 (임베딩 모델)

텍스트를 고차원 벡터 공간에 매핑하여 **의미적 유사도**를 계산하는 방식이다. RAG 시스템에서 가장 핵심적인 인덱싱 방식이다.

#### 임베딩 모델 비교

| 모델 | 차원 | 비용 | 특징 |
|------|------|------|------|
| **OpenAI text-embedding-3-large** | 3072 | $0.13/1M 토큰 | Matryoshka 학습으로 유연한 차원 축소 가능 |
| **OpenAI text-embedding-3-small** | 1536 | $0.02/1M 토큰 | 비용 효율적, 소규모 프로젝트에 적합 |
| **Cohere embed-v4** | 1024 | 유료 | MTEB 1위급 성능, Reranker와 함께 사용 시 최적 |
| **Sentence Transformers (all-MiniLM-L6-v2)** | 384 | 무료 (로컬) | 경량, 빠른 추론 속도 |
| **BGE (BAAI)** | 1024 | 무료 (로컬) | 중국어/영어 우수, 오픈소스 |

#### 벡터 공간에서의 유사도 메트릭

| 메트릭 | 범위 | 특징 | 적합한 경우 |
|--------|------|------|------------|
| **Cosine Similarity** | -1 ~ 1 | 방향만 비교, 크기 무시 | NLP, 문서 유사도 (가장 일반적) |
| **Euclidean Distance** | 0 ~ ∞ | 절대적 거리 측정 | 클러스터링, 이상 탐지 |
| **Dot Product** | -∞ ~ ∞ | 방향 + 크기 반영 | 추천 시스템, 협업 필터링 |

대부분의 RAG 시스템에서는 **Cosine Similarity**가 표준이다. 임베딩 벡터가 정규화되어 있으면 Cosine Similarity와 Dot Product는 동일한 결과를 낸다.

## 4.4 벡터 저장소 (Vector Store)

벡터 저장소는 임베딩된 벡터를 저장하고 유사도 기반 검색을 수행하는 전문 데이터베이스다.

### 주요 벡터 저장소 비교

| 항목 | **ChromaDB** | **FAISS** | **Pinecone** | **Weaviate** |
|------|-------------|-----------|-------------|-------------|
| 유형 | 오픈소스 DB | 오픈소스 라이브러리 | 완전 관리형 SaaS | 오픈소스 DB |
| 개발사 | Chroma | Meta | Pinecone Systems | Weaviate B.V. |
| 검색 유형 | 벡터 + 메타데이터 | 벡터 (순수) | 벡터 + 하이브리드 | 벡터 + BM25 하이브리드 |
| 확장성 | 소~중규모 | 수십억 벡터 | 수십억 (자동 확장) | 수억 벡터 |
| 가격 | 무료 | 무료 | 무료 티어 + $50/월~ | 무료 (셀프호스팅) |
| 적합한 경우 | 프로토타이핑, 학습용 | 연구, 고성능, 커스텀 인덱싱 | 프로덕션, 엔터프라이즈 | 하이브리드 검색, 멀티모달 |

### 인덱싱 알고리즘: Flat vs IVF vs HNSW

| 항목 | Flat (Brute-force) | IVF | HNSW |
|------|-------------------|-----|------|
| **원리** | 모든 벡터와 거리 계산 | k-means 클러스터링 후 관련 클러스터만 검색 | 계층적 그래프 탐색 |
| **검색 정확도** | 100% (정확) | 높음 (nprobe에 따라) | 매우 높음 (ef에 따라) |
| **검색 속도** | 느림 O(n) | 빠름 | 매우 빠름 |
| **메모리** | 낮음 | 중간 | 높음 (그래프 연결 정보) |
| **업데이트** | 즉시 가능 | 재학습 필요할 수 있음 | 동적 추가/삭제 용이 |
| **적합한 규모** | < 10만 벡터 | 10만 ~ 수억 | 10만 ~ 수천만 |

```mermaid
flowchart LR
    subgraph "Flat (Brute-force)"
        Q1["쿼리"] --> ALL["모든 벡터와 비교"]
        ALL --> R1["정확한 결과<br/>O(n)"]
    end

    subgraph "IVF"
        Q2["쿼리"] --> CLUSTER["가까운 클러스터 탐색"]
        CLUSTER --> INNER["클러스터 내 검색"]
        INNER --> R2["빠른 결과<br/>O(n/k)"]
    end

    subgraph "HNSW"
        Q3["쿼리"] --> TOP["상위 레이어<br/>(대략적 위치)"]
        TOP --> MID["중간 레이어"]
        MID --> BOT["하위 레이어<br/>(정밀 검색)"]
        BOT --> R3["매우 빠른 결과<br/>O(log n)"]
    end

    style R1 fill:#e74c3c,color:#fff
    style R2 fill:#f39c12,color:#fff
    style R3 fill:#2ecc71,color:#fff
```

---

# 5. RAG 파이프라인 - Generation

## 5.1 검색 방법 (Search Methods)

### Exact Nearest Neighbor (Brute-force)

쿼리 벡터와 데이터베이스의 **모든 벡터** 사이의 거리를 하나씩 계산하여 가장 가까운 벡터를 찾는 방식이다.

```python
import faiss

d = 128       # 벡터 차원
index = faiss.IndexFlatL2(d)
index.add(vectors)

# 검색 - 모든 벡터와 비교
D, I = index.search(query_vector, k=5)
```

100% 정확한 결과를 보장하지만, O(n×d) 시간 복잡도로 대규모 데이터셋에서는 실시간 검색이 불가능하다. 데이터셋이 10만 건 미만이거나, 벤치마크 Ground Truth 생성 시 사용한다.

### Approximate Nearest Neighbor (ANN)

정확도를 소량 희생하는 대신 검색 속도를 극적으로 향상시키는 방식이다.

**LSH (Locality Sensitive Hashing)**: 유사한 벡터가 같은 해시 버킷에 들어갈 확률이 높도록 설계된 특수 해시 함수를 사용한다. 메모리 효율적이지만 고차원 데이터에서 성능이 저하될 수 있다.

**HNSW (Hierarchical Navigable Small World)**: 다층 그래프 구조를 구축하여, 최상위 레이어에서 대략적 위치를 파악하고 하위 레이어로 내려가며 정밀 검색한다. ANN 방법 중 **최고 수준의 정확도와 검색 속도**를 제공한다.

**IVF (Inverted File Index)**: k-means 알고리즘으로 전체 벡터 공간을 여러 클러스터로 분할하고, 검색 시 쿼리와 가장 가까운 nprobe개의 클러스터만 탐색한다.

### Exact vs ANN 트레이드오프

| 항목 | Exact NN | ANN |
|------|----------|-----|
| 정확도 | 100% (완벽) | 95~99%+ |
| 검색 속도 | O(n×d), 느림 | O(log n) ~ O(1), 빠름 |
| 확장성 | 수만~수십만 한계 | 수억~수십억 가능 |
| 적합한 경우 | 소규모 데이터, Ground Truth | 프로덕션 시스템 |

## 5.2 검색된 컨텍스트 기반 답변 생성

검색 단계에서 가장 관련성 높은 문서 청크를 찾으면, 이를 LLM에 전달하여 최종 답변을 생성한다.

### 검색 결과를 LLM에 전달하는 방식

```python
from langchain_core.prompts import ChatPromptTemplate

template = """다음 컨텍스트를 기반으로 질문에 답변하세요.
컨텍스트에 답이 없으면 "해당 정보를 찾을 수 없습니다"라고 답변하세요.

컨텍스트:
{context}

질문: {question}

답변:"""

prompt = ChatPromptTemplate.from_template(template)
```

프롬프트 템플릿에 검색된 문서를 `{context}`로, 사용자 질문을 `{question}`으로 삽입한다. "답을 모를 때" 처리 지시를 포함하여 환각을 방지한다.

### 컨텍스트 윈도우와 top_k의 관계

**top_k**는 검색 결과에서 상위 몇 개의 문서를 LLM에 전달할지 결정하는 파라미터다.

- **top_k가 작을 때** (3~5): 가장 관련성 높은 문서만 전달하여 노이즈 최소화. 정밀한 답변에 유리
- **top_k가 클 때** (10~20): 더 많은 컨텍스트를 제공하여 종합적인 답변 가능. 단, 노이즈 증가 및 토큰 비용 증가

LLM의 컨텍스트 윈도우 크기에 따라 전달 가능한 문서 수가 제한된다. GPT-4o(128K 토큰)는 상당히 많은 문서를 포함할 수 있지만, 컨텍스트가 길어질수록 중간 부분의 정보를 놓치는 **"Lost in the Middle"** 문제가 발생할 수 있으므로, 적절한 top_k 값을 찾는 것이 중요하다.

---

# 6. 기본 RAG 챗봇 구현

이 섹션에서는 앞서 배운 RAG 개념을 **단일 파일 코드**로 직접 구현해본다. 복잡한 프로젝트 구조 없이 핵심 동작 원리에 집중하되, **유사도 점수와 출처 표시**, **대화형 루프**까지 포함하여 실용적인 수준으로 구현한다.

> 전체 소스 코드는 [tutorials-python/ai/rag/basic-rag](https://github.com/kenshin579/tutorials-python/tree/main/ai/rag/basic-rag)를 참조한다.

## 6.1 의존성 설치

```bash
pip install langchain langchain-openai langchain-chroma langchain-community
```

또는 `pyproject.toml`을 사용하는 경우:

```bash
pip install -e .
```

## 6.2 전체 코드

`main.py` 하나로 **문서 인덱싱**, **출처 포함 질의응답**, **대화형 모드**가 모두 동작한다.

```python
import os
import sys

from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHROMA_DIR = "./chroma_db"
DOCS_DIR = "./docs"

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")


# ── 1단계: 문서 인덱싱 ──────────────────────────────────
def index_documents():
    """문서를 로드 → 청킹 → 임베딩 → 벡터 저장소에 저장"""

    loader = DirectoryLoader(DOCS_DIR, glob="**/*.md", loader_cls=TextLoader)
    documents = loader.load()
    print(f"로드된 문서: {len(documents)}개")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(documents)
    print(f"생성된 청크: {len(chunks)}개")

    Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_DIR)
    print("인덱싱 완료!")


# ── 2단계: 유사도 검색 + 출처 표시 ────────────────────────
def retrieve_with_sources(vector_store, question: str, k: int = 3):
    """유사도 점수와 함께 관련 문서를 검색하고 출처 정보를 반환"""
    results = vector_store.similarity_search_with_relevance_scores(question, k=k)

    sources = []
    for doc, score in results:
        source_file = os.path.basename(doc.metadata.get("source", "알 수 없음"))
        sources.append({
            "file": source_file,
            "score": score,
            "preview": doc.page_content[:80] + "...",
        })
    return results, sources


def format_docs_simple(docs):
    """retriever용 포맷 함수 (Document 리스트 → 텍스트)"""
    return "\n\n".join(doc.page_content for doc in docs)


def print_sources(sources):
    """출처 정보를 포맷팅하여 출력"""
    print("\n📚 참조 문서:")
    for i, src in enumerate(sources, 1):
        print(f"  [{i}] {src['file']} (유사도: {src['score']:.3f})")
        print(f"      {src['preview']}")


# ── 3단계: RAG 체인 구성 ─────────────────────────────────
def build_chain(vector_store):
    """RAG 체인을 구성하여 반환"""

    prompt = ChatPromptTemplate.from_template(
        """다음 컨텍스트를 기반으로 질문에 답변하세요.
컨텍스트에 답이 없으면 "해당 정보를 찾을 수 없습니다"라고 답변하세요.

컨텍스트:
{context}

질문: {question}
답변:"""
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 3})

    chain = (
        {"context": retriever | format_docs_simple, "question": RunnablePassthrough()}
        | prompt
        | ChatOpenAI(model="gpt-4o", temperature=0)
        | StrOutputParser()
    )
    return chain


def query(question: str):
    """단일 질문에 대해 답변 생성 + 출처 표시"""

    vector_store = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
    results, sources = retrieve_with_sources(vector_store, question)

    chain = build_chain(vector_store)
    answer = chain.invoke(question)

    print(f"\n💬 질문: {question}")
    print(f"\n🤖 답변: {answer}")
    print_sources(sources)


# ── 4단계: 대화형 루프 ───────────────────────────────────
def chat():
    """대화형 모드 - 반복적으로 질문하고 답변을 받을 수 있다"""

    vector_store = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
    chain = build_chain(vector_store)

    print("=" * 50)
    print("RAG 챗봇 대화 모드")
    print("종료: quit 또는 exit 입력")
    print("=" * 50)

    while True:
        try:
            question = input("\n❓ 질문: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n대화를 종료합니다.")
            break

        if not question:
            continue
        if question.lower() in ("quit", "exit", "q"):
            print("대화를 종료합니다.")
            break

        results, sources = retrieve_with_sources(vector_store, question)
        answer = chain.invoke(question)

        print(f"\n🤖 답변: {answer}")
        print_sources(sources)


# ── 실행 ─────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python main.py [index|query|chat]")
        print("  index         - docs/ 디렉토리의 문서를 인덱싱")
        print("  query <질문>  - 단일 질문에 답변")
        print("  chat          - 대화형 모드 시작")
        sys.exit(1)

    command = sys.argv[1]
    if command == "index":
        index_documents()
    elif command == "query":
        question = sys.argv[2] if len(sys.argv) > 2 else "청약철회 기간은?"
        query(question)
    elif command == "chat":
        chat()
    else:
        print(f"알 수 없는 명령: {command}")
```

## 6.3 코드 흐름 설명

전체 코드는 **인덱싱**, **출처 포함 검색**, **RAG 체인**, **대화형 루프** 네 부분으로 구성된다.

### 인덱싱 (`index_documents`)

앞서 배운 RAG 파이프라인의 오프라인 단계에 해당한다.

1. **문서 로드**: `DirectoryLoader`로 `docs/` 디렉토리의 마크다운 파일을 읽어 `Document` 객체로 변환
2. **청킹**: `RecursiveCharacterTextSplitter`로 500자 단위로 분할 (50자 겹침)
3. **임베딩 + 저장**: `OpenAIEmbeddings`로 벡터화 후 `ChromaDB`에 저장

### 출처 포함 검색 (`retrieve_with_sources`)

일반적인 `similarity_search`는 Document 객체만 반환하지만, `similarity_search_with_relevance_scores`를 사용하면 **유사도 점수**를 함께 받을 수 있다. 이를 통해 검색 결과의 품질을 확인하고, 어떤 문서에서 답변이 생성되었는지 **출처를 투명하게 제공**할 수 있다.

### RAG 체인 (`build_chain`)

LangChain의 LCEL(LangChain Expression Language)로 체인을 구성한다. 체인을 별도 함수로 분리하면 `query`와 `chat` 모드에서 재사용할 수 있다.

1. **검색기 생성**: 저장된 ChromaDB에서 상위 3개 유사 청크를 검색하는 retriever 설정
2. **문서 포맷팅**: `format_docs_simple`로 검색된 Document 객체들을 하나의 문자열로 결합
3. **프롬프트 구성**: 포맷팅된 컨텍스트와 사용자 질문을 템플릿에 삽입
4. **LLM 호출**: GPT-4o로 답변 생성
5. **출력 파싱**: `StrOutputParser`로 최종 답변 추출

### 대화형 루프 (`chat`)

`while` 루프로 사용자 입력을 반복적으로 받으며, 매 질문마다 **검색 → 답변 생성 → 출처 표시**를 수행한다. vector_store와 chain 객체를 루프 밖에서 한 번만 초기화하여 효율적으로 재사용한다.

```mermaid
flowchart LR
    Q["사용자 질문"] --> SRC["retrieve_with_sources<br/>(유사도 검색)"]
    Q --> RET["retriever<br/>(ChromaDB 검색)"]
    RET --> FMT["format_docs<br/>(텍스트 결합)"]
    Q --> MERGE["프롬프트 구성"]
    FMT --> MERGE
    MERGE --> LLM["ChatOpenAI<br/>(GPT-4o)"]
    LLM --> PARSE["StrOutputParser"]
    PARSE --> ANS["답변 + 출처 출력"]
    SRC --> ANS

    style SRC fill:#e74c3c,color:#fff
    style RET fill:#45b7d1,color:#fff
    style FMT fill:#f39c12,color:#fff
    style LLM fill:#2ecc71,color:#fff
```

## 6.4 실행 및 테스트

샘플 문서로 소비자기본법, 근로기준법, 주택임대차보호법 요약 마크다운 파일을 `docs/` 디렉토리에 넣어 테스트한다.

```bash
# 1. 환경 변수 설정
export OPENAI_API_KEY=your_api_key

# 2. 문서 인덱싱
python main.py index
# 로드된 문서: 3개
# 생성된 청크: 18개
# 인덱싱 완료!

# 3. 단일 질의 (출처 포함)
python main.py query "청약철회 기간은?"
# 💬 질문: 청약철회 기간은?
# 🤖 답변: 소비자는 계약내용에 관한 서면을 받은 날부터 7일 이내에 ...
#
# 📚 참조 문서:
#   [1] consumer-protection-act.md (유사도: 0.872)
#       ## 청약철회(전자상거래법) ### 청약철회 기간 소비자는 다음 기간 내에 청약의 철회를 할...
#   [2] consumer-protection-act.md (유사도: 0.814)
#       ### 환불 의무 사업자는 청약철회를 받은 날부터 3영업일 이내에 이미 지급받은 대금을 환...
#   [3] tenant-protection-act.md (유사도: 0.627)
#       # 주택임대차보호법 주요 내용 요약 ## 대항력 ### 대항력의 요건 임차인이 주택의 인...

# 4. 대화형 모드
python main.py chat
# ==================================================
# RAG 챗봇 대화 모드
# 종료: quit 또는 exit 입력
# ==================================================
# ❓ 질문: 연차휴가는 며칠인가요?
# 🤖 답변: 1년간 80% 이상 출근한 근로자에게 15일의 유급휴가가 ...
# 📚 참조 문서:
#   [1] labor-standards-act.md (유사도: 0.891)
#       ...
```

> 이 코드를 FastAPI + React UI를 갖춘 프로덕션 수준의 챗봇으로 확장하는 방법은 별도 시리즈에서 다룰 예정이다.

---

# 7. 참고

- [AWS - What is RAG?](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
- [IBM - RAG vs Fine-tuning vs Prompt Engineering](https://www.ibm.com/think/topics/rag-vs-fine-tuning-vs-prompt-engineering)
- [LangChain RAG Documentation](https://docs.langchain.com/oss/python/langchain/rag)
- [Real Python - Build an LLM RAG Chatbot With LangChain](https://realpython.com/build-llm-rag-chatbot-with-langchain/)
- [NVIDIA - RAG 101](https://developer.nvidia.com/blog/rag-101-demystifying-retrieval-augmented-generation-pipelines/)
- [Pinecone - RAG Guide](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [LoRA 원본 논문 - Hu et al. (2021)](https://arxiv.org/pdf/2106.09685)
- [QLoRA 원본 논문 - Dettmers et al. (2023)](https://arxiv.org/abs/2305.14314)
- [Weaviate - Chunking Strategies for RAG](https://weaviate.io/blog/chunking-strategies-for-rag)
- [FAISS - Guidelines to choose an index](https://github.com/facebookresearch/faiss/wiki/Guidelines-to-choose-an-index)
- [ANN Benchmarks](https://ann-benchmarks.com/)
- [Hugging Face PEFT](https://github.com/huggingface/peft)
- [Stanford HAI - Hallucinating Law](https://hai.stanford.edu/news/hallucinating-law-legal-mistakes-large-language-models-are-pervasive)
