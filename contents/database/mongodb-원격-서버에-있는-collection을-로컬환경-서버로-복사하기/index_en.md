---
title: "Copying a Collection from a Remote MongoDB Server to a Local Server"
description: "How to copy a collection from a remote MongoDB server to a local environment using mongodump and mongoimport."
date: 2022-07-24
update: 2022-07-24
tags:
  - mongo
  - clone
  - backup
  - dump
  - import
---

During development, you often need to copy remote data to your local environment exactly as-is for testing. In a [previous post](https://blog.advenoh.pe.kr/mongodb-collection-cloning하는-방법/), we looked at how to clone a collection within the same server. This time, let's look at how to clone from a remote server to your local environment.

# 1. mongodump

The `mongodump` command is not a `mongo` shell command but a command-line tool installed alongside MongoDB. `mongodump` is a tool that exports MongoDB data.

- `--host` : host name
- `--por`t : port
- `-u` : user
- `-p` : password
- `--db` : database name

```bash
$ mongodump --host remotehost --port 27017 -u username -p 'password' --db clone
2022-07-24T22:45:15.852+0900    writing clone.inventory to dump/clone/inventory.bson
2022-07-24T22:45:15.854+0900    writing clone.inventory3 to dump/clone/inventory3.bson
2022-07-24T22:45:15.857+0900    writing clone.inventoryclone to dump/clone/inventoryclone.bson
2022-07-24T22:45:15.862+0900    done dumping clone.inventoryclone (3 documents)
2022-07-24T22:45:15.862+0900    done dumping clone.inventory (3 documents)
2022-07-24T22:45:15.862+0900    done dumping clone.inventory3 (3 documents)
```

After running it, the backup files are created inside the `dump/database_name` folder.

```bash
$ cd dump/clone
$ ls 
inventory.bson               inventory.metadata.json      inventory3.bson              inventory3.metadata.json     inventoryclone.bson          inventoryclone.metadata.json
```

# 2. mongoimport

To create the dumped data in your local environment with `mongoimport`, just use `mongoimport`.

- `--uri` : enter the MongoDB address
- `-d` : database name
- `-c` : collection name

```bash
$ mongoimport --uri "mongodb://localhost:27017" -d clone2 -c inventory inventory.metadata.json
2022-07-24T22:56:53.354+0900    connected to: mongodb://localhost:27017
2022-07-24T22:56:53.381+0900    1 document(s) imported successfully. 0 document(s) failed to import.
```

# 3. Conclusion

As some of you may have already realized, using the mongodump and mongoimport commands enables cloning across various systems as shown below.

- Remote server -> local environment
- Remote server -> another remote server
- Local environment -> local environment

# 4. References

- https://www.mongodb.com/docs/database-tools/mongodump/

  

  
