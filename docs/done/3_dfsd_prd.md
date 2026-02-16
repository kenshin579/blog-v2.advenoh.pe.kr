# 그래프 기초: DFS, DAG, 위상정렬 블로그 PRD

## 배경

SCC(강연결 요소) 알고리즘을 다루기 전에 반드시 알아야 할 그래프 기초 개념을 별도 글로 작성한다.
이 글이 선행 학습 글이 되고, SCC 글에서 링크로 참조하는 구조이다.

### 글 순서

```
[이 글] 그래프 기초: DFS, DAG, 위상정렬
  → [후속 글] SCC 알고리즘과 도달 가능성 판정
```

---

## 블로그 목차

### 1. 방향 그래프 기초

- 그래프란 무엇인가 — 노드(Vertex)와 간선(Edge)
- 방향 그래프(Directed Graph) vs 무방향 그래프(Undirected Graph)
- 그래프 표현 방법
  - 인접 리스트 (Adjacency List) — 희소 그래프에 유리
  - 인접 행렬 (Adjacency Matrix) — 밀집 그래프에 유리
  - 비교표 (공간복잡도, 간선 존재 확인, 순회 성능)
- Go로 인접 리스트 구현 예제

### 2. DFS (깊이 우선 탐색)

#### 2.1 DFS 기본 동작

- 재귀/스택 기반 탐색 원리
- 방문 상태 관리 (미방문 → 진행 중 → 완료)
- 시간복잡도: O(V + E)
- Mermaid로 DFS 탐색 순서 시각화

#### 2.2 Discovery Time과 Finish Time

- 각 노드의 발견 시점(discovery)과 완료 시점(finish) 기록
- **Finish Order(후위 순서)** — 탐색이 끝나는 순서로 노드를 기록
- Finish Order가 중요한 이유 → SCC(Kosaraju)의 핵심 입력
- 예시 그래프로 타임스탬프 추적

#### 2.3 간선 분류 (Edge Classification)

- DFS 트리에서 간선이 4가지로 분류되는 원리

| 간선 종류 | 설명 | 발견 조건 |
|-----------|------|-----------|
| Tree Edge | DFS 트리의 간선 | 미방문 노드로 이동 |
| Back Edge | 조상 노드로 돌아가는 간선 | 진행 중 노드로 이동 |
| Forward Edge | 자손 노드로 가는 비트리 간선 | 완료된 노드, discovery 더 큼 |
| Cross Edge | 다른 서브트리로 가는 간선 | 완료된 노드, discovery 더 작음 |

- **Back Edge가 존재하면 순환이 있다** → 순환 감지의 핵심
- Mermaid로 간선 분류 시각화

#### 2.4 그래프 전치 (Transpose Graph)

- 모든 간선의 방향을 뒤집은 그래프
- 구현: 인접 리스트에서 `u → v`를 `v → u`로 변환
- 용도: Kosaraju 알고리즘의 2단계에서 사용
- Mermaid로 원본 vs 전치 그래프 비교

### 3. DAG (Directed Acyclic Graph)

- 정의: 순환이 없는 방향 그래프
- DAG인지 확인하는 방법: DFS에서 Back Edge가 없으면 DAG
- DAG가 중요한 이유
  - 위상정렬이 가능한 유일한 조건
  - 의존성 관계 표현 (빌드 시스템, 작업 스케줄링)
  - SCC 축약 결과가 항상 DAG

### 4. 위상정렬 (Topological Sort)

#### 4.1 위상정렬이란

- DAG에서 모든 간선 `u → v`에 대해 u가 v보다 앞에 오는 선형 순서
- 위상정렬이 가능한 조건: 그래프가 DAG일 때만
- 실생활 예시: 대학 선수과목, 빌드 의존성

#### 4.2 Kahn 알고리즘 (BFS 기반)

- 핵심 아이디어: 진입차수(in-degree)가 0인 노드부터 제거
- 동작 과정:
  1. 모든 노드의 진입차수 계산
  2. 진입차수 0인 노드를 큐에 삽입
  3. 큐에서 노드를 꺼내고, 해당 노드의 이웃 진입차수 감소
  4. 진입차수가 0이 되면 큐에 삽입
  5. 반복
- 순환 감지: 처리된 노드 수 < 전체 노드 수 → 순환 존재
- 시간복잡도: O(V + E)
- Mermaid로 단계별 시각화

#### 4.3 DFS 기반 위상정렬

- DFS Finish Order의 역순이 위상정렬 결과
- Kahn과의 비교

| 항목 | Kahn (BFS) | DFS 기반 |
|------|-----------|----------|
| 접근 방식 | 진입차수 제거 | Finish Order 역순 |
| 순환 감지 | 처리 노드 수로 판단 | Back Edge 존재로 판단 |
| 구현 | 큐 + 진입차수 배열 | 재귀 + 스택 |
| 용도 | 일반적 위상정렬 | SCC 전처리(Kosaraju) |

### 5. Go 구현 예제

- 방향 그래프 자료구조
- DFS (타임스탬프 + 간선 분류)
- 그래프 전치
- Kahn 위상정렬
- 테스트 케이스

### 6. 정리

- 이 글에서 다룬 개념 요약표
- 다음 글 예고: SCC 알고리즘과 도달 가능성 판정

---

## 작성 방침

- **코드 언어**: Go
- **다이어그램**: Mermaid 형식만 사용
- **DFS Finish Order**: SCC(Kosaraju) 연결을 위해 충분히 강조
- **간선 분류**: 순환 감지 → SCC로 이어지는 흐름을 명확히
- **그래프 전치**: Kosaraju 사전 지식으로 반드시 포함
- **위상정렬**: Kahn 알고리즘 메인, DFS 기반은 비교 수준

---

## 참고 자료

- Introduction to Algorithms (CLRS) — Chapter 22 (Elementary Graph Algorithms)
- [Wikipedia: Depth-First Search](https://en.wikipedia.org/wiki/Depth-first_search)
- [Wikipedia: Topological Sorting](https://en.wikipedia.org/wiki/Topological_sorting)
- [Wikipedia: Directed Acyclic Graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph)
