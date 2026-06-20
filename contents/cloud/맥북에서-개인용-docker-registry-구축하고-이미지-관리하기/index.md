---
title: "맥북에서 개인용 Docker Registry 구축하고 이미지 관리하기"
description: "맥북 로컬에서 인증을 적용한 Docker Registry 컨테이너를 띄우고 이미지를 푸시·실행·조회하는 방법을 정리한다."
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

# 1. 개요

개발한 애플리케이션을 배포하거나 테스트 환경에서 쓰려고 Docker 이미지를 직접 관리할 때, 개인용 Docker Registry를 운영하면 편하다. 외부 레지스트리에 올리지 않고 로컬에 이미지 저장소를 두면 인터넷 없이도 푸시·풀이 되고, 공개하기 곤란한 이미지를 외부에 노출하지 않아도 된다.

이번 글에서는 맥북 로컬 환경에 Docker Registry 서버를 띄우고, 직접 만든 이미지를 업로드해서 실행하는 과정을 정리한다.

# 2. Docker Registry 서버 구축하기

## 2.1 Docker로 Registry 서버 실행하기

Docker는 `registry` 이미지를 제공하기 때문에 별도 설치 없이 컨테이너 하나로 Registry 서버를 띄울 수 있다. 다음 명령어로 사용자 인증과 로컬 저장소 폴더를 적용한 Registry를 실행한다.

### 2.1.1 사용자 로그인 인증 파일 생성

```bash
> brew install httpd
> mkdir -p /Users/user/data/docker/auth

# 사용자 인증 파일 생성 (username: admin, password: password)
> htpasswd -Bbn admin password > /Users/user/data/docker/auth/htpasswd
```

입력한 `username`과 `password`는 `/Users/user/data/docker/auth/htpasswd` 파일에 저장이 된다.

### 2.1.2 Docker Registry 컨테이너 실행

```bash
> docker run -d --name private-registry -p 7001:5000 \
  --restart=always \
  -v /Users/user/data/docker/private-registry:/var/lib/registry \
  -v /Users/user/data/docker/auth:/auth \
  -e "REGISTRY_AUTH=htpasswd" \
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
  -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \
  registry:2
```

- `-e`: 환경 변수를 설정해서 `htpasswd` 인증 방식을 사용하고 인증 파일의 경로를 지정한다
- `-v` : 이미지 데이터가 `host` 머신에 저장하도록 설정하여 도커를 재시작해도 기존 데이터로 동작하도록 한다

------

## 2.2 Docker 이미지 업로드 및 실행

이제 개인 Registry에 이미지를 업로드하고, 올린 이미지를 실행해보자.

암호를 입력해야 하기 때문에 `docker` 로그인시 아래 명령어와 같이 `username`/password를 입력해서 로그인을 한다.

```bash
> docker login localhost:7001 -u admin -p password
```

실행 테스트를 위해 `busybox` 이미지를 개인 Registry 서버에 올려본다.

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

업로드한 버전으로 실행된 것을 확인할 수 있는데, Registry API로도 조회해볼 수 있다.

```bash
# Docker Registry API v2를 사용하여 저장된 모든 이미지 저장소 목록을 조회
> curl http://localhost:7001/v2/_catalog
{"repositories":["helloworld"]}

# helloworld 이미지의 모든 태그를 조회
curl http://localhost:7001/v2/helloworld/tags/list
{"name":"helloworld","tags":["latest"]}
```

# 3. 마무리

정리하면, `htpasswd`로 인증 파일을 만들고 `registry:2` 컨테이너를 띄운 뒤, `busybox` 이미지를 태그해서 push하고 Registry API(`/v2/_catalog`)로 저장된 이미지를 확인했다. 공개 Registry에 올리기 어려운 이미지는 이렇게 개인용 Registry에 두고 쓰면 된다.

> 팀 단위로 이미지 접근 권한을 나누거나, 사용자 인증·취약점 스캔·UI 기반 관리가 필요하다면 [**Harbor**](https://goharbor.io/)를 고려해볼 수 있다. Harbor는 CNCF에서 관리하는 오픈소스 Registry로, RBAC, 취약점 스캔, 웹 UI 같은 기능을 갖추고 있다.

# 4. 참고

- [[Docker] Docker Registry(Private Repository, Http)](https://lucas-owner.tistory.com/89)
- [Private Docker Registry 구축 및 보안 강화](https://velog.io/@luckyprice1103/Private-Docker-Registry-구축-및-보안-강화-2)
