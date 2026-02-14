---
title: "Golang Concurrency 10편 - 실전 프로젝트와 Best Practices"
description: "Go 동시성을 활용한 실전 프로젝트(웹 크롤러, Graceful Shutdown)와 Best Practices를 다룹니다"
date: 2025-05-15
tags: ["go", "golang", "concurrency", "crawler", "graceful-shutdown", "best-practices"]
series: "Golang Concurrency"
seriesOrder: 10
draft: false
---

시리즈의 마지막 편이다. 1편부터 9편까지 goroutine, channel, select, sync, context, 동시성 패턴, 에러 처리, 테스팅, 성능 최적화를 다뤘다. 이번 편에서는 배운 모든 것을 **실전 프로젝트**에 적용하고, Go 동시성 프로그래밍의 **Best Practices**를 정리한다.

> 이 글의 전체 예제 코드는 GitHub에서 확인할 수 있다.
> - [동시성 웹 크롤러](https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/project/crawler)
> - [Graceful Shutdown](https://github.com/kenshin579/tutorials-go/tree/master/golang/concurrency/project/shutdown)

## 서론 - 배운 것을 실전에 적용하기

지금까지 개별 동시성 도구와 패턴을 하나씩 살펴봤다. 하지만 실무에서는 이 도구들이 **조합**되어 사용된다. 하나의 프로젝트 안에서 context로 취소를 전파하고, semaphore로 동시성을 제한하고, sync.Map으로 상태를 관리하고, Mutex로 공유 자원을 보호하는 상황이 동시에 발생한다.

이번 편에서는 두 가지 실전 프로젝트를 통해 이를 확인한다.

- **동시성 웹 크롤러**: 여러 URL을 동시에 크롤링하면서 rate limiting, 중복 방지, 취소 처리를 모두 구현한다
- **Graceful Shutdown**: HTTP 서버가 종료 신호를 받았을 때 진행 중인 요청을 안전하게 완료하고 종료하는 패턴을 구현한다

## 실전 프로젝트 1: 동시성 웹 크롤러

웹 크롤러는 동시성 프로그래밍의 대표적인 활용 사례다. 여러 URL을 동시에 요청하면 성능이 크게 향상되지만, 그만큼 제어해야 할 것도 많다. 동시 요청 수 제한, 중복 URL 방지, rate limiting, 전체 크롤링 취소 등을 모두 고려해야 한다.

### 설계: Crawler 구조체와 Result

먼저 크롤링 결과를 담을 `Result` struct와 크롤러 자체인 `Crawler` struct를 정의한다.

```go
// Result - 크롤링 결과
type Result struct {
    URL   string
    Title string
    Links []string
    Err   error
}

// Crawler - 동시성 웹 크롤러
type Crawler struct {
    client      *http.Client
    maxWorkers  int
    rateLimit   time.Duration
    visited     sync.Map
    results     []Result
    resultsMu   sync.Mutex
}
```

각 필드의 역할을 정리하면 다음과 같다.

| 필드 | 타입 | 역할 |
|------|------|------|
| `client` | `*http.Client` | HTTP 요청 클라이언트 (timeout 설정 포함) |
| `maxWorkers` | `int` | 동시에 실행할 최대 worker 수 |
| `rateLimit` | `time.Duration` | 요청 간 최소 간격 |
| `visited` | `sync.Map` | 방문한 URL 기록 (중복 방지) |
| `results` | `[]Result` | 크롤링 결과 수집 |
| `resultsMu` | `sync.Mutex` | results 슬라이스 보호 |

`NewCrawler` 생성자 함수에서 HTTP 클라이언트의 timeout을 설정한다.

```go
func NewCrawler(maxWorkers int, rateLimit time.Duration) *Crawler {
    return &Crawler{
        client: &http.Client{
            Timeout: 5 * time.Second,
        },
        maxWorkers: maxWorkers,
        rateLimit:  rateLimit,
    }
}
```

### 핵심 동시성 패턴 활용

`Crawl` 메서드는 이 시리즈에서 다뤘던 여러 동시성 패턴을 하나로 조합한다.

```go
func (c *Crawler) Crawl(ctx context.Context, urls []string) []Result {
    sem := make(chan struct{}, c.maxWorkers) // semaphore
    var wg sync.WaitGroup

    // rate limiter
    ticker := time.NewTicker(c.rateLimit)
    defer ticker.Stop()

    for _, u := range urls {
        // 이미 방문한 URL은 건너뜀
        if _, loaded := c.visited.LoadOrStore(u, true); loaded {
            continue
        }

        select {
        case <-ctx.Done():
            break
        case <-ticker.C:
            // rate limit 대기
        }

        sem <- struct{}{} // semaphore 획득
        wg.Add(1)

        go func() {
            defer wg.Done()
            defer func() { <-sem }() // semaphore 해제

            result := c.fetch(ctx, u)
            c.resultsMu.Lock()
            c.results = append(c.results, result)
            c.resultsMu.Unlock()
        }()
    }

    wg.Wait()
    return c.results
}
```

이 코드에서 사용된 동시성 패턴을 하나씩 살펴보자.

#### context.WithCancel로 전체 크롤링 취소

`Crawl` 메서드는 `context.Context`를 첫 번째 파라미터로 받는다. 호출자가 `context.WithTimeout`이나 `context.WithCancel`로 생성한 context를 전달하면, 크롤링 도중 언제든 취소할 수 있다.

```go
select {
case <-ctx.Done():
    break // context가 취소되면 루프 탈출
case <-ticker.C:
    // rate limit 대기 후 진행
}
```

`ctx.Done()` channel이 닫히면 더 이상 새 URL을 크롤링하지 않는다. 이미 실행 중인 goroutine도 `fetch` 메서드 내부에서 `http.NewRequestWithContext(ctx, ...)`를 사용하므로, context가 취소되면 진행 중인 HTTP 요청도 중단된다.

#### Semaphore (buffered channel)로 동시 worker 수 제한

`maxWorkers` 크기의 buffered channel이 semaphore 역할을 한다.

```go
sem := make(chan struct{}, c.maxWorkers)

// 작업 시작 전: semaphore 획득 (빈 자리가 없으면 대기)
sem <- struct{}{}

// 작업 완료 후: semaphore 해제
defer func() { <-sem }()
```

이렇게 하면 동시에 실행되는 goroutine 수가 `maxWorkers`를 초과하지 않는다. 6편에서 다뤘던 Semaphore 패턴의 실전 적용이다.

#### time.Ticker로 Rate Limiting

외부 서버에 너무 빠르게 요청을 보내면 IP가 차단될 수 있다. `time.Ticker`로 요청 간 최소 간격을 보장한다.

```go
ticker := time.NewTicker(c.rateLimit)
defer ticker.Stop()

// 루프 안에서 ticker를 기다림
case <-ticker.C:
    // rate limit 간격만큼 대기 후 다음 요청 진행
```

#### sync.Map으로 방문한 URL 관리 (중복 방지)

여러 goroutine이 동시에 URL을 처리하므로, 방문 여부를 확인하는 자료구조도 동시성 안전해야 한다. `sync.Map`의 `LoadOrStore`는 원자적으로 "확인 후 저장"을 수행한다.

```go
if _, loaded := c.visited.LoadOrStore(u, true); loaded {
    continue // 이미 방문한 URL
}
```

일반 `map`에 `Mutex`를 걸어도 되지만, 읽기가 많고 키 집합이 안정적인 경우 `sync.Map`이 더 효율적이다.

#### sync.Mutex로 결과 수집 보호

여러 goroutine이 동시에 `results` 슬라이스에 append하면 race condition이 발생한다. `sync.Mutex`로 보호한다.

```go
c.resultsMu.Lock()
c.results = append(c.results, result)
c.resultsMu.Unlock()
```

### fetch 메서드와 HTML 파싱

개별 URL을 가져오는 `fetch` 메서드는 context를 HTTP 요청에 전달하여 취소를 지원한다.

```go
func (c *Crawler) fetch(ctx context.Context, url string) Result {
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return Result{URL: url, Err: fmt.Errorf("request 생성 실패: %w", err)}
    }

    resp, err := c.client.Do(req)
    if err != nil {
        return Result{URL: url, Err: fmt.Errorf("fetch 실패: %w", err)}
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return Result{URL: url, Err: fmt.Errorf("body 읽기 실패: %w", err)}
    }

    title := extractTitle(string(body))
    links := extractLinks(string(body))

    return Result{
        URL:   url,
        Title: title,
        Links: links,
    }
}
```

HTML에서 title과 link를 추출하는 헬퍼 함수도 간단한 정규식으로 구현한다.

```go
func extractTitle(html string) string {
    re := regexp.MustCompile(`<title>(.*?)</title>`)
    matches := re.FindStringSubmatch(html)
    if len(matches) > 1 {
        return matches[1]
    }
    return ""
}

func extractLinks(html string) []string {
    re := regexp.MustCompile(`href="(https?://[^"]+)"`)
    matches := re.FindAllStringSubmatch(html, -1)
    var links []string
    for _, m := range matches {
        if len(m) > 1 {
            links = append(links, m[1])
        }
    }
    return links
}
```

### 테스트: httptest.NewServer로 테스트 서버 구성

외부 서버에 의존하지 않고 크롤러를 테스트하려면 `httptest.NewServer`를 사용한다. 이전 편에서 다뤘던 httptest 패턴의 실전 적용이다.

#### 기본 크롤링 테스트

3개 페이지를 가진 테스트 서버를 구성하고 모두 크롤링되는지 확인한다.

```go
func TestCrawlerBasic(t *testing.T) {
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, `<html><title>Home</title><body>
            <a href="/page1">Page 1</a>
            <a href="/page2">Page 2</a>
        </body></html>`)
    })
    mux.HandleFunc("/page1", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, `<html><title>Page 1</title><body>Content 1</body></html>`)
    })
    mux.HandleFunc("/page2", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, `<html><title>Page 2</title><body>Content 2</body></html>`)
    })
    server := httptest.NewServer(mux)
    defer server.Close()

    c := NewCrawler(3, 1*time.Millisecond)
    ctx := context.Background()

    urls := []string{
        server.URL + "/",
        server.URL + "/page1",
        server.URL + "/page2",
    }

    results := c.Crawl(ctx, urls)

    assert.Equal(t, 3, len(results))
    for _, r := range results {
        assert.NoError(t, r.Err)
        assert.NotEmpty(t, r.Title)
    }
}
```

#### 취소 테스트

`context.WithTimeout`으로 50ms timeout을 설정하고, 각 요청이 100ms 걸리는 느린 서버에 크롤링을 시도한다. timeout으로 인해 일부 요청만 처리되거나 에러가 발생해야 한다.

```go
func TestCrawlerWithCancel(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(100 * time.Millisecond) // 느린 서버
        fmt.Fprint(w, `<html><title>Slow</title></html>`)
    }))
    defer server.Close()

    c := NewCrawler(2, 1*time.Millisecond)
    ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
    defer cancel()

    urls := []string{
        server.URL + "/1",
        server.URL + "/2",
        server.URL + "/3",
        server.URL + "/4",
        server.URL + "/5",
    }

    results := c.Crawl(ctx, urls)

    // timeout으로 인해 일부만 처리됨 (또는 모두 에러)
    t.Logf("처리된 결과 수: %d", len(results))
    for _, r := range results {
        if r.Err != nil {
            t.Logf("URL: %s, Error: %v", r.URL, r.Err)
        }
    }
}
```

#### 중복 URL 테스트

같은 URL을 3번 전달해도 실제 HTTP 요청은 1번만 발생해야 한다.

```go
func TestCrawlerDuplicateURL(t *testing.T) {
    callCount := 0
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        callCount++
        fmt.Fprint(w, `<html><title>Test</title></html>`)
    }))
    defer server.Close()

    c := NewCrawler(3, 1*time.Millisecond)
    ctx := context.Background()

    urls := []string{
        server.URL + "/page",
        server.URL + "/page", // 중복
        server.URL + "/page", // 중복
    }

    results := c.Crawl(ctx, urls)
    assert.Equal(t, 1, len(results)) // 1번만 크롤링
    assert.Equal(t, 1, callCount)
}
```

#### 링크 추출 테스트

HTML에서 `https://`로 시작하는 절대 경로 링크만 추출되는지 확인한다. 상대 경로(`/relative`)는 추출되지 않아야 한다.

```go
func TestCrawlerLinkExtraction(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, `<html><title>Links</title><body>
            <a href="https://example.com/a">A</a>
            <a href="https://example.com/b">B</a>
            <a href="/relative">Relative</a>
        </body></html>`)
    }))
    defer server.Close()

    c := NewCrawler(1, 1*time.Millisecond)
    ctx := context.Background()

    results := c.Crawl(ctx, []string{server.URL + "/"})

    assert.Equal(t, 1, len(results))
    assert.Equal(t, "Links", results[0].Title)
    assert.Equal(t, 2, len(results[0].Links)) // https:// 링크만 추출
    assert.Equal(t, "https://example.com/a", results[0].Links[0])
    assert.Equal(t, "https://example.com/b", results[0].Links[1])
}
```

### 크롤러 동시성 패턴 요약

```
┌─────────────────────────────────────────────────────────────┐
│                   동시성 웹 크롤러 구조                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌──────────┐    ┌──────────────────────┐   │
│  │ URL List │───>│ Ticker   │───>│ sync.Map (visited)   │   │
│  └─────────┘    │ (rate    │    │ 중복 URL 필터링         │   │
│                 │  limit)  │    └──────────┬───────────┘   │
│                 └──────────┘               │               │
│                                            v               │
│                 ┌─────────────────────────────────────┐    │
│                 │   Semaphore (buffered channel)       │    │
│                 │   maxWorkers개까지 동시 실행           │    │
│                 └────────┬──────────┬──────────┬──────┘    │
│                          │          │          │           │
│                    ┌─────v┐   ┌─────v┐   ┌─────v┐         │
│                    │fetch │   │fetch │   │fetch │         │
│                    │(ctx) │   │(ctx) │   │(ctx) │         │
│                    └──┬───┘   └──┬───┘   └──┬───┘         │
│                       │          │          │              │
│                       v          v          v              │
│                 ┌─────────────────────────────────────┐    │
│                 │   sync.Mutex (results 보호)          │    │
│                 │   []Result에 안전하게 append          │    │
│                 └─────────────────────────────────────┘    │
│                                                             │
│  context.Done() → 전체 크롤링 취소                           │
└─────────────────────────────────────────────────────────────┘
```

## 실전 프로젝트 2: Graceful Shutdown

프로덕션 서버에서 배포나 재시작이 발생할 때, 서버를 즉시 종료하면 진행 중인 요청이 실패한다. Graceful Shutdown은 **새 요청은 거부하되, 진행 중인 요청은 완료될 때까지 기다린 후 종료**하는 패턴이다.

### HTTP 서버의 Graceful Shutdown이 필요한 이유

서버 종료 시 발생할 수 있는 문제를 생각해보자.

- 사용자가 결제 요청을 보냈는데, 서버가 갑자기 종료되면 결제는 처리되었지만 응답을 받지 못한다
- DB 트랜잭션이 진행 중인데 서버가 종료되면 데이터 정합성이 깨질 수 있다
- WebSocket 연결이 갑자기 끊기면 클라이언트가 재연결 로직을 실행해야 한다

Graceful Shutdown은 이런 문제를 방지한다.

```
┌─────────────────────────────────────────────────────┐
│              Graceful Shutdown 흐름                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. SIGTERM/SIGINT 수신                              │
│          │                                          │
│          v                                          │
│  2. 새 연결 수락 중지 (리스너 닫기)                     │
│          │                                          │
│          v                                          │
│  3. 진행 중인 요청 완료 대기                            │
│          │                                          │
│          v                                          │
│  4. shutdown timeout 초과 시 강제 종료                 │
│          │                                          │
│          v                                          │
│  5. 서버 종료 완료                                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Server 구조체 설계

```go
type Server struct {
    httpServer *http.Server
    mux        *http.ServeMux
}

func NewServer(addr string) *Server {
    mux := http.NewServeMux()

    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "Hello, World!")
    })

    mux.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(2 * time.Second) // 느린 요청 시뮬레이션
        fmt.Fprintln(w, "Slow response done")
    })

    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprintln(w, "OK")
    })

    return &Server{
        httpServer: &http.Server{
            Addr:    addr,
            Handler: mux,
        },
        mux: mux,
    }
}
```

`/slow` 핸들러는 2초 걸리는 요청을 시뮬레이션한다. Graceful Shutdown이 제대로 동작하면, shutdown 시점에 `/slow` 요청이 진행 중이더라도 2초가 지나 응답이 완료된 후에 서버가 종료된다.

### http.Server.Shutdown() 동작 방식

Go 표준 라이브러리의 `http.Server`는 `Shutdown` 메서드를 제공한다. 이 메서드의 동작 방식은 다음과 같다.

1. 열려 있는 리스너를 즉시 닫는다 (새 연결 수락 중지)
2. idle 상태의 연결을 닫는다
3. 활성 연결이 idle 상태가 될 때까지 기다린다 (진행 중인 요청 완료 대기)
4. context가 만료되면 에러를 반환한다

```go
func (s *Server) Start(listener net.Listener) error {
    return s.httpServer.Serve(listener)
}

func (s *Server) Shutdown(ctx context.Context) error {
    return s.httpServer.Shutdown(ctx)
}
```

`Serve`는 `http.ErrServerClosed`를 반환하면 정상 종료된 것이다. 이 에러를 별도로 처리해야 한다.

### signal.NotifyContext 패턴

실제 프로덕션에서는 OS 시그널(SIGTERM, SIGINT)을 받아 graceful shutdown을 트리거한다. Go 1.16부터 `signal.NotifyContext`를 사용하면 시그널과 context를 깔끔하게 연결할 수 있다.

```go
func main() {
    // SIGINT, SIGTERM 수신 시 context 취소
    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    srv := NewServer(":8080")

    // 서버를 goroutine으로 시작
    go func() {
        if err := srv.Start(listener); err != http.ErrServerClosed {
            log.Fatalf("server error: %v", err)
        }
    }()

    // 시그널 대기
    <-ctx.Done()
    log.Println("shutdown signal received")

    // shutdown timeout 설정
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    if err := srv.Shutdown(shutdownCtx); err != nil {
        log.Fatalf("shutdown error: %v", err)
    }
    log.Println("server gracefully stopped")
}
```

핵심 포인트는 다음과 같다.

- `signal.NotifyContext`는 지정한 시그널을 받으면 context를 자동으로 취소한다
- `<-ctx.Done()`으로 시그널을 기다린다
- shutdown에도 별도 timeout을 설정하여 무한 대기를 방지한다

### 테스트: 기본 Graceful Shutdown

```go
func TestGracefulShutdown(t *testing.T) {
    listener, err := net.Listen("tcp", "127.0.0.1:0")
    assert.NoError(t, err)
    addr := listener.Addr().String()

    srv := NewServer(addr)

    go func() {
        if err := srv.Start(listener); err != http.ErrServerClosed {
            t.Errorf("unexpected error: %v", err)
        }
    }()

    time.Sleep(50 * time.Millisecond)

    // health check로 서버 정상 동작 확인
    resp, err := http.Get("http://" + addr + "/health")
    assert.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)
    resp.Body.Close()

    // graceful shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    err = srv.Shutdown(ctx)
    assert.NoError(t, err)
}
```

`net.Listen("tcp", "127.0.0.1:0")`으로 랜덤 포트를 사용하여 테스트 간 포트 충돌을 방지한다.

### 테스트: 진행 중인 요청 완료 후 종료

Graceful Shutdown의 핵심은 진행 중인 요청이 완료된 후에 서버가 종료되는 것이다.

```go
func TestGracefulShutdownWithPendingRequests(t *testing.T) {
    listener, err := net.Listen("tcp", "127.0.0.1:0")
    assert.NoError(t, err)
    addr := listener.Addr().String()

    srv := NewServer(addr)

    go func() {
        if err := srv.Start(listener); err != http.ErrServerClosed {
            t.Errorf("unexpected error: %v", err)
        }
    }()

    time.Sleep(50 * time.Millisecond)

    var wg sync.WaitGroup
    var slowResp string

    // 느린 요청 시작 (2초 소요)
    wg.Add(1)
    go func() {
        defer wg.Done()
        resp, err := http.Get("http://" + addr + "/slow")
        if err != nil {
            t.Logf("slow request error: %v", err)
            return
        }
        defer resp.Body.Close()
        body, _ := io.ReadAll(resp.Body)
        slowResp = string(body)
    }()

    // 느린 요청이 시작된 후 shutdown
    time.Sleep(100 * time.Millisecond)

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    err = srv.Shutdown(ctx)
    assert.NoError(t, err)

    wg.Wait()

    // 진행 중이던 요청이 완료되었는지 확인
    if slowResp != "" {
        assert.Contains(t, slowResp, "Slow response done")
    }
}
```

shutdown timeout(5초)이 요청 처리 시간(2초)보다 길기 때문에, 진행 중이던 `/slow` 요청이 정상적으로 완료된 후 서버가 종료된다.

### 테스트: Shutdown Timeout 초과 시 강제 종료

shutdown timeout이 너무 짧으면 진행 중인 요청을 기다리지 못하고 `context deadline exceeded` 에러가 발생한다.

```go
func TestShutdownTimeout(t *testing.T) {
    listener, err := net.Listen("tcp", "127.0.0.1:0")
    assert.NoError(t, err)
    addr := listener.Addr().String()

    srv := NewServer(addr)

    go func() {
        if err := srv.Start(listener); err != http.ErrServerClosed {
            t.Errorf("unexpected error: %v", err)
        }
    }()

    time.Sleep(50 * time.Millisecond)

    // 느린 요청 시작 (2초 소요)
    go func() {
        http.Get("http://" + addr + "/slow")
    }()

    time.Sleep(100 * time.Millisecond)

    // 아주 짧은 timeout (100ms)으로 shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer cancel()

    err = srv.Shutdown(ctx)
    assert.Error(t, err) // context deadline exceeded
    t.Logf("shutdown timeout: %v", err)
}
```

이 테스트는 `/slow` 요청이 2초 걸리는데 shutdown timeout이 100ms이므로, `Shutdown`이 `context.DeadlineExceeded` 에러를 반환한다.

### 테스트: Signal 패턴 시뮬레이션

실제 OS 시그널 대신 `context.WithCancel`로 시그널 수신을 시뮬레이션한다.

```go
func TestSignalPattern(t *testing.T) {
    ctx, cancel := context.WithCancel(context.Background())

    listener, err := net.Listen("tcp", "127.0.0.1:0")
    assert.NoError(t, err)
    addr := listener.Addr().String()

    srv := NewServer(addr)

    serverDone := make(chan struct{})
    go func() {
        defer close(serverDone)
        if err := srv.Start(listener); err != http.ErrServerClosed {
            t.Errorf("unexpected error: %v", err)
        }
    }()

    time.Sleep(50 * time.Millisecond)

    // health check
    resp, err := http.Get("http://" + addr + "/health")
    assert.NoError(t, err)
    resp.Body.Close()

    // "시그널" 수신 시뮬레이션
    cancel()

    // shutdown 처리
    go func() {
        <-ctx.Done()
        shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer shutdownCancel()
        srv.Shutdown(shutdownCtx)
    }()

    // 서버 종료 대기
    select {
    case <-serverDone:
        t.Log("signal 패턴으로 서버 gracefully 종료됨")
    case <-time.After(3 * time.Second):
        t.Fatal("서버가 시간 내에 종료되지 않음")
    }
}
```

이 테스트의 핵심은 `cancel()` 호출이 실제 프로덕션 환경의 SIGTERM 수신과 동일한 흐름을 트리거한다는 것이다. `ctx.Done()` channel이 닫히면 별도 goroutine에서 `Shutdown`을 호출하고, `serverDone` channel로 서버 종료 완료를 확인한다.

## Best Practices 정리

이 시리즈에서 다뤘던 내용을 바탕으로, Go 동시성 프로그래밍의 핵심 Best Practices를 정리한다.

### Goroutine: 생성한 곳에서 lifecycle 관리

goroutine을 시작하면 반드시 종료 조건도 함께 설계해야 한다. "fire and forget" 방식은 goroutine 누수의 주요 원인이다.

```go
// Bad - goroutine이 언제 종료되는지 알 수 없다
go func() {
    for {
        doWork()
    }
}()

// Good - context로 종료를 제어한다
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            doWork()
        }
    }
}()
```

### Channel: 생산자가 close, 소비자는 close 금지

channel을 close하는 책임은 항상 **데이터를 보내는 쪽(생산자)**에 있다. 소비자가 channel을 close하면 생산자가 closed channel에 write하여 panic이 발생한다.

```go
// Good - 생산자가 close
func producer() <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch) // 생산자가 close
        for i := 0; i < 10; i++ {
            ch <- i
        }
    }()
    return ch
}

// 소비자는 range로 읽기만 한다
for v := range producer() {
    fmt.Println(v)
}
```

### Context: 함수 첫 번째 파라미터, cancel은 반드시 defer 호출

Go 공식 컨벤션에 따라 context는 함수의 첫 번째 파라미터로 전달하고, struct에 저장하지 않는다. 파생 context의 cancel 함수는 반드시 호출해야 리소스가 정리된다.

```go
// Good
func FetchData(ctx context.Context, url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel() // 반드시 defer로 호출

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    // ...
}

// Bad - cancel을 호출하지 않으면 리소스 누수
func FetchData(ctx context.Context, url string) ([]byte, error) {
    ctx, _ = context.WithTimeout(ctx, 5*time.Second)
    // cancel이 호출되지 않아 timer가 leak된다!
}
```

### Sync: 필요한 최소 범위만 lock

Mutex의 lock 범위는 가능한 한 좁게 유지한다. 넓은 범위의 lock은 동시성 성능을 저하시킨다.

```go
// Bad - I/O 작업까지 lock 범위에 포함
mu.Lock()
data := fetchFromDB() // 느린 I/O
cache[key] = data
mu.Unlock()

// Good - 공유 자원 접근만 lock
data := fetchFromDB() // lock 밖에서 I/O
mu.Lock()
cache[key] = data     // 공유 자원만 보호
mu.Unlock()
```

읽기가 쓰기보다 훨씬 많은 경우 `sync.RWMutex`를 사용하면 읽기 작업의 동시성을 유지할 수 있다.

### Error: goroutine 에러는 channel 또는 errgroup으로 전달

goroutine 안에서 발생한 에러는 자동으로 전파되지 않는다. 명시적으로 channel이나 errgroup을 사용해야 한다.

```go
// errgroup 패턴 (추천)
g, ctx := errgroup.WithContext(ctx)

for _, url := range urls {
    g.Go(func() error {
        return fetchURL(ctx, url)
    })
}

if err := g.Wait(); err != nil {
    // 첫 번째 에러 반환, 나머지 goroutine은 ctx를 통해 취소
    log.Fatal(err)
}
```

### Testing: 항상 -race 플래그 사용

동시성 코드는 반드시 race detector와 함께 테스트해야 한다. race condition은 일반 테스트에서는 발견되지 않을 수 있다.

```bash
# 모든 테스트에 -race 적용
go test -race ./...

# CI/CD 파이프라인에서도 필수
go test -race -count=1 ./...
```

### Best Practices 요약 표

| 영역 | Best Practice | 안티패턴 |
|------|--------------|---------|
| goroutine | 생성한 곳에서 lifecycle 관리 | fire and forget |
| channel | 생산자가 close | 소비자가 close |
| context | 첫 번째 파라미터, defer cancel() | struct에 저장, cancel 누락 |
| sync | 최소 범위 lock | I/O 포함한 넓은 lock |
| error | channel/errgroup으로 전달 | log.Println 후 무시 |
| testing | -race 플래그 필수 | race detector 없이 테스트 |

## 시리즈 요약

전체 시리즈에서 다룬 내용을 한눈에 정리한다.

| 편 | 제목 | 핵심 내용 |
|----|------|----------|
| 1편 | Goroutine 기초 | goroutine 생성, WaitGroup, 동시 실행 원리 |
| 2편 | Channel 완전 정복 | unbuffered/buffered channel, 방향 지정, close |
| 3편 | Select와 Channel 심화 | select 문, timeout, non-blocking, fan-in/fan-out |
| 4편 | Sync 패키지 | Mutex, RWMutex, Once, WaitGroup, sync.Map |
| 5편 | Context 완벽 가이드 | WithCancel, WithTimeout, WithDeadline, WithValue |
| 6편 | 동시성 패턴 실전 | Worker Pool, Pipeline, Semaphore, Rate Limiting, Pub/Sub |
| 7편 | 에러 처리 전략 | error channel, errgroup, errors.Join, panic recover |
| 8편 | 동시성 테스팅 | race detector, goroutine 테스트, httptest |
| 9편 | 성능 최적화 | pprof, trace, sync.Pool, atomic, 벤치마크 |
| 10편 | 실전 프로젝트와 Best Practices | 웹 크롤러, Graceful Shutdown, 종합 정리 |

## 정리

이 시리즈를 통해 Go 동시성 프로그래밍의 기초부터 실전까지 살펴봤다. 마지막으로 핵심을 요약하면 다음과 같다.

- **goroutine은 가볍지만, 관리는 필수다.** 생성한 goroutine은 반드시 종료 조건을 설계해야 한다.
- **channel은 통신을 위한 도구다.** "메모리를 공유하지 말고, 통신으로 메모리를 공유하라"는 Go의 철학을 따르되, 상황에 맞는 도구를 선택한다.
- **context는 동시성의 중추다.** 취소, timeout, 값 전달을 하나의 인터페이스로 관리한다.
- **패턴을 알면 복잡도가 낮아진다.** Worker Pool, Pipeline, Semaphore 등 검증된 패턴을 활용한다.
- **테스트와 도구를 적극 활용한다.** race detector, pprof, trace는 동시성 버그를 찾는 데 필수다.

## 참고 자료

- [Effective Go - Concurrency](https://go.dev/doc/effective_go#concurrency)
- [Go Concurrency Patterns](https://go.dev/talks/2012/concurrency.slide)
- [Advanced Go Concurrency Patterns](https://go.dev/talks/2013/advconc.slide)
- [Go Blog - Context](https://go.dev/blog/context)
- [Go Blog - Pipelines and Cancellation](https://go.dev/blog/pipelines)
- [Go Blog - Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [http.Server.Shutdown - Go Documentation](https://pkg.go.dev/net/http#Server.Shutdown)
- [signal.NotifyContext - Go Documentation](https://pkg.go.dev/os/signal#NotifyContext)
