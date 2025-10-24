export const mockArticles = [
  {
    slug: 'typescript-advanced-types',
    markdown: `---
title: TypeScript 고급 타입 시스템 완벽 가이드
date: 2024-10-20
excerpt: TypeScript의 고급 타입 시스템을 활용하여 더 안전하고 표현력 있는 코드를 작성하는 방법을 알아봅니다.
tags: [TypeScript, 타입시스템, 프로그래밍]
series: TypeScript 마스터하기
seriesOrder: 1
---

## 소개

TypeScript는 JavaScript에 정적 타입을 추가한 언어입니다. 이 글에서는 고급 타입 시스템을 깊이 있게 다룹니다.

## 유니온 타입과 인터섹션 타입

유니온 타입은 여러 타입 중 하나를 나타냅니다:

\`\`\`typescript
type ID = string | number;

function printId(id: ID) {
  console.log(\`Your ID is: \${id}\`);
}
\`\`\`

인터섹션 타입은 여러 타입을 결합합니다:

\`\`\`typescript
interface Colorful {
  color: string;
}

interface Circle {
  radius: number;
}

type ColorfulCircle = Colorful & Circle;
\`\`\`

## 제네릭 타입

제네릭을 사용하면 재사용 가능한 컴포넌트를 만들 수 있습니다:

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const output = identity<string>("myString");
\`\`\`

## 조건부 타입

조건부 타입을 사용하면 타입 수준에서 조건 로직을 표현할 수 있습니다:

\`\`\`typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
\`\`\`
`
  },
  {
    slug: 'react-hooks-patterns',
    markdown: `---
title: React Hooks 디자인 패턴
date: 2024-10-18
excerpt: React Hooks를 효과적으로 사용하기 위한 디자인 패턴과 베스트 프랙티스를 소개합니다.
tags: [React, Hooks, JavaScript]
---

## React Hooks란?

React Hooks는 함수형 컴포넌트에서 상태와 생명주기 기능을 사용할 수 있게 해주는 API입니다.

## useState 패턴

상태 관리의 기본:

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

## useEffect 패턴

사이드 이펙트 처리:

\`\`\`jsx
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, [dependency]);
\`\`\`

## 커스텀 Hooks

재사용 가능한 로직 추출:

\`\`\`jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
\`\`\`
`
  },
  {
    slug: 'nodejs-performance-optimization',
    markdown: `---
title: Node.js 성능 최적화 전략
date: 2024-10-15
excerpt: Node.js 애플리케이션의 성능을 극대화하기 위한 실전 최적화 기법들을 다룹니다.
tags: [Node.js, 성능, 백엔드]
series: Node.js 마스터하기
seriesOrder: 1
---

## 성능 최적화의 중요성

Node.js 애플리케이션의 성능은 사용자 경험과 직결됩니다.

## 이벤트 루프 이해하기

Node.js의 핵심인 이벤트 루프를 이해해야 합니다:

\`\`\`javascript
setImmediate(() => {
  console.log('Immediate');
});

process.nextTick(() => {
  console.log('Next Tick');
});
\`\`\`

## 클러스터링

멀티코어 활용을 위한 클러스터링:

\`\`\`javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello World');
  }).listen(8000);
}
\`\`\`
`
  },
  {
    slug: 'modern-css-layouts',
    markdown: `---
title: 모던 CSS 레이아웃 기법
date: 2024-10-12
excerpt: Grid와 Flexbox를 활용한 현대적인 CSS 레이아웃 구현 방법을 배웁니다.
tags: [CSS, 레이아웃, 프론트엔드]
---

## CSS Grid vs Flexbox

두 가지 강력한 레이아웃 시스템을 언제 사용해야 할까요?

## CSS Grid 기초

2차원 레이아웃을 위한 Grid:

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.item {
  grid-column: span 2;
}
\`\`\`

## Flexbox 패턴

1차원 레이아웃을 위한 Flexbox:

\`\`\`css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
\`\`\`

## 반응형 디자인

미디어 쿼리 없이 반응형 구현:

\`\`\`css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`
`
  },
  {
    slug: 'typescript-generics-deep-dive',
    markdown: `---
title: TypeScript 제네릭 심화 학습
date: 2024-10-10
excerpt: TypeScript 제네릭의 고급 사용법과 실전 예제를 통해 타입 안정성을 극대화합니다.
tags: [TypeScript, 제네릭, 고급]
series: TypeScript 마스터하기
seriesOrder: 2
---

## 제네릭의 힘

제네릭은 TypeScript의 가장 강력한 기능 중 하나입니다.

## 제네릭 제약 조건

타입 매개변수에 제약을 걸 수 있습니다:

\`\`\`typescript
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}
\`\`\`

## 제네릭 클래스

재사용 가능한 클래스 구현:

\`\`\`typescript
class GenericStack<T> {
  private items: T[] = [];

  push(item: T) {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }
}
\`\`\`
`
  },
  {
    slug: 'web-security-best-practices',
    markdown: `---
title: 웹 보안 베스트 프랙티스
date: 2024-10-08
excerpt: 웹 애플리케이션을 안전하게 보호하기 위한 필수 보안 가이드라인을 제시합니다.
tags: [보안, 웹개발, 베스트프랙티스]
---

## 웹 보안의 중요성

보안은 선택이 아닌 필수입니다.

## XSS 공격 방어

Cross-Site Scripting 방어:

\`\`\`javascript
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
\`\`\`

## CSRF 토큰

Cross-Site Request Forgery 방어:

\`\`\`javascript
app.use(csrf());

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
\`\`\`
`
  },
  {
    slug: 'docker-microservices',
    markdown: `---
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

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

## Docker Compose

여러 서비스 오케스트레이션:

\`\`\`yaml
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
\`\`\`
`
  },
  {
    slug: 'graphql-api-design',
    markdown: `---
title: GraphQL API 디자인 가이드
date: 2024-10-01
excerpt: 효율적이고 확장 가능한 GraphQL API를 설계하는 방법을 배웁니다.
tags: [GraphQL, API, 백엔드]
---

## GraphQL vs REST

GraphQL의 장단점을 이해해봅시다.

## 스키마 정의

타입 시스템 활용:

\`\`\`graphql
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
\`\`\`

## 리졸버 구현

데이터 페칭:

\`\`\`javascript
const resolvers = {
  Query: {
    user: (_, { id }) => getUserById(id),
    posts: () => getAllPosts(),
  },
  User: {
    posts: (user) => getPostsByUserId(user.id),
  },
};
\`\`\`
`
  }
];
