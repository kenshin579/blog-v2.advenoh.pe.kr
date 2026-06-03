---
title: "A Summary of JPA Association Mapping"
description: "Core concepts you frequently encounter when mapping entity associations in JPA."
date: 2019-12-04
update: 2019-12-04
tags:
  - jpa
  - database
  - spring
  - OneToMany
  - OneToOne
  - 연관관계
  - 단방향
  - 양방향
  - 다대다
  - 다대일
  - 일대다
  - 일대일
series: "Spring JPA"
---


# 1. Introduction

An entity establishes relationships with other entities by holding references (variables) to them. For example, in the case of writing a comment on a post in a blog, the Comment entity holds a Post entity field, forming an association with it, so that you can query information about the post the comment was written on. In a table, this kind of relationship is established using a foreign key.

In JPA, mapping the relationships between tables to associations between entities is the first and most central task you perform. In this post, let's look at the core terms you frequently encounter when mapping entities in JPA. In later posts in this series, we will look at each association concretely through example code.

# 2. Directionality

> Scenario
>
> - Post -> Comment
> - Comment -> Post

A table can join two tables using a single foreign key, allowing queries in both directions.

```sql
SELECT * FROM post AS p INNER JOIN comment AS c ON p.id = c.post_id
# or
SELECT * FROM comment AS c INNER JOIN post AS P ON p.id = c.post_id

```

For objects, however, if a referencing field exists on an object, you can query the associated object in only one direction through that field, which makes it unidirectional; and if each object holds the other as a field, it becomes bidirectional.

- Unidirectional
    - When only one side references the other in the object relationship
    - Post -> Comment
- Bidirectional
    - When both sides reference each other in the object relationship
    - Post -> Comment, Comment -> Post

# 3. Associations/Relationships

Looking at the relationship between Post and Comment in the example above, a single post (one) can have many comments (many), and many comments (many) are included in a single post (one), which forms a many-to-one and one-to-many relationship. In addition, various relationships exist between entities, as shown below.


* Many-to-one (N:1)
    * Along with one-to-many, this is the most frequently used association
* One-to-many (1:N)
* One-to-one (1:1)
* Many-to-many (N:N)
    * Rarely used in practice

# 4. The Owner of the Association

A table has only one foreign key on one side and establishes an association with that single foreign key. However, for entities mapped bidirectionally, a referencing field exists on each of the two sides.

The place that manages the foreign key — only one of the two entities — is called the owner of the association. We will cover this in more detail in a later post in the series, but the characteristics of the owner of the association are as follows.

- An entity that uses the mappedBy attribute is not the owner of the association
    - The mappedBy attribute specifies the field name of the owner of the association
- Usually, the entity mapped to the table that holds the foreign key (e.g. Comment) is chosen as the owner that manages the foreign key
    - In a many-to-one bidirectional relationship, the many (N) side becomes the owner of the association

# 5. References

- JPA relationships
    - [[https://minwan1.github.io/2018/12/21/2018-12-26-jpa-%EA%B4%80%EA%B3%84%EC%84%A4%EC%A0%95/](https://minwan1.github.io/2018/12/21/2018-12-26-jpa-관계설정/)](https://minwan1.github.io/2018/12/21/2018-12-26-jpa-%EA%B4%80%EA%B3%84%EC%84%A4%EC%A0%95/)
    - [https://siyoon210.tistory.com/27](https://siyoon210.tistory.com/27)
    - [https://howtodoinjava.com/hibernate/how-to-define-association-mappings-between-hibernate-entities/](https://howtodoinjava.com/hibernate/how-to-define-association-mappings-between-hibernate-entities/)
- Book: Java ORM Standard JPA Programming
    - <a href="http://www.yes24.com/Product/Goods/19040233?scode=032&OzSrank=1"><img src="images/JPA-연관관계-매핑-정리/JPA_book.jpeg" align="left" alt="Java ORM Standard JPA Programming" style="zoom:33%;" /></a>
