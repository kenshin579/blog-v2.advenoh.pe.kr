---
title: "How to Clone a MongoDB Collection"
description: "Learn how to clone a MongoDB collection using MongoDB scripts."
date: 2022-07-16
update: 2022-07-16
tags:
  - mongo, mongodb, clone, collection, script, 몽고
---

Often you may want to clone an existing collection for testing without modifying the original data. Let's look at how to easily clone a collection using a MongoDB script.

For the clone test, create an inventory and insert some sample data.

```javascript
db.inventory.insertMany([
    {item: "journal", qty: 25, tags: ["blank", "red"], size: {h: 14, w: 21, uom: "cm"}},
    {item: "mat", qty: 85, tags: ["gray"], size: {h: 27.9, w: 35.5, uom: "cm"}},
    {item: "mousepad", qty: 25, tags: ["gel", "blue"], size: {h: 19, w: 22.85, uom: "cm"}}
])
```

# 1.db.collection.find().forEach()

`find().forEach()` iterates over the collection's documents one by one with `forEach` and inserts them into another collection, inventory2. Since it processes documents one at a time, it has the drawback of being slow.

```javascript
db.inventory.find().forEach(
    function(docs){
        db.inventory2.insert(docs);
    })
```

# 2.db.collection.aggregate()

Using the `$out operator` of `aggregate` allows you to clone a bit faster.

## Syntax

```javascript
{ $out: { db: "<output-db>", coll: "<output-collection>" } }
```


```javascript
db.inventory.aggregate([{ $match: {} }, { $out: "inventory3" }])

```

# References

- https://www.mongodbmanager.com/clone-mongodb-collection
- https://www.mongodb.com/docs/manual/reference/operator/aggregation/out/
- https://github.com/kenshin579/tutorials-go/blob/master/go-mongo/script/clone_collection.js

  
