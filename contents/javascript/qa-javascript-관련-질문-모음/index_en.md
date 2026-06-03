---
title: "Q&A: A Collection of JavaScript Questions"
description: "A personal collection of JavaScript questions and the answers I figured out along the way."
date: 2018-03-23
update: 2018-03-23
tags:
  - Q&A
  - faq
  - javascript
  - defaultProps
  - es6
---

This is a personal collection where I jot down things I don't know and briefly summarize what I learn about them.
If you know the answer to any of the unanswered questions, please leave a comment. Thank you.

# Full Q&A List

## <span style="color:orange">[Answered]</span>

## <span style="color:brown">1. What is `This is a ${msg}`?

This is a new string notation added in ES6, called a Template Literal.
Template literals allow line breaks within a string without using the \ character, and they let you easily substitute the value of a variable directly through the simple \${…} string interpolation expression.

![](/media/javascript/QA-JavaScript-관련-질문-모음/image_3.png)

References

- [https://poiemaweb.com/es6-template-literals](https://poiemaweb.com/es6-template-literals)
- [https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Template_literals](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Template_literals)

## <span style="color:brown">2. What is the difference between var, const, and let?

The const and let keywords were introduced in ES6.

- var \* the scope works at the function level
  ![](/media/javascript/QA-JavaScript-관련-질문-모음/image_5.png)

- const
    - the scope is block-level
    - used when the value does not change
      ![](/media/javascript/QA-JavaScript-관련-질문-모음/image_4.png)

- let
    - the scope is block-level
    - used when the value changes

References

- [https://velopert.com/3626](https://velopert.com/3626)

## <span style="color:brown">3. What does () => ({}) mean in lambda expression form?

ES6 added lambda expression syntax. The expression () => ({}) is equivalent to function() { return { } }.

![](/media/javascript/QA-JavaScript-관련-질문-모음/image_7.png)

References

- [http://hacks.mozilla.or.kr/2015/09/es6-in-depth-arrow-functions/](http://hacks.mozilla.or.kr/2015/09/es6-in-depth-arrow-functions/)

## <span style="color:brown">4. What is …?

![](/media/javascript/QA-JavaScript-관련-질문-모음/7387AE5C-6B59-4AD8-8546-AA42E65E9734.png)

This is syntax added in ES6 that can be used as a Spread or a Rest Parameter.

- Spread operator
    - expands an iterable array, object, or string into individual elements
    - ex.
      ![](/media/javascript/QA-JavaScript-관련-질문-모음/image_6.png)
      ![](/media/javascript/QA-JavaScript-관련-질문-모음/image_1.png)

- Rest Parameter
    - collects all elements into an array
    - the Rest Parameter must be the last argument
      ![](/media/javascript/QA-JavaScript-관련-질문-모음/image_2.png)

References

- [https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/rest_parameters](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/rest_parameters)
- [https://scotch.io/bar-talk/javascripts-three-dots-spread-vs-rest-operators543](https://scotch.io/bar-talk/javascripts-three-dots-spread-vs-rest-operators543)
- [https://jaeyeophan.github.io/2017/04/18/ES6-4-Spread-Rest-parameter/](https://jaeyeophan.github.io/2017/04/18/ES6-4-Spread-Rest-parameter/)

---

## <span style="color:orange">[Unanswered Questions]</span>

### - When is defaultProps used?
