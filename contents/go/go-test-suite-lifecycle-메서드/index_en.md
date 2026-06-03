---
title: "Go Test Suite (Lifecycle Methods)"
description: "How to use testify's Test Suite and its lifecycle methods to organize Go unit tests."
date: 2021-07-17
update: 2021-07-17
tags:
  - golang
  - test
  - suite
  - testify
  - before
  - after
  - lifecyle 
  - unit test
  - test suite
---


In Go, you can easily write unit tests using the various features (e.g. assertion, mocking, suite) provided by the [testify](https://github.com/stretchr/testify) library. There are cases where you need to skip the entire test depending on a particular config setting. In such cases, you can easily handle that scenario using a Test Suite.

- e.g. cluster_test.go - run only when in redis cluster mode

When you run the `suite.Run()` method, the methods defined in the Suite run in order, so if you put a condition before that and call the `t.Skip()` method when it's true, the entire test is skipped.

```go
func TestExampleTestSuite(t *testing.T) {
	//under a specific condition, you can choose not to run the entire test
	if isSkip() {
		t.Skip("skipping")
	}
	suite.Run(t, new(ExampleTestSuite))
}

func isSkip() bool {
	return false
}

```


The Suite package provides several interfaces before and after test execution, allowing various processing before and after tests. Let's look at the various life cycle methods. By examining the execution logic of `suite.Run()`, you can see at which point in the test execution life cycle the [suite interface](https://github.com/stretchr/testify/blob/master/suite/interfaces.go) methods run.

```go
func Run(t *testing.T, suite TestingSuite) {
  
  ...omitted...
  if afterTestSuite, ok := suite.(AfterTest); ok {
						afterTestSuite.AfterTest(suiteName, method.Name)
					}

					if tearDownTestSuite, ok := suite.(TearDownTestSuite); ok {
						tearDownTestSuite.TearDownTest()
					}
  
    ...omitted...
}
  º
```

- Setup
    - `SetupSuite` - runs only once before all tests in the suite
    - `SetupTest` - runs before each test in the suite
    - `BeforeTest` - a function that runs before a test, taking `suiteName, testName` arguments
- Teardown
    - `AfterTest` - a function that runs after a test, taking suiteName testName arguments
    - `TearDownTest` - runs after each test in the suite
    - `TestDownSuite` - runs after all tests in the suite have run

To write tests with a Test Suite, create a `struct` that embeds the `suite.Suite` struct and define suite methods on that `struct`.

```go
type ExampleTestSuite struct {
	suite.Suite
}

func (ets *ExampleTestSuite) SetupSuite() {}

...omitted...
func (ets *ExampleTestSuite) TestExample1() {}

```



Here is the full [test code](https://github.com/kenshin579/tutorials-go/blob/master/go-testing/suite_test.go) that was written.

```go
type ExampleTestSuite struct {
	suite.Suite
	TestValue int
}

//runs only once before all tests in the suite
func (ets *ExampleTestSuite) SetupSuite() {
	fmt.Println("SetupSuite :: run once")
}

//runs before each test in the suite
func (ets *ExampleTestSuite) SetupTest() {
	fmt.Println("SetupTest :: run setup test")
	ets.TestValue = 5
}

//a function that runs before a test, taking suiteName testName arguments
func (ets *ExampleTestSuite) BeforeTest(suiteName, testName string) {
	fmt.Printf("BeforeTest :: run before test - suiteName:%s testName: %s\n", suiteName, testName)
}

//TEST ----------------------------------------
func (ets *ExampleTestSuite) TestExample1() {
	fmt.Println("TestExample1")
  assert.Equal(ets.T(), ets.TestValue, 5) //you can check assertions this way, but
	ets.Equal(ets.TestValue, 5) //to check assertions you can use it like this.
}

func (ets *ExampleTestSuite) TestExample2() {
	fmt.Println("TestExample2")
}

//TEST ----------------------------------------

//a function that runs after a test, taking suiteName testName arguments
func (ets *ExampleTestSuite) AfterTest(suiteName, testName string) {
	fmt.Printf("AfterTest :: suiteName:%s testName: %s\n", suiteName, testName)
}

//runs after each test in the suite
func (ets *ExampleTestSuite) TearDownTest() {
	fmt.Println("TearDownTest :: run before after test")
}

//runs once after all tests in the suite have run
func (ets *ExampleTestSuite) TearDownSuite() {
	fmt.Println("TearDownSuite :: run once")
}

func TestExampleTestSuite(t *testing.T) {
	//under a specific condition, you can choose not to run the entire test
	if isSkip() {
		t.Skip("skipping")
	}
	suite.Run(t, new(ExampleTestSuite))
}

func isSkip() bool {
	return false
}

```



Shall we run the test and check the life cycle?

```bash
=== RUN   TestExampleTestSuite
SetupSuite :: run once
--- PASS: TestExampleTestSuite (0.00s)
=== RUN   TestExampleTestSuite/TestExample1
SetupTest :: run setup test
BeforeTest :: run before test - suiteName:ExampleTestSuite testName: TestExample1
TestExample1
AfterTest :: suiteName:ExampleTestSuite testName: TestExample1
TearDownTest :: run before after test
    --- PASS: TestExampleTestSuite/TestExample1 (0.00s)
=== RUN   TestExampleTestSuite/TestExample2
SetupTest :: run setup test
BeforeTest :: run before test - suiteName:ExampleTestSuite testName: TestExample2
TestExample2
AfterTest :: suiteName:ExampleTestSuite testName: TestExample2
TearDownTest :: run before after test
TearDownSuite :: run once
    --- PASS: TestExampleTestSuite/TestExample2 (0.00s)
PASS
```

# References

- https://brunoscheufler.com/blog/2020-04-12-building-go-test-suites-using-testify

- https://pkg.go.dev/github.com/stretchr/testify/suite
