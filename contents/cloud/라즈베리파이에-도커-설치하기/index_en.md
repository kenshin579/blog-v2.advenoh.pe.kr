---
title: "Installing Docker on a Raspberry Pi"
description: "A guide to installing Docker on a Raspberry Pi."
date: 2021-07-18
update: 2021-07-18
tags:
  - raspberry
  - docker
  - install
  - 도커
  - 라즈베리파이
  - 설치
---

Let's take a look at how to install Docker on a Raspberry Pi.

## Prerequisites

- Raspbian OS installed on the Raspberry Pi
    - Reference: [Installing Raspberry Pi 4 OS Without a Monitor](https://blog.advenoh.pe.kr/raspberry-pi4-os-설치/)
- SSH connection enabled

# Installing Docker on a Raspberry Pi

## Installing Docker with a Script

Download the installation script provided by Docker and run it directly.

```bash
$ curl -sSL https://get.docker.com | sh
Executing docker install script, commit: 7cae5f8b0decc17d6571f9f52eb840fbc13b2737
+ sudo -E sh -c apt-get update -qq >/dev/null
+ sudo -E sh -c DEBIAN_FRONTEND=noninteractive apt-get install -y -qq apt-transport-https ca-certificates curl >/dev/null
+ sudo -E sh -c curl -fsSL "https://download.docker.com/linux/raspbian/gpg" | apt-key add -qq - >/dev/null
Warning: apt-key output should not be parsed (stdout is not a terminal)
...omitted...
```



## Adding a Non-root User to the Docker Group

By default, running a Docker container requires root privileges. You can run it with sudo, but if you want a user without root privileges to run it as well, you can add the user to the docker group. You need to log out and log back in for it to take effect.

```bash
$ sudo usermod -aG docker pi
```

Now let's run a Docker command to check whether the installation went well. If it was installed correctly, you should be able to see the Docker version and additional information.

```bash
$ docker verion
```



## Testing by Running the Hello World Container

The best way to test whether Docker was installed correctly is to run the Hello World container as the final step. Run the container with the command below.

```bash
$ docker run hello-world
```

# References

- https://dev.to/elalemanyo/how-to-install-docker-and-docker-compose-on-raspberry-pi-1mo
- https://www.boolsee.pe.kr/installation-and-running-of-docker-in-raspberry-pi-buster/
- https://phoenixnap.com/kb/docker-on-raspberry-pi
