# HashiCorp Vault 실전 가이드 1편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `tutorials-go/cloud/vault/`에 Transit KEK + KV 저장 DEK 방식의 envelope encryption Go 예제를 만들고, 그 실행 결과로 블로그 1편 초안을 쓴다.

**Architecture:** Docker dev 모드 Vault에 Transit KEK `member-api-kek`를 두고, `transit/datakey/wrapped`로 만든 DEK를 KV v2(`secret/member-api/dek`)에 버전별로 저장한다. Go 패키지 `envelope`가 KV read → `transit/decrypt`로 AES-GCM keyring을 메모리에 만들고, `member` 패키지가 회원 이메일·전화번호를 필드 단위로 암호화해 JSON 파일에 저장한다. CLI `member-cli`가 앱 역할(put/get)과 migration 역할(init-dek/rotate-dek/reencrypt)을 서로 다른 Vault token으로 실행한다.

**Tech Stack:** Go 1.26, `github.com/hashicorp/vault/api` v1.23.0, testify v1.11.1, testcontainers-go v0.44.0 + `modules/vault` v0.44.0, Docker Compose, `hashicorp/vault:2.2.1`

**Spec:** `docs/superpowers/specs/2026-11-02-vault-series-design.md` (이 계획은 spec의 1편 범위만 구현한다. 2·3편 계획은 1편이 끝난 뒤 spec §13 확인 결과를 반영해 따로 쓴다)

## Global Constraints

- 예제 위치: `tutorials-go/cloud/vault/`, **중첩 모듈** `module github.com/kenshin579/tutorials-go/cloud/vault`, `go 1.26.0` (루트 모듈의 testcontainers v0.13을 건드리지 않기 위해 분리한다. `keycloak/backend` 등 중첩 모듈 선례가 있다)
- tutorials-go 브랜치: `master`에서 `feature/vault-envelope-encryption`. 커밋 메시지는 한국어 `feat: ...`/`test: ...`/`docs: ...`, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- blog-v2 브랜치: `feat/vault-series`(이미 있음). 커밋 메시지 `docs: ...`, 같은 Co-Authored-By
- Vault 이미지: `hashicorp/vault:2.2.1` (compose, testcontainers 모두 같은 태그)
- 이름: KEK `member-api-kek`, KV mount `secret`, KV path `member-api/dek`, KV 필드 `current_version`(문자열 `"1"`, `"2"`…), `wrapped_v<N>`(Transit 암호문 `vault:v1:...`), policy `member-api`(앱), `member-api-migration`
- DEK: `transit/datakey/wrapped/member-api-kek`, `bits=256`. KV 쓰기는 check-and-set(CAS)로 한다
- 암호문 바이트 포맷: `[1바이트 DEK 버전][12바이트 nonce][AES-256-GCM 암호문+tag]`, JSON 파일에는 `base64.StdEncoding` 문자열로 저장. DEK 버전은 1~255
- policy 권한(spec §5.2 그대로): `member-api` = `secret/data/member-api/dek` read, `transit/decrypt/member-api-kek` update / `member-api-migration` = `transit/datakey/wrapped/member-api-kek` update, `transit/decrypt/member-api-kek` update, `secret/data/member-api/dek` create·update·read. 둘 다 `transit/keys/*` 권한 없음
- 비공개: 회사 저장소명·도메인·키/경로/role 이름·사람 이름·PR 번호를 코드·주석·README·글·커밋·PR에 쓰지 않는다. PR 전에 `grep -rnF -f /Users/user/src/workspace_blogv2/.vault-series-private-terms.txt <대상>`이 아무것도 출력하지 않아야 한다(이 목록 파일은 git 밖에 있다. 내용을 어디에도 옮기지 않는다)
- 블로그 글(Task 6~7): spec §9 작성 방침을 따른다. `~다`체, heading `# N.`/`## N.M`, `들어가며` → … → `FAQ` → `마무리` → `참고`, FAQ 질문 `~나?/~는가?/~인가?`, 목록 끝 마침표 없음, Mermaid(노드에 `<br/>` 금지). 명령 출력은 Task 5에서 실제로 얻은 것만 쓴다
- PR은 만들기만 하고 머지하지 않는다. 리뷰어를 지정하지 않는다. `gh pr create` + HEREDOC으로 만들고 생성 직후 URL을 보고한다

## Review Focus

1. KV 문서가 손상된 경우(`current_version`이 가리키는 `wrapped_vN` 필드가 없음, `current_version`이 숫자가 아님) → `LoadKeyring`이 어떤 필드가 문제인지 담은 에러를 돌려줘야 한다. 패닉이나 빈 keyring이면 안 된다 → Task 3 `TestParseDEKData_*`
2. Vault를 재시작해 KEK가 바뀐 뒤 옛 데이터를 읽는 경우(키 분실 데모) → `get`이 GCM 인증 실패를 감싼 에러로 끝나야 한다. 엉뚱한 평문이 나오거나 패닉이면 안 된다 → Task 4 `TestRepository_GetWithWrongKey`
3. migration이 두 번 겹쳐 실행되는 경우 → CAS 때문에 뒤에 쓴 쪽이 실패해야 하고, 앞의 DEK 버전이 덮어써지면 안 된다 → Task 3 `TestWriteDEK_StaleCASFails`
4. 권한이 없는 token(앱 token으로 rotate, migration token으로 KEK 회전) → 403이 그대로 에러로 올라와야 한다 → Task 3 `TestPolicy_*`
5. 데이터 파일이 없거나 비어 있는 상태에서 `get`/`reencrypt` → `ErrNotFound`/0건 처리여야 하고 크래시하면 안 된다 → Task 4 `TestRepository_GetMissingFile`, `TestRepository_ReencryptEmpty`

---

### Task 1: 모듈 골격, Docker dev Vault, policy와 setup 스크립트

**Files:**
- Create: `tutorials-go/cloud/vault/go.mod`
- Create: `tutorials-go/cloud/vault/.gitignore` (`.tokens/`, `data/`)
- Create: `tutorials-go/cloud/vault/docker-compose.yml`
- Create: `tutorials-go/cloud/vault/policies/member-api.hcl`
- Create: `tutorials-go/cloud/vault/policies/member-api-migration.hcl`
- Create: `tutorials-go/cloud/vault/scripts/setup.sh`

**Interfaces:**
- Produces: `docker compose up -d`로 `http://127.0.0.1:8200`에 dev Vault(root token `root`), `./scripts/setup.sh` 실행 후 `.tokens/app.token`, `.tokens/migration.token` 파일. Task 3 통합 테스트가 `policies/*.hcl`을 그대로 읽는다

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go
git checkout master && git pull origin master
git checkout -b feature/vault-envelope-encryption
```

- [ ] **Step 2: `go.mod`, `.gitignore`, `docker-compose.yml` 작성**

compose 서비스 이름은 `vault`, 이미지 `hashicorp/vault:2.2.1`, 명령 `server -dev -dev-root-token-id=root -dev-listen-address=0.0.0.0:8200`, 포트 `8200:8200`. Vault 2.0.2부터 공식 이미지에서 `IPC_LOCK`이 빠졌으므로 `cap_add`를 넣지 않는다. 기동이 mlock 관련으로 실패하면 `VAULT_DISABLE_MLOCK=true` 환경 변수를 추가하고 그 사실을 README에 적는다

- [ ] **Step 3: policy 파일 작성** (Global Constraints의 권한 표 그대로, 그 외 경로 없음)

- [ ] **Step 4: `scripts/setup.sh` 작성**

`set -euo pipefail`. 모든 vault 명령은 로컬 CLI 없이 `docker compose exec -T -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=root vault vault ...`로 실행한다. 순서: `transit/`가 `vault secrets list`에 없을 때만 enable → `vault write -f transit/keys/member-api-kek` → `vault policy write member-api - < policies/member-api.hcl`(migration도 같은 방식) → `vault token create -policy=<p> -ttl=24h -field=token`으로 `.tokens/app.token`, `.tokens/migration.token` 작성. 스크립트는 `cloud/vault/`를 기준 디렉터리로 `cd`한다

- [ ] **Step 5: 동작 확인**

```bash
cd /Users/user/src/workspace_blogv2/tutorials-go/cloud/vault
docker compose up -d
./scripts/setup.sh && ./scripts/setup.sh   # 두 번 실행해도 성공해야 한다
docker compose exec -T -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN="$(cat .tokens/app.token)" vault \
  vault write -f transit/datakey/wrapped/member-api-kek
```

Expected: setup 두 번 모두 exit 0, 마지막 명령은 `permission denied`(403)로 실패

- [ ] **Step 6: Commit**

```bash
git add cloud/vault
git commit -m "feat: Vault envelope encryption 예제의 dev Vault와 policy 구성 추가"
```

---

### Task 2: `envelope.Keyring` (버전별 AES-GCM)

**Files:**
- Create: `tutorials-go/cloud/vault/envelope/keyring.go`
- Test: `tutorials-go/cloud/vault/envelope/keyring_test.go`

**Interfaces:**
- Produces:
  - `func NewKeyring(current uint8, keys map[uint8][]byte) (*Keyring, error)` — 모든 키는 32바이트, `current`는 `keys`에 있어야 하고 0이면 안 된다
  - `func (k *Keyring) Current() uint8`
  - `func (k *Keyring) Encrypt(plaintext []byte) ([]byte, error)` — 항상 `current` 버전으로 암호화
  - `func (k *Keyring) Decrypt(blob []byte) ([]byte, error)` — blob 첫 바이트의 버전 키로 복호화
  - `func VersionOf(blob []byte) (uint8, error)`
  - `var ErrUnknownKeyVersion, ErrCiphertextTooShort, ErrInvalidKey error`

- [ ] **Step 1: 실패하는 테스트 작성**

테스트 이름과 단언(키는 `crypto/rand`로 만든 32바이트):
- `TestKeyring_EncryptDecrypt_RoundTrip`: `Decrypt(Encrypt("alice@example.com"))` == 원문
- `TestKeyring_EncryptUsesCurrentVersion`: keys `{1,2}`, current 2 → `VersionOf(blob)` == 2
- `TestKeyring_DecryptOldVersion`: current 1 keyring으로 만든 blob을 keys `{1,2}` current 2 keyring이 복호화
- `TestKeyring_EncryptNonceUnique`: 같은 평문 두 번 암호화 결과가 다르다
- `TestKeyring_DecryptUnknownVersion`: `errors.Is(err, ErrUnknownKeyVersion)`
- `TestKeyring_DecryptTooShort`: 길이 `1+12+15` 이하 blob → `errors.Is(err, ErrCiphertextTooShort)`
- `TestKeyring_DecryptTampered`: 마지막 바이트를 바꾼 blob → 에러(nil 아님)
- `TestNewKeyring_Invalid`: 31바이트 키, `current` 없음, `current == 0` 각각 `errors.Is(err, ErrInvalidKey)`

- [ ] **Step 2: 실패 확인**

Run: `cd /Users/user/src/workspace_blogv2/tutorials-go/cloud/vault && go test ./envelope/ -run 'Keyring' -v`
Expected: FAIL (undefined: NewKeyring)

- [ ] **Step 3: `keyring.go` 구현**

`crypto/aes` + `cipher.NewGCM`, nonce는 `gcm.NonceSize()`(12)바이트 `crypto/rand`. 버전별 `cipher.AEAD`를 `NewKeyring`에서 미리 만들어 둔다

- [ ] **Step 4: 통과 확인**

Run: `go test ./envelope/ -run 'Keyring' -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cloud/vault/envelope
git commit -m "feat: 버전별 AES-GCM keyring 구현"
```

---

### Task 3: Vault 연동 (`InitDEK`, `RotateDEK`, `LoadKeyring`)

**Files:**
- Create: `tutorials-go/cloud/vault/envelope/vault.go`
- Test: `tutorials-go/cloud/vault/envelope/vault_test.go` (순수 함수 단위 테스트)
- Test: `tutorials-go/cloud/vault/envelope/vault_integration_test.go` (testcontainers)

**Interfaces:**
- Consumes: Task 2 `NewKeyring`, Task 1 `policies/*.hcl`
- Produces:
  - `type Config struct { KEKName, KVMount, KVPath string }`, `var DefaultConfig = Config{KEKName: "member-api-kek", KVMount: "secret", KVPath: "member-api/dek"}`
  - `func InitDEK(ctx context.Context, c *vaultapi.Client, cfg Config) (created bool, err error)` — KV 문서가 이미 있으면 아무것도 쓰지 않고 `false`
  - `func RotateDEK(ctx context.Context, c *vaultapi.Client, cfg Config) (version uint8, err error)` — 새 DEK를 `current_version+1`로 추가하고 `current_version`을 올린다. 문서가 없으면 1
  - `func LoadKeyring(ctx context.Context, c *vaultapi.Client, cfg Config) (*Keyring, error)` — 모든 `wrapped_vN`을 `transit/decrypt`로 풀어 keyring 구성
  - `func parseDEKData(data map[string]interface{}) (current uint8, wrapped map[uint8]string, err error)`
  - `func writeDEK(ctx context.Context, c *vaultapi.Client, cfg Config, data map[string]interface{}, cas int) error` — `KVv2(mount).Put(..., vaultapi.WithCheckAndSet(cas))`
  - `var ErrDEKNotInitialized error` — KV 문서가 없을 때 `LoadKeyring`이 감싸서 반환

- [ ] **Step 1: 순수 함수 단위 테스트 작성** (`vault_test.go`)

- `TestParseDEKData_Valid`: `{"current_version":"2","wrapped_v1":"vault:v1:a","wrapped_v2":"vault:v1:b"}` → current 2, wrapped 2개
- `TestParseDEKData_MissingCurrentField`: `wrapped_v2` 없이 `current_version:"2"` → 에러 메시지에 `wrapped_v2` 포함
- `TestParseDEKData_NonNumericVersion`: `current_version:"abc"` → 에러
- `TestParseDEKData_VersionOutOfRange`: `current_version:"256"`, `"0"` → 에러
- `TestNextVersion_Overflow`: 255 다음 버전 요청 → 에러 (`func nextVersion(current uint8) (uint8, error)`)

- [ ] **Step 2: 통합 테스트 작성** (`vault_integration_test.go`)

`testing.Short()`이면 `t.Skip`. `tcvault.Run(ctx, "hashicorp/vault:2.2.1", tcvault.WithToken("root"), tcvault.WithInitCommand("secrets enable transit", "write -f transit/keys/member-api-kek"))`로 띄우고 `HttpHostAddress`로 client를 만든다. root client로 `../policies/*.hcl`을 `Sys().PutPolicy`로 올리고 policy별 token을 발급하는 헬퍼 `newTokenClient(t, root *vaultapi.Client, policy string) *vaultapi.Client`를 둔다. 테스트:
- `TestInitDEK_Idempotent`: migration client로 첫 호출 `created==true`, 두 번째 `false`, KV `current_version == "1"`
- `TestRotateDEK_AddsVersion`: init 후 rotate → 반환 2, `LoadKeyring(app client)`의 `Current()==2`, v1 blob 복호화 가능
- `TestLoadKeyring_DecryptsAcrossRotation`: v1 keyring으로 암호화 → rotate → 새로 load한 keyring이 복호화, 새 암호화는 `VersionOf == 2`
- `TestLoadKeyring_NotInitialized`: 빈 Vault에서 `errors.Is(err, ErrDEKNotInitialized)`
- `TestWriteDEK_StaleCASFails`: init 후(KV 버전 1) `writeDEK(..., cas=0)` → 에러, KV `current_version`은 그대로 `"1"`
- `TestPolicy_AppTokenCannotRotate`: app client `RotateDEK` → 에러, `*vaultapi.ResponseError`의 `StatusCode == 403`
- `TestPolicy_MigrationTokenCannotRotateKEK`: migration client로 `transit/keys/member-api-kek/rotate` write → 403

- [ ] **Step 3: 실패 확인**

Run: `go test ./envelope/ -v`
Expected: FAIL (undefined: InitDEK 등)

- [ ] **Step 4: `vault.go` 구현**

datakey 응답의 `ciphertext`를 `wrapped_v<N>`에 넣고, decrypt 응답의 `plaintext`(base64)를 디코드해 32바이트 키로 쓴다. `RotateDEK`는 KV를 읽어(없으면 cas 0, 있으면 읽은 `VersionMetadata.Version`) 기존 필드를 모두 유지한 맵에 새 필드와 `current_version`을 더해 `writeDEK`로 쓴다. `InitDEK`는 문서 존재 확인 후 `RotateDEK`. 의존성 추가: `go get github.com/hashicorp/vault/api@v1.23.0 github.com/testcontainers/testcontainers-go@v0.44.0 github.com/testcontainers/testcontainers-go/modules/vault@v0.44.0 github.com/stretchr/testify@v1.11.1 && go mod tidy`

- [ ] **Step 5: 통과 확인**

Run: `go test ./envelope/ -v` (Docker 실행 중)
Expected: PASS. `go test -short ./envelope/ -v`는 통합 테스트가 SKIP

- [ ] **Step 6: Commit**

```bash
git add cloud/vault
git commit -m "feat: Transit datakey로 DEK를 발급·회전하고 keyring을 로드하는 Vault 연동 구현"
```

---

### Task 4: `member.Repository` (필드 암호화 JSON 저장소와 재암호화)

**Files:**
- Create: `tutorials-go/cloud/vault/member/repository.go`
- Test: `tutorials-go/cloud/vault/member/repository_test.go`

**Interfaces:**
- Consumes: Task 2 `*envelope.Keyring`, `envelope.VersionOf`
- Produces:
  - `type Member struct { ID, Email, Phone string }`
  - `func NewRepository(path string, k *envelope.Keyring) *Repository`
  - `func (r *Repository) Put(m Member) error` — Email·Phone을 암호화해 저장. 같은 ID는 덮어쓴다. 상위 디렉터리가 없으면 만든다
  - `func (r *Repository) Get(id string) (Member, error)`
  - `func (r *Repository) Reencrypt() (int, error)` — `current`가 아닌 버전의 필드를 복호화 후 현재 버전으로 다시 암호화하고, 바꾼 레코드 수를 반환
  - `var ErrNotFound error`
  - 파일 포맷: `{"members":[{"id":"...","email":"<base64>","phone":"<base64>"}]}`

- [ ] **Step 1: 실패하는 테스트 작성** (`t.TempDir()`의 파일, 실제 `envelope.Keyring`)

- `TestRepository_PutGet_RoundTrip`
- `TestRepository_FileHasNoPlaintext`: 파일 바이트에 `alice@example.com`, `010-1234-5678`이 없다
- `TestRepository_GetNotFound`: 없는 ID → `errors.Is(err, ErrNotFound)`
- `TestRepository_GetMissingFile`: 파일이 아예 없을 때 `Get` → `ErrNotFound`
- `TestRepository_Reencrypt`: v1 keyring으로 2건 저장 → keys `{1,2}` current 2 repository로 `Reencrypt()` == 2, 파일의 모든 필드 `VersionOf == 2`, 다시 호출하면 0, `Get` 결과 원문과 같다
- `TestRepository_ReencryptEmpty`: 파일 없음 → `(0, nil)`
- `TestRepository_GetWithWrongKey`: keyring A로 저장 → 같은 버전 번호의 다른 키 keyring B로 `Get` → 에러(nil 아님), 반환 Member는 빈 값

- [ ] **Step 2: 실패 확인**

Run: `go test ./member/ -v`
Expected: FAIL

- [ ] **Step 3: `repository.go` 구현** (파일은 임시 파일에 쓴 뒤 rename)

- [ ] **Step 4: 통과 확인**

Run: `go test ./member/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cloud/vault/member
git commit -m "feat: 회원 개인정보를 필드 단위로 암호화하는 JSON 저장소 구현"
```

---

### Task 5: `member-cli`, README, 시나리오 실행, tutorials-go PR

**Files:**
- Create: `tutorials-go/cloud/vault/cmd/member-cli/main.go`
- Create: `tutorials-go/cloud/vault/README.md`

**Interfaces:**
- Consumes: Task 3 `InitDEK`/`RotateDEK`/`LoadKeyring`/`DefaultConfig`, Task 4 `Repository`
- Produces: `go run ./cmd/member-cli <subcommand>`. 서브커맨드와 사용 token(README에 명시):
  - `init-dek`, `rotate-dek`, `reencrypt` — migration token
  - `put --id <id> --email <e> --phone <p>`, `get --id <id>` — app token
  - 공통 플래그 `--data` (기본 `./data/members.json`). Vault 주소·token은 `VAULT_ADDR`/`VAULT_TOKEN` 환경 변수(`vaultapi.DefaultConfig`, `NewClient`)
  - 에러는 stderr에 한 줄로 쓰고 exit 1. 패닉하지 않는다

- [ ] **Step 1: `main.go` 구현** (`flag.NewFlagSet`으로 서브커맨드 분기)

- [ ] **Step 2: 빌드와 전체 테스트**

Run: `go vet ./... && go test ./...`
Expected: PASS

- [ ] **Step 3: 시나리오 실행과 출력 기록**

아래 순서를 실제로 실행하고, 각 명령과 출력을 README의 해당 절에 그대로 붙인다(token 값은 `hvs.****`로 가린다).

1. `docker compose up -d` → `./scripts/setup.sh`
2. migration token으로 `init-dek` → `vault kv get secret/member-api/dek`(root, compose exec) 출력
3. app token으로 `put`(alice) → `cat data/members.json` → `get`
4. app token으로 `rotate-dek` 시도 → 403 출력
5. migration token으로 `rotate-dek` → `reencrypt` → app token으로 `get` → `members.json`의 버전 바이트가 2로 바뀐 것 확인(base64 디코드 첫 바이트)
6. 키 분실 데모: `docker compose restart vault` → `./scripts/setup.sh` → migration token으로 `init-dek` → app token으로 `get` → 복호화 실패 출력

Expected: 4는 403, 6은 GCM 인증 실패 메시지로 exit 1, 나머지는 성공

- [ ] **Step 4: README 마무리**

구성 설명, 사전 준비(Docker), 위 시나리오, 정리(`docker compose down`), 블로그 글 링크 자리(`https://blog.advenoh.pe.kr/` 아래 1편 slug — 발행 전이므로 "발행 예정"으로 적는다)

- [ ] **Step 5: 비공개 점검**

Run: `grep -rnF -f /Users/user/src/workspace_blogv2/.vault-series-private-terms.txt cloud/vault; echo "exit=$?"`
Expected: 출력 없음, `exit=1`

- [ ] **Step 6: Commit, push, PR**

```bash
git add cloud/vault
git commit -m "feat: member-cli와 envelope encryption 실행 시나리오 README 추가"
git push -u origin feature/vault-envelope-encryption
gh pr create --title "feat: Vault Transit envelope encryption 예제 추가" --body "$(cat <<'EOF'
## Summary
- dev 모드 Vault(docker compose)와 앱/migration policy 분리 구성
- Transit datakey로 DEK 발급·회전, KV v2에 wrap된 DEK 저장, 부팅 시 keyring 로드
- 회원 이메일·전화번호 필드 암호화 JSON 저장소와 재암호화
- member-cli와 실행 시나리오(키 회전, 키 분실 데모) README

## Test plan
- [x] go test ./... (Docker 필요: testcontainers 통합 테스트)
- [x] README 시나리오 직접 실행

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL 출력. URL을 사용자에게 보고한다

---

### Task 6: 블로그 1편 초안

**Files:**
- Create: `blog-v2.advenoh.pe.kr/docs/start/hashicorp-vault-실전-가이드-1-핵심-개념과-transit-envelope-encryption/index.md`

**Interfaces:**
- Consumes: Task 5 README의 실제 출력, spec §5.1 목차, §3 use case, §4.1 비교, §4.4 Sealed Secrets 위치

- [ ] **Step 1: 사실 확인**

본문에 쓸 Vault 동작(seal/unseal과 Shamir, barrier, KV v2 버전, Transit datakey의 `plaintext`/`wrapped` 차이, policy capabilities, token TTL, dev 모드 특성)을 `developer.hashicorp.com/vault/docs` 공식 문서에서 확인하고, 확인한 URL을 `참고` 절 후보로 모은다. 확인하지 못한 내용은 쓰지 않는다

- [ ] **Step 2: 초안 작성**

frontmatter: `title: "HashiCorp Vault 실전 가이드 1편 - 핵심 개념과 Transit으로 구현하는 Envelope Encryption"`, `description`(한 문장), `date`/`update: 2026-11-02`(발행 시 조정), `tags`(spec §2 후보 중 1편에 맞는 것), `series: "HashiCorp Vault 실전 가이드"`, `seriesOrder: 1`. 본문은 spec §5.1 목차를 따른다. 들어가며에 use case(§3 1편 행), Sealed Secrets 위치 두세 문장과 기존 글 링크(`/kubernetes-환경에서-secret-안전하게-관리하기/`), 시리즈 범위를 둔다. Mermaid 도식 최소 2개: envelope encryption 구조(KEK·DEK·데이터), 부팅 시 DEK 로드 sequence. 코드는 핵심 부분만 인용하고 전체는 GitHub 링크(`https://github.com/kenshin579/tutorials-go/tree/master/cloud/vault`). 실행 출력은 Task 5 README에서 가져온다. FAQ 3~5개

- [ ] **Step 3: 구조 점검**

Run: `grep -nE '^#{1,3} ' <초안>` — 모든 heading에 번호가 있고 마지막 세 H1이 `FAQ`, `마무리`, `참고` 순서인지 확인. `grep -nE '습니다|입니다' <초안>`(코드블록 밖)에 결과가 없어야 한다

- [ ] **Step 4: Commit**

```bash
cd /Users/user/src/workspace_blogv2/blog-v2.advenoh.pe.kr
git add docs/start/hashicorp-vault-실전-가이드-1-핵심-개념과-transit-envelope-encryption
git commit -m "docs: HashiCorp Vault 실전 가이드 1편 초안 추가"
```

---

### Task 7: fluent-korean revise, 최종 점검, blog-v2 PR

**Files:**
- Modify: Task 6 초안

- [ ] **Step 1: 지침 전문 읽기**

`/Users/user/.claude/plugins/cache/fluent-korean/fluent-korean/1.0.0/output-styles/fluent-korean-not-coding.md`를 처음부터 끝까지 읽는다(요약하지 않는다)

- [ ] **Step 2: revise**

지침의 문장 단위·구 단위 조항을 본문 산문에 적용한다. `~다`체는 유지하고, 코드블록·명령·인용·frontmatter는 바꾸지 않는다. 사실이나 수치는 바꾸지 않는다

- [ ] **Step 3: 최종 점검**

```bash
f=docs/start/hashicorp-vault-실전-가이드-1-핵심-개념과-transit-envelope-encryption/index.md
file -I "$f"                                     # charset=utf-8
grep -nE '^#{1,3} ' "$f"                          # heading 번호 규칙
grep -nE '<br' "$f"                               # Mermaid 노드 안 <br> 없음
grep -nF -f /Users/user/src/workspace_blogv2/.vault-series-private-terms.txt "$f"; echo "exit=$?"   # 출력 없음, exit=1
```

렌더 확인이 필요하면 dev 서버는 한글 slug에서 500이 나므로 ASCII 임시 폴더로 복사해 확인하고 임시 폴더는 지운다

- [ ] **Step 4: Commit, push, PR**

```bash
git add "$f"
git commit -m "docs: Vault 1편 초안 문장을 fluent-korean 지침으로 다듬기"
git push -u origin feat/vault-series
gh pr create --title "docs: HashiCorp Vault 실전 가이드 시리즈 설계와 1편 초안" --body "$(cat <<'EOF'
## Summary
- 3편 시리즈 설계 문서와 1편 구현 계획
- 1편 초안: Vault 핵심 개념, Transit datakey + KV 기반 envelope encryption (docs/start)
- 예제 코드: tutorials-go cloud/vault (별도 PR)

## Test plan
- [ ] 초안 문체·heading·Mermaid 렌더 확인
- [ ] 예제 PR 머지 후 GitHub 링크 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL 출력. tutorials-go PR URL과 함께 사용자에게 보고한다
