# Bloom Filter 블로그 글 설계

- 작성일: 2026-07-30
- 대상 저장소: `blog-v2.advenoh.pe.kr`, `tutorials-go`

## 1. 목표

Bloom Filter를 개념부터 Go 구현까지 한 편에 담은 단일 장문 글을 작성한다. 실무에서 어디에 쓰이는지까지 다뤄 "그래서 이걸 언제 쓰나"가 닫히도록 한다.

글의 축은 두 가지다.

1. 자료구조 개념 정리 — 비트 배열, k개 해시, false positive 확률 수식, 삭제 불가 이유
2. Go 직접 구현 — `tutorials-go`에 처음부터 구현하고 테스트로 false positive rate를 실측

여기에 실무 사용처와 변종 비교를 덧붙인다.

## 2. 범위

### 포함

- 한국어 본문 (`index.md`)
- Go 샘플 코드와 테스트, 벤치마크 (`tutorials-go`)
- 직접 구현 + `bits-and-blooms/bloom/v3` 라이브러리 비교
- 실무 사용처 및 Counting Bloom Filter / Cuckoo Filter / HyperLogLog 비교

### 제외 (이번 작업 범위 밖)

- `cover.png` 이미지 생성
- 영문 버전 `index_en.md`
- 슬라이드 데크 `slides.html` / `slides_en.html`

영문과 슬라이드는 초안이 리뷰를 통과해 `docs/merge_ready/`로 넘어간 뒤 별도로 진행한다. 초안 단계에서는 목차와 코드가 흔들릴 가능성이 커서, 세 곳을 동시에 동기화하는 비용이 크기 때문이다.

## 3. 글 기본 정보

| 항목 | 값 |
|------|-----|
| 초안 위치 | `docs/start/bloom-filter-완벽-가이드-개념부터-go-구현까지/index.md` |
| 발행 카테고리 | `algorithm` |
| title | `Bloom Filter 완벽 가이드 - 개념부터 Go 구현까지` |
| description | `Bloom Filter의 동작 원리와 false positive 확률 계산을 살펴보고, Go로 직접 구현한 뒤 라이브러리와 성능을 비교하며 실무 활용 사례까지 정리합니다` |
| date / update | `2026-07-30` |
| series | 없음 (단일 글) |
| tags | bloom-filter, golang, data-structure, algorithm, probabilistic-data-structure, hash, false-positive, redis, cassandra, 블룸필터, 자료구조, 확률적자료구조 |

`category`는 frontmatter에 넣지 않는다. `contents/{category}/` 디렉토리 구조로 결정된다.

## 4. 목차

```
# 1. 개요
## 1.1 Bloom Filter란
## 1.2 왜 필요한가 - 1억 개 URL 중복 체크를 map으로 하면
## 1.3 확률적 자료구조: false positive는 있고 false negative는 없다

# 2. 동작 원리
## 2.1 비트 배열과 k개의 해시 함수
## 2.2 Add - 비트를 세우는 과정              (Mermaid)
## 2.3 Contains - "없다"는 확실, "있다"는 아마도  (Mermaid)
## 2.4 왜 원소를 삭제할 수 없는가

# 3. 파라미터 설계 (m, n, k, p)
## 3.1 false positive 확률 공식
## 3.2 최적 m과 k 구하기
## 3.3 숫자로 감 잡기 - n=100만일 때 p별 메모리    (표)
## 3.4 map[string]struct{} 와 메모리 비교          (표)

# 4. Go로 직접 구현하기
## 4.1 자료구조 정의 - []uint64 비트 배열
## 4.2 New / NewWithEstimates - 파라미터 자동 계산
## 4.3 해시 하나로 k개 인덱스 만들기 (Kirsch-Mitzenmacher)
## 4.4 Add와 Contains
## 4.5 테스트 - false positive rate 실측값 vs 이론값

# 5. 라이브러리 활용 (bits-and-blooms/bloom)
## 5.1 기본 사용법
## 5.2 직접 구현과 벤치마크 비교               (표)
## 5.3 직접 구현할 때 vs 라이브러리를 쓸 때

# 6. 실무에서 어디에 쓰이는가
## 6.1 데이터베이스 - Cassandra·RocksDB의 SSTable 조회 스킵
## 6.2 캐시 관통(cache penetration) 방어 - Redis Bloom
## 6.3 Chrome Safe Browsing - 악성 URL 사전 필터
## 6.4 크롤러 - 방문한 URL 중복 제거
## 6.5 쓰면 안 되는 경우

# 7. 변종과 대안 비교
## 7.1 Counting Bloom Filter - 삭제 지원
## 7.2 Cuckoo Filter - 삭제 + 더 나은 공간 효율
## 7.3 HyperLogLog - 개수 추정, 혼동하기 쉬운 이웃
## 7.4 선택 기준                              (표)

# 8. 정리
# 9. 참고
```

### 구성 의도

- 2.4에서 "삭제가 안 된다"는 한계를 심어두고 7장에서 해결책(Counting / Cuckoo)으로 회수한다.
- 3장의 수식은 3.3~3.4의 실제 숫자 표로 바로 이어져야 추상적으로 끝나지 않는다.
- 6.5를 넣은 이유는 확률적 자료구조 글이 장점만 나열하고 끝나는 경우가 많아서다. 정확한 답이 필요한 곳에는 쓰지 않는다는 판단 기준을 명시한다.

### 문체와 형식

- 기존 글과 동일하게 번호 붙은 섹션(`# 1. 개요` → `## 1.1`), `~이다` 서술체
- 다이어그램은 Mermaid만 사용. 노드 텍스트에 `<br/>`, `<br>` 등 HTML 태그 금지
- 본문 마지막에 `본 포스팅에서 작성한 코드는 [github](...)에서 확인할 수 있다.` 링크
- 마지막 섹션은 `# 9. 참고`에 URL 목록
- 파일은 UTF-8 인코딩

## 5. Go 코드 설계

위치: `tutorials-go/golang/data-structure/bloom-filter/`, package `bloomfilter`

| 파일 | 내용 |
|------|------|
| `bloom_filter.go` | 직접 구현 |
| `bloom_filter_test.go` | 단위 테스트 + false positive rate 실측 |
| `bloom_filter_bench_test.go` | 직접 구현 vs `bits-and-blooms/bloom/v3` 벤치마크 |
| `library_test.go` | 라이브러리 사용 예제 (본문 5.1절 코드) |

### 공개 API

```go
type BloomFilter struct {
    bits []uint64 // 비트 배열 (uint64 워드 단위)
    m    uint64   // 전체 비트 수
    k    uint64   // 해시 함수 개수
    n    uint64   // 추가된 원소 수
}

func New(m, k uint64) *BloomFilter
func NewWithEstimates(n uint64, p float64) *BloomFilter // m, k 자동 계산
func OptimalM(n uint64, p float64) uint64
func OptimalK(m, n uint64) uint64

func (f *BloomFilter) Add(data []byte)
func (f *BloomFilter) Contains(data []byte) bool
func (f *BloomFilter) EstimatedFPR() float64 // 현재 n 기준 이론 FPR
```

### 해시 전략

해시 함수를 k개 따로 두지 않고 xxhash 64비트 하나를 상·하위 32비트로 쪼개 `h1 + i*h2`로 k개 인덱스를 만든다 (Kirsch-Mitzenmacher 기법).

```go
func (f *BloomFilter) Add(data []byte) {
    h1, h2 := f.hashes(data)
    for i := uint64(0); i < f.k; i++ {
        pos := (h1 + i*h2) % f.m
        f.bits[pos/64] |= 1 << (pos % 64)
    }
    f.n++
}
```

- 슬라이스를 만들지 않고 루프를 돌려 힙 할당을 0으로 유지한다. 5.2절 벤치마크의 `B/op`가 의미를 가지려면 필요하다.
- `h2`가 0이거나 짝수이면 인덱스가 뭉치는 문제가 있어 `h2 |= 1`로 홀수를 보장한다. 본문 4.3절에서 이 함정을 설명한다.

### 수식

- false positive 확률: `p = (1 - e^(-kn/m))^k`
- 최적 비트 수: `m = -n·ln(p) / (ln2)²`
- 최적 해시 개수: `k = (m/n)·ln2`

### 테스트

| 테스트 | 검증 내용 |
|--------|----------|
| false negative 없음 | 10만 개를 넣고 전부 `Contains == true` |
| FPR 실측 | `NewWithEstimates(100_000, 0.01)`에 10만 개를 넣고, 넣지 않은 100만 개를 조회해 실측 비율이 이론값 근처인지 |
| 최적 파라미터 | n=100만, p=0.01 → m=9,585,059 bits(약 1.14MiB), k=7 |
| EstimatedFPR | 원소 수가 늘수록 값이 커지는지 |

### 벤치마크

`BenchmarkAdd`, `BenchmarkContains`를 직접 구현과 `bits-and-blooms/bloom/v3` 양쪽에 대해 실행하고 `ns/op`, `B/op`, `allocs/op`를 본문 5.2절 표에 옮긴다.

## 6. 작업 순서

1. **`tutorials-go`** — TDD로 구현. `go test ./golang/data-structure/bloom-filter/...` 통과 확인. 벤치마크를 실행해 실측 수치를 확보한다.
2. **`tutorials-go` PR** — 브랜치 `feat/bloom-filter`, 한국어 커밋 메시지
3. **`blog-v2`** — `docs/start/bloom-filter-완벽-가이드-개념부터-go-구현까지/index.md` 초안 작성. 1단계에서 나온 실측값을 3.3·3.4·5.2 표에 그대로 반영한다.
4. **`blog-v2` PR** — 브랜치 `docs/bloom-filter`

코드를 먼저 작성하고 테스트 통과를 확인한 뒤 글을 쓴다. 본문의 표에 들어가는 수치는 추정하지 않고 실제 측정값만 사용한다.

## 7. 완료 기준

- `go test ./golang/data-structure/bloom-filter/...` 전부 통과
- 벤치마크가 실행되고 결과 수치가 본문 표에 반영됨
- `docs/start/bloom-filter-완벽-가이드-개념부터-go-구현까지/index.md`가 UTF-8로 존재하고 frontmatter가 3장 형식을 따름
- Mermaid 다이어그램 2개(2.2, 2.3)가 HTML 태그 없이 작성됨
- 본문에서 `tutorials-go` 코드 GitHub 링크가 연결됨
