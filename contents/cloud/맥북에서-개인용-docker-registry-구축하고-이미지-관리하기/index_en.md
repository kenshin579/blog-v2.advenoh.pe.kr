---
title: "Setting Up a Personal Docker Registry on a MacBook and Managing Images"
description: "A step-by-step guide to building a personal Docker Registry on a MacBook and managing your container images."
date: 2025-05-05
update: 2025-05-05
tags:
  - docker
  - docker registry
  - 도커 레지스트리
  - 개인용 도커 레지스트리 구축
  - private registry
  - 도커 이미지 관리
  - harbor
---

# 1. Overview

When you want to directly manage `Docker` images to deploy your developed application or use it in a test environment, running a personal `Docker Registry` is useful. In particular, having your own image repository for your local network or development purposes—without relying on an external registry—offers advantages in both deployment speed and security.

In this article, I'll walk through, step by step, how to set up a `Docker Registry` server in a local MacBook environment and upload and run your app images on it.

# 2. Setting Up the Docker Registry Server

## 2.1 Running the `Registry` Server with `Docker`

`Docker` provides a `Registry` image, so you can run a `Registry` server with a single container without any complicated installation. The following command runs a `Docker Registry` with basic user authentication and a local storage folder configured.

### 2.1.1 Create the User Login Authentication File

```bash
> brew install http
> mkdir -p /Users/user/data/docker/auth

# Create the user authentication file (username: admin, password: password)
> htpasswd -Bbn admin password > /Users/user/data/docker/auth/htpasswd
```

The `username` and `password` you enter are saved in the `/Users/user/data/docker/auth/htpasswd` file.

### 2.1.2 Run the Docker Registry Container

```bash
> docker run -d --name private-registry -p 7001:5000 \\
  --restart=always \\
  -v /Users/user/data/docker/private-registry:/var/lib/registry \\
  -v /Users/user/data/docker/auth:/auth \\
  -e "REGISTRY_AUTH=htpasswd" \\
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \\
  -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \\
  registry:2
```

- `-e`: sets environment variables to use the `htpasswd` authentication method and specifies the path to the authentication file
- `-v`: configures image data to be stored on the `host` machine so that the existing data is used even after Docker restarts

------

## 2.2 Uploading and Running a Docker Image

Now let's upload a Docker image to the personal `Registry` and run the uploaded image.

Because a password is required, log in to `docker` by entering the `username`/password as shown in the command below.

```bash
> docker login localhost:7001 -u admin -p password
```

To test running Docker, let's push the `busybox` Docker image to the personal `registry` server.

```bash
> docker tag busybox localhost:7001/helloworld

> docker push localhost:7001/helloworld
Using default tag: latest
The push refers to repository [localhost:7001/helloworld]
be632cf9bbb6: Pushed 
latest: digest: sha256:c109a60479ed80d63b17808a6f993228b6ace6255064160ea82adfa01c36deba size: 527

> docker run localhost:7001/helloworld echo "Hello, World"
Hello World
```

You can confirm that it ran with the uploaded version, but you can also verify it using the `Docker Registry API`.

```bash
# Use the Docker Registry API v2 to query the list of all stored image repositories
> curl <http://localhost:7001/v2/_catalog>
{"repositories":["helloworld"]}

# Query all tags of the helloworld image
curl <http://localhost:7001/v2/helloworld/tags/list>
{"name":"helloworld","tags":["latest"]}
```

# 3. Conclusion

In this article, I covered the entire process of setting up a `Docker Registry` server in a local MacBook environment and uploading and running a developed `Docker` image. For images that are difficult to upload to a public `Registry` server, building a personal `Registry` like this makes image management easy.

> If you need to split image access permissions by team, or require user authentication, vulnerability scanning, and UI-based image management features, you might consider [**Harbor**](https://goharbor.io/). `Harbor` is an open-source `Docker Registry` managed by the `CNCF` that provides more powerful and sophisticated image management capabilities.

# 4. References

- [[Docker\] Docker Registry(Private Repository, Http)](https://lucas-owner.tistory.com/89)
- [Private Docker Registry 구축 및 보안 강화](https://velog.io/@luckyprice1103/Private-Docker-Registry-구축-및-보안-강화-2)
