---
title: "jq - How to Use the Command-Line JSON Processor"
description: "A collection of handy jq recipes: extracting fields matching a value from a JSON array and counting array elements."
date: 2023-01-27
update: 2023-01-27
tags:
  - jq
  - gojq
  - json
---

I don't use `jq` often, but there are times when it's handy when I need it, so I'm leaving it on the blog for the record.

# 1. A Collection of jq Usage

## 1.1 How to extract a field value from an array where a specific field matches?


For a JSON array like the one below, how would you write a `jq` query to extract a desired field from the item where a specific field, `id`, matches?

```json
[
  {
    "id": "e0a65e34-b516-4f49-bb08-7108dc104046",
    "name": "Frank",
    "country": "KR"
  },
  {
    "id": "423be8de-9c04-4f0e-8ff0-545a8cb175b4",
    "name": "David",
    "country": "KR"
  },
  {
    "id": "61adaddd-525e-4a81-a4eb-7fb99b46cc05",
    "name": "Angela",
    "country": "US"
  }
]

```


`jq`'s `select(bool)` syntax is a function that selects values for which the boolean expression is true, so if you write the query as below, the item with the matching id is selected, and you select and print the fields you want to see.

```bash
$ cat json/ex2.json | jq '.[] | select(.id == "423be8de-9c04-4f0e-8ff0-545a8cb175b4") | {name, country}'
{
  "name": "David",
  "country": "KR"
}
```

## 1.2 How to print the number of elements in an array from a JSON string?

You can get the number of elements in an array with the `length` function.

```bash
$ echo '[{"username":"user1"},{"username":"user2"}]' | jq '. | length'
```

Reference

- https://phpfog.com/count-json-array-elements-with-jq/


# 2. References

- https://stackoverflow.com/questions/51184524/get-parent-element-id-while-parsing-json-data-with-jq
- https://stackoverflow.com/questions/18592173/select-objects-based-on-value-of-variable-in-object-using-jq
- https://stedolan.github.io/jq/manual/#select(boolean_expression)
- https://www.44bits.io/ko/post/cli_json_processor_jq_basic_syntax
