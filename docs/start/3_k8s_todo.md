# Kubernetes Pod 디자인 패턴 블로그 시리즈 - TODO

## Phase 1: 공통 기반 준비

- [x] `tutorials-go/kubernetes/pod-design-patterns/` 디렉토리 생성
- [x] Kind 클러스터 설정 파일 작성 (`kind-config.yaml`)
- [x] 공통 메인 Go 웹 서버 작성 (`common/main-app/main.go`, `Dockerfile`)
- [x] Makefile 작성 (빌드/로드/클러스터 관리)
- [x] Kind 클러스터 생성 및 메인 앱 이미지 빌드/로드 검증

## Phase 2: 1편 샘플 코드 작성 및 검증

### Sidecar 패턴
- [x] Go Request Logger Sidecar 작성 (`sidecar/request-logger/main.go`, `Dockerfile`)
- [x] Sidecar Pod manifest 작성 (`sidecar/sidecar-pod.yaml`)
- [x] Kind에서 배포 및 동작 검증 (프록시 요청 → 로그 파일 확인)

### Ambassador 패턴
- [x] Go Redis Proxy 작성 (`ambassador/redis-proxy/main.go`, `Dockerfile`)
- [x] Redis Deployment + Service manifest 작성 (`ambassador/redis-deployment.yaml`)
- [x] Ambassador Pod manifest 작성 (`ambassador/ambassador-pod.yaml`)
- [x] Kind에서 배포 및 동작 검증 (localhost:6379 → 외부 Redis 접근 확인)

### Adapter 패턴
- [x] Go Metrics Adapter 작성 (`adapter/metrics-adapter/main.go`, `Dockerfile`)
- [x] Adapter Pod manifest 작성 (`adapter/adapter-pod.yaml`)
- [x] Kind에서 배포 및 동작 검증 (curl /metrics → Prometheus 형식 확인)

## Phase 3: 1편 블로그 작성

- [x] `docs/start/k8s-pod-디자인-패턴-1-sidecar-ambassador-adapter/index.md` 생성
- [x] 섹션 1: 실습 환경 준비 (Kind 클러스터 생성, 이미지 빌드/로드)
- [x] 섹션 2: Multi-Container Pod 개념 + 3가지 패턴 개요 Mermaid 다이어그램
- [x] 섹션 3: Sidecar 패턴 (개념 + 사례 + Go Request Logger 실전 예제)
- [x] 섹션 4: Ambassador 패턴 (개념 + 사례 + Redis Ambassador 실전 예제)
- [x] 섹션 5: Adapter 패턴 (개념 + 사례 + Prometheus Exporter 실전 예제)
- [x] 섹션 6: 패턴 비교 표 + 의사결정 플로우차트 Mermaid 다이어그램
- [x] 섹션 7: 정리 + 다음 편 예고
- [x] 인코딩 확인 (`file -I`)
- [ ] tutorials-go PR 생성 (샘플 코드)
- [ ] blog-v2 PR 생성 (블로그 글)

## Phase 4: 2편 샘플 코드 작성 및 검증

- [ ] Init Container 체이닝 manifest 작성 (`init-container/init-chain-pod.yaml`)
- [ ] Init + Sidecar 조합 manifest 작성 (`init-container/init-sidecar-combo-pod.yaml`)
- [ ] Kind에서 배포 및 동작 검증 (kubectl get pod -w로 init 상태 변화 관찰)
- [ ] 실패 시 동작 확인 (의도적 실패 → 재시작 동작 관찰)

## Phase 5: 2편 블로그 작성

- [ ] `docs/start/k8s-pod-디자인-패턴-2-init-container-완벽-가이드/index.md` 생성
- [ ] 섹션 1: Init Container 개념 + Mermaid sequence 다이어그램
- [ ] 섹션 2: Pod 라이프사이클 (실행 순서, 실패 시 동작, 리소스 관리)
- [ ] 섹션 3: 대표 사용 사례 4가지 (의존성 대기, 설정 다운로드, DB 마이그레이션, 파일 권한)
- [ ] 섹션 4: 실전 예제 - Init Container 체이닝
- [ ] 섹션 5: Init Container vs Sidecar 비교 + 조합 예제
- [ ] 섹션 6: 마무리 + 다음 편 예고
- [ ] 인코딩 확인 (`file -I`)
- [ ] tutorials-go PR 생성 (샘플 코드)
- [ ] blog-v2 PR 생성 (블로그 글)

## Phase 6: 3편 샘플 코드 작성 및 검증

- [ ] Native Sidecar Pod manifest 작성 (`native-sidecar/native-logger-pod.yaml`)
- [ ] 기존 vs Native 비교용 manifest 작성 (`native-sidecar/native-vs-legacy-pod.yaml`)
- [ ] Job + Native Sidecar manifest 작성 (`native-sidecar/job-with-sidecar.yaml`)
- [ ] Kind에서 배포 및 동작 검증 (시작/종료 순서 확인)
- [ ] Job 완료 시 Sidecar 자동 종료 확인

## Phase 7: 3편 블로그 작성

- [ ] `docs/start/k8s-pod-디자인-패턴-3-native-sidecar-kep-753/index.md` 생성
- [ ] 섹션 1: 기존 Sidecar 문제점 (종료 순서, 시작 순서, Job 문제) + Mermaid 다이어그램
- [ ] 섹션 2: Native Sidecar 개념 + YAML 문법 + Mermaid 라이프사이클 다이어그램
- [ ] 섹션 3: 기존 vs Native 비교 표 + 버전별 지원 현황
- [ ] 섹션 4: 실전 예제 3개 (Native Logger, Job + Sidecar, 기존→Native 전환)
- [ ] 섹션 5: 마이그레이션 가이드 + 호환성 체크리스트
- [ ] 섹션 6: 시리즈 전체 회고
- [ ] 인코딩 확인 (`file -I`)
- [ ] tutorials-go PR 생성 (샘플 코드)
- [ ] blog-v2 PR 생성 (블로그 글)

## Phase 8: 시리즈 마무리

- [ ] 각 편 상단 시리즈 네비게이션 링크 최종 확인
- [ ] 1편 → 2편 → 3편 상호 링크 정상 동작 확인
- [ ] `contents/cloud/`로 이동 후 Publish
