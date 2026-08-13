---
title: "Go에서 시간 의존 코드 테스트하기 (Testing Time-Dependent Code in Go)"
description: "time.Now()를 직접 호출하는 코드는 테스트하기 어렵다. 시간을 파라미터로 받기, nowFunc 필드 주입, clockwork Clock 인터페이스, Go 1.25의 testing/synctest까지 시간 의존 코드를 테스트하는 4가지 패턴을 예제 코드와 함께 알아봅니다."
date: 2026-08-12
update: 2026-08-12
tags:
  - golang
  - go
  - testing
  - time
  - clockwork
  - synctest
  - unit-test
  - 테스트
  - 시간
---

쿠폰 만료 검사, 주문 생성 시각 기록, TTL 캐시. 흔한 기능이지만 셋 다 `time.Now()`를 품고 있다.
`time.Now()`를 직접 호출하는 코드는 실행할 때마다 결과가 달라지므로, "만료 1초 전에는 유효하고 만료 시각부터는 무효" 같은 경계 조건을 테스트로 고정할 방법이 마땅치 않다.
결국 테스트에 `time.Sleep`을 넣고 실제 시간이 흐르기를 기다리게 되는데, 이런 테스트는 느리고 CI 환경에 따라 간헐적으로 깨진다(flaky).

이 글에서는 시간 의존 코드를 테스트하는 4가지 패턴을 점진적으로 살펴본다.
시간을 파라미터로 받는 가장 단순한 방법부터, `nowFunc` 필드 주입, clockwork 라이브러리의 Clock 인터페이스, 그리고 Go 1.25에 추가된 `testing/synctest`까지 각 패턴이 이전 패턴의 어떤 한계를 해결하는지 예제 코드와 함께 알아본다.

> 참고 자료
> - [예제 전체 코드 (tutorials-go)](https://github.com/kenshin579/tutorials-go/tree/master/golang/testing/clock)
> - [jonboulle/clockwork](https://github.com/jonboulle/clockwork)
> - [testing/synctest 패키지 문서](https://pkg.go.dev/testing/synctest)
> - [Testing Time (Go Blog: synctest)](https://go.dev/blog/synctest)

# 1. 시간 의존 코드가 테스트하기 어려운 이유

## 1.1 흔한 안티패턴

`time.Now()`를 직접 호출하는 TTL 캐시가 있다고 하자. 만료를 검증하려면 테스트가 실제로 TTL만큼 기다리는 수밖에 없다.

```go
// 나쁜 예: 실제 시간이 흐르기를 기다리는 테스트
func Test_Cache_만료(t *testing.T) {
	cache := NewCache(100 * time.Millisecond) // 내부에서 time.Now() 직접 호출

	cache.Set("key", "value")
	time.Sleep(150 * time.Millisecond) // 실제로 150ms를 기다린다

	_, ok := cache.Get("key")
	assert.False(t, ok)
}
```

이 테스트에는 세 가지 문제가 있다.
첫째, 느리다.
TTL을 짧게 줄여도 테스트마다 수십~수백 ms가 쌓이고, 프로덕션과 같은 값(10분 등)으로는 아예 테스트할 수 없다.
둘째, flaky하다.
CI 머신의 부하에 따라 `Sleep`이 깨어나는 시점과 만료 판정 시점의 간격이 어긋나, 어제는 통과하던 테스트가 오늘은 깨진다.
셋째, 만료 경계 정각(`now == expiresAt`) 같은 정밀한 조건은 실제 시계로는 아예 재현이 불가능하다.

날짜 기반 로직도 마찬가지다. "이번 달 말일까지 유효한 쿠폰" 검사를 `time.Now()`로 구현하면, 그 테스트는 월말에 실행하느냐 월초에 실행하느냐에 따라 결과가 달라진다.

## 1.2 해결의 공통 원리

네 가지 패턴 모두 원리는 하나다.
**시간을 코드 안에서 얻지 말고 밖에서 주입받는다.** `time.Now()`라는 전역 함수 호출을 파라미터, 함수 필드, 인터페이스 중 하나로 바꾸면 테스트가 시간을 통제할 수 있게 된다.
마지막 패턴인 `testing/synctest`는 반대로 코드를 그대로 두고 테스트 실행 환경 쪽에서 시간을 가상화하는 접근이다.

패턴마다 코드에 손대는 정도가 다를 뿐이므로, 가장 가벼운 것부터 순서대로 보자.

# 2. 패턴 1: 시간을 파라미터로 받기

## 2.1 쿠폰 만료 검사 예제

가장 단순한 방법은 함수가 "지금"을 인자로 받는 것이다. 쿠폰 만료 검사를 이렇게 구현한다.

```go
package clock

import "time"

// Coupon은 만료 시각을 가진 쿠폰이다.
type Coupon struct {
	Code      string
	ExpiresAt time.Time
}

// IsExpiredAt은 주어진 시각 기준으로 쿠폰 만료 여부를 반환한다.
// 시간을 파라미터로 받는 순수 함수라서 실행 시점과 무관하게 테스트할 수 있다.
func (c Coupon) IsExpiredAt(now time.Time) bool {
	return now.After(c.ExpiresAt)
}
```

`IsExpiredAt`은 입력이 같으면 출력이 항상 같은 순수 함수다.
프로덕션 코드는 `coupon.IsExpiredAt(time.Now())`처럼 호출 시점에 현재 시각을 넘기고, 테스트는 원하는 시각을 마음대로 넘기면 된다.

## 2.2 테이블 드리븐 테스트로 경계값 검증

시간을 파라미터로 받으면 테이블 드리븐 테스트와 궁합이 좋다. 만료 경계를 1초 단위로 오가며 검증한다.

```go
package clock

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func Test_Coupon_IsExpiredAt_경계값(t *testing.T) {
	expiresAt := time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC)
	coupon := Coupon{Code: "WELCOME10", ExpiresAt: expiresAt}

	tests := []struct {
		name    string
		now     time.Time
		expired bool
	}{
		{"만료 1초 전", expiresAt.Add(-time.Second), false},
		{"만료 시각과 동일", expiresAt, false},
		{"만료 1초 후", expiresAt.Add(time.Second), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expired, coupon.IsExpiredAt(tt.now))
		})
	}
}
```

눈여겨볼 것은 "만료 시각과 동일" 케이스다.
`now.After(expiresAt)`는 두 시각이 정확히 같으면 `false`를 반환하므로, 만료 시각 정각의 쿠폰은 **아직 유효**하다.
이 경계 포함 여부는 구현자가 `After`를 쓰느냐 `!Before`를 쓰느냐에 따라 소리 없이 뒤집히는 부분이라, 이렇게 테스트 케이스로 명시해서 고정해 두는 것이 좋다.
실제 시계였다면 "정확히 만료 시각인 순간"을 재현하는 것 자체가 불가능하다.

## 2.3 한계

이 패턴의 약점은 콜스택이 깊어질 때 드러난다.
만료 검사가 핸들러 → 서비스 → 도메인 로직처럼 여러 층을 거쳐 호출된다면, 모든 중간 계층이 `now`를 인자로 받아 그대로 아래로 전달해야 한다.
시간이 함수 하나가 아니라 객체의 여러 메서드에 걸쳐 쓰인다면 시그니처마다 `now`가 번지기 시작한다.

시간이 필요한 곳이 구조체 안이라면, 파라미터 대신 구조체에 시간의 출처를 심어두는 편이 낫다.

# 3. 패턴 2: nowFunc 필드 주입

## 3.1 OrderService에 nowFunc 필드

구조체에 `func() time.Time` 타입 필드를 하나 두고, 기본값으로 `time.Now`를 넣는다. 주문 생성 시각을 기록하는 서비스 예제다.

```go
package clock

import "time"

// Order는 생성 시각이 기록되는 주문이다.
type Order struct {
	ID        string
	CreatedAt time.Time
}

// OrderService는 주문을 생성하는 서비스다.
// nowFunc 필드로 현재 시각 함수를 주입받아 테스트에서 시간을 고정할 수 있다.
// 인터페이스 없이 함수 필드 하나로 해결하는 가장 가벼운 주입 패턴이다.
type OrderService struct {
	nowFunc func() time.Time
}

// NewOrderService는 실제 시간(time.Now)을 사용하는 OrderService를 생성한다.
func NewOrderService() *OrderService {
	return &OrderService{nowFunc: time.Now}
}

// CreateOrder는 현재 시각을 생성 시각으로 기록한 주문을 만든다.
func (s *OrderService) CreateOrder(id string) Order {
	return Order{ID: id, CreatedAt: s.nowFunc()}
}
```

프로덕션 경로는 `NewOrderService()`를 쓰므로 아무것도 달라지지 않는다.
`time.Now` 자체가 `func() time.Time` 시그니처라서 그대로 필드에 대입할 수 있다는 점이 이 패턴을 가볍게 만든다.
인터페이스도, 외부 의존성도 없다.

## 3.2 테스트에서 고정 시간 주입

테스트는 생성자를 우회해 `nowFunc`에 고정 시각을 반환하는 클로저를 넣는다.

```go
func Test_OrderService_고정_시간_주입(t *testing.T) {
	fixed := time.Date(2026, 8, 12, 9, 30, 0, 0, time.UTC)
	svc := &OrderService{nowFunc: func() time.Time { return fixed }}

	order := svc.CreateOrder("order-1")

	assert.Equal(t, fixed, order.CreatedAt)
}
```

이제 `CreatedAt`을 `assert.Equal`로 **정확히** 비교할 수 있다. 시간이 고정되어 있으니 오차 허용 같은 타협이 필요 없다.

단, `nowFunc`는 unexported 필드라 이렇게 직접 주입하는 것은 같은 패키지의 테스트(white-box 테스트)에서만 가능하다.
`clock_test` 같은 별도 패키지에서 black-box로 테스트하거나 다른 패키지에서 이 서비스를 쓰는 테스트라면, `WithNowFunc` 같은 옵션 함수를 export 하거나 다음 절의 차선책을 써야 한다.

## 3.3 주입 불가 시 차선책 - assert.WithinDuration

시간을 주입할 수 없는 상황(레거시 코드, 외부 패키지, black-box 테스트)이라면 정확한 일치 대신 오차 허용 비교로 물러설 수 있다. testify의 `assert.WithinDuration`이 그 용도다.

```go
func Test_OrderService_주입_없이_WithinDuration_검증(t *testing.T) {
	svc := NewOrderService()

	order := svc.CreateOrder("order-2")

	// 시간을 주입할 수 없을 때의 차선책: 정확한 일치 대신 오차 허용 비교
	assert.WithinDuration(t, time.Now(), order.CreatedAt, time.Second)
}
```

"생성 시각이 지금으로부터 1초 이내"라는 느슨한 검증이다.
`WithinDuration`이 시간을 주입하거나 값을 채워주는 것은 아니다. `CreatedAt`은 여전히 서비스 내부의 `time.Now`가 기록하고, 이 단언은 두 시각의 차이를 사후에 비교만 한다.
값 자체를 못 박지는 못하지만, `CreatedAt`이 채워지긴 하는지 정도는 확인할 수 있다.
어디까지나 주입이 불가능할 때의 차선책이다.

## 3.4 한계

경험상 대부분의 시간 의존 코드는 이 패턴으로 충분하다.
"지금이 언제인지 한 번 묻고 기록하는" 코드가 실무의 다수이기 때문이다.
하지만 `nowFunc`가 대체하는 것은 `time.Now()` 하나뿐이다.
TTL 캐시처럼 시간이 **흘러야** 검증되는 로직("10분 뒤에 만료되는가")은 고정 시각 하나로는 표현할 수 없고, `time.Sleep`, `time.After`, `time.Ticker`까지 얽히면 함수 필드 하나로는 감당이 안 된다.

시간의 "흐름" 자체를 시뮬레이션하려면 시계를 통째로 추상화해야 한다.

# 4. 패턴 3: Clock 인터페이스 주입 (clockwork)

## 4.1 TTL 캐시 예제 - 시간이 흘러야 검증되는 로직

[jonboulle/clockwork](https://github.com/jonboulle/clockwork)는 `Now()`, `Sleep()`, `After()`, `NewTicker()` 등을 묶은 `Clock` 인터페이스와, 시간을 수동으로 진행시킬 수 있는 `FakeClock` 구현을 제공한다.
TTL 캐시에 이 인터페이스를 주입한다.

```go
package clock

import (
	"sync"
	"time"

	"github.com/jonboulle/clockwork"
)

type cacheItem struct {
	value     string
	expiresAt time.Time
}

// TTLCache는 TTL이 지나면 항목이 만료되는 인메모리 캐시다.
// clockwork.Clock을 주입받아 테스트에서 가짜 시계로 시간을 "진행"시킬 수 있다.
// nowFunc 주입(패턴 2)과 달리 시간이 흘러야 검증되는 로직에 적합하다.
type TTLCache struct {
	clock clockwork.Clock
	ttl   time.Duration

	mu    sync.Mutex
	items map[string]cacheItem
}

// NewTTLCache는 주어진 시계와 TTL로 캐시를 생성한다.
// 프로덕션에서는 clockwork.NewRealClock()을 전달한다.
func NewTTLCache(clock clockwork.Clock, ttl time.Duration) *TTLCache {
	return &TTLCache{
		clock: clock,
		ttl:   ttl,
		items: make(map[string]cacheItem),
	}
}

// Set은 key에 value를 저장하고 TTL 이후 만료되도록 기록한다.
func (c *TTLCache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = cacheItem{
		value:     value,
		expiresAt: c.clock.Now().Add(c.ttl),
	}
}

// Get은 key의 값을 반환한다. 항목이 없거나 만료됐으면 false를 반환한다.
func (c *TTLCache) Get(key string) (string, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	it, ok := c.items[key]
	if !ok {
		return "", false
	}
	// now >= expiresAt이면 만료
	if !c.clock.Now().Before(it.expiresAt) {
		delete(c.items, key)
		return "", false
	}
	return it.value, true
}
```

`time.Now()` 대신 `c.clock.Now()`를 호출한다는 것 말고는 평범한 캐시다. 프로덕션에서는 `clockwork.NewRealClock()`을 넘기면 실제 시계로 동작한다.

## 4.2 fakeClock.Advance()로 시간 진행 시뮬레이션

테스트에서는 `FakeClock`을 주입하고 `Advance()`로 가상 시간을 원하는 만큼 진행시킨다.

```go
package clock

import (
	"testing"
	"time"

	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
)

func Test_TTLCache_가짜_시계로_만료_검증(t *testing.T) {
	fakeClock := clockwork.NewFakeClock()
	cache := NewTTLCache(fakeClock, 10*time.Minute)

	cache.Set("session", "user-42")

	// TTL 직전: 아직 살아있다
	fakeClock.Advance(10*time.Minute - time.Second)
	v, ok := cache.Get("session")
	assert.True(t, ok)
	assert.Equal(t, "user-42", v)

	// TTL 경과: 만료된다 (실제로 10분을 기다리지 않는다)
	fakeClock.Advance(time.Second)
	_, ok = cache.Get("session")
	assert.False(t, ok)
}

func Test_TTLCache_없는_키(t *testing.T) {
	cache := NewTTLCache(clockwork.NewFakeClock(), time.Minute)

	_, ok := cache.Get("missing")

	assert.False(t, ok)
}
```

이 테스트의 흐름을 보면 패턴 2로는 왜 안 되는지가 드러난다.
한 테스트 안에서 `Advance`를 두 번 호출해 **"TTL 직전에는 살아있다"와 "TTL 정각부터는 만료된다"를 순서대로** 검증한다.
`Set` 시점의 시각과 두 번의 `Get` 시점의 시각이 모두 달라야 하는데, 고정 시각 하나를 반환하는 `nowFunc`로는 이 시나리오를 표현할 방법이 없다.
그러면서 프로덕션 TTL인 10분을 그대로 쓰고도 테스트는 즉시 끝난다.

## 4.3 언제 인터페이스까지 필요한가

Clock 인터페이스는 외부 의존성과 추상화 계층이 하나 늘어나는 비용이 있으므로 무조건 쓸 것은 아니다.
기준은 코드가 시간을 어떻게 소비하느냐다.
`Now()`를 한 번 읽고 끝나면 패턴 2로 충분하고, TTL·재시도 백오프·스케줄러처럼 시간의 경과에 반응하는 로직이거나 `Sleep`/`Ticker`/`After`까지 제어해야 하면 그때 인터페이스를 도입한다.
clockwork는 etcd 같은 프로젝트가 이미 쓰고 있어서, 직접 인터페이스를 정의하는 것보다 부담이 적다.

그런데 이 패턴에는 전제가 하나 있다. 처음부터 Clock을 주입받도록 **설계되어 있어야** 한다는 것이다. 그런 설계 없이 작성된 코드는 어떻게 할까.

# 5. 패턴 4: testing/synctest (Go 1.25+)

## 5.1 코드 수정 없이 가상 시간 버블에서 테스트

Go 1.25에서 정식 채택된 `testing/synctest` 패키지는 접근을 뒤집는다.
코드에 시계를 주입하는 대신, `synctest.Test`가 만드는 "버블" 안에서 테스트를 실행한다.
버블 안에서는 `time.Now()`와 `time.Sleep()`이 가상 시간으로 동작한다.
버블 내 모든 goroutine이 잠들어 durably blocked 상태가 되면 런타임이 가상 시계를 다음 이벤트 시각으로 즉시 점프시키므로, `time.Sleep(10 * time.Minute)`이 실제로는 기다리지 않고 끝난다.

프로덕션 코드는 한 줄도 바꾸지 않고, clockwork 같은 라이브러리도 필요 없다. 시계 주입 설계가 없는 기존 코드도 그대로 테스트할 수 있다는 뜻이다.

## 5.2 시계 주입이 없는 NaiveCache를 synctest로 테스트

이번에는 아무 주입 설계 없이 `time.Now()`를 직접 호출하는 캐시를 만든다.
1.1절의 나쁜 예와 같은, 지금까지의 패턴으로는 테스트할 수 없던 형태의 코드다.

```go
package clock

import (
	"sync"
	"time"
)

// NaiveCache는 time.Now()를 직접 호출하는 평범한 TTL 캐시다.
// 시계 주입 설계가 전혀 없어 패턴 1~3으로는 테스트할 수 없지만,
// testing/synctest 버블 안에서는 time.Now()가 가상 시간을 읽으므로
// 코드 수정 없이 그대로 테스트할 수 있다(패턴 4).
type NaiveCache struct {
	ttl time.Duration

	mu    sync.Mutex
	items map[string]cacheItem
}

// NewNaiveCache는 주어진 TTL로 캐시를 생성한다.
func NewNaiveCache(ttl time.Duration) *NaiveCache {
	return &NaiveCache{
		ttl:   ttl,
		items: make(map[string]cacheItem),
	}
}

// Set은 key에 value를 저장하고 TTL 이후 만료되도록 기록한다.
func (c *NaiveCache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = cacheItem{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
	}
}

// Get은 key의 값을 반환한다. 항목이 없거나 만료됐으면 false를 반환한다.
func (c *NaiveCache) Get(key string) (string, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	it, ok := c.items[key]
	if !ok {
		return "", false
	}
	// now >= expiresAt이면 만료
	if !time.Now().Before(it.expiresAt) {
		delete(c.items, key)
		return "", false
	}
	return it.value, true
}
```

패턴 3의 `TTLCache`와 로직은 같지만 `clock` 필드가 없다.
이 코드를 synctest 버블 안에서 테스트한다.

```go
package clock

import (
	"testing"
	"testing/synctest"
	"time"

	"github.com/stretchr/testify/assert"
)

// NaiveCache는 time.Now()를 직접 호출하고 시계 주입 설계가 없다.
// 그런데도 synctest 버블 안에서는 time.Now()/time.Sleep()이
// 가상 시간으로 동작하므로 코드 수정 없이 테스트할 수 있다 (Go 1.25+).
func Test_NaiveCache_Synctest_만료_검증(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		cache := NewNaiveCache(10 * time.Minute)

		cache.Set("session", "user-42")

		// 버블 안의 time.Sleep은 실제로 기다리지 않고 가상 시간을 진행시킨다
		time.Sleep(10*time.Minute - time.Second)
		v, ok := cache.Get("session")
		assert.True(t, ok)
		assert.Equal(t, "user-42", v)

		// TTL 경과: 만료된다
		time.Sleep(time.Second)
		_, ok = cache.Get("session")
		assert.False(t, ok)
	})
}
```

시나리오는 패턴 3의 테스트와 완전히 같다.
다른 점은 `fakeClock.Advance()` 자리에 표준 라이브러리의 `time.Sleep()`이 들어갔고, clockwork가 아예 등장하지 않는다는 것이다.
버블 안이므로 `NaiveCache`가 호출하는 `time.Now()`가 가상 시간을 읽는다.

주목할 것은 두 번째 `Sleep` 후의 검증이다.
버블의 가상 시간은 결정론적이라 `Sleep(1초)` 후의 `time.Now()`는 정확히 1초 뒤, 즉 `now == expiresAt`인 바로 그 순간이다.
실제 시계라면 스케줄링 지연 때문에 절대 정확히 맞출 수 없는 "만료 정각" 경계가 flaky 없이 매번 같은 결과로 검증된다.
`!now.Before(expiresAt)` 구현에서 정각이 만료로 처리된다는 사실이 이 테스트로 고정된다.

## 5.3 제약 사항

synctest는 만능 대체재가 아니라 **동시성 + 시간** 조합에 특화된 도구다. 몇 가지 제약이 있다.

- **Go 1.25 이상**이 필요하다. Go 1.24에서는 `GOEXPERIMENT=synctest`가 필요한 실험 기능이었고, 1.25에서 정식 API(`synctest.Test`)가 됐다.
- 버블 안의 goroutine이 버블 밖 자원(실제 네트워크 I/O 등)에 블록되면 가상 시간이 진행되지 않는다. 버블 안팎을 오가는 채널 통신도 패닉을 일으킨다. 외부 시스템과 통신하는 통합 테스트에는 맞지 않다.
- 패턴 1·2가 다루는 "특정 시각 기준 판단"(월말 만료 쿠폰 등)에는 오히려 부적합하다. 버블의 가상 시간은 고정된 기준 시각(2000-01-01 00:00:00 UTC)에서 시작하므로 임의의 달력 날짜를 시뮬레이션하는 용도가 아니다.

각 패턴의 자리는 그대로다. 어떤 상황에 어떤 패턴인지는 다음 장에서 정리한다.

# 6. 퀴즈

여기까지 읽었으면 풀 수 있는 문제들이다. 답을 고르면 바로 해설이 나온다.

```quiz
- type: mcq
  q: "TTL 캐시 테스트에서 time.Sleep으로 실제 시간이 흐르기를 기다릴 때 생기는 문제로 이 글이 지적한 것은?"
  choices: ["테스트가 병렬로 실행되면 캐시 항목이 서로 섞인다", "TTL을 프로덕션보다 크게 잡아야만 테스트가 통과한다", "CI 머신의 부하에 따라 결과가 달라져 간헐적으로 깨진다", "만료된 항목이 맵에서 지워지지 않고 계속 남는다"]
  answer: 2
  explain: "Sleep이 깨어나는 시점과 만료 판정 시점의 간격이 CI 부하에 따라 어긋나서, 어제 통과하던 테스트가 오늘 깨진다. 느린 것과 만료 정각을 재현할 수 없는 것까지 세 가지가 함께 지적됐다. (1.1절)"

- type: ox
  q: "IsExpiredAt이 now.After(ExpiresAt)로 구현돼 있으면, 만료 시각 정각의 쿠폰은 이미 만료된 것으로 판정된다."
  answer: false
  explain: "After는 두 시각이 정확히 같으면 false를 반환하므로 만료 시각 정각의 쿠폰은 아직 유효하다. 구현자가 After를 쓰느냐 !Before를 쓰느냐에 따라 소리 없이 뒤집히는 부분이라 테스트 케이스로 명시해 고정해 둔다. (2.2절)"

- type: code
  q: "nowFunc 필드에 time.Now를 괄호 없이 그대로 대입할 수 있는 이유는?"
  lang: go
  code: |
    type OrderService struct {
        nowFunc func() time.Time
    }

    func NewOrderService() *OrderService {
        return &OrderService{nowFunc: time.Now}
    }
  choices: ["Go가 함수 이름을 자동으로 클로저로 감싸주기 때문", "time.Now 자체가 func() time.Time 시그니처이기 때문", "구조체 리터럴에서는 필드 타입 검사가 생략되기 때문", "time 패키지가 표준 라이브러리에 속해 있기 때문"]
  answer: 1
  explain: "time.Now의 타입이 이미 func() time.Time이라 필드에 그대로 대입된다. 인터페이스도 외부 의존성도 없이 함수 필드 하나로 끝나는 것이 이 패턴을 가볍게 만드는 지점이다. (3.1절)"

- type: mcq
  q: "assert.WithinDuration으로 검증하는 테스트에서 order.CreatedAt 값은 어떻게 채워지나?"
  choices: ["서비스 내부의 time.Now가 기록하고 단언은 사후 비교만 한다", "단언이 호출되는 시점의 시각으로 덮어써서 채워진다", "허용 오차 범위의 중앙값이 자동으로 계산되어 대입된다", "테스트가 첫 인자로 넘긴 기준 시각이 그대로 주입된다"]
  answer: 0
  explain: "WithinDuration은 시간을 주입하거나 값을 채워주지 않는다. CreatedAt은 여전히 서비스 내부의 time.Now가 기록하고, 이 단언은 두 시각의 차이를 사후에 비교만 한다. 주입이 불가능할 때의 차선책이다. (3.3절)"

- type: blank
  q: "clockwork의 FakeClock은 ___() 메서드로 가상 시간을 원하는 만큼 앞으로 진행시킨다. 덕분에 프로덕션 TTL인 10분을 그대로 쓰고도 테스트는 즉시 끝난다."
  answer: ["Advance", "fakeClock.Advance"]
  explain: "Advance()다. 한 테스트 안에서 두 번 호출해 'TTL 직전에는 살아있다'와 'TTL 정각부터는 만료된다'를 순서대로 검증할 수 있다. 고정 시각 하나를 반환하는 nowFunc로는 표현할 수 없는 시나리오다. (4.2절)"

- type: mcq
  q: "nowFunc 주입 대신 Clock 인터페이스까지 도입할 기준으로 이 글이 제시한 것은?"
  choices: ["구조체가 현재 시각을 한 번 읽어 필드에 기록할 때", "테스트를 별도 패키지에서 black-box로 작성해야 할 때", "특정 시각을 기준으로 만료 여부만 판단하면 될 때", "재시도 백오프처럼 시간의 경과에 반응하는 로직일 때"]
  answer: 3
  explain: "기준은 코드가 시간을 어떻게 소비하느냐다. Now()를 한 번 읽고 끝나면 패턴 2로 충분하고, TTL·재시도 백오프·스케줄러처럼 경과에 반응하거나 Sleep/Ticker/After까지 제어해야 할 때 인터페이스를 도입한다. (4.3절)"

- type: code
  q: "TTLCache.Get의 만료 판정이다. 가상 시간이 expiresAt과 정확히 같아진 순간 Get은 어떻게 동작하나?"
  lang: go
  code: |
    it, ok := c.items[key]
    if !ok {
        return "", false
    }
    if !c.clock.Now().Before(it.expiresAt) {
        delete(c.items, key)
        return "", false
    }
    return it.value, true
  choices: ["저장된 값을 반환하고 항목도 맵에 그대로 남는다", "저장된 값을 반환하지만 항목은 맵에서 지워진다", "항목을 맵에서 지우고 false를 반환한다", "키가 아직 살아있어 panic 없이 빈 값만 반환한다"]
  answer: 2
  explain: "Before는 두 시각이 같으면 false이므로 !Before는 true가 되어 정각부터 만료로 처리된다. 2.2절 쿠폰의 After와 정확히 반대 경계라, 어느 쪽을 골랐든 정각 케이스를 테스트로 명시해 둬야 한다. (4.1절)"

- type: blank
  q: "synctest 버블의 가상 시간은 고정된 기준 시각인 ___년 1월 1일 0시(UTC)에서 시작하므로, 임의의 달력 날짜를 시뮬레이션하는 용도로는 맞지 않다."
  answer: ["2000"]
  explain: "2000년 1월 1일 00:00:00 UTC에서 시작한다. 그래서 '이번 달 말일까지 유효한 쿠폰'처럼 특정 시각 기준으로 판단하는 로직에는 패턴 1·2가 더 맞고, synctest는 동시성과 시간이 얽힌 쪽에 특화된 도구다. (5.3절)"

- type: ox
  q: "synctest 버블 안의 goroutine이 버블 밖 goroutine과 채널로 통신하면 패닉이 발생한다."
  answer: true
  explain: "버블 안팎을 오가는 채널 통신은 패닉을 일으킨다. 버블 밖 자원(실제 네트워크 I/O 등)에 블록되면 가상 시간도 진행되지 않으므로, 외부 시스템과 통신하는 통합 테스트에는 맞지 않다. (5.3절)"

- type: mcq
  q: "시계 주입 설계가 전혀 없는 NaiveCache를 synctest로 테스트할 때 프로덕션 코드에는 어떤 변경이 필요한가?"
  choices: ["clockwork.Clock을 필드로 받도록 생성자를 고쳐야 한다", "코드는 그대로 두고 테스트만 버블 안에서 실행하면 된다", "time.Now() 호출을 synctest 전용 API로 바꿔야 한다", "nowFunc 필드를 추가하고 기본값으로 time.Now를 넣어야 한다"]
  answer: 1
  explain: "synctest는 코드에 시계를 주입하는 대신 테스트 실행 환경 쪽에서 시간을 가상화한다. 버블 안에서는 NaiveCache가 호출하는 time.Now()가 그대로 가상 시간을 읽으므로 프로덕션 코드는 한 줄도 바뀌지 않는다. 대신 Go 1.25 이상이 필요하다. (5.1절)"
```

# 7. 마무리

`time.Now()` 직접 호출은 시간을 테스트할 수 없는 전역 입력으로 만든다.
해법은 시간을 주입받는 것이고, 네 패턴은 코드에 손대는 범위가 다를 뿐이다.
상황별로 정리하면 다음과 같다.

| 상황 | 추천 패턴 |
|------|----------|
| 특정 시각 기준 판단만 필요 (만료 검사 등) | 패턴 1 (파라미터 전달) |
| 구조체가 `time.Now()`를 저장/기록 | 패턴 2 (nowFunc 주입) |
| 시간이 "흘러야" 검증되는 로직 (TTL, 재시도, 스케줄러) | 패턴 3 (Clock 인터페이스, clockwork) |
| 동시성 + 시간 조합, 기존 코드 수정 불가 | 패턴 4 (synctest, Go 1.25+) |
| 주입이 불가능한 레거시 코드 | `assert.WithinDuration`으로 오차 허용 비교 |

표가 다루지 못하는 세부만 몇 가지 보태면 이렇다.

- **패턴 2 (nowFunc 주입)**: 3.4절에서 말했듯 실무의 다수는 여기서 끝난다. 단 필드가 unexported라 같은 패키지 테스트(white-box)에서만 주입할 수 있다.
- **패턴 3 (Clock 인터페이스)**: `Sleep`/`Ticker`/`After`까지 제어할 수 있는 대신, 의존성과 인터페이스 추가 비용이 든다.
- **패턴 4 (synctest)**: 코드 수정이 필요 없다. 시계 주입 설계가 없는 코드도 그대로 테스트한다. 다만 Go 1.25 이상이 필요하다.

새 코드라면 패턴 1·2를 기본으로 시작해서 시간이 흘러야 하는 로직에만 패턴 3으로 올라가고, synctest(패턴 4)는 그 설계가 없는 코드의 안전망으로 쓰는 것이 자연스럽다.

덤으로, 이 글의 두 예제는 만료 경계를 반대로 처리한다.
2.2절의 쿠폰은 만료 정각이 아직 유효(`now.After`)이고, 4.1절의 캐시는 정각부터 miss(`!now.Before`)다.
그 차이는 코드에서 단어 하나로만 드러난다.
그래서 어느 쪽을 골랐든 "경계 정각" 케이스를 테스트로 명시해 두어야 한다.
이런 정밀한 경계 테스트가 가능하다는 것 자체가 시간을 주입받는 설계의 가장 큰 수확이다.

이 글의 전체 예제 코드와 테스트는 [tutorials-go 저장소](https://github.com/kenshin579/tutorials-go/tree/master/golang/testing/clock)에서 확인할 수 있다.
