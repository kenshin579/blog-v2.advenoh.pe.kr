# 「HashiCorp Vault 실전 가이드」 시리즈(3편) 설계

- 작성일: 2026-11-02
- 브랜치: `feat/vault-series` (blog-v2). 예제 저장소(`tutorials-go`, `argocd-charts-sample`)의 브랜치는 구현 계획에서 정한다
- 원본: 회사에서 운영 중인 Vault 연동 구조(비공개). **구조만 참고해 일반화하고, 코드·이름·사례는 가져오지 않는다**

## 1. 목적

회사에서 쓰는 Vault를 스스로 이해하기 위한 스터디를 블로그 3편과 예제 코드로 남긴다.
모든 실습은 로컬(Docker, kind)에서 직접 구축해 재현한다.

이해하려는 대상은 세 가지다.

- Vault 기본기: seal/unseal, secret engine(KV v2, Transit), auth method, token, policy
- 앱 레벨 암호화: Transit KEK로 wrap한 DEK를 KV에 두고, 앱이 부팅할 때 unwrap해서 메모리에서만 쓰는 envelope encryption
- Kubernetes 연동: k8s auth, Agent Injector(sidecar proxy), Vault Secrets Operator(VSO), 그리고 Sealed Secrets와의 차이와 이전 방법

## 2. 산출물

| 편 | 제목 | 초안 경로 (`docs/start/`) | 발행 경로 | 예제 |
|---|---|---|---|---|
| 1편 | `HashiCorp Vault 실전 가이드 1편 - 핵심 개념과 Transit으로 구현하는 Envelope Encryption` | `hashicorp-vault-실전-가이드-1-핵심-개념과-transit-envelope-encryption/index.md` | `contents/cloud/` 아래 같은 slug | `tutorials-go/cloud/vault/` |
| 2편 | `HashiCorp Vault 실전 가이드 2편 - Kubernetes에 Vault 구성하고 Agent Injector로 암호화 키 전달하기` (안) | `hashicorp-vault-실전-가이드-2-kubernetes-agent-injector/index.md` | 위와 같음 | `argocd-charts-sample/secret-management/` |
| 3편 | `HashiCorp Vault 실전 가이드 3편 - VSO로 애플리케이션 시크릿 관리하고 Sealed Secrets에서 이전하기` (안) | `hashicorp-vault-실전-가이드-3-vso와-sealed-secrets-이전/index.md` | 위와 같음 | `argocd-charts-sample/secret-management/` |

| 항목 | 값 |
|---|---|
| 시리즈 | `series: "HashiCorp Vault 실전 가이드"`, `seriesOrder: 1~3` |
| 언어 | 한국어만. 영문판(`index_en.md`)은 만들지 않는다(최근 글 관례) |
| 부가물 | 슬라이드·퀴즈·이미지 없음. 도식은 Mermaid |
| 독자 | Docker와 Kubernetes 기본(Pod, ServiceAccount, Secret)을 알고, Vault는 처음이거나 써 봤지만 구조를 모르는 백엔드 개발자 |
| 문체 | `~다`체 |
| 기존 글 연결 | 기존 글 `kubernetes-환경에서-secret-안전하게-관리하기`(Sealed Secrets)로 링크한다 |

frontmatter 태그 후보(편마다 조정): `vault`, `hashicorp-vault`, `secret-management`, `transit`, `envelope-encryption`, `kubernetes`, `golang`, `vault-agent`, `vault-secrets-operator`, `sealed-secrets`, `시크릿관리`, `암호화`

## 3. 편별 use case

각 편은 `들어가며`에서 "이런 상황에서 쓴다"를 먼저 제시하고, 그 상황을 푸는 순서로 전개한다.

| 편 | use case | 다루지 않는 것 |
|---|---|---|
| 1편 | DB에 개인정보(이메일, 전화번호)를 저장할 때 필드 단위로 암호화해야 하는데, 암호화 키를 코드나 설정 파일에 두고 싶지 않다 | K8s에서 앱에 키를 전달하는 방법(2편) |
| 2편 | 1편의 상황을 K8s 위의 앱에서 한다. DEK를 K8s Secret에 두면 etcd에 평문이 남으므로 키는 앱 메모리에만 두고, Vault 토큰 관리도 앱에서 떼어 내고 싶다 | 앱 실행에 필요한 설정 시크릿(3편) |
| 3편 | 앱 실행에 필요한 설정 시크릿(DB 접속 암호, 외부 API 키, OAuth client secret)을 앱이나 외부 chart를 고치지 않고 K8s Secret으로 주입하면서, 원본은 Vault에서 중앙 관리하고 싶다. 지금은 SealedSecret으로 관리하고 있다 | - |

## 4. 시리즈 공통 설계 결정

### 4.1 DEK 방식: Transit datakey(wrapped) + KV 저장

- KEK는 Transit 키로 두고 Vault 밖으로 나오지 않는다
- DEK는 `transit/datakey/wrapped/<kek>`로 만든다. 이 API는 wrap된 DEK만 돌려주므로 평문 DEK가 발급 과정에서 노출되지 않는다
- wrap된 DEK를 KV v2에 버전별 필드로 저장한다(`current_version`, `wrapped_v<N>`)
- 앱은 부팅할 때 KV를 읽고 `transit/decrypt`로 unwrap한 뒤, AES-GCM keyring(암호화는 현재 버전, 복호화는 모든 버전)을 메모리에 만든다
- 1편에서 비교할 대안
  - KV에 평문 DEK 저장: 단순하지만 KV를 읽을 수 있으면 키를 얻는다
  - Transit encrypt/decrypt 직접 호출: 키가 앱에 오지 않지만 요청마다 Vault를 거치므로 지연이 생기고 Vault 가용성에 묶인다

### 4.2 K8s 전달 방식: 2편 Agent Injector, 3편 VSO

- HashiCorp 공식 비교 문서는 기본 권장 방식을 정하지 않는다. 고르는 기준은 "이 시크릿이 K8s Secret(etcd)에 평문으로 남아도 되는가"이다
- 남으면 안 되는 앱 암호화 키(DEK)는 Agent Injector로 전달한다. proxy 모드로 써서 앱은 토큰 없이 localhost로 Vault API를 호출한다
- 남아도 되는 설정 시크릿은 VSO로 K8s Secret에 동기화한다. 앱과 외부 chart를 고치지 않아도 된다
- CSI provider와 External Secrets Operator(ESO)는 비교 표로만 다루고 실습하지 않는다

### 4.3 Vault 배포 형태

| 편 | 형태 | 이유 |
|---|---|---|
| 1편 | Docker dev 모드 | 개념과 API에 집중한다. "재시작하면 KEK가 사라져 기존 데이터를 복호화할 수 없다"를 데모로 보여준다 |
| 2·3편 | Helm standalone 1대 + Raft(PVC) + 수동 unseal(Shamir) | 실제 운영처럼 재시작해도 키가 남고, 재시작 후 unseal이 필요하다 |

2·3편에서 운영처럼 구성하는 요소와 설명만 하는 요소:

- 구성한다: Raft 영구 스토리지, 수동 unseal, root token은 초기 설정에만 사용, file audit device, Raft snapshot 백업과 복구
- 설명만 한다: HA(Raft 3대, 샘플 kind가 control-plane 노드 1개라 의미 없음), auto-unseal(클라우드 KMS 필요), TLS(운영에서는 필수라고 명시)
- unseal key와 root token은 `vault operator init` 출력을 gitignore된 로컬 파일에 저장한다(샘플이므로 별도 비밀 저장소를 쓰지 않는다)

### 4.4 Sealed Secrets와의 관계

- VSO로 바꿔도 "클러스터 안에 평문 K8s Secret이 생긴다"는 성질은 같다. 바뀌는 것은 원본 위치(git의 암호문 → Vault), 값 변경 흐름(PR → Vault write), 감사 범위(누가 읽었는지까지), 동적 시크릿 가능 여부, 런타임 의존성(Vault가 살아 있고 unseal 상태여야 함)이다
- git 쓰기 권한이 탈취돼 공격자가 워크로드를 배포하는 경우는 Sealed Secrets와 VSO 모두 막지 못한다. 이 점을 숨기지 않고 적는다
- 결론은 "대체 관계라기보다 역할이 다르다"이다. 일반 설정 시크릿과 앱이 직접 쓰는 암호화 키를 다른 방식으로 다루는 구성을 보여준다

## 5. 1편 상세

### 5.1 목차

1. 들어가며: use case, 설정 파일·env에 시크릿을 두는 방식의 한계, Sealed Secrets와의 위치 차이 두세 문장(기존 글 링크, 자세한 비교는 3편), 시리즈 범위
2. Vault 핵심 개념
   - 2.1 아키텍처: storage backend, barrier, seal/unseal(Shamir)
   - 2.2 Secret Engine: KV v2, Transit
   - 2.3 Auth Method와 Token(TTL, k8s auth는 개요만)
   - 2.4 Policy(path 기반, capabilities)
3. 로컬 환경 구성: docker-compose로 dev 서버 실행, CLI와 UI
4. Envelope Encryption 이해하기: DEK/KEK, 세 방식 비교 표, 이 글이 4.1 방식을 고른 이유
5. Go로 구현하기
   - 5.1 KEK 생성과 DEK 발급, KV 스키마
   - 5.2 앱 부팅 시 DEK 로드(KV read → `transit/decrypt` → AES-GCM)
   - 5.3 필드 암복호화(암호문 앞에 키 버전)
   - 5.4 키 회전(DEK v2 추가 → keyring → 재암호화)
   - 5.5 policy 분리(app용과 migration용 token으로 권한 거부 확인)
6. dev 모드가 감추는 것: 재시작 시 KEK 분실 데모, 실제 운영의 init/unseal(2편 예고)
7. FAQ
8. 마무리
9. 참고

### 5.2 예제: `tutorials-go/cloud/vault/`

| 구성 | 내용 |
|---|---|
| `docker-compose.yml` | 공식 Vault 이미지, dev 모드 |
| `scripts/setup.sh` | Transit 활성화, KEK `member-api-kek` 생성, policy `member-api`(app)·`member-api-migration` 작성, policy별 token 발급. 여러 번 실행해도 결과가 같다 |
| `envelope/` 패키지 | `Keyring`(버전별 AES-GCM, 암호문 앞에 버전), `Loader`(KV read + unwrap), `Rotator`(datakey 발급 → KV에 새 버전 추가 → `current_version` 갱신) |
| `cmd/` | CLI 서브커맨드 `init-dek`, `rotate-dek`, `put`, `get`, `reencrypt`. 회원 저장소는 JSON 파일(Vault 재시작 후에도 데이터가 남아야 키 분실 데모가 된다) |
| 테스트 | `Keyring` 단위 테스트(Vault 불필요) + testcontainers-go로 띄운 Vault를 쓰는 통합 테스트(Docker 필요) |
| `README.md` | 실행 순서 |

policy 권한:

| policy | 허용 |
|---|---|
| `member-api` (앱) | `secret/data/member-api/dek` read, `transit/decrypt/member-api-kek` update |
| `member-api-migration` | `transit/datakey/wrapped/member-api-kek` update, `transit/decrypt/member-api-kek` update, `secret/data/member-api/dek` create·update·read |

앱 policy에는 DEK 발급과 KV 쓰기를 주지 않고, migration policy에는 KEK 회전(`transit/keys/*`)을 주지 않는다. KEK 관리는 인프라 담당 역할(root 또는 별도 관리자 policy)의 몫으로 둔다.

## 6. 2편 상세

### 6.1 목차

1. 들어가며: use case, 1편 복습 링크
2. K8s에서 Vault를 쓰는 방법 개관: Agent Injector, CSI, VSO, 앱 직접 호출 비교 표(공식 문서 기준). 이 편은 Agent Injector, 3편은 VSO
3. Vault를 운영처럼 배포하기: Helm standalone + Raft, init/unseal, root token 사용 원칙, audit device
4. Kubernetes auth 이해하기: SA token → TokenReview → role → policy, 인프라 역할과 앱 역할의 권한 분리
5. Agent Injector로 DEK 전달하기: 어노테이션 해설, init container와 sidecar, proxy 모드
6. 부팅 블로킹 재현과 해결: sealed 상태에서 재현, 동기 로드 + liveness → `CrashLoopBackOff`, 비동기 로드 + readiness로 해결, 그 대가(로드 전 요청은 실패)
7. Vault 재시작과 키 보존: Pod 재시작 → sealed → unseal → 같은 KEK로 기존 데이터 복호화, Raft snapshot 백업과 복구
8. FAQ
9. 마무리
10. 참고

### 6.2 실습 시나리오

1. 설정 시크릿은 SealedSecret으로 배포한 상태에서 시작한다(기존 Sealed Secrets 글 링크, 3편에서 Vault로 옮긴다고 예고)
2. Vault 배포 → `make vault-init` → `make vault-unseal` → `make vault-setup`
3. member-api 배포: PreSync Job이 migration SA로 로그인해 DEK v1을 적재하고(이미 있으면 건너뜀), 앱은 Agent proxy로 DEK를 로드해 이메일을 암호화 저장한다
4. 부팅 블로킹 재현: Vault가 sealed인 상태에서 앱을 띄워 Agent가 로그인하지 못하게 한다. `LOAD_MODE=sync`와 livenessProbe 조합이면 `CrashLoopBackOff`, `LOAD_MODE=async`와 readiness 조합이면 Pod는 살아 있고 DEK 로드 전까지 `/readyz`가 503이다. 특정 사례와 원인이 같다고 주장하지 않고 "같은 메커니즘을 결정적으로 재현한다"고 쓴다
5. Vault Pod 재시작 → sealed 동안 앱 동작 확인 → unseal → 앱 Pod 재시작 후 같은 KEK로 기존 데이터 복호화
6. Raft snapshot 저장과 복구

## 7. 3편 상세

### 7.1 목차

1. 들어가며: use case
2. VSO 동작 원리: `VaultConnection`, `VaultAuth`, `VaultStaticSecret`, `refreshAfter`, rollout restart, 시크릿이 etcd에 남는다는 점
3. VSO 설치와 첫 동기화
4. Sealed Secrets와 비교하기: 같은 점과 다른 점 표(4.4), 역할 분담 결론
5. Sealed Secrets에서 Vault로 이전하기: 값 적재 → 같은 이름의 Secret으로 동기화 → 검증 → SealedSecret 제거 → 롤백 방법
6. audit log로 "누가 읽었나" 확인하기
7. Agent Injector와 VSO, 언제 무엇을 쓰나: use case 기준 선택 표
8. FAQ
9. 마무리
10. 참고

### 7.2 실습 시나리오

1. 2편 클러스터를 이어서 쓴다. 처음부터 시작하는 독자를 위해 2편 구성을 재현하는 Makefile 타깃을 둔다
2. VSO 설치, `vso-member-api` policy와 k8s auth role 추가
3. Vault KV `secret/member-api/config`에 설정 값을 넣는다
4. chart 값 `secretSource: sealed`를 `vault`로 바꿔 sync한다. 두 경우 모두 같은 이름의 K8s Secret을 만들므로 Deployment는 바뀌지 않는다
5. 앱이 같은 값을 읽는지 확인하고 SealedSecret을 제거한다
6. Vault에서 값을 바꾸고 `refreshAfter` 뒤 Secret 갱신과 rollout restart를 확인한다
7. audit log에서 VSO와 앱의 읽기 기록을 확인한다

## 8. 예제 코드 구성: `argocd-charts-sample/secret-management/`

독립 디렉터리로 둔다. 기존 Git Generator ApplicationSet(`appset.yaml`)이 `chart/*`를 자동 탐지하므로 `chart/` 아래에 넣으면 의도치 않게 함께 배포된다. 기존 예제도 건드리지 않는다.

```
secret-management/
├── Makefile           # 모든 kubectl/helm 명령에 --context kind-argo-cluster 고정
├── README.md
├── bootstrap/         # app-of-apps: sealed-secrets, vault, vault-secrets-operator(3편), member-api
├── charts/member-api/ # Deployment(Agent Injector 어노테이션), Service, PVC, SA 2개, PreSync DEK Job, secretSource 분기
├── app/member-api/    # Go 데모 앱 (별도 go.mod, Dockerfile)
└── scripts/           # vault-init, vault-unseal, vault-setup, seal, snapshot
```

| 구성 | 내용 |
|---|---|
| sealed-secrets | upstream chart 컨트롤러. 독립 Sealed Secrets 예제를 겸한다 |
| vault | upstream chart. standalone + Raft, Agent Injector 활성화, file audit |
| vault-secrets-operator | upstream chart(3편 단계에서 추가) |
| `vault-setup.sh` | 인프라 담당 역할(root token). kv-v2·Transit 활성화, KEK 생성, policy(`member-api`, `member-api-migration`, `vso-member-api`), k8s auth role을 각 SA(`member-api`, `member-api-migration`, VSO용)에 바인딩. 여러 번 실행해도 결과가 같다 |
| member-api | 설정 시크릿(외부 API 토큰 등)은 K8s Secret의 env로 받고, DEK는 Agent proxy로 로드해 이메일을 암호화하고 PVC의 JSON 파일에 저장한다. `LOAD_MODE`(`sync`/`async`)로 로드 방식을 바꾼다 |
| `secretSource` | `sealed`면 SealedSecret, `vault`면 `VaultAuth` + `VaultStaticSecret`을 렌더링한다 |

운영 방식:

- 이미지는 로컬에서 빌드해 `kind load docker-image`로 넣는다. 기존 CI(루트 `main.go` 변경 시에만 동작)는 건드리지 않는다
- ArgoCD는 GitHub `HEAD`에서 pull하므로 개발 중에는 Application의 `targetRevision`을 feature 브랜치로 바꿔 검증한다. Makefile 변수로 바꾸고, 커밋하는 값은 `HEAD`로 둔다
- SealedSecret은 봉인한 클러스터의 키로만 풀린다. kind를 다시 만들거나 독자가 fork하면 `make seal`로 다시 봉인해 커밋해야 한다. README에 적고 3편 비교 포인트(git에 들어간 값이 클러스터 키에 묶이는가)로도 쓴다

2편 Go 앱은 1편 `envelope` 로직 중 필요한 부분을 작게 다시 작성한다. 저장소 간 의존성을 만들지 않기 위해 중복을 감수한다.

blog-v2 `CLAUDE.md`는 샘플 코드를 `../tutorials-go/`에 두라고 한다. 2·3편의 Go 앱은 예외로 `argocd-charts-sample/secret-management/app/`에 둔다. ArgoCD가 pull하는 chart·bootstrap과 같은 저장소에 있어야 독자가 fork 하나로 실습을 재현할 수 있고, `argocd-charts-sample/app/`에 앱 소스를 두는 기존 관례와도 맞기 때문이다. 1편 예제는 규칙대로 `tutorials-go`에 둔다.

## 9. 작성 방침

- `~다`체로 쓴다
- heading 번호는 `.claude/skills/content-heading-style/` 규칙(`# N.`, `## N.M`, `### N.M.K`)을 따르고, H3는 내용이 길 때만 쓴다
- 절 순서는 `들어가며` → 본문 → `FAQ` → `마무리` → `참고`. FAQ 질문은 `~나?`/`~는가?`/`~인가?`로 쓰고 `Q.` 접두를 붙이지 않는다
- 목록 끝에는 마침표를 찍지 않는다
- 다이어그램은 Mermaid로 그리고 노드 텍스트에 `<br/>`를 넣지 않는다
- 사실·수치·동작은 공식 문서나 실습에서 확인한 것만 쓴다. 명령 출력은 실제로 실행한 결과만 넣는다
- 초안을 쓴 뒤 `fluent-korean` 지침으로 revise한다
  - 기준 파일: `~/.claude/plugins/cache/fluent-korean/fluent-korean/1.0.0/output-styles/fluent-korean-not-coding.md`. 지침이 요약을 권하지 않으므로 전문을 읽고 적용한다
  - 지침 예시는 `~합니다`체지만 블로그 관례인 `~다`체는 유지한다
  - 코드, 명령, 인용에는 적용하지 않는다
- revise 뒤 heading 규칙을 다시 점검한다

## 10. 안전과 비공개 원칙

- 회사 저장소명, 도메인, 내부 URL, 키·경로·role 이름, 사람 이름, PR·이슈 번호를 글·예제·커밋·PR에 쓰지 않는다. 회사 사례는 "sidecar proxy 구성에서 생길 수 있는 부팅 블로킹"처럼 일반화한다
- PR을 내기 전에 사내 식별자를 grep으로 점검한다. 점검할 식별자 목록은 공개 저장소에 적지 않고 로컬에서만 쓴다
- 개인 운영 저장소는 참고하지도 사용하지도 않는다. K8s 실습은 `argocd-charts-sample/`에서만 한다
- 이 Mac의 kubectl 기본 context가 회사 클러스터이므로, Makefile과 스크립트의 모든 명령에 `--context kind-argo-cluster`를 붙이고 그 context가 없으면 중단한다
- unseal key와 root token 파일은 gitignore에 넣고 커밋하지 않는다

## 11. 작업 순서

1. 1편: `tutorials-go/cloud/vault/` 코드와 테스트 → 실행 결과 확보 → 초안 → fluent-korean revise → heading 점검 → PR
2. 2편: `argocd-charts-sample/secret-management/` 구성(Sealed Secrets, Vault, member-api) → 시나리오 실행과 출력 확보 → 초안 → revise → PR
3. 3편: VSO 추가와 migration 실습 → 시나리오 실행 → 초안 → revise → PR
4. 저장소마다 feature 브랜치에서 작업하고 PR을 만든다. PR은 머지하지 않고 생성 직후 URL을 보고한다

## 12. 범위 밖

- HA, auto-unseal, TLS 실습(본문 설명만)
- Transit 서명 키(JWT 서명)는 "Transit은 서명에도 쓸 수 있다" 한 줄 언급만
- CSI provider, ESO 실습(비교 표만)
- 동적 시크릿(`VaultDynamicSecret`) 실습(3편에서 개념만)
- 영문판, 슬라이드, 퀴즈
- `fluent-korean`을 스킬로 만드는 작업

## 13. 구현할 때 확인할 항목

확인되지 않은 항목은 글에 사실로 쓰지 않는다. 확인 결과에 따라 시나리오를 조정한다.

- Vault, Vault Helm chart, VSO, sealed-secrets 컨트롤러와 kubeseal, Go Vault 클라이언트의 최신 안정 버전
- Go 클라이언트로 `github.com/hashicorp/vault/api`를 쓸지, 더 권장되는 클라이언트가 있는지
- testcontainers-go Vault 모듈 사용 가능 여부
- Agent Injector에서 `agent-pre-populate: "false"`와 `agent-cache-enable: "true"` 조합이 proxy 전용 동작을 하는지, 앱이 쓸 주소와 포트
- Vault가 sealed일 때 Agent의 auto-auth 재시도 동작과 앱이 받는 에러
- Vault가 멈췄을 때 VSO가 이미 만든 Secret이 유지되는지
- Sealed Secrets가 만든 Secret의 ownerReference와 SealedSecret 삭제 시 Secret이 함께 지워지는지
- VSO가 이미 존재하는 같은 이름의 Secret을 덮어쓰는 옵션과 기본값
- VSO의 rollout restart 설정 필드명
- kind 기본 StorageClass로 Raft PVC가 동작하는지, kind 노드 1대에서 ArgoCD·Vault·VSO·sealed-secrets·member-api를 함께 띄울 자원이 충분한지
