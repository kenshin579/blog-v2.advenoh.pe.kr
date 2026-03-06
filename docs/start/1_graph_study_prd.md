# Robot Scheduler 선행 학습 가이드

Robot Scheduler는 다수의 로봇이 동일 공간에서 동시 운행할 때 발생하는 **경로 충돌**, **교착(Deadlock)**, **경로 공유** 문제를 해결하는 시스템이다.
이 문서는 Robot Scheduler 코드를 이해하기 위해 미리 학습해야 할 Computer Science 주제를 정리한다.

## 추천 학습 순서

```
1단계: Graph Theory (DAG, 위상정렬, 순환감지)
  ↓
2단계: Deadlock (OS 교재의 교착상태 챕터)
  ↓
3단계: Grid & Bresenham (래스터화, 2D 충돌감지)
  ↓
4단계: Computational Geometry (Point-in-Polygon, Intersection)
  ↓
5단계: Temporal Reasoning (시간-공간 동시 판단)
  ↓
6단계: Concurrency (goroutine, distributed lock)
```

1~2단계만 확실히 이해해도 전체 스케줄러의 동작 원리를 파악할 수 있다. 3단계 이후는 세부 구현을 읽을 때 필요하다.

---

## 1단계: Graph Theory 기초

> 가장 핵심. ADG 구축 → 위상정렬 → 순환감지 → 순환제거 흐름이 전체 스케줄러의 뼈대이다.

### DAG (Directed Acyclic Graph)

- **적용**: 로봇 액션 간 의존 관계를 방향 그래프로 표현
- **라이브러리**: gonum의 `simple.DirectedGraph`
- **학습 포인트**:
  - 방향 그래프와 무방향 그래프의 차이
  - DAG의 정의 (순환이 없는 방향 그래프)
  - 노드(vertex)와 간선(edge)의 관계
  - 그래프의 인접 리스트 vs 인접 행렬 표현

### Topological Sort (위상정렬)

- **적용**: DAG에서 선후 관계를 만족하는 실행 순서 도출
- **학습 포인트**:
  - Kahn's Algorithm (BFS 기반 위상정렬)
  - DFS 기반 위상정렬
  - 위상정렬이 가능한 조건 (DAG일 때만)
  - 시간복잡도: O(V + E)

### Cycle Detection (순환 감지)

- **적용**: 교착(deadlock) 상태 감지
- **학습 포인트**:
  - DFS 기반 순환 감지 알고리즘
  - Back edge의 의미
  - 시간복잡도: O(V + E)

### Connected Components (연결 요소)

- **적용**: 충돌 관련 로봇들을 독립적인 그룹으로 분리
- **학습 포인트**:
  - 무방향 그래프에서의 연결 요소 탐색 (DFS/BFS)
  - 연결 요소 분리의 실용적 의미 (독립적인 문제를 나눠서 처리)

---

## 2단계: Deadlock Detection & Resolution

> OS 교재의 Deadlock 챕터(환형대기, 자원할당 그래프)를 먼저 보면 직관적으로 이해된다.

### Deadlock 개념

- **적용**: 다수 로봇이 서로의 경로를 점유하여 순환 대기 발생
- **학습 포인트**:
  - Deadlock의 4가지 필요조건 (상호배제, 점유대기, 비선점, 환형대기)
  - Resource Allocation Graph
  - 운영체제의 교착 상태와 로봇 경로 교착의 유사성

### Cycle Breaking (순환 제거)

- **적용**: 양보(yield) 로봇을 선정하고 간선을 역전시켜 순환 해소
- **알고리즘 흐름**:
  1. 순환에 참여하는 로봇 추출
  2. Multi-criteria 정렬로 양보 로봇 선정
  3. 양보 로봇의 간선 역전
  4. 역전 후 순환이 남아있지 않은지 재검증

### Multi-criteria Decision (다단계 우선순위 결정)

- **적용**: 5단계 기준으로 양보 로봇 선정
- **정렬 기준** (우선순위 순):
  1. `boundaryWorking` 여부 (작업 중이 아닌 로봇 우선 양보)
  2. `canSafelyYield` 여부 (안전하게 양보 가능한 로봇)
  3. `hasPriorityCommand` 여부 (우선순위 커맨드가 없는 로봇)
  4. `priorityIndex` 값 (우선순위가 낮은 로봇)
  5. `robotID` 사전순 (동점 처리)
- **학습 포인트**:
  - Lexicographic ordering (사전식 정렬)
  - 다중 기준 비교 함수 설계

---

## 3단계: Spatial Data Structures & Algorithms

> 로봇 경로를 격자 위에 "그려서" 충돌을 감지하는 방식. 컴퓨터 그래픽스의 래스터화와 동일한 원리이다.

### 2D Grid-based Occupancy Map

- **적용**: 연속 공간을 이산 격자(해상도 0.1m)로 변환하여 O(1) 충돌 판정
- **구조**:
  ```go
  type ExclusiveMap struct {
      XYResolution    float64                // 격자 셀 해상도 (0.1m)
      Envelope        geom.Envelope          // 공간 경계
      OccupiedGridMap map[int]map[int]string // [x][y] = robotID (희소 표현)
  }
  ```
- **학습 포인트**:
  - 공간 분할(Space Partitioning) 기법
  - 희소 표현(Sparse Representation) vs 밀집 표현(Dense Representation)
  - 해시맵 기반 2D 격자가 2D 배열보다 메모리 효율적인 이유

### Bresenham's Line Algorithm

- **적용**: 연속 경로(직선)를 격자 셀로 래스터화
- **핵심 코드**:
  ```go
  dx := int(math.Abs(float64(endX - startX)))
  dy := int(math.Abs(float64(endY - startY)))
  err := dx - dy
  ```
- **학습 포인트**:
  - 정수 연산만으로 직선을 그리는 원리
  - 부동소수점 연산 회피의 이점
  - 시간복잡도: O(max(dx, dy))

### Coordinate Transform (좌표 변환)

- **적용**: 실제 좌표 ↔ 격자 좌표 간 변환
- **학습 포인트**:
  - 아핀 변환 (Translation + Scaling)
  - 정변환과 역변환의 관계

### Circle Collision (원형 충돌 판정)

- **적용**: 로봇 반지름만큼 격자 점유 영역을 확장
- **학습 포인트**:
  - 원형 경계를 사각형으로 근사(Bounding Box Approximation)
  - `gridSizeOfRobot = ceil(robotSize / resolution)` 공식

---

## 4단계: Computational Geometry

### Point-in-Polygon (점 포함 판정)

- **적용**: 노드가 스케줄링 영역 안에 있는지 판정
- **학습 포인트**:
  - Ray Casting Algorithm
  - Winding Number Algorithm
  - GEOS 라이브러리의 역할 (Geometry Engine Open Source)

### Line-Polygon Intersection (직선-다각형 교차)

- **적용**: 경로와 구역 경계의 교점을 계산하여 커맨드 분할 경계점 결정
- **학습 포인트**:
  - 선분-선분 교차 판정
  - 교점 좌표 계산

### Interval Merging (구간 병합)

- **적용**: 충돌 이벤트 그룹화가 구간 병합 문제와 유사
- **알고리즘 흐름**:
  1. 구간을 시작점 기준으로 정렬 — O(n log n)
  2. 겹치는 구간을 병합 — O(n)
  3. 간격(gap) 기반으로 세그먼트 생성

---

## 5단계: Temporal Reasoning (시간 기반 판단)

> 공간뿐 아니라 **시간축**까지 고려하여 "지금 지나가도 안전한가?"를 판단한다.

### Kinematics (등속 운동 모델)

- **적용**: 로봇 도착/통과 시간 계산
- **공식**:
  ```
  arrivingTime = distance / standardSpeed
  passingTime = (totalDistance - distance) / standardSpeed
  ```
- **학습 포인트**:
  - 등속 운동의 시간-거리-속도 관계
  - 유클리드 거리 합산을 통한 경로 길이 계산

### Safety Margin (안전 여유)

- **적용**: 불확실성을 보상하는 시간 여유 계산
- **공식**:
  ```
  robotMarginTime = robotA.SpeedMarginRatio × timeA - robotB.SpeedMarginRatio × timeB
  횡단 허용 조건: robotMarginTime >= CrossingMarginSecond (1초)
  ```
- **학습 포인트**:
  - 안전 마진의 공학적 의미
  - 속도 불확실성에 대한 비율 기반 보정

### Temporal Conflict Window (시간 구간 겹침)

- **적용**: 두 로봇의 경로 점유 시간이 겹치는지 판정
- **학습 포인트**:
  - 구간 겹침 판정: `max(startA, startB) < min(endA, endB)`
  - 시공간(Spatiotemporal) 충돌 개념

---

## 6단계: Concurrency & Distributed Systems

### Error Group (병렬 팬아웃)

- **적용**: 사이트별 ADG를 병렬로 업데이트
- **패턴**:
  ```go
  errGroup := new(errgroup.Group)
  for siteID, siteRobots := range siteIDRobots {
      errGroup.Go(func() error { ... })
  }
  err := errGroup.Wait()
  ```
- **학습 포인트**:
  - Go의 goroutine과 sync 패키지
  - Fan-out / Fan-in 패턴
  - 에러 전파와 취소(context cancellation)

### Distributed Locking (분산 잠금)

- **적용**: 미션 수정 시 동시성 보호 (Redis 기반)
- **학습 포인트**:
  - 분산 환경에서의 Mutual Exclusion
  - Redis 기반 분산 락 (Redlock 알고리즘)
  - Lock with Callback 패턴

### Event-Driven Architecture

- **적용**: 우선순위 그룹 변경을 실시간으로 전파
- **학습 포인트**:
  - Pub/Sub 패턴
  - 이벤트 기반 아키텍처의 장단점
  - 느슨한 결합(Loose Coupling)

---

## 부록: 적용된 디자인 패턴

| 패턴 | 용도 |
|------|------|
| Factory/Builder | 로봇 목록으로부터 ADG 구축 |
| Strategy | 다양한 우선순위 계산 방식 교체 |
| Template Method | 재사용 가능한 경로 분할 로직 |
| Chain of Responsibility | 다단계 우선순위 비교를 통한 단계적 의사결정 |
| Observer | 이벤트 기반 상태 전파 (Pub/Sub) |
| Repository | 데이터 저장소 추상화 |

---

## 참고 자료

- **Graph Theory**: Introduction to Algorithms (CLRS) — Chapter 22-24
- **Deadlock**: Operating System Concepts (Silberschatz) — Chapter 8
- **Bresenham's Algorithm**: Computer Graphics: Principles and Practice (Foley)
- **Computational Geometry**: Computational Geometry: Algorithms and Applications (de Berg)
- **Concurrency in Go**: Concurrency in Go (Katherine Cox-Buday)
- **gonum 라이브러리**: https://pkg.go.dev/gonum.org/v1/gonum/graph
