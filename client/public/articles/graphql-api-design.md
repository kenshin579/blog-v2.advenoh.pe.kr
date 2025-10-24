---
title: GraphQL API 디자인 가이드
date: 2024-10-01
excerpt: 효율적이고 확장 가능한 GraphQL API를 설계하는 방법을 배웁니다.
tags: [GraphQL, API, 백엔드]
---

## GraphQL vs REST

GraphQL의 장단점을 이해해봅시다.

## 스키마 정의

타입 시스템 활용:

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

type Query {
  user(id: ID!): User
  posts: [Post!]!
}
```

## 리졸버 구현

데이터 페칭:

```javascript
const resolvers = {
  Query: {
    user: (_, { id }) => getUserById(id),
    posts: () => getAllPosts(),
  },
  User: {
    posts: (user) => getPostsByUserId(user.id),
  },
};
```
