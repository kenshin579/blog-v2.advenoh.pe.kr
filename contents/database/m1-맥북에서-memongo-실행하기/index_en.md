---
title: "Running Memongo on an M1 MacBook"
description: "How to run Memongo on an M1 MacBook."
date: 2023-02-25
update: 2023-02-25
tags:
  - m1
  - mac
  - mongo
  - mongodb
  - golang
  - 몽고
  - 맥북
  - memongo
---

If you are developing with the combination of an M1 MacBook + `golang` + `memongo`, you will run into the error message below and start searching for how to fix it. Since I forget the setup steps every time a new team member joins, I'm writing this down again.

When you run `memongo` on an M1, you'll see that it throws an error during the `memongo` download process saying the system architecture does not match, and it fails to run.

```bash
=== RUN   TestMongoTestSuite
{"time":"2023-02-25T17:15:24.374615+09:00","level":"FATAL","prefix":"-","file":"db.go","line":"17","message":"memongo does not support automatic downloading on your system: your architecture, arm64, is not supported"}

```

There are two solutions. Personally, rather than having to remember the option every time, I find it a bit more convenient to leave the default settings as they are and use the downloaded MongoDB binary, so I recommend running it with the second approach.

# 1. Configuring Memongo Options

You can run it on an M1 by providing the URL to download when the architecture is `arm64`.

```go
opts := &memongo.Options{
		ShouldUseReplica: true,
		MongoVersion:     "4.2.1",
		LogLevel:         2,
	}

	if runtime.GOARCH == "arm64" {
		if runtime.GOOS == "darwin" {
			// Only set the custom url as workaround for arm64 macs
			opts.DownloadURL = "https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-4.2.1.tgz"
		}
	}

	mongoServer, err := memongo.StartWithOptions(opts)
```



# 2. Using a Custom MongoDB Binary

If you download the MongoDB binary and set the environment variables `MEMONGO_MONGOD_BIN` and `PATH`, you can make it use the already installed binary instead of downloading one. If you happen to run into problems when running it, very occasionally you may need to kill `mongod` with `pkill`.

Install mongodb with brew.

```bash
$ brew tap mongodb/brew
$ brew update
$ brew install mongodb-community@4.2
```

Verify that MongoDB is installed properly.

```bash
$ mongo --version
MongoDB shell version v4.2.21
git version: b0aeed9445ff41af07449fa757e1f231bce990b3
allocator: system
modules: none
build environment:
    distarch: x86_64
    target_arch: x86_64
```

Add the required environment variables to your shell's configuration. Note that if you run it from GoLand, you need to restart the application after modifying the shell settings.

```bash
$ vim ~/.zshrc
export MEMONGO_MONGOD_BIN=/opt/homebrew/opt/mongodb-community@4.2/bin/mongod
export PATH=$PATH:/opt/homebrew/opt/mongodb-community@4.2/bin
```



If you run [memongo_test.go](https://github.com/kenshin579/tutorials-go/blob/master/go-memongo/memongo_test.go) again, you can confirm that it runs fine.

```bash
=== RUN   TestMongoTestSuite
[memongo] [INFO]  Starting MongoDB with options &memongo.Options{ShouldUseReplica:true, Port:57585, CachePath:"", MongoVersion:"4.2.1", DownloadURL:"", MongodBin:"/opt/homebrew/opt/mongodb-community@4.2/bin/mongod", Logger:(*log.Logger)(nil), LogLevel:0, StartupTimeout:10000000000, Auth:false}
--- PASS: TestMongoTestSuite (2.21s)
=== RUN   TestMongoTestSuite/TestQuery
[{_id ObjectID("63f9c767d1ef4a0debb6f01a")} {type Oolong} {rating 7} {vendor [C]}]
    --- PASS: TestMongoTestSuite/TestQuery (0.00s)
PASS
```



# References

- https://www.mongodb.com/docs/v4.2/tutorial/install-mongodb-on-os-x/
- https://github.com/nodkz/mongodb-memory-server/issues/422
- https://github.com/benweissmann/memongo
- https://github.com/tryvium-travels/memongo
