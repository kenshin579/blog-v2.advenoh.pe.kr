---
title: "Installing the Latest Go Version on Raspberry Pi – Install Directly Instead of apt!"
description: "How to manually install the latest Go version on a Raspberry Pi instead of using the outdated apt package."
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

# 1. Overview

While upgrading my Raspberry Pi 4 to the 64-bit OS, I needed to install the latest Golang again but couldn't remember how, so I'm leaving this as a record.

If you install using `apt`, version 1.19 gets installed, so this post covers how to manually install the latest version.

------

# 2. How to Install the Latest Golang

## 2.1 Checking the Raspberry Pi OS

First, check the OS and architecture of the Raspberry Pi you are currently using.

```bash
> uname -m
aarch64
```

Based on the output, you can determine the architecture.

- `armv7l` → 32-bit (ARMv7)
- `aarch64` → 64-bit (ARM64)
- `armv6l` → 32-bit (older models)

## 2.2 Download Golang According to the Installed Architecture OS

Check the latest version of Golang on the official website and download it.

1. Check the latest version with the command below.

```bash
> curl -s <https://go.dev/VERSION?m=text>
go1.24.1
time 2025-02-27T17:57:18Z
```

Set the download URL based on the latest version.

```bash
> cd src
> wget <https://go.dev/dl/go1.X.Y.linux-><ARCH>.tar.gz
```

> For the `<ARCH>` part, use `armv6l` if it's `armv6l`, or `arm64` if it's `aarch64`.

For example, to download the latest Golang for the ARM64 version, run it as follows.

```bash
> wget <https://go.dev/dl/go1.22.1.linux-arm64.tar.gz>
```

## 2.3 Manually Installing Golang

Remove the existing Golang and install the new version.

```bash
> sudo rm -rf ~/.local/share/go
> mkdir -p ~/.local/share && mv go ~/.local/share
```

## 2.4 Setting Environment Variables

To use Golang properly, you need to set the `PATH` environment variable.

```bash
> echo 'export GOPATH=$HOME/.local/share/go' >> ~/.bashrc
> echo 'export PATH=$HOME/.local/share/go/bin:$PATH' >> ~/.bashrc
> source ~/.bashrc
```

## 2.5 Verifying the Golang Installation

Check whether the installation completed successfully.

```bash
> go version
go version go1.22.1 linux/arm64
```

------

# 3. Conclusion

Now the latest Golang has been successfully installed on the Raspberry Pi. Compared to the default installation via `apt`, you can take advantage of the latest features and performance optimizations. After this, to start a Go project, you can additionally proceed with setting up `GOPATH` and managing modules. 🚀

# 4. References

- [Installing the Latest Version of Golang on Your Raspberry Pi](https://akashrajpurohit.com/blog/installing-the-latest-version-of-golang-on-your-raspberry-pi/)
- [Operating system images](https://www.raspberrypi.com/software/operating-systems/)
