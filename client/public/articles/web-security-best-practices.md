---
title: 웹 보안 베스트 프랙티스
date: 2024-10-08
excerpt: 웹 애플리케이션을 안전하게 보호하기 위한 필수 보안 가이드라인을 제시합니다.
tags: [보안, 웹개발, 베스트프랙티스]
---

## 웹 보안의 중요성

보안은 선택이 아닌 필수입니다.

## XSS 공격 방어

Cross-Site Scripting 방어:

```javascript
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

## CSRF 토큰

Cross-Site Request Forgery 방어:

```javascript
app.use(csrf());

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
```
