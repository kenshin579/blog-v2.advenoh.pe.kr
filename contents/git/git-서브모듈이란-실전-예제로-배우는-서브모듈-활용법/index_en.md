---
title: "What Is a Git Submodule? Learning How to Use Submodules with Hands-on Examples"
description: "What Git submodules are and how to add, use, update, and remove them with practical examples."
date: 2025-04-03
update: 2025-04-03
tags:
  - git
  - git submodule
  - 깃 서브모듈
  - 서브모듈
---

# 1. Overview

## What is a Git submodule?

A `Git` submodule (Git Submodule) is a feature that lets you include another `Git` repository inside a single `Git` repository. This allows you to manage a separate repository independently while still reusing it within a specific project.

## Why and when do you use it?

- **Code reuse**: Useful when you need to maintain the same library or common codebase across multiple projects
- **Independent version control**: Since submodules are managed independently, you can version-control them separately from the main project
- **Sharing and collaboration**: Convenient when a team needs to use a common module across multiple projects

## How do you use it?

With `Git` submodules, you can include and manage a separate repository within a single Git repository. Basically, it goes through the following process:

1. Add a submodule
2. Use the repository that includes the submodule
3. Update and maintain the submodule
4. Remove the submodule

------

# 2. Trying Out Submodules

## 2.1 Including a submodule Repo in the main Repo

To add a `Git` submodule, run the following command.

```bash
> cd main-repo

# Add a submodule
> git submodule add <https://github.com/kenshin579/submodule-repo.git> submodule
Cloning into '/Users/user/GolandProjects/main-repo/submodule'...
remote: Enumerating objects: 11, done.
remote: Counting objects: 100% (11/11), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 11 (delta 0), reused 6 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (11/11), done.
```

Running the above command includes the submodule in the current directory. When you add a submodule, a `.gitmodules` file is created. This file contains information about the submodule.

```
[submodule "submodule"]
	path = submodule
	url = <https://github.com/kenshin579/submodule-repo.git>
```

This file defines how the main repository should reference the submodule.

## 2.2 Using a Repo that includes a submodule

By default, when you clone a `Git` repository, the submodule is not cloned automatically. To bring the submodule along as well, run the following.

```bash
> git clone --recursive <https://github.com/kenshin579/main-repo.git>
Cloning into 'main-repo'...
remote: Enumerating objects: 10, done.
remote: Counting objects: 100% (10/10), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 10 (delta 0), reused 6 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (10/10), done.
Submodule 'submodule' (<https://github.com/kenshin579/submodule-repo.git>) registered for path 'submodule'
Cloning into '/Users/user/src/main-repo/submodule'...
remote: Enumerating objects: 11, done.
remote: Counting objects: 100% (11/11), done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 11 (delta 0), reused 6 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (11/11), done.
Submodule path 'submodule': checked out '988b35283f2d7b7ed93c552e7ae50f4fdd5adb7d'

> cd main-repo
> tree
.
├── README.md
└── submodule
    ├── README.md
    └── submodule-file.txt

2 directories, 3 files
```

If you cloned without the `--recursive` option, you need to manually initialize and update the submodule.

```bash
> git submodule update --init --recursive
```

## 2.3 Downloading the latest submodule code

Add a new file in the submodule, commit it, and then push.

```bash
> cd submodule
> echo "New content" > new-file.txt
> git add new-file.txt
> git commit -m "Add new file"
> git push origin main
```

Since the submodule has been updated, you also need to pull the latest code in the main repository.

```bash
> cd main-repo
> git submodule update --remote
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 4 (delta 1), reused 3 (delta 1), pack-reused 0 (from 0)
Unpacking objects: 100% (4/4), 1.18 KiB | 402.00 KiB/s, done.
From <https://github.com/kenshin579/submodule-repo>
   48e49d4..5419b0a  chores     -> origin/chores
   988b352..d5f4a06  main       -> origin/main
Submodule path 'submodule': checked out 'd5f4a065378f733945944cca2815116c1cece8e9'
```

You can confirm that the submodule has been updated to the latest state.

## 2.4 Removing a submodule from the main Repo

To remove a submodule, perform the following steps.

```bash
# Remove the submodule referenced in .gitmodules
> git submodule deinit -f path/to/submodule

# Delete the submodule folder
> git rm --cached path/to/submodule
> rm -rf .git/modules/path/to/submodule

# commit changes
> git commit -m "Removed submodule"
> git push origin main
```

# 3. Wrapping Up

A `Git` submodule is a powerful feature that lets you effectively manage a separate `Git` repository within a single project. However, when using submodules, keep the following points in mind.

- Since a submodule is an independent repository, it needs to be updated separately
- If you clone without the `--recursive` option, the submodule is not included, so an initialization step is needed
- When removing a submodule, you need to clean up the `.gitmodules` file and the `.git/modules` directory

Use this guide to make effective use of `Git` submodules!

> For reference, the examples written here can be found on the github below
> - [main-repo](https://github.com/kenshin579/main-repo)
> - [submodule-repo](https://www.notion.so/Git-1ca46a2166e380068207d9c29824569a?pvs=21)

# 4. References

- [Git Tools - Submodules](https://git-scm.com/book/ko/v2/Git-도구-서브모듈)
- [Git submodules](https://www.atlassian.com/ko/git/tutorials/git-submodule)
- [Using Git Submodules](https://devocean.sk.com/blog/techBoardDetail.do?ID=165172&boardType=techBlog)
