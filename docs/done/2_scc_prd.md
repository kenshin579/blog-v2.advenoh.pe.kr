# SCC(강연결 요소) 알고리즘 블로그 PRD

## 선행 글

- [그래프 기초: DFS, DAG, 위상정렬](3_dfsd_prd.md) — DFS Finish Order, 간선 분류, 그래프 전치, 위상정렬을 먼저 다룸

---

## 배경

Robot Scheduler의 Pathfinder Reachability 모듈에서 SCC 알고리즘이 사용된다.
노드 A에서 노드 B로 도달 가능한지 O(1)으로 판단하기 위한 전처리 구조체이며,
경로 탐색 전에 "아예 갈 수 없는 곳"을 빠르게 걸러내는 역할이다.

### 실제 코드의 알고리즘 흐름

1. **SCC 계산** — Kosaraju 알고리즘으로 강연결 요소 분리
2. **SCC → DAG 변환** — 각 SCC를 하나의 노드로 축약한 DAG 생성
3. **위상정렬** — Kahn 알고리즘 (BFS 기반)
4. **Bitset 전파** — 역순으로 순회하며 도달 가능한 SCC를 비트셋으로 합산
5. **O(1) 쿼리** — `IsReachable(from, to)` 호출 시 비트셋 lookup만 수행

---

## 블로그 목차

### 1. SCC란 무엇인가

- 강연결 요소(Strongly Connected Component)의 정의
- 방향 그래프에서 "서로 도달 가능한 노드의 최대 집합"
- 간단한 예시 그래프 (Mermaid 다이어그램)
- SCC를 왜 알아야 하는가 — 활용 사례 개요

### 2. SCC 알고리즘

#### 2.1 Kosaraju 알고리즘 (메인)

- 핵심 아이디어: 2-pass DFS (정방향 → 역방향)
- 동작 과정 단계별 설명
  1. 1차 DFS: 원본 그래프에서 후위 순서(finish order) 기록
  2. 그래프 전치(transpose): 모든 간선 방향 뒤집기
  3. 2차 DFS: finish order 역순으로 전치 그래프 탐색 → 각 트리가 하나의 SCC
- 각 단계별 Mermaid 다이어그램
- 시간복잡도: O(V + E)
- 왜 정확한가 — 직관적 증명

#### 2.2 Tarjan 알고리즘 (비교)

- 핵심 아이디어: 1-pass DFS + 스택 기반
- discovery time과 low-link 값의 의미
- Kosaraju와의 비교

| 항목 | Kosaraju | Tarjan |
|------|----------|--------|
| DFS 횟수 | 2회 | 1회 |
| 추가 자료구조 | 전치 그래프 | 스택 + low-link 배열 |
| 구현 난이도 | 직관적 | 상대적으로 복잡 |
| 실무 사용 | 교육/이해 용이 | 경쟁 프로그래밍에서 선호 |

### 3. SCC → DAG 축약 (Condensation Graph)

- SCC를 하나의 노드로 압축하면 반드시 DAG가 되는 이유
- 축약 그래프(Condensation Graph) 생성 방법
- Mermaid로 축약 전후 비교 다이어그램
- 축약 그래프의 활용 가치
  - 도달 가능성(Reachability) 판정
  - 2-SAT 문제 해결
  - 컴파일러의 의존성 분석

### 4. 실전 활용: O(1) 도달 가능성 판정

- 문제 정의: "노드 A에서 노드 B로 갈 수 있는가?"
- 나이브한 접근: 매번 BFS/DFS → O(V + E) per query
- 전처리 파이프라인:

```
원본 그래프
  → SCC 분해 (Kosaraju)
  → DAG 축약 (Condensation)
  → 위상정렬 (Kahn's Algorithm)
  → Bitset 역순 전파
  → O(1) 쿼리
```

- 각 단계별 상세 설명:
  1. SCC 분해: 같은 SCC 내 노드는 서로 도달 가능 → 한 그룹으로 처리
  2. DAG 축약: SCC를 단일 노드로 압축
  3. 위상정렬: Kahn 알고리즘(BFS)으로 DAG의 처리 순서 결정
  4. Bitset 전파: 위상정렬 역순으로 "도달 가능한 SCC 집합"을 비트셋으로 합산
  5. 쿼리: `from`의 SCC bitset에서 `to`의 SCC 비트가 켜져 있는지 확인 → O(1)
- 공간복잡도와 전처리 시간복잡도 분석

### 5. Go 구현 예제

- 핵심 자료구조 정의
- Kosaraju 알고리즘 구현
- DAG 축약 구현
- Bitset 기반 Reachability 구현
- 테스트 케이스 (예시 그래프로 검증)

### 6. 정리

- SCC 알고리즘 선택 기준 (Kosaraju vs Tarjan)
- SCC가 쓰이는 곳 정리
  - 컴파일러: 순환 의존성 탐지, 모듈 분석
  - 경로 탐색: 도달 가능성 전처리 (이 글의 사례)
  - 2-SAT: 논리식 만족 가능성 판정
  - 소셜 네트워크: 강하게 연결된 커뮤니티 탐지
  - 웹 그래프: 페이지 클러스터링
- 참고 자료

---

## 작성 방침

- **메인 알고리즘**: Kosaraju (분석한 코드가 Kosaraju 기반이므로)
- **Tarjan**: 비교 수준으로 다룸
- **코드 언어**: Go
- **다이어그램**: 반드시 Mermaid 형식 사용
- **한 글 구성**: SCC 개념 + 도달 가능성 활용까지 한 글에 담아서 "SCC를 왜 배우는가"의 동기부여 확보

---

## 참고 자료

- Introduction to Algorithms (CLRS) — Chapter 22 (Elementary Graph Algorithms)
- Pathfinder Reachability 모듈 소스코드 (Kosaraju + Bitset Reachability)
- [Wikipedia: Strongly Connected Component](https://en.wikipedia.org/wiki/Strongly_connected_component)
- [Wikipedia: Kosaraju's Algorithm](https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm)
