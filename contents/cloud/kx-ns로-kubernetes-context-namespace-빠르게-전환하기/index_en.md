---
title: "Switching Kubernetes context and namespace quickly with kx and ns (with fzf)"
description: "Tired of typing kubectl config use-context and -n namespace over and over? Here are two tiny fzf-based scripts, kx and ns, that let you pick a context and namespace interactively — plus an alias trick using a ~/.ns file to drop the -n flag entirely."
date: 2026-06-19
update: 2026-06-19
tags:
  - kubernetes
  - k8s
  - kubectl
  - fzf
  - kx
  - ns
  - 생산성
---

# 1. Introduction

When you work across multiple Kubernetes clusters, switching the cluster (context) and specifying the namespace for your work is something you repeat dozens of times a day.

```bash
# Which cluster am I looking at right now?
kubectl config current-context

# Specify the namespace on every single command...
kubectl get pods -n web-dev
kubectl logs -n web-dev my-pod-xxxx
kubectl describe deploy -n web-dev my-app
```

Specifying the namespace with `-n` on every command is especially tedious. You can change the default namespace with `kubectl config set-context --current --namespace=...`, but that still requires knowing the exact namespace name and typing a long command.

Doing all of this by hand got annoying, so I built two tiny scripts — `kx` (context switching) and `ns` (namespace switching) — that **pick from a list** using `fzf`. This post shares that workflow.

> For reference, I don't split my kubeconfig across multiple files — I merge everything into a single `~/.kube/config`. Read this post assuming all of your clusters' contexts live in that one file.

## 1.1 Picking from a list with fzf

[fzf](https://github.com/junegunn/fzf) is an interactive command-line fuzzy finder. It takes a list from standard input, lets you filter by typing, lets you pick with the arrow keys, and returns the selected line to standard output. It's the core tool of this post.

On macOS, install it with Homebrew.

```bash
brew install fzf
```

`fzf` works simply: pipe the output of any command into it, a selection UI pops up, and the line you pick is printed out.

```bash
# Pick one entry from the directory's file list
ls | fzf
```

In other words, the combination of **"a command that produces a list" + `fzf` + "a command that runs on the chosen value"** lets you build any interactive selector. `kx` and `ns` are exactly this pattern.

# 2. Switching k8s context and namespace easily with fzf

Now let's build the actual switching tools with `fzf`. We'll go in order: `kx` to pick a context, `ns` to pick a namespace, and then an alias that ties them together for even more convenience.

## 2.1 kx — switching context with fzf

First, the `kx` script that picks and switches a context.

```bash
#!/bin/bash

context=$(kubectl config get-contexts \
    | grep -v CURRENT | sed 's/\*//' \
    | awk '{print $1}' \
    | fzf -x -e --reverse --bind=left:page-up,right:page-down --no-mouse)

if [[ $context != "" ]]; then
  kubectl config use-context $context
fi
```

Let's break down the pipeline step by step.

- `kubectl config get-contexts` — prints the registered contexts as a table. The first line is the `CURRENT NAME CLUSTER ...` header, and the current context is prefixed with a `*`.
- `grep -v CURRENT` — removes the **header line** that contains the word `CURRENT`.
- `sed 's/\*//'` — strips the `*` that marks the current context. Without this, the `*` would leak into the context name.
- `awk '{print $1}'` — extracts only the **first column (the context name)** from each line.
- `fzf ...` — pipes that list of names into `fzf` for interactive selection.

Here's a summary of the `fzf` options:

| Option | Meaning |
| --- | --- |
| `-x` (`--extended`) | Extended search mode (AND-search multiple keywords separated by spaces) |
| `-e` (`--exact`) | Exact substring matching (exact rather than fuzzy) |
| `--reverse` | Input box on top, list below (read top-to-bottom) |
| `--bind=left:page-up,right:page-down` | Map ←/→ keys to page movement |
| `--no-mouse` | Disable the mouse (so terminal scrolling isn't captured by `fzf`) |

Finally, the `[[ $context != "" ]]` guard prevents `use-context` from running **when you cancel with `ESC` in `fzf`** (empty value).

That's all it takes to switch clusters.

Run `kx` and the registered contexts show up in an `fzf` screen.

```text
>                                                              ← search input box
  4/4                                                          ← (matches / total count)
> minikube                                                     ← current cursor (>) position
  docker-desktop
  prod-cluster
  staging-cluster
```

Type just a few characters like `prod` and the list narrows instantly. No need to scan through every context — you can pick exactly the one you want right away.

```text
> prod
  1/4
> prod-cluster
```

Press `Enter` on the remaining line and it switches to that context.

```bash
$ kx
Switched to context "prod-cluster".
```

## 2.2 ns — switching namespace with fzf

The `ns` script applies the same pattern to namespaces.

```bash
#!/bin/bash

namespace=$(kubectl get ns \
  | awk '{print $1}' \
  | grep -v NAME \
  | fzf -x -e --reverse --bind=left:page-up,right:page-down --no-mouse)

if [[ $namespace != "" ]]; then
  echo $namespace > ~/.ns
  cat ~/.ns
fi

kubectl config set-context --current --namespace=$namespace
```

It's almost identical to `kx`.

- `kubectl get ns` — prints the namespace list (`NAME STATUS AGE`).
- `awk '{print $1}'` — extracts only the first column (the namespace name).
- `grep -v NAME` — removes the `NAME` header line.
- `fzf ...` — selects interactively.

There's one key difference from `kx`.

```bash
echo $namespace > ~/.ns
```

It **saves the chosen namespace to a `~/.ns` file**. This is what truly shines in the next section. At the same time, `kubectl config set-context --current --namespace=$namespace` also changes the current context's default namespace.

Run `ns` and the current cluster's namespaces show up in `fzf`.

```text
>
  6/6
> default
  kube-system
  kube-public
  web-dev
  web-staging
  monitoring
```

Type `web` to narrow it down, then pick `web-dev` and press `Enter`.

```text
> web
  2/6
> web-dev
  web-staging
```

The selected value is saved to `~/.ns`, and the current context's default namespace changes along with it.

```bash
$ ns
web-dev
Context "..." modified.
```

## 2.3 Finishing with an alias

The reason `ns` saves the chosen namespace to `~/.ns` is to use that value as a **single source of truth** wired into an alias. Add the following alias to `~/.zshrc` (or `~/.bashrc`).

```bash
alias kc='kubectl -n $(cat ~/.ns)'
```

`kc` is `kubectl -n $(cat ~/.ns)` — that is, it **automatically injects the namespace you picked with `ns` into the `-n` flag.** Since the alias reads `~/.ns` every time it runs, changing the namespace with `ns` also changes what `kc` targets.

Now the whole workflow flows like this.

```bash
$ kx          # select the cluster (context)
$ ns          # select the namespace → saved to ~/.ns

$ kc get pods            # = kubectl -n web-dev get pods
$ kc logs my-pod-xxxx    # = kubectl -n web-dev logs my-pod-xxxx
$ kc describe deploy x   # = kubectl -n web-dev describe deploy x
```

You no longer need to append `-n web-dev` every time. There's also the option of changing the default namespace with `set-context --namespace`, but the `~/.ns` + `kc` combination is more intuitive because it **carries "the namespace I'm currently working on" explicitly in a single file**. If you ever lose track of which namespace you're looking at, a quick `cat ~/.ns` tells you.

## 2.4 Why doesn't kx create ~/.kx?

One question might come up here. `ns` saves its selection to `~/.ns`, so why doesn't `kx` create a `~/.kx` file? It looks like an asymmetry, but there's a reason.

The key is **where `kubectl` remembers the "current state"**.

- **context**: When you run `kubectl config use-context`, that choice is persisted to the `current-context` field of the kubeconfig (`~/.kube/config`). Every subsequent `kubectl` command automatically uses that context. If you want the current value, `kubectl config current-context` is one line away — so no separate file is needed.
- **namespace**: A namespace is also stored in the kubeconfig, but the `kc='kubectl -n $(cat ~/.ns)'` alias needs to **pull that value out as text in the shell** and inject it after `-n`. The value inside the kubeconfig is only used internally by `kubectl` and isn't easy to extract with `$(...)`. So we write it separately to a plain text file, `~/.ns`, and the alias reads it with `cat`.

| | Where current state is stored | Need to pull the value out in the shell | Separate file |
| --- | --- | --- | --- |
| **context** | kubeconfig `current-context` (`kubectl` uses it automatically) | None | ❌ |
| **namespace** | kubeconfig + `~/.ns` | `kc` alias uses `$(cat ~/.ns)` | ✅ |

So `~/.ns` is less about "storing" the namespace and more about **replicating it in a form that's easy to pull out in the shell**. A context doesn't need that, which is why there's no `~/.kx`.

# 3. Keep your personal scripts in ~/bin

I keep personal scripts like `kx` and `ns` together in a `~/bin` directory, managed as a git repository. That way I can restore the exact same setup on a new Mac with a single clone.

```bash
# Place the scripts in ~/bin and grant execute permission
chmod +x ~/bin/kx ~/bin/ns
```

If you register `~/bin` on your `PATH`, you can run `kx` and `ns` from anywhere just by typing them.

```bash
# ~/.zshrc
export PATH="$HOME/bin:$PATH"
```

Managing `~/bin` as a git repository keeps a change history of your scripts and makes syncing across machines easy. Once your personal automation scripts start piling up, it's worth organizing them once.

# 4. Wrapping up

To recap, commands you used to type out in full have become this short.

| Before | After |
| --- | --- |
| `kubectl config use-context prod-cluster` | `kx` |
| `kubectl config set-context --current --namespace=web-dev` | `ns` |
| `kubectl -n web-dev get pods` | `kc get pods` |

The key isn't some fancy tool but the simple pattern **`list command | fzf | run command`**. This pattern applies not only to context/namespace but to almost any "pick from a list and run" task — selecting a pod, switching a git branch, and more. If you have a command you repeat every day, try wrapping it once in a two-line `fzf` script.
