# HashiCorp Vault 실전 가이드 3편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2편의 `argocd-charts-sample/secret-management/`에 Vault Secrets Operator(VSO)를 더해, member-api의 설정 시크릿(API 토큰)을 SealedSecret에서 Vault KV로 앱 수정 없이 이전하고, 그 실행 결과로 블로그 3편 초안을 쓴다.

**Architecture:** VSO를 ArgoCD Application으로 설치하고, member-api chart에 `secretSource: vault`일 때 `VaultConnection`·`VaultAuth`·`VaultStaticSecret`(VSS)을 렌더링한다. VSS는 Vault KV `secret/member-api/config`를 기존과 **같은 이름의 Secret `member-api-config`**로 동기화하므로 Deployment는 바뀌지 않는다. 이전은 두 단계다. ① SealedSecret을 `skip-set-owner-references`로 다시 봉인해 Secret의 소유 관계를 끊고 ② `secretSource`를 `vault`로 바꿔 VSS가 `overwrite: true`로 Secret을 넘겨받게 한다. 이후 Vault에서 값을 바꾸면 `refreshAfter` 뒤 Secret이 갱신되고 `rolloutRestartTargets`가 Deployment를 재시작한다.

**Tech Stack:** 2편 환경(kind v1.37, ArgoCD v2.14.11, Vault 2.2.1 / chart 0.34.1, sealed-secrets 0.41.2 / chart 2.22.0) + VSO chart `1.6.2`(repo `https://helm.releases.hashicorp.com`, 2026-10-21)

**Spec:** `docs/superpowers/specs/2026-11-02-vault-series-design.md` (§3 3편 행, §4.2, §4.4, §7, §8, §9, §10, §13의 VSO 항목)

## 확인된 사실 (2026-11-03 공식 문서·소스 조사, 계획의 근거)

- VSS `destination`: `create` 기본 false, `overwrite` 기본 false. `create: true` + `overwrite: false`면 VSO 소유가 아닌 기존 Secret에 "not the owner of the destination Secret" 에러. `overwrite: true`면 기존 Secret의 ownerReferences·labels·annotations를 **교체**한다(API reference: "useful when migrating to VSO from a previous secret deployment strategy")
- VSO가 붙이는 것: ownerRef `{kind: VaultStaticSecret}`, label `app.kubernetes.io/managed-by: hashicorp-vso` 등
- SealedSecret이 만든 Secret: ownerRef `{kind: SealedSecret, controller: true}`. SealedSecret을 지우면 GC로 Secret도 지워진다. `sealedsecrets.bitnami.com/skip-set-owner-references: "true"`를 **kubeseal 입력 Secret의 metadata**(→ `spec.template.metadata.annotations`)에 달면 ownerRef를 붙이지 않는다
- VSS `refreshAfter`마다 KV를 다시 읽고(+최대 10% jitter), 값의 HMAC이 바뀌었을 때만 Secret을 갱신한다. `rolloutRestartTargets`는 첫 동기화 이후 값이 바뀔 때만 대상의 `spec.template.metadata.annotations["vso.secrets.hashicorp.com/restartedAt"]`를 patch한다
- Vault가 sealed/접속 불가면 VSO는 Secret을 지우지 않는다. 이벤트 `VaultClientError`·`VaultClientConfigError`, status `SecretSynced=False` 등이 남고 backoff로 재시도한다
- `VaultAuth`의 `kubernetes.serviceAccount`는 VSS와 같은 namespace의 SA. VSO가 TokenRequest로 그 SA의 token을 받아 로그인한다. audit log의 `auth.metadata.service_account_name`·`display_name`에 그 SA가 남고, 요청 헤더 `User-Agent: vso/<버전>`도 남는다
- ArgoCD v2.14.11에는 VSS 내장 health check가 없다(App health 계산에서 빠짐). SealedSecret은 내장 health(Synced=False → Degraded)가 있다
- instant update(event)는 Vault Enterprise 전용. 이 계획은 `refreshAfter`만 쓴다

## Global Constraints

- 위치: `argocd-charts-sample/secret-management/` (2편 구조 유지). 브랜치 `main`에서 `feat/vault-secrets-operator`. 커밋 `[#vault] <type>: <한국어 설명>` + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- blog-v2 브랜치 `feat/vault-series-3`(이미 있음). 커밋 `docs: ...`, 같은 Co-Authored-By
- kube context: 모든 명령은 `--context kind-argo-cluster`(2편 `lib.sh`의 `require_context`, Makefile `check-context`). 블로그·README의 kubectl에도 모두 붙인다
- 버전: VSO chart `1.6.2`(app 1.6.2). 문서의 지원 목록은 Kubernetes 1.32~1.36이고 1.37은 v1.6.0 CHANGELOG의 테스트 목록에만 있으므로 Task 1에서 기동을 확인한다. 문제가 있으면 chart 1.6.0으로 내리고 ledger에 Ruling
- VSO namespace `vault-secrets-operator-system`. chart 값 `defaultVaultConnection.enabled: false`(연결 정보는 member-api chart의 `VaultConnection`이 가진다)
- Vault 이름: KV v2 `secret/member-api/config`, 키 `api-token`(Deployment가 읽는 Secret 키와 같다). policy `vso-member-api`(`secret/data/member-api/config` read만). k8s auth role `vso-member-api`(SA `vso-member-api`, ns `member-api`, `token_policies=vso-member-api`, `token_ttl=1h`)
- chart 리소스 이름: SA `vso-member-api`, `VaultConnection` `vault`(address `http://vault.vault.svc:8200`), `VaultAuth` `member-api`(method kubernetes, mount `kubernetes`, role `vso-member-api`, serviceAccount `vso-member-api`), `VaultStaticSecret` `member-api-config`(type kv-v2, mount `secret`, path `member-api/config`, `refreshAfter: 30s`, destination `{name: member-api-config, create: true, overwrite: true}`, `rolloutRestartTargets: [{kind: Deployment, name: member-api}]`). 모두 sync-wave `-1`
- 기본값은 2편 상태(`secretSource: sealed`)를 유지한다. 3편 전환은 `make secret-source SOURCE=vault`(Application helm parameter patch, 2편 `load-mode`와 같은 방식)로 한다. 재봉인한 SealedSecret 파일은 GitHub에서 pull하므로 commit·push가 필요하다
- 사설 정보, 블로그 작성 방침, 출력 규칙은 2편 계획과 같다(spec §9, §10. 출력은 run-log에 기록한 것만, 생략은 `...`로 표시)
- PR은 만들기만 하고 머지하지 않는다. 리뷰어 지정 금지. 최종 리뷰 뒤에 만든다

## Review Focus

1. 이전 순서를 틀리는 경우(VSO가 넘겨받기 전에 SealedSecret이 지워짐) → Secret이 GC로 사라져 그 사이 새로 뜨는 Pod가 `CreateContainerConfigError` → 재봉인 단계 뒤 Secret의 ownerReferences가 비어 있는지, 전환 뒤 Secret의 uid가 그대로인지 확인한다 → Task 3
2. 두 컨트롤러가 같은 Secret을 번갈아 덮어쓰는 경우 → 전환 뒤 SealedSecret이 prune되고, 2분 동안 Secret의 `resourceVersion`·data가 바뀌지 않아야 한다 → Task 3
3. Vault가 sealed인 동안 → Secret이 남아 있고 앱이 계속 동작하며, VSS 이벤트·status에 에러가 보여야 한다. unseal 뒤 다시 동기화된다 → Task 4
4. 값이 바뀌지 않았는데 재시작하는 경우 → `refreshAfter`가 여러 번 지나도 `restartedAt`가 바뀌지 않고, 값을 바꾼 한 번만 바뀌어야 한다 → Task 4
5. 롤백할 때 SealedSecret에 옛 값이 남아 있는 경우 → Vault에서 바꾼 값이 아니라 옛 값으로 돌아간다 → 롤백 전에 현재 값으로 다시 봉인하는 절차를 README·글에 적고 실제로 확인한다 → Task 4

---

### Task 1: VSO 설치, Vault 준비, 2편 재현 타깃

**Files:**
- Create: `secret-management/bootstrap/vault-secrets-operator.yaml` (Application, chart 1.6.2, ns `vault-secrets-operator-system`, `CreateNamespace=true`, automated)
- Create: `secret-management/vault/policies/vso-member-api.hcl`
- Modify: `secret-management/scripts/vault-setup.sh` (policy `vso-member-api`, role `vso-member-api` 추가)
- Create: `secret-management/scripts/vault-config.sh` (`API_TOKEN`(기본 `demo-api-token-v1`, `.env` 우선)을 `secret/member-api/config` `api-token`에 `kv put`)
- Modify: `secret-management/Makefile` (`bootstrap-vso`, `vault-config`, `up` 타깃)

**Interfaces:**
- Consumes: 2편 `lib.sh`(`require_context`, `k`, `vault_exec`, `root_token`)
- Produces: VSO controller와 CRD(`vaultconnections`, `vaultauths`, `vaultstaticsecrets`), Vault policy·role `vso-member-api`, KV `secret/member-api/config`. `make up` = `cluster` → `bootstrap` → vault-0 Running 대기 → `vault-init` → `vault-unseal` → `vault-setup` → `app-image` 후, 남은 단계(`seal` → commit·push → `app-deploy`)를 안내 출력

- [ ] **Step 1: 브랜치** — `git checkout main && git pull origin main && git checkout -b feat/vault-secrets-operator`
- [ ] **Step 2: 작성** — Files의 내용. `vault-config.sh`는 `kv put`이라 다시 실행하면 KV 버전이 하나 늘어난다는 점을 주석으로 적는다
- [ ] **Step 3: 설치와 확인**

```bash
make bootstrap-vso && make vault-setup && make vault-config
kubectl --context kind-argo-cluster -n vault-secrets-operator-system get pods
kubectl --context kind-argo-cluster get crd | grep secrets.hashicorp.com
```

Expected: controller Pod `Running`, CRD 목록에 `vaultauths`·`vaultconnections`·`vaultstaticsecrets`, vault-setup 2회 실행 exit 0

- [ ] **Step 4: role 확인** — 2편 Task 2 Step 3과 같은 방식(임시 SA `vso-member-api` 생성 → `create token` → `auth/kubernetes/login role=vso-member-api` → `vault kv get` 권한 확인 → SA 삭제). Expected: 로그인 `token_policies ["default" "vso-member-api"]`, `secret/member-api/config` read 성공, `secret/member-api/dek` read는 403
- [ ] **Step 5: Commit** — `[#vault] feat: VSO 설치와 Vault 설정 시크릿 준비`

---

### Task 2: member-api chart의 VSO 리소스와 전환 타깃

**Files:**
- Create: `secret-management/charts/member-api/templates/vso.yaml` (`{{- if eq .Values.secretSource "vault" }}`: SA, `VaultConnection`, `VaultAuth`, `VaultStaticSecret`. Global Constraints 값)
- Modify: `charts/member-api/values.yaml` (`vso:` 블록: `address`, `role`, `refreshAfter`)
- Modify: `scripts/seal.sh` (`SKIP_OWNER_REFS=1`이면 입력 Secret metadata에 `sealedsecrets.bitnami.com/skip-set-owner-references: "true"` 추가)
- Create: `scripts/set-param.sh NAME VALUE` (Application `member-api`의 현재 `spec.source.helm.parameters`를 `kubectl get -o json`으로 읽어 NAME을 추가하거나 바꾼 배열 전체를 patch한다. merge patch는 배열을 통째로 바꾸므로 다른 parameter를 지우지 않으려면 이렇게 해야 한다)
- Modify: `Makefile` (`secret-source`: `SOURCE=sealed|vault` → `set-param.sh secretSource $(SOURCE)`. 2편 `load-mode`도 `set-param.sh loadMode $(MODE)`로 바꾼다. 지금의 `load-mode`는 parameter 배열을 덮어써서 다른 값을 지운다)

**Interfaces:**
- Produces: `helm template --set secretSource=vault` → SealedSecret 0개, VSO 리소스 4개. `secretSource=sealed` → SealedSecret 1개, VSO 리소스 0개. `make secret-source SOURCE=vault`, `SKIP_OWNER_REFS=1 make seal`

- [ ] **Step 1: 렌더 검증 명령을 먼저 실행해 실패 확인**

```bash
helm template charts/member-api --set secretSource=vault | grep -c "kind: VaultStaticSecret"   # 지금은 0
```

- [ ] **Step 2: 템플릿·values·seal.sh·Makefile 작성**
- [ ] **Step 3: 검증**

```bash
helm lint charts/member-api
helm template charts/member-api --set secretSource=vault | grep -cE "kind: (VaultConnection|VaultAuth|VaultStaticSecret|ServiceAccount)"   # SA 3(기존 2 + vso) + VSO 3 = 6
helm template charts/member-api --set secretSource=vault | grep -c "kind: SealedSecret"    # 0
helm template charts/member-api | grep -cE "kind: (VaultConnection|VaultAuth|VaultStaticSecret)"   # 0
make -n secret-source SOURCE=vault
```

- [ ] **Step 4: parameter 보존 확인(먼저 실패 확인)** — 수정 전 Makefile로 `make load-mode MODE=async && make secret-source SOURCE=sealed`를 돌리면 `loadMode`가 사라지는 것을 `kubectl get application member-api -o jsonpath='{.spec.source.helm.parameters}'`로 확인하고, `set-param.sh` 적용 뒤 같은 순서로 두 값이 모두 남는지 확인한다(지금 클러스터는 2편 상태라 실제 렌더는 바뀌지 않는다)
- [ ] **Step 5: Commit** — `[#vault] feat: member-api chart에 VSO 리소스와 secretSource 전환 추가`

---

### Task 3: SealedSecret → VSO 이전

**Files:**
- Modify: `charts/member-api/templates/sealedsecret.yaml` (`SKIP_OWNER_REFS=1 make seal`로 다시 생성)

**Interfaces:**
- Consumes: Task 1(KV 값, VSO), Task 2(chart, `secret-source`)
- Produces: run-log의 이전 전·중·후 출력(Secret ownerReferences, uid, resourceVersion, labels, `/config`, Pod restart 횟수)

- [ ] **Step 1: 현재 상태 기록** — `kubectl get secret member-api-config -o jsonpath='{.metadata.uid} {.metadata.ownerReferences}'`, `/config` 응답, Pod 이름과 restart 수. Expected: ownerRef `SealedSecret` `controller:true`
- [ ] **Step 2: 위험 확인(별도 namespace)** — `kubectl create namespace sealed-demo` → 같은 방식으로 봉인한 임시 SealedSecret 적용 → Secret 생성 확인 → SealedSecret 삭제 → Secret도 사라짐 확인 → namespace 삭제. member-api는 건드리지 않는다
- [ ] **Step 3: 소유 관계 끊기** — `SKIP_OWNER_REFS=1 make seal` → commit(`[#vault] chore: member-api SealedSecret 을 skip-set-owner-references 로 다시 봉인`) → push → `make app-sync`. Expected: Secret uid 그대로, `ownerReferences` 없음, `/config` 그대로
- [ ] **Step 4: 전환** — `make secret-source SOURCE=vault` → sync 완료 대기. Expected:
  - SealedSecret `member-api-config` 없음(prune), VSS `member-api-config` 있음
  - Secret uid 그대로, ownerRef `VaultStaticSecret`, label `app.kubernetes.io/managed-by: hashicorp-vso`
  - `/config`가 Step 1과 같음, member-api Pod 이름·restart 수 그대로(첫 동기화는 재시작하지 않는다)
- [ ] **Step 5: 덮어쓰기 경쟁 없음** — 2분 동안 30초 간격으로 Secret `resourceVersion` 기록 → 모두 같음. sealed-secrets controller 로그에 `member-api-config` 관련 새 이벤트 없음
- [ ] **Step 6: ledger에 결과 기록**(커밋 없음. Step 3의 커밋이 이 Task의 커밋이다)

---

### Task 4: 값 변경·Vault 장애·롤백

**Interfaces:**
- Consumes: Task 3의 전환 상태
- Produces: run-log의 출력. 마지막 상태는 `secretSource: vault`

- [ ] **Step 1: 값 변경과 재시작** — `restartedAt`(Deployment template annotation)과 Pod 이름 기록 → `refreshAfter`가 두 번 지나도록 70초 대기 → 바뀌지 않음 확인 → `vault kv put secret/member-api/config api-token=demo-api-token-v2-rotated` → 30초 간격 관찰. Expected: Secret data 갱신, `restartedAt` 한 번 생김·바뀜, 새 Pod, `/config` → `{"api_token":"de****","length":25}`
- [ ] **Step 2: Vault 장애** — `make vault-seal` → 60초 대기 → `kubectl describe vaultstaticsecret member-api-config`의 이벤트·status, `get secret member-api-config`(남아 있음), `/config`(앱 계속 동작) → `make vault-unseal` → 다음 refresh에서 `SecretSynced=True`
- [ ] **Step 3: 롤백** — 현재 값(`demo-api-token-v2-rotated`)으로 `API_TOKEN=... SKIP_OWNER_REFS=1 make seal` → commit·push → `make secret-source SOURCE=sealed` → 관찰: VSS prune, Secret이 VSS ownerRef GC로 지워졌다가 sealed-secrets가 다시 만드는지(uid 변경 여부), 그 사이 member-api Pod 상태. `/config`가 v2 값 유지. 결과를 사실대로 기록하고, 다시 만들어지는 동안의 공백이 있으면 그 시간을 적는다
- [ ] **Step 4: 다시 vault로** — `make secret-source SOURCE=vault` → Task 3 Step 4와 같은 확인
- [ ] **Step 5: ledger 기록**(커밋은 Step 3의 재봉인 커밋)

---

### Task 5: audit log, README, 비공개 점검

**Files:**
- Modify: `secret-management/README.md` (3편 절: VSO 설치, 이전 2단계, 값 변경·장애·롤백, audit, "다루지 않는 것" 갱신)

- [ ] **Step 1: audit 비교** — vault-0 로그에서 `jq`로 `request.path`가 `secret/data/member-api/config`인 줄과 `secret/data/member-api/dek`인 줄을 골라 `time`, `auth.display_name`, `auth.metadata.service_account_name`, `request.headers.user-agent`(있으면) 출력. Expected: config는 SA `vso-member-api`·User-Agent `vso/1.6.2`, dek는 SA `member-api`(Agent 경유)
- [ ] **Step 2: README** — 출력은 run-log에서만, 생략은 `...`, 모든 kubectl에 `--context`
- [ ] **Step 3: 점검** — `grep -rnF -f /Users/user/src/workspace_blogv2/.vault-series-private-terms.txt secret-management` 출력 없음, `helm lint`, `cd app/member-api && go test -short ./...`
- [ ] **Step 4: Commit** — `[#vault] docs: README 에 VSO 이전 절차와 실행 결과 추가`

---

### Task 6: 블로그 3편 초안

**Files:**
- Create: `blog-v2.advenoh.pe.kr/docs/start/hashicorp-vault-실전-가이드-3-vso와-sealed-secrets-이전/index.md`

- [ ] **Step 1: 초안** — frontmatter `title: "HashiCorp Vault 실전 가이드 3편 - VSO로 애플리케이션 시크릿 관리하고 Sealed Secrets에서 이전하기"`, `series`, `seriesOrder: 3`, description 한 문장. 목차는 spec §7.1. 들어가며에 use case(spec §3 3편 행)와 1·2편 링크. 비교 절은 spec §4.4(같은 점·다른 점 표, git 쓰기 권한 탈취는 둘 다 못 막는다). 이전 절은 Task 3의 2단계와 그 이유(ownerReference, overwrite). 선택 기준 절은 Agent Injector와 VSO를 use case로 비교. VSO와 ESO는 표 한두 줄(provider, 동적 시크릿, 라이선스 BUSL-1.1/Apache-2.0). ArgoCD v2.14에 VSS health check가 없다는 점. Mermaid 최소 3개(VSO 동기화 흐름, 이전 2단계, 선택 기준 또는 장애 시 동작). FAQ 3~5개
- [ ] **Step 2: 구조 점검** — 2편과 같은 점검(heading 번호, H1 순서, 존댓말, 목록 마침표, FAQ 어미, `<br`, 모든 kubectl에 `--context`)
- [ ] **Step 3: Commit** — `docs: HashiCorp Vault 실전 가이드 3편 초안 추가`

---

### Task 7: fluent-korean revise, 렌더 확인, 최종 리뷰 뒤 PR

- [ ] **Step 1** — fluent-korean 지침(`/Users/user/.claude/plugins/cache/fluent-korean/fluent-korean/1.0.0/output-styles/fluent-korean-not-coding.md`) 기준으로 산문 revise. `~다`체 유지, 코드·출력 제외
- [ ] **Step 2** — ASCII 임시 폴더로 dev 서버 렌더 확인(Mermaid SVG 수 = 블록 수, 구문 오류 0) 후 정리
- [ ] **Step 3** — 최종 whole-branch 리뷰(두 저장소) → Critical·Important 수정 → push → PR 2개(argocd-charts-sample `feat/vault-secrets-operator`, blog-v2 `feat/vault-series-3`) → URL 보고
