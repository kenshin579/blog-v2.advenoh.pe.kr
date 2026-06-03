---
title: "Deleting Multiple Git Branches at Once"
description: "How to delete multiple local and remote Git branches at once using grep and xargs."
date: 2020-07-11
update: 2020-07-11
tags:
  - git
  - github
  - branch
  - multiple
  - delete
  - 깃
  - 깃허브
  - 다중
  - 삭제
  - 브랜치
---

Let's look at how to delete multiple Git local and remote branches at once.

# 1. Deleting Multiple Local Branches

## 1.1 Listing the branches you want to delete

Check the list of branches you want to delete with the `grep` command.

```bash
$ git branch | grep "MEDIA-1"
  deploy/MEDIA-1078
  deploy/MEDIA-1210
  feature/MEDIA-1068
```

## 1.2 Deleting branches at once with a search pattern

Pass the branches found with `grep` to the `xargs` command via a pipeline to delete them.

> The `xargs` command passes the output of the previous command as arguments to the next command.

```bash
$ git branch | grep "MEDIA-1" | xargs git branch -D
Deleted branch deploy/MEDIA-1078 (was f21fb73ce).
Deleted branch deploy/MEDIA-1210 (was d8918276b).
Deleted branch feature/MEDIA-1068 (was e5c3e4d6b).
```

# 2. Deleting Multiple Remote Branches

## 2.1 Checking the list of Remote branches

Remote branches can be deleted on the same principle. You can check the list of Remote branches with git's `-r` (`--remotes`) option.

```bash
$ git branch -r | grep -Eo 'greenkeeper/.*'
greenkeeper/monorepo.gatsby-20190320034241
greenkeeper/monorepo.gatsby-20190322142727
greenkeeper/monorepo.gatsby-20190322145441
```

## 2.2 Deleting multiple Remote branches

Delete the branches found with the search pattern one by one with xargs.

The `git push origin :branch-to-delete` command is used to delete the remote branch as well when a local branch is deleted.

```bash
$ git branch -r | grep -Eo 'greenkeeper/.*' | xargs -I {} git push origin :{} 
To https://github.com/kenshin579/advenoh.pe.kr.git
 - [deleted]         greenkeeper/monorepo.gatsby-20190320034241
To https://github.com/kenshin579/advenoh.pe.kr.git
 - [deleted]         greenkeeper/monorepo.gatsby-20190322142727
To https://github.com/kenshin579/advenoh.pe.kr.git
 - [deleted]         greenkeeper/monorepo.gatsby-20190322145441
```

# 3. References

* git branch
    * https://medium.com/@rajsek/deleting-multiple-branches-in-git-e07be9f5073c
    * https://stackoverflow.com/questions/10555136/delete-multiple-remote-branches-in-git
    * https://www.educative.io/edpresso/how-to-delete-remote-branches-in-git
    * https://trustyoo86.github.io/git/2017/11/28/git-remote-branch-create.html
* xargs
    * https://rsec.kr/?p=91
