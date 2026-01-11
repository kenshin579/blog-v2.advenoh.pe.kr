# 뉴스 카테고리 분류 개선 PRD

## 1. 현재 상황

### 1.1 현재 분류 방식
- **방식**: 순수 키워드 매칭 (정규표현식/AI 없음)
- **로직 위치**: `scripts/news/category/categorizer.py`
- **키워드 정의**: `scripts/news/categories.yaml`

```python
# 현재 분류 로직 (categorizer.py:31-60)
text = (title + " " + " ".join(tags) + " " + " ".join(rss_categories)).lower()
for category in categories:
    if any(keyword.lower() in text for keyword in keywords):
        return category["name"], category["emoji"]
return "Misc", "📌"  # 매칭 실패 시 기본값
```

### 1.2 현재 카테고리 구조
| 카테고리 | 이모지 | 키워드 수 |
|---------|--------|----------|
| Cloud & Infra | ☁️ | 24개 |
| AI / ML | 🤖 | 15개 |
| Development | 💻 | 18개 |
| Security | 🔒 | 6개 |
| Misc | 📌 | 0개 (기본값) |

---

## 2. 문제점 분석

### 2.1 2025-12-22 뉴스 분류 결과
- **총 항목**: 62개
- **Misc 분류**: 28개 (45%)
- **재분류 가능**: 18개 (Misc의 64%)

### 2.2 Misc로 잘못 분류된 항목 유형

#### AI / ML로 이동해야 할 항목 (8개)
| 제목 | 누락 키워드 |
|-----|-----------|
| "에이전트 중심 IDE" 안티그래비티 체험기 | 에이전트, agent |
| 바이브 코딩 도구 3가지 | 바이브 코딩, vibe coding |
| 바이브 코딩 추천 툴 7가지 | 바이브 코딩, vibe coding |
| Kanana-2 오픈소스 공개 | kanana, 카나나 |
| Kanana-o의 진화 과정 | kanana, 카나나 |
| 멀티모달 임베딩 모델 개발기 | 멀티모달, multimodal |
| Tensor-Canon v0.1.4 | tensor, 텐서 |
| Codex에 도입된 Skills 기능 | codex |

#### Development로 이동해야 할 항목 (9개)
| 제목 | 누락 키워드 |
|-----|-----------|
| CDN으로 배우는 개발자 소통법 | cdn, 아키텍처 |
| 자바스크립트 내부 슬롯과 내부 메서드 | 자바스크립트 (영문만 있음) |
| PyCon 영상 데이터가 들려준 파이썬의 미래 | python, 파이썬, pycon |
| 2026년 백엔드 개발자에게 찾아올 변화 | 백엔드, backend |
| 코드 품질 개선 기법 | 코드 품질, code quality |
| OpenSCAD은 꽤 멋지다 | 3d, cad, 모델링 |
| Charles Proxy | proxy, 디버깅 |
| DiceBear 아바타 라이브러리 | library, 라이브러리 |
| PrivateStater 애널리틱스 도구 | analytics |

#### Cloud & Infra로 이동해야 할 항목 (1개)
| 제목 | 누락 키워드 |
|-----|-----------|
| Athenz 엔지니어 Kubestronaut 도전 | kubestronaut (k8s 변형) |

### 2.3 근본 원인

1. **키워드 부족**: 신규 용어 및 한글 키워드 누락
2. **부분 문자열 한계**: "kubestronaut"는 "kubernetes" 포함 안 함
3. **의미 기반 분류 부재**: 제목만으로 맥락 파악 불가
4. **카테고리 세분화 부족**: Career, Design, Tools 등 없음

---

## 3. 개선 요구사항

### 3.1 Phase 1: 키워드 확장 (단기)

#### 목표
- 현재 키워드 매칭 방식 유지
- 누락된 키워드 추가로 즉시 분류 정확도 향상

#### 추가할 키워드

**AI / ML 카테고리:**
```yaml
# AI Agent
- agent
- 에이전트
- agentic
# AI Coding
- vibe coding
- 바이브 코딩
- copilot
- cursor
- codex
# AI Models
- kanana
- 카나나
- llama
- mistral
- anthropic
# AI Concepts
- multimodal
- 멀티모달
- rag
- embedding
- 임베딩
- tensor
- 텐서
- transformer
- 트랜스포머
- fine-tuning
- 파인튜닝
```

**Development 카테고리:**
```yaml
# Languages
- python
- 파이썬
- java
- 자바
- go
- golang
- rust
- kotlin
- 코틀린
# Concepts
- 백엔드
- backend
- 프론트엔드
- frontend
- cdn
- proxy
- 아키텍처
- architecture
- 리팩토링
- refactoring
- 코드 품질
- code quality
- 디버깅
- debugging
# Tools
- ide
- vscode
- intellij
- 라이브러리
- library
- analytics
- pycon
```

**Cloud & Infra 카테고리:**
```yaml
# Extended K8s
- kubestronaut
- istio
- argocd
- gitops
```

### 3.2 Phase 2: 카테고리 구조 개선 (중기)

#### 새 카테고리 추가 검토

| 카테고리 | 이모지 | 용도 | 예시 키워드 |
|---------|--------|-----|-----------|
| Career & Culture | 👔 | 개발자 커리어, 회고 | 회고, 커리어, 프리랜서, 이직 |
| Design & UX | 🎨 | 디자인, UX | ux, ui, 디자인, 피그마 |
| Tools & Productivity | 🛠️ | 개발 도구 | 도구, tool, 생산성 |
| News & Trends | 📰 | 트렌드, 업계 뉴스 | 트렌드, 전망, 2026년 |

### 3.3 Phase 3: AI 기반 분류 (장기)

#### 목표
- 키워드 매칭 실패 시 LLM으로 fallback
- 의미 기반 분류로 정확도 향상

#### 구현 방안

```python
# 제안하는 2단계 분류 로직
def categorize_article_v2(title, tags, rss_categories, categories):
    # 1단계: 키워드 매칭 (기존 방식)
    result = keyword_match(title, tags, rss_categories, categories)
    if result != "Misc":
        return result

    # 2단계: LLM 분류 (fallback)
    return llm_categorize(title, categories)
```

#### LLM 분류 프롬프트 예시
```
다음 IT 뉴스 제목을 가장 적절한 카테고리로 분류해주세요.

제목: "{title}"

카테고리 옵션:
1. Cloud & Infra - 클라우드, 인프라, DevOps, 컨테이너
2. AI / ML - 인공지능, 머신러닝, LLM, AI 코딩
3. Development - 프로그래밍, 프레임워크, 데이터베이스
4. Security - 보안, 취약점, 인증
5. Misc - 위 카테고리에 해당하지 않음

카테고리 이름만 답하세요.
```

#### 고려사항
- **API 비용**: 분류당 ~$0.001 (GPT-4o-mini 기준)
- **캐싱**: 동일 제목 패턴은 캐시하여 비용 절감
- **배치 처리**: Misc 항목만 LLM으로 분류하여 비용 최소화

---

## 4. 우선순위 및 일정

| Phase | 작업 | 우선순위 | 예상 효과 |
|-------|-----|---------|----------|
| 1 | 키워드 확장 | 높음 | Misc 비율 45% → 20% |
| 2 | 카테고리 구조 개선 | 중간 | 분류 세분화 |
| 3 | AI 기반 분류 | 낮음 | Misc 비율 → 5% 미만 |

---

## 5. 성공 지표

- **Misc 비율**: 현재 45% → 목표 15% 이하
- **재분류 필요 항목**: 현재 64% → 목표 10% 이하
- **분류 정확도**: 수동 검토 시 95% 이상 정확

---

## 6. 참고 파일

- 분류 로직: `scripts/news/category/categorizer.py`
- 키워드 정의: `scripts/news/categories.yaml`
- 메인 스크립트: `scripts/news/main.py`
- 생성 결과: `contents/biweekly/news-{DATE}/index.md`
