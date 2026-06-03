---
title: "Mongo Script Collection"
description: "A collection of handy MongoDB migration scripts for common operations."
date: 2023-02-25
update: 2023-02-25
tags:
  - mongo
  - script
  - mongodb
  - 몽고
  - 스크립트
---

When developing with MongoDB as the primary database, you end up doing data migrations frequently. Since it's a bit less familiar than MySQL, I find myself Googling the same migrations over and over, so I'm writing them down on the blog to keep them organized.

Before the hands-on examples, let's quickly insert some data into the inventory collection.

```javascript
db.inventory.insertMany([
    {item: "journal", qty: 25, tags: ["blank", "red"], size: {h: 14, w: 21, uom: "cm"}},
    {item: "mat", qty: 85, tags: ["gray"], size: {h: 27.9, w: 35.5, uom: "cm"}},
    {item: "mousepad", qty: 25, tags: ["gel", "blue"], size: {h: 19, w: 22.85, uom: "cm"}}
])
```

# 1. Rename the key name of item

To rename the key name of item in the inventory list, use the `$rename` operator. In the example below, we rename `item` -> `item_id`.

```javascript
db.inventory.updateMany({}, {$rename: {"item": "item_id"}}, false, true)
```


# 2. Update a specific value of a matching item

Like a WHERE clause in SQL, use the `$eq` operator to select an item matching a specific value, and change the value with the `$set` operator.

```javascript
db.inventory.updateMany(
    {"item_id": {$eq: "journal"}},
    {
        $set: {"item_id": "11111"}
    }
)
```

# References

- https://blog.kevinchisholm.com/javascript/mongodb/getting-started-with-mongo-shell-scripting-basic-crud-operations/

- https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/#mongodb-method-db.collection.updateOne

  

  
