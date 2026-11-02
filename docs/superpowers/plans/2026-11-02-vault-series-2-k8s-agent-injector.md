# HashiCorp Vault 실전 가이드 2편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `argocd-charts-sample/secret-management/`에 kind + ArgoCD 위에서 운영처럼 구성한 Vault(Raft, 수동 unseal, audit, snapshot)와 Agent Injector로 DEK를 받는 Go 앱 member-api를 만들고, 그 실행 결과로 블로그 2편 초안을 쓴다.

**Architecture:** ArgoCD Application으로 sealed-secrets와 Vault(Helm, Raft replica 1, Agent Injector 포함)를 설치하고, init/unseal/setup은 스크립트로 한다. member-api는 설정 시크릿(API 토큰)을 SealedSecret이 만든 K8s Secret에서 env로 받고, DEK는 Pod에 주입된 Vault Agent sidecar(proxy 모드, `127.0.0.1:8200`)를 거쳐 토큰 없이 로드한다. DEK 적재는 ArgoCD PreSync Job이 migration ServiceAccount로 k8s auth에 직접 로그인해서 한다. 부팅 시 동기 로드(`LOAD_MODE=sync`)와 비동기 로드(`async`)를 바꿔 가며 sealed Vault에서 생기는 부팅 블로킹을 재현한다.

**Tech Stack:** kind v0.33.0, ArgoCD(chart argo-cd 7.8.28, 기존 terraform), Vault Helm chart 0.34.1 + `hashicorp/vault:2.2.1`, vault-k8s 1.7.6(chart 기본), sealed-secrets chart 2.22.0(controller 0.41.2, kubeseal 0.41.x), Go 1.26, `github.com/hashicorp/vault/api` v1.23.0, `github.com/hashicorp/vault/api/auth/kubernetes` v0.12.0, testify v1.11.1, testcontainers-go v0.44.0

**Spec:** `docs/superpowers/specs/2026-11-02-vault-series-design.md` (§3 2편 행, §4.2~4.4, §6, §8, §9, §10, §13). 3편(VSO, migration) 범위는 포함하지 않는다.

**Spec 대비 변경:** spec §8은 `bootstrap/`을 app-of-apps로 적었다. member-api의 PreSync Job은 `vault-setup`이 끝난 뒤에만 성공하므로, app-of-apps로 동시에 sync하면 첫 sync가 실패한다. 그래서 Application을 개별 파일로 두고 Makefile이 순서대로 적용한다(`bootstrap` → init/unseal/setup → `app-deploy`).

## Global Constraints

- 위치: `argocd-charts-sample/secret-management/` 독립 디렉터리. 기존 `chart/`, `bootstrap/`, `app/`은 건드리지 않는다
- argocd-charts-sample 브랜치: `main`에서 `feat/vault-agent-injector`. 커밋 메시지는 저장소 관례 `[#vault] <type>: <한국어 설명>`, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- blog-v2 브랜치: `feat/vault-series-2`(이미 있음). 커밋 `docs: ...`, 같은 Co-Authored-By
- **kube context**: 모든 kubectl/helm/kubeseal 호출에 `--context kind-argo-cluster`(helm은 `--kube-context`)를 붙인다. `scripts/lib.sh`의 `require_context`가 그 context가 없으면 exit 1 한다. 이 Mac의 기본 context는 회사 클러스터다
- 버전: Vault chart `0.34.1`(repo `https://helm.releases.hashicorp.com`), Vault server·agent 이미지 `hashicorp/vault:2.2.1`(1편과 맞춤. chart가 테스트한 버전은 2.0.4까지이므로 Task 1에서 기동을 확인하고, 문제가 있으면 2.0.4로 내리고 ledger에 Ruling), sealed-secrets chart `2.22.0`(repo `https://bitnami.github.io/sealed-secrets`), 베이스 이미지 `golang:1.26-alpine3.24` / `alpine:3.24`, 앱 이미지 `member-api:0.1.0`(`latest` 금지: kind에서 pull policy가 Always가 된다)
- namespace: `vault`(Vault, injector), `kube-system`(sealed-secrets, `fullnameOverride: sealed-secrets-controller`: kubeseal 기본값과 맞춤), `member-api`(앱)
- Vault 이름(1편과 같음): KEK `member-api-kek`, KV v2 mount `secret`, 경로 `member-api/dek`, 필드 `current_version`/`wrapped_v<N>`, policy `member-api`·`member-api-migration`(1편 HCL을 그대로 복사)
- k8s auth: mount `kubernetes`, `kubernetes_host=https://kubernetes.default.svc`. role `member-api`(SA `member-api`, ns `member-api`, policy `member-api`, `token_ttl=1h`), role `member-api-migration`(SA `member-api-migration`, ns `member-api`, policy `member-api-migration`, `token_ttl=10m`). `token_policies`·`token_ttl` 필드를 쓴다(`policies`·`ttl`은 deprecated)
- Agent Injector annotation(member-api Deployment): `agent-inject: "true"`, `role: "member-api"`, `agent-pre-populate: "false"`, `agent-cache-enable: "true"`, `agent-cache-use-auto-auth-token: "true"`(문서와 소스의 기본값이 달라 명시), `auth-max-backoff: "10s"`(기본 5m이면 unseal 뒤 최대 5분 대기), `agent-image: "hashicorp/vault:2.2.1"`. 앱 env `VAULT_ADDR=http://127.0.0.1:8200`(injector가 넣어 주지 않는다)
- init 출력: `vault operator init -key-shares=3 -key-threshold=2 -format=json` → `secret-management/.vault/init.json`(gitignore, chmod 600). 필드 `unseal_keys_b64`, `root_token`
- 사설 정보: 회사 저장소명·도메인·키/경로/role 이름·사람 이름·PR 번호를 코드·주석·README·글·커밋·PR에 쓰지 않는다. 장애 사례는 "sidecar proxy 구성에서 생길 수 있는 부팅 블로킹"으로 일반화한다. PR 전에 `grep -rnF -f /Users/user/src/workspace_blogv2/.vault-series-private-terms.txt <대상>`이 아무것도 출력하지 않아야 한다
- 블로그 글: spec §9 작성 방침, 명령 출력은 이 계획을 실행하며 얻은 것만(run-log에 기록), 사실은 공식 문서로 확인한 것만
- PR은 만들기만 하고 머지하지 않는다. 리뷰어 지정 금지. `gh pr create` + HEREDOC

## Review Focus

1. Vault가 sealed인 상태에서 앱이 뜨는 경우(`LOAD_MODE=async`) → Pod는 Running, `/readyz`는 503, `/members` 요청은 503 JSON이어야 한다. 500이나 패닉이면 안 되고, unseal 뒤 `auth-max-backoff`(10s) + 앱 재시도 간격 안에 Ready가 되어야 한다 → Task 4 `TestServer_*BeforeReady`, Task 7 시나리오
2. Agent sidecar가 auto-auth를 끝내기 전에 들어온 요청(토큰 없이 Vault로 전달되어 403/503) → 로더가 이를 재시도 대상으로 다뤄야 한다. 한 번 실패로 영구 실패 상태가 되면 안 된다 → Task 4 `TestServer_LoadAsyncRetriesUntilSuccess`
3. PreSync Job이 sync마다 다시 도는 경우 → DEK를 덮어쓰지 않고 건너뛰어야 한다 → Task 3 `TestInitDEK_Idempotent`, Task 6 두 번째 sync 확인
4. `make vault-init`을 두 번 실행하는 경우 → 기존 `.vault/init.json`(unseal key)을 덮어쓰면 복구 불가 → 이미 초기화돼 있으면 아무것도 쓰지 않고 종료해야 한다 → Task 1 Step 6
5. 다른 kube context(회사 클러스터)가 기본으로 잡힌 상태에서 스크립트 실행 → 모든 명령이 `kind-argo-cluster`로만 가야 하고, 그 context가 없으면 아무것도 하지 않고 실패해야 한다 → Task 1 Step 7

---

### Task 1: 골격, context 가드, sealed-secrets·Vault 설치, init/unseal

**Files:**
- Create: `secret-management/Makefile`, `secret-management/.gitignore`(`.vault/`, `.env`), `secret-management/scripts/lib.sh`, `scripts/vault-init.sh`, `scripts/vault-unseal.sh`, `scripts/vault-status.sh`
- Create: `secret-management/bootstrap/sealed-secrets.yaml`, `secret-management/bootstrap/vault.yaml` (ArgoCD Application, Helm repo source + `helm.valuesObject`)

**Interfaces:**
- Produces: `lib.sh`의 `KCTX=${KCTX:-kind-argo-cluster}`, `require_context`, `k`(kubectl --context "$KCTX"), `vault_exec`(`k -n vault exec -i vault-0 -- env VAULT_TOKEN="${VAULT_TOKEN:-}" vault "$@"`. Pod 안의 `VAULT_ADDR`는 chart가 설정한다), `root_token`(init.json에서 jq). Makefile 타깃 `cluster`(`$(MAKE) -C ../terraform all`), `bootstrap`, `vault-init`, `vault-unseal`, `vault-status`

- [ ] **Step 1: 브랜치** — `cd argocd-charts-sample && git checkout main && git pull origin main && git checkout -b feat/vault-agent-injector`
- [ ] **Step 2: `lib.sh`와 Makefile 작성** — 모든 스크립트가 `set -euo pipefail` 후 `source "$(dirname "$0")/lib.sh"; require_context`로 시작한다. `require_context`는 `kubectl config get-contexts -o name | grep -qx "$KCTX"`가 실패하면 stderr에 이유를 쓰고 exit 1
- [ ] **Step 3: Application 작성** — vault values: `server.ha.enabled: true`, `server.ha.replicas: 1`, `server.ha.raft.enabled: true`(chart의 raft 경로. replica 1이라 단일 노드), `server.image.tag: 2.2.1`, `injector.agentImage.tag: 2.2.1`, `server.dataStorage.size: 1Gi`. sealed-secrets values: `fullnameOverride: sealed-secrets-controller`, destination ns `kube-system`. 둘 다 `syncPolicy.automated`, `syncOptions: [CreateNamespace=true]`
- [ ] **Step 4: 클러스터와 설치 확인**

```bash
cd secret-management && make cluster && make bootstrap
kubectl --context kind-argo-cluster -n vault get pod vault-0 pvc
kubectl --context kind-argo-cluster -n kube-system get deploy sealed-secrets-controller
```

Expected: `vault-0`가 `0/1 Running`(초기화 전 readiness 실패), PVC `data-vault-0` Bound, sealed-secrets-controller Available

- [ ] **Step 5: `vault-init.sh`, `vault-unseal.sh` 작성과 확인** — init은 `vault status -format=json`의 `initialized`가 true면 "already initialized"를 출력하고 exit 0(파일을 쓰지 않는다). unseal은 `sealed`가 false면 건너뛰고, 아니면 `unseal_keys_b64`의 앞 2개로 unseal

```bash
make vault-init && make vault-unseal && make vault-status
kubectl --context kind-argo-cluster -n vault delete pod vault-0 && sleep 20 && make vault-status
make vault-unseal && make vault-status
```

Expected: 첫 status `Initialized true / Sealed false`, Pod 삭제 후 `Initialized true / Sealed true`(Raft 데이터가 PVC에 남았다), 다시 unseal 후 `Sealed false`, `vault-0 1/1`

- [ ] **Step 6: init 재실행 안전성** — `cp .vault/init.json /tmp/x && make vault-init && cmp .vault/init.json /tmp/x` → "already initialized", cmp 차이 없음
- [ ] **Step 7: context 가드** — `KCTX=no-such-context ./scripts/vault-status.sh; echo $?` → 이유 출력 후 1, kubectl 호출 없음(`vault-status`는 Makefile이 `lib.sh` 경유로 부르는 스크립트로 둔다)
- [ ] **Step 8: Commit** — `[#vault] feat: secret-management 골격과 Vault·sealed-secrets 설치, init/unseal 스크립트 추가`

---

### Task 2: `vault-setup.sh` (engine, KEK, policy, k8s auth, audit)

**Files:**
- Create: `secret-management/vault/policies/member-api.hcl`, `member-api-migration.hcl` (1편 `tutorials-go/cloud/vault/policies/`와 같은 내용)
- Create: `secret-management/scripts/vault-setup.sh`, Makefile 타깃 `vault-setup`

**Interfaces:**
- Consumes: Task 1 `lib.sh`(`vault_exec`, `root_token`)
- Produces: Vault 안의 `secret/`(kv-v2), `transit/`, KEK, policy 2개, `auth/kubernetes` + role 2개, file audit(stdout). Task 6의 Pod와 Job이 role 이름으로 로그인한다

- [ ] **Step 1: 스크립트 작성** — 순서: kv-v2 `secret/`(없을 때만), `transit/`(없을 때만), `write -f transit/keys/member-api-kek`, policy 2개(`policy write <name> - < file`), `auth enable kubernetes`(없을 때만), `write auth/kubernetes/config kubernetes_host=https://kubernetes.default.svc`, role 2개(Global Constraints 값), `audit enable file file_path=stdout`(없을 때만). 존재 확인은 `-format=json` 출력을 변수에 담아 `jq -e`로 한다(`pipefail` + `grep -q` SIGPIPE 회피)
- [ ] **Step 2: 실행과 재실행** — `make vault-setup && make vault-setup` → 두 번 모두 exit 0
- [ ] **Step 3: k8s auth 로그인 확인**

```bash
kubectl --context kind-argo-cluster create namespace member-api --dry-run=client -o yaml | kubectl --context kind-argo-cluster apply -f -
kubectl --context kind-argo-cluster -n member-api create serviceaccount member-api
kubectl --context kind-argo-cluster -n member-api create serviceaccount other
JWT=$(kubectl --context kind-argo-cluster -n member-api create token member-api)
kubectl --context kind-argo-cluster -n vault exec -i vault-0 -- vault write auth/kubernetes/login role=member-api jwt="$JWT"
JWT=$(kubectl --context kind-argo-cluster -n member-api create token other)
kubectl --context kind-argo-cluster -n vault exec -i vault-0 -- vault write auth/kubernetes/login role=member-api jwt="$JWT"
kubectl --context kind-argo-cluster -n member-api delete serviceaccount other
```

Expected: 첫 로그인은 `token_policies [default member-api]`가 포함된 출력, 두 번째는 `service account name not authorized`류 403. audience 경고가 나오면 출력 그대로 run-log에 남긴다(Task 7, 글에서 언급). `member-api` SA는 Task 6 chart가 관리하므로 지우고(`delete serviceaccount member-api`) 다음으로 간다

- [ ] **Step 4: audit 확인** — `kubectl --context kind-argo-cluster -n vault logs vault-0 | grep -c '"type":"request"'` → 1 이상
- [ ] **Step 5: Commit** — `[#vault] feat: vault-setup 스크립트로 KV·Transit·policy·k8s auth·audit 구성`

---

### Task 3: member-api의 `envelope`, `member` 패키지

**Files:**
- Create: `secret-management/app/member-api/go.mod` (`module github.com/kenshin579/argocd-charts-sample/secret-management/app/member-api`, `go 1.26.0`)
- Create: `app/member-api/envelope/keyring.go`, `keyring_test.go`, `vault.go`, `vault_integration_test.go`
- Create: `app/member-api/member/repository.go`, `repository_test.go`

**Interfaces:**
- Produces(1편과 같은 시그니처, 필요한 것만):
  - `envelope.NewKeyring(current uint8, keys map[uint8][]byte) (*Keyring, error)`, `(*Keyring).Current/Encrypt/Decrypt`, `VersionOf`
  - `envelope.Config{KEKName, KVMount, KVPath}`, `envelope.DefaultConfig`
  - `envelope.InitDEK(ctx, c *vaultapi.Client, cfg Config) (bool, error)`: 문서가 있으면 false. 삭제된 문서면 `ErrDEKDeleted`. 없으면 datakey 발급 후 `cas=0`으로 v1 저장(CAS 충돌은 다른 Job이 먼저 만든 것으로 보고 false, nil)
  - `envelope.LoadKeyring(ctx, c *vaultapi.Client, cfg Config) (*Keyring, error)`, `ErrDEKNotInitialized`, `ErrDEKDeleted`
  - `member.NewRepository(path string, k *envelope.Keyring) *Repository`, `Put(Member) error`, `Get(id string) (Member, error)`, `ErrNotFound`. 재암호화는 넣지 않는다(2편 범위 밖)

- [ ] **Step 1: 테스트 작성** — 1편에서 같은 이름의 테스트를 가져온다: `TestKeyring_EncryptDecrypt_RoundTrip`, `TestKeyring_DecryptUnknownVersion`, `TestKeyring_DecryptTampered`, `TestNewKeyring_Invalid`, `TestRepository_PutGet_RoundTrip`, `TestRepository_FileHasNoPlaintext`, `TestRepository_GetMissingFile`. 통합(testcontainers, `hashicorp/vault:2.2.1`, `-short`에서 skip): `TestInitDEK_Idempotent`, `TestInitDEK_ConcurrentCreatesOnce`(goroutine 2개가 동시에 InitDEK → created는 정확히 한 번 true, KV `current_version == "1"`), `TestLoadKeyring_NotInitialized`, `TestLoadKeyring_RoundTrip`
- [ ] **Step 2: 실패 확인** — `cd app/member-api && go test ./...` → FAIL(undefined)
- [ ] **Step 3: 구현** — 1편 코드를 참고해 다시 작성한다. 저장소 간 의존성을 만들지 않는다(spec §8). GoDoc 주석, gofmt
- [ ] **Step 4: 통과 확인** — `go vet ./... && go test -count=1 ./...` → PASS
- [ ] **Step 5: Commit** — `[#vault] feat: member-api의 keyring·DEK 로드·회원 저장소 구현`

---

### Task 4: `server` 패키지 (HTTP, readiness, 동기/비동기 로드)

**Files:**
- Create: `app/member-api/server/server.go`, `server/server_test.go`

**Interfaces:**
- Consumes: Task 3 `*envelope.Keyring`, `member.NewRepository`
- Produces:
  - `type Loader func(ctx context.Context) (*envelope.Keyring, error)`
  - `type Retry struct { Initial, Max time.Duration }`(실패할 때마다 2배, Max에서 멈춤)
  - `func New(dataPath, apiToken string) *Server`
  - `func (s *Server) LoadSync(ctx context.Context, load Loader, r Retry) error`: 성공할 때까지 재시도하고 반환. ctx가 끝나면 ctx 에러
  - `func (s *Server) LoadAsync(ctx context.Context, load Loader, r Retry)`: goroutine으로 `LoadSync`
  - `func (s *Server) Ready() bool`
  - `func (s *Server) Handler() http.Handler`: `GET /healthz`(항상 200 `ok`), `GET /readyz`(로드 전 503, 후 200), `POST /members`(JSON `{"id","email","phone"}` → 201), `GET /members/{id}`(200 JSON / 404), `GET /config`(`{"api_token":"<앞 2글자>****","length":N}`). 로드 전 `/members*`는 503 `{"error":"keyring not loaded"}`
  - 로드된 Repository는 `atomic.Pointer[member.Repository]`로 교체한다. 실패한 로드마다 `slog.Warn`으로 시도 횟수와 에러를 남긴다

- [ ] **Step 1: 테스트 작성** (`httptest`, 실제 `envelope.Keyring`, `t.TempDir()`)
  - `TestServer_ReadyzBeforeLoad`: 503
  - `TestServer_MembersBeforeReady`: POST·GET 모두 503, body `{"error":"keyring not loaded"}`
  - `TestServer_LoadAsyncRetriesUntilSuccess`: 로더가 2번 에러(403을 흉내 낸 에러) 후 성공, `Retry{1ms, 5ms}` → `Eventually`로 `/readyz` 200, 호출 횟수 3
  - `TestServer_LoadSyncStopsOnContextCancel`: 항상 실패하는 로더 + 50ms timeout ctx → `errors.Is(err, context.DeadlineExceeded)`
  - `TestServer_MembersRoundTrip`: 로드 후 POST → GET이 원문, 데이터 파일에 이메일 평문 없음
  - `TestServer_GetUnknownMember`: 404
  - `TestServer_HealthzAlwaysOK`: 로드 전에도 200
  - `TestServer_ConfigMasksToken`: `apiToken="demo-api-token-v1"` → `{"api_token":"de****","length":17}`
- [ ] **Step 2: 실패 확인** — `go test ./server/` → FAIL
- [ ] **Step 3: 구현** — 라우팅은 Go 1.22+ `http.ServeMux` 패턴(`GET /members/{id}`)
- [ ] **Step 4: 통과 확인** — `go test -count=1 ./...` → PASS
- [ ] **Step 5: Commit** — `[#vault] feat: member-api HTTP 서버와 동기·비동기 keyring 로드 구현`

---

### Task 5: `cmd/member-api`(serve, init-dek)와 이미지

**Files:**
- Create: `app/member-api/cmd/member-api/main.go`, `app/member-api/Dockerfile`, Makefile 타깃 `app-image`

**Interfaces:**
- Consumes: Task 3 `envelope.InitDEK`/`LoadKeyring`/`DefaultConfig`, Task 4 `server`
- Produces: 이미지 `member-api:0.1.0`, 명령 `member-api serve`(기본), `member-api init-dek`
  - `serve` env: `PORT`(기본 8080), `DATA_PATH`(기본 `/data/members.json`), `API_TOKEN`, `LOAD_MODE`(`sync`|`async`, 기본 `async`), `VAULT_ADDR`. Vault token 없이 client를 만든다(Agent proxy가 붙인다). `sync`면 `LoadSync`가 끝난 뒤 HTTP를 시작하고, `async`면 HTTP를 먼저 시작하고 `LoadAsync`. `Retry{1s, 10s}`
  - `init-dek` env: `VAULT_ADDR`(예 `http://vault.vault.svc:8200`), `VAULT_ROLE`(기본 `member-api-migration`). `auth/kubernetes`로 SA token(`/var/run/secrets/kubernetes.io/serviceaccount/token`, `kubernetes.NewKubernetesAuth`) 로그인 후 `InitDEK`. 결과를 `DEK v1 created` / `DEK already exists, skipped`로 출력. 에러는 stderr 한 줄 + exit 1

- [ ] **Step 1: main.go 작성** — `go get github.com/hashicorp/vault/api/auth/kubernetes@v0.12.0`
- [ ] **Step 2: Dockerfile** — `golang:1.26-alpine3.24`에서 `CGO_ENABLED=0 go build`, 실행 단계 `alpine:3.24`, 비root 사용자(UID 10001), `ENTRYPOINT ["/app/member-api"]`, `CMD ["serve"]`
- [ ] **Step 3: 빌드와 로드** — `make app-image` = `docker build -t member-api:0.1.0 app/member-api && kind load docker-image member-api:0.1.0 --name argo-cluster`
- [ ] **Step 4: 확인** — `go vet ./... && go test -short ./...` PASS, `docker run --rm member-api:0.1.0 init-dek; echo $?` → SA token 파일이 없다는 한 줄 에러, exit 1
- [ ] **Step 5: Commit** — `[#vault] feat: member-api 실행 명령(serve, init-dek)과 Dockerfile 추가`

---

### Task 6: Helm chart, SealedSecret, 배포

**Files:**
- Create: `secret-management/charts/member-api/{Chart.yaml,values.yaml}`, `templates/{serviceaccounts.yaml,pvc.yaml,deployment.yaml,service.yaml,presync-init-dek.yaml,sealedsecret.yaml}`
- Create: `secret-management/bootstrap/member-api.yaml`(Application, git source `secret-management/charts/member-api`, `targetRevision: HEAD`)
- Create: `secret-management/scripts/seal.sh`, Makefile 타깃 `seal`, `app-deploy`(`REVISION ?= HEAD`, `sed`로 targetRevision을 바꿔 `kubectl apply`), `app-port-forward`(`kubectl port-forward -n member-api svc/member-api 8081:80`, Service port 80 → container 8080), `load-mode`(`MODE=sync|async`, Application에 `spec.source.helm.parameters: [{name: loadMode, value: $(MODE)}]`를 `kubectl patch --type merge`로 넣는다. git push 없이 바뀌고 selfHeal과 충돌하지 않는다)

**Interfaces:**
- Consumes: Task 2 role 이름, Task 5 이미지와 명령
- Produces:
  - values: `image.repository: member-api`, `image.tag: 0.1.0`, `image.pullPolicy: IfNotPresent`, `loadMode: async`, `secretSource: sealed`, `vault.agentImage: hashicorp/vault:2.2.1`, `vault.authMaxBackoff: 10s`, `vault.serviceAddr: http://vault.vault.svc:8200`
  - Deployment: `strategy: Recreate`(RWO PVC), Global Constraints의 annotation, env `VAULT_ADDR=http://127.0.0.1:8200`, `LOAD_MODE`, `API_TOKEN`(Secret `member-api-config` key `api-token`), PVC `/data` 마운트. livenessProbe `GET /healthz`(period 5s, failureThreshold 3), readinessProbe `GET /readyz`(period 5s)
  - PreSync Job: annotation `argocd.argoproj.io/hook: PreSync`, `hook-delete-policy: BeforeHookCreation`, SA `member-api-migration`, `args: ["init-dek"]`, `VAULT_ADDR` = `vault.serviceAddr`, `backoffLimit: 2`. **Agent를 주입하지 않는다**(Job은 코드에서 k8s auth로 직접 로그인)
  - `sealedsecret.yaml`: `{{- if eq .Values.secretSource "sealed" }}` … `{{- end }}`로 감싼 kubeseal 출력. Secret 이름 `member-api-config`, ns `member-api`
  - `seal.sh`: `API_TOKEN`(기본 `demo-api-token-v1`, `.env`가 있으면 읽음)으로 `kubectl create secret generic --dry-run=client -o yaml | kubeseal --context kind-argo-cluster --format yaml`을 돌려 위 템플릿을 다시 쓴다

- [ ] **Step 1: chart와 스크립트 작성**, `helm lint charts/member-api` → 0 failures, `helm template charts/member-api | grep -c 'vault.hashicorp.com/agent-inject: "true"'` → 1
- [ ] **Step 2: 봉인과 push** — `make seal` → `git add -A && git commit`(이 단계 커밋 메시지 `[#vault] feat: member-api chart와 SealedSecret 추가`) → `git push -u origin feat/vault-agent-injector`(ArgoCD가 GitHub에서 pull하므로 필요하다. PR은 만들지 않는다)
- [ ] **Step 3: 배포** — `make app-image && make app-deploy REVISION=feat/vault-agent-injector`

Expected(각각 확인해 run-log에 기록):
- `kubectl --context kind-argo-cluster -n member-api get jobs` → PreSync Job `Complete`, 로그 `DEK v1 created`
- `get pod` → member-api `2/2 Running`(app + vault-agent), init container 없음
- `make app-port-forward` 뒤 `curl -s localhost:8081/readyz` → 200, `POST /members` → 201, `GET /members/alice` → 원문, `GET /config` → `{"api_token":"de****","length":17}`
- `kubectl ... exec deploy/member-api -c member-api -- cat /data/members.json` → 암호문만

- [ ] **Step 4: PreSync 재실행** — `argocd app sync member-api --core --kube-context kind-argo-cluster` → Job 로그 `DEK already exists, skipped`, KV `current_version` 그대로 `"1"`
- [ ] **Step 5: Commit**(바뀐 것이 있으면) — `[#vault] fix: ...`

---

### Task 7: 시나리오 실행, README, PR

**Files:**
- Create: `secret-management/README.md`, `secret-management/scripts/snapshot.sh`, Makefile 타깃 `snapshot-save`, `snapshot-restore`

**Interfaces:**
- Consumes: Task 1~6 전부
- Produces: README의 실제 출력, run-log(`<plan workspace>/run-log.md`, 토큰·unseal key는 `****`로 가림)

- [ ] **Step 1: 부팅 블로킹 재현(sync)** — `vault operator seal`(root token) → `make load-mode MODE=sync`(Task 6 타깃) → Pod가 새로 뜬 뒤 1~2분 관찰

Expected: app 컨테이너 restart 증가, `CrashLoopBackOff`, `describe pod`에 `Liveness probe failed`, agent 로그에 auto-auth 재시도(503/sealed)

- [ ] **Step 2: 해결(async)** — `make load-mode MODE=async`(Vault는 계속 sealed) → Pod `1/2`(app NotReady), `/readyz` 503, `/members` 503 → `make vault-unseal` → 10~30초 안에 `/readyz` 200, 앱 로그에 재시도 경고와 로드 완료
- [ ] **Step 3: Vault 재시작과 키 보존** — 데이터가 있는 상태에서 `delete pod vault-0` → sealed → unseal → `delete pod -l app=member-api` → `GET /members/alice`가 원문(같은 KEK, 같은 DEK)
- [ ] **Step 4: snapshot** — `snapshot.sh save`(root token으로 `vault operator raft snapshot save /tmp/vault.snap` 후 `kubectl cp`로 `.vault/snapshots/`) → KV에 임시 값 기록 → `snapshot.sh restore` → 임시 값이 사라졌는지 확인(복원 후 `vault status`가 unsealed인지, sealed면 unseal). 복원 완료 로그 `post-unseal setup complete` 확인
- [ ] **Step 5: README 작성** — 구성도(Mermaid), 사전 준비(Docker, kind, kubectl, helm, kubeseal, jq, argocd CLI), `make` 순서, Step 1~4의 실제 출력, 정리(`make -C ../terraform kind-delete`), "다루지 않는 것"(HA, auto-unseal, TLS, VSO는 3편)
- [ ] **Step 6: 비공개 점검** — `grep -rnF -f /Users/user/src/workspace_blogv2/.vault-series-private-terms.txt secret-management; echo $?` → 출력 없음, 1
- [ ] **Step 7: Commit** — `[#vault] docs: secret-management README와 snapshot 스크립트 추가`. PR은 최종 리뷰 뒤에 만든다(1편과 같은 이유)

---

### Task 8: 블로그 2편 초안

**Files:**
- Create: `blog-v2.advenoh.pe.kr/docs/start/hashicorp-vault-실전-가이드-2-kubernetes-agent-injector/index.md`

- [ ] **Step 1: 사실 확인** — 본문에 쓸 동작(Helm raft 모드, readinessProbe와 sealed, k8s auth 흐름과 TokenReview, injector의 init/sidecar, cache·auto-auth token, auto-auth backoff 기본값, audit file stdout, raft snapshot restore 주의)을 공식 문서로 대조하고 URL을 모은다
- [ ] **Step 2: 초안 작성** — frontmatter `title: "HashiCorp Vault 실전 가이드 2편 - Kubernetes에 Vault 구성하고 Agent Injector로 암호화 키 전달하기"`, `series: "HashiCorp Vault 실전 가이드"`, `seriesOrder: 2`, description 한 문장. 목차는 spec §6.1. 들어가며에 use case(spec §3 2편 행), 1편 링크(`/hashicorp-vault-실전-가이드-1-핵심-개념과-transit-envelope-encryption/`). Mermaid 최소 3개(전체 구성, k8s auth 로그인 sequence, 부팅 블로킹 timeline 또는 sequence). 출력은 run-log에서만 가져온다. FAQ 3~5개
- [ ] **Step 3: 구조 점검** — heading 번호, 마지막 H1 `FAQ`/`마무리`/`참고`, 존댓말 없음, 목록 끝 마침표 없음, FAQ 어미 `~나?/~는가?/~인가?`, `<br` 없음
- [ ] **Step 4: Commit** — `docs: HashiCorp Vault 실전 가이드 2편 초안 추가`

---

### Task 9: fluent-korean revise, 렌더 확인, 최종 리뷰 뒤 PR

- [ ] **Step 1: 지침 전문 읽기** — `/Users/user/.claude/plugins/cache/fluent-korean/fluent-korean/1.0.0/output-styles/fluent-korean-not-coding.md`
- [ ] **Step 2: revise** — `~다`체 유지, 코드·출력·frontmatter 제외, 사실 변경 금지
- [ ] **Step 3: 렌더 확인** — 초안을 `contents/cloud/vault-preview-tmp/index.md`로 복사 → `npm run generate:manifest` → `npx next dev -p 3000` → chrome-devtools로 `article svg[aria-roledescription]` 개수 = Mermaid 블록 수, 구문 오류 0 → 임시 폴더 삭제, `git restore next-env.d.ts`, manifest 재생성
- [ ] **Step 4: 최종 점검과 Commit** — UTF-8, 사내 식별자 grep exit 1 → `docs: Vault 2편 초안 문장을 fluent-korean 지침으로 다듬기`
- [ ] **Step 5: 최종 whole-branch 리뷰 후 PR** — 두 저장소(argocd-charts-sample `feat/vault-agent-injector`, blog-v2 `feat/vault-series-2`) PR 생성, URL 보고
