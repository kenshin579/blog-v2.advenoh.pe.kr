---
title: Docker로 마이크로서비스 구축하기
date: 2024-10-05
excerpt: Docker를 활용하여 확장 가능한 마이크로서비스 아키텍처를 구현하는 방법을 알아봅니다.
tags: [Docker, 마이크로서비스, DevOps]
series: 마이크로서비스 아키텍처
seriesOrder: 1
---

## 마이크로서비스란?

마이크로서비스는 작고 독립적인 서비스들의 집합입니다.

## Dockerfile 작성

효율적인 Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

## Docker Compose

여러 서비스 오케스트레이션:

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: example
```
