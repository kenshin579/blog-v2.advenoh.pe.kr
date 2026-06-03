---
title: "Copying Docker Images to Another Docker Registry - Skopeo"
description: "How to copy Docker images to another Docker registry using Skopeo."
date: 2024-08-26
update: 2024-08-26
tags:
  - skopeo
  - 쿠버네티스
  - Kubernetes
  - docker
  - 도커
  - 도커 이미지
  - 도커 레지스트리
  - 레지스트리
  - registry
  - docker registry
  - mirror docker registry
  - 도커 이미지 복사
---

# 1. Overview

Recently, our company has increasingly needed to deploy products to various Kubernetes cluster environments. This required copying the same Docker image to the Docker registries of multiple Kubernetes clusters.

I handled this by using the basic Docker commands to download the image locally and then push it to another Docker registry.

```bash
DOCKER_REGISTRY_SRC_ADDR="docker.io"
DOCKER_REGISTRY_DST_ADDR="demo.goharbor.io"

# download dockker image
docker pull --platform=linux $DOCKER_REGISTRY_SRC_ADDR/library/mariadb:latest

# tag docker image
docker tag $DOCKER_REGISTRY_SRC_ADDR/library/mariadb:latest $DOCKER_REGISTRY_DST_ADDR/library/mariadb:latest

# login to docker registry
docker login $DOCKER_REGISTRY_DST_ADDR

# push docker image
docker push $DOCKER_REGISTRY_DST_ADDR/library/mariadb:latest
```

Although it requires running several Docker commands, writing them as a shell script reduced some of the hassle, so I just used it that way. Then, on a recommendation from a coworker, I learned about a CLI called Skopeo. Since it makes copying Docker images to another registry easier than running the existing Docker commands, I'm putting together this note to share how Skopeo works.

# 2. What is Skopeo

Skopeo is a command-line tool for working with container images, supporting various operations such as copying, inspecting, signing, and deleting images. Because Skopeo can perform operations between image registries without a Docker engine, it is especially useful in cloud-native environments.

> On M1, the Harbor registry server didn't install well, so I use the demo server provided by the Harbor site. You just need to create a New Project and use it.
> Reference: [Test Harbor with the Demo Server](https://goharbor.io/docs/2.11.0/install-config/demo-server/)

## 2.1 Installing Skopeo

On macOS, install it via the Homebrew command as shown below.

```bash
> brew install skopeo
```

## 2.2 How to Use Skopeo

### 2.2.1 Inspecting an Image

You can inspect an image in a remote registry without downloading it locally. You can check the image's metadata as shown below.

```bash
❯ skopeo inspect docker://docker.io/library/mariadb
FATA[0001] Error parsing manifest for image: choosing image instance: no image found in image index for architecture "arm64", variant "v8", OS "darwin"
```

When running it on an M1 MacBook, an error occurs as shown above, so you need to specify the OS and Arch with the options below.

```bash
> skopeo inspect docker://docker.io/library/mariadb --override-os linux --override-arch amd64
{
    "Name": "docker.io/library/mariadb",
    "Digest": "sha256:4b812bbd9a025569fbe5a7a70e4a3cd3af53aa36621fecb1c2e108af2113450a",
    "RepoTags": [
        "10",
        "10-bionic",
        "10-focal",
        "10-jammy",
        "10-jessie",
        "10-ubi",
(...omitted...)
```

### 2.2.2 Copying an Image to Another Docker Registry

One of Skopeo's powerful features is copying an image from one registry to another. For example, to copy an image from Docker Hub to an internal private registry, you can use the following command.

```bash
> skopeo copy docker://docker.io/library/mariadb:latest docker://demo.goharbor.io/frank-test/mariadb:latest --override-os linux --override-arch amd64
Getting image source signatures
Copying blob bc75b4546118 skipped: already exists
Copying blob ad9066662cff skipped: already exists
Copying blob 8687fa065e6d skipped: already exists
Copying blob 31e907dcc94a skipped: already exists
Copying blob c13aedba8d5d skipped: already exists
Copying blob 90824338d93e skipped: already exists
Copying blob a5e6bca88fae skipped: already exists
Copying blob 537f82e52967 skipped: already exists
Copying config 92520f8661 done   |
Writing manifest to image destination
```

### 2.2.3 Deleting an Image

You can delete an image that is no longer needed from the registry with the command below.

```bash
> skopeo delete docker://demo.goharbor.io/frank-test/mariadb:latest
```

### 2.2.4 Listing Tags

To check the list of images provided by a Docker registry, you can use the `list-tags` option.

```bash
> skopeo list-tags docker://docker.io/library/mariadb
{
    "Repository": "docker.io/library/mariadb",
    "Tags": [
        "10",
        "10-bionic",
        "10-focal",
        "10-jammy",
        "10-jessie",
...omitted...
```

### 2.2.5 Login Authentication

The `skopeo login` command logs in to a specific registry and saves the authentication token to an `authfile`, so you don't have to enter your credentials repeatedly. The default authfile location is `.config/containers/auth.json`.

> Logging in to a registry

```bash
# You only need to log in this one time
> skopeo login docker.io
> skopeo login demo.goharbor.io
```

> Using the `—creds` command option

```bash
$ skopeo inspect --creds=testuser:testpassword docker://demo.goharbor.io/frank-test/mariadb:latest
{
  "Tag": "latest",
  "Digest": "sha256:473bb2189d7b913ed7187a33d11e743fdc2f88931122a44d91a301b64419f092",
  "RepoTags": [
    "latest"
  ],
  "Comment": "",
  "Created": "2016-01-15T18:06:41.282540103Z",
  "ContainerConfig": {
    "Hostname": "aded96b43f48",
...omitted...
```

# 3. References

You can find the example files described in this post [here](https://github.com/kenshin579/tutorials-go/tree/master/cloud/skopeo).

- [skopeo github](https://github.com/containers/skopeo)
