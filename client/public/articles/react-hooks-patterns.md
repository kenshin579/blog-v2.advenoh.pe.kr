---
title: React Hooks 디자인 패턴
date: 2024-10-18
excerpt: React Hooks를 효과적으로 사용하기 위한 디자인 패턴과 베스트 프랙티스를 소개합니다.
tags: [React, Hooks, JavaScript]
---

## React Hooks란?

React Hooks는 함수형 컴포넌트에서 상태와 생명주기 기능을 사용할 수 있게 해주는 API입니다.

## useState 패턴

상태 관리의 기본:

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

## useEffect 패턴

사이드 이펙트 처리:

```jsx
useEffect(() => {
  const subscription = subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, [dependency]);
```

## 커스텀 Hooks

재사용 가능한 로직 추출:

```jsx
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
```
