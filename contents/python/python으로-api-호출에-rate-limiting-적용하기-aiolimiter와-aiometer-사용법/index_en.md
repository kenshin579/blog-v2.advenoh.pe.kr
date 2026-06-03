---
title: "Applying Rate Limiting to API Calls in Python: How to Use aiolimiter and aiometer"
description: "How to efficiently apply rate limiting to asynchronous API calls in Python using the aiolimiter and aiometer libraries."
date: 2025-04-05
update: 2025-04-05
tags:
  - rate limit
  - aiolimiter
  - rate limiting
  - aiometer
  - python
  - 파이썬
---

# 1. Overview

<img src="thumbnail.png" width="75%" />

Rate limiting is a technique that restricts API calls or server requests within a specific time unit. It is used to prevent server overload and to avoid failures caused by excessive requests. For example, some APIs limit the number of calls in a manner such as "20 per second." In situations like this, let's look at how to efficiently apply rate limiting when developing with Python.

> I personally use the [korea-investment-stock](https://pypi.org/project/korea-investment-stock/) API, and the Korea Investment API has a constraint of 20 calls per second, so I started studying this to solve that problem.

# 2. How to Use `aiolimiter`

## 2.1 What Is `aiolimiter`?

`aiolimiter` is a rate limiter library that supports asynchronous programming. Used together with `asyncio`, it helps you control the number of requests even while processing multiple tasks asynchronously. `aiolimiter` is especially useful when handling server or API calls asynchronously.

### Example

The following is an example of applying a rate limit to API calls using `aiolimiter`.

```python
class AiolimiterTest(TestCase):
    @classmethod
    def setUpClass(cls):
        max_concurrent = 20
        cls.limiter = AsyncLimiter(max_concurrent, time_period=1)  # 20 calls per second

    def test_run_concurrently(self):
        stock_list = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"] * 4 * 5
        # stock_list = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"]
        start_time = time.time()

        stock_data = asyncio.run(self.fetch_stocks(stock_list))
        elapsed_time = time.time() - start_time

        print(f"elapsed_time: {elapsed_time}, size: {len(stock_list)}, stock_data: {stock_data}")

    async def fetch_stock_current_price(self, stock_code):
        async with self.limiter:
            url = "<http://httpbin.org/get>"

            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"{start_time}:{stock_code}: calling stock price")

                    data = await response.json()

                    wait_time = random.uniform(1, 2)  # random delay of 1~2 seconds

                    await asyncio.sleep(wait_time)
                    print(f"{start_time}:{stock_code} Stock price fetched")
                    return data

    async def fetch_stocks(self, stock_list):
        # create a list of tasks
        tasks = [self.fetch_stock_current_price(code) for code in stock_list]

        # run the tasks concurrently
        results = await asyncio.gather(*tasks)

        for result in results:
            print(result)
```

In this code, `AsyncLimiter` is used to allow only 20 requests per second. By using `limiter` to call the API asynchronously, you can safely fetch data within the limited number of requests.

# 3. How to Use `aiometer`

## 3.1 What Is `aiometer`?

`aiometer` is similar to `aiolimiter`, but it provides the ability to manage multiple rate limiters at once. It is useful when you need to call multiple APIs simultaneously or apply several different constraints.

### Example

This is an example of applying a rate limit to asynchronous requests using `aiometer`.

```python
class AiometerTest(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.max_at_once = 5  # used to limit the maximum number of tasks running concurrently at a given time
        cls.max_per_second = 20  # limits the number of tasks created per second

    def test_run_concurrently(self):
        stock_list = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"] * 4 * 5
        # stock_list = ["AAPL", "GOOGL", "AMZN", "MSFT", "TSLA"]
        start_time = time.time()

        stock_data = asyncio.run(self.fetch_stocks(stock_list))
        elapsed_time = time.time() - start_time

        print(f"elapsed_time: {elapsed_time}, size: {len(stock_list)}, stock_data: {stock_data}")

    async def fetch_stock_current_price(self, stock_code):
        url = "<http://httpbin.org/get>"

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"{start_time}:{stock_code}: calling stock price")

                data = await response.json()

                wait_time = random.uniform(1, 2)  # random delay of 1~2 seconds

                await asyncio.sleep(wait_time)
                print(f"{start_time}:{stock_code} Stock price fetched")
                return data

    async def fetch_stocks(self, stock_list):
        # create a list of tasks
        tasks = [functools.partial(self.fetch_stock_current_price, code) for code in stock_list]

        # run the tasks concurrently
        results = await aiometer.run_all(tasks, max_per_second=self.max_per_second, max_at_once=self.max_at_once)

        for result in results:
            print(result)
```

`aiometer.run_all(tasks, 20, 5)` is configured to allow only 20 calls per second at most, and additionally limits the number of concurrent executions to 5.

# 4. Conclusion

Both libraries can be very useful in environments where asynchronous processing is possible. In the case of `aiometer`, it has the advantage of being able to limit the maximum number of tasks that can run concurrently, preventing excessive I/O.

| Feature                              | `aiometer`  | `aiolimiter`                 |
| --------------------------------- | ----------- | ---------------------------- |
| Rate Limit            | ✅ Supported      | ✅ Supported                       |
| Concurrency Limit | ✅ Supported      | ❌ Not supported                 |
| Complexity                            | Relatively simple | Must be controlled directly with `async with` |

# 5. References

- [Applying Rate Limit to Python Async API Calls](https://devocean.sk.com/blog/techBoardDetail.do?ID=166023&boardType=techBlog)
