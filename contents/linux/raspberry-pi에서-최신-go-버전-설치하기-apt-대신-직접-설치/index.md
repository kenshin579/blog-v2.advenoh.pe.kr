---
title: "Raspberry Pi에서 최신 Go 버전 설치하기 – apt 대신 직접 설치!"
description: "Raspberry Pi에서 최신 Go 버전 설치하기 – apt 대신 직접 설치!"
date: 2025-03-23
update: 2025-03-23
tags:
  - linux
  - pi
  - os
  - install
  - monitor
  - raspbian
  - raspberry pi
  - 라즈베리파이
  - go
  - golang
  - apt
---

# 1. 개요

라즈베리파이4에 64 OS 업그레디 하면서 다시 최신 Golang 설치하려니 기억이 나지 않아서 기록상 남겨둔다.

`apt`를 이용해서 설치를 하면 1.19 버전이 설치가 되어서 이 포스팅에서는 수동으로 최신 버전으로 설치하는 방법을 다룬다.

------

# 2. 최신 Golang 설치하는 방법

## 2.1 라즈베리파이 OS 확인

먼저 현재 사용 중인 라즈베리파이의 OS와 아키텍처를 확인한다.

```bash
> uname -m
aarch64
```

출력 결과에 따라 아키텍처를 확인할 수 있다.

- `armv7l` → 32비트 (ARMv7)
- `aarch64` → 64비트 (ARM64)
- `armv6l` → 32비트 (구형 모델)

## 2.2 설치된 architecture OS에 맞게 Golang 다운로드

Golang의 최신 버전을 공식 웹사이트에서 확인하고 다운로드한다.

1. 아래 명령어로 최신 버전을 확인한다.

```bash
> curl -s <https://go.dev/VERSION?m=text>
go1.24.1
time 2025-02-27T17:57:18Z
```

최신 버전을 기반으로 다운로드 URL을 설정한다.

```bash
> cd src
> wget <https://go.dev/dl/go1.X.Y.linux-><ARCH>.tar.gz
```

> `<ARCH>` 부분은 `armv6l`이면 `armv6l`, `aarch64`이면 `arm64`로 변경한다.

예를 들어, ARM64 버전의 최신 Golang을 다운로드하려면 다음과 같이 실행한다.

```bash
> wget <https://go.dev/dl/go1.22.1.linux-arm64.tar.gz>
```

## 2.3 Golang 수동 설치

기존의 Golang을 제거하고, 새 버전을 설치한다.

```bash
> sudo rm -rf ~/.local/share/go
> mkdir -p ~/.local/share && mv go ~/.local/share
```

## 2.4 환경 변수 설정

Golang을 정상적으로 사용하려면 `PATH` 환경 변수를 설정해야 한다.

```bash
> echo 'export GOPATH=$HOME/.local/share/go' >> ~/.bashrc
> echo 'export PATH=$HOME/.local/share/go/bin:$PATH' >> ~/.bashrc
> source ~/.bashrc
```

## 2.5 Golang 실행 확인

설치가 정상적으로 완료되었는지 확인한다.

```bash
> go version
go version go1.22.1 linux/arm64
```

------

# 3. 마무리

이제 라즈베리파이에 최신 Golang이 성공적으로 설치되었다. `apt`를 통한 기본 설치보다 최신 기능과 성능 최적화를 활용할 수 있다. 이후 Go 프로젝트를 시작하려면 `GOPATH` 설정 및 모듈 관리를 추가로 진행하면 된다. 🚀

# 4. 참고

- [Installing the Latest Version of Golang on Your Raspberry Pi](https://akashrajpurohit.com/blog/installing-the-latest-version-of-golang-on-your-raspberry-pi/)
- [Operating system images](https://www.raspberrypi.com/software/operating-systems/)
