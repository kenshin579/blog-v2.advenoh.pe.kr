---
title: "Go Strings (String Functions)"
description: "A walkthrough of commonly used string functions provided by Go's strings package."
date: 2021-05-28
update: 2021-05-28
tags:
  - golang
  - string
  - replace
  - split
  - join
  - repeat
  - 스트링
  - 문자열
  - 고랭
---

# String Functions

Among Go's standard libraries, the `strings` package provides many useful string functions. Let's work with strings through several examples.

## 1. Search (Contains, Prefix/Suffix, Index)

```go
func TestStrings(t *testing.T) {
	assert.True(t, strings.Contains("test", "st"))
	assert.True(t, strings.ContainsAny("test", "s"))
	assert.True(t, strings.HasPrefix("test", "te"))
	assert.True(t, strings.HasSuffix("test", "st"))
  
  assert.Equal(t, 2, strings.Count("test", "t"))
	assert.Equal(t, 1, strings.Index("test", "e"))
}
```

## 2. Replace (Uppercase/Lowercase, Trim, Map)

```go
func TestStrings(t *testing.T) {
	assert.Equal(t, "f00", strings.Replace("foo", "o", "0", -1))
	assert.Equal(t, "test", strings.ToLower("TEST"))
	assert.Equal(t, "TEST", strings.ToUpper("test"))
	assert.Equal(t, "Test", strings.Trim(" Test  ", " "))
	assert.Equal(t, "Test", strings.TrimSpace(" Test  "))
	f := func(r rune) rune {
		return r + 1
	}
	assert.Equal(t, "bc", strings.Map(f, "ab"))
}
```

> The `Map` function takes a function and a string as arguments and applies the function to each character of the string.

## 3. Split (Split, Fields)

```go
func TestStrings(t *testing.T) {
	assert.Equal(t, []string{"a", "b", "c"}, strings.Split("a,b,c", ","))
  assert.Equal(t, []string{"t", "e", "s", "t"}, strings.Fields("t\t   e s t"))
}
```

> Fields splits a string around white space characters (as defined by unicode.IsSpace)

## 4. Concatenate (+, Sprintf, Builder)

The `fmt.Sprintf()` method returns a string by formatting various types as you want, making it easy to build the string you need.

```go
func TestStrings(t *testing.T) {
	assert.Equal(t, "hello world", "hello"+" world")
	assert.Equal(t, "data: 123", fmt.Sprintf("%s %d", "data:", 123))
	assert.Equal(t, "3.1416", fmt.Sprintf("%.4f", math.Pi))

	var b strings.Builder
	for i := 3; i >= 1; i-- {
		fmt.Fprintf(&b, "%d...", i)
	}
	b.WriteString("end")
	assert.Equal(t, "3...2...1...end", b.String())
}
```

> The methods provided by `strings.Builder` offer a way to combine strings faster and more efficiently

# 5. Join (Join, Repeat)

```go
func TestStrings(t *testing.T) {
	assert.Equal(t, "a-b", strings.Join([]string{"a", "b"}, "-"))
	assert.Equal(t, "AAAAA", strings.Repeat("A", 5))
}
```

## 6. Format, Convert (strconv)

```go
func TestStrings(t *testing.T) {
	assert.Equal(t, "23", strconv.Itoa(23))
	assert.Equal(t, "ff", strconv.FormatInt(255, 16))

	intValue, _ := strconv.Atoi("23")
	assert.Equal(t, 23, intValue)
}
```


You can find the examples written here on [github](https://github.com/kenshin579/tutorials-go/tree/master/go-strings).


# References

- https://yourbasic.org/golang/string-functions-reference-cheat-sheet/
- http://pyrasis.com/book/GoForTheReallyImpatient/Unit46
- https://mingrammer.com/gobyexample/string-functions/
- http://cloudrain21.com/go-how-to-concatenate-strings
- http://pyrasis.com/book/GoForTheReallyImpatient/Unit46/02
- https://golang.org/pkg/strings/
- https://yourbasic.org/golang/string-functions-reference-cheat-sheet/
