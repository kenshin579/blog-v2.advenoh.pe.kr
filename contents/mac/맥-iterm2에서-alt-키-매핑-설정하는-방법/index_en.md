---
title: "How to Set Up Alt Key Mapping in iTerm2 on Mac"
description: "Configure the Alt key in iTerm2 so that Option + arrow keys jump word by word, just like on Linux terminals."
date: 2024-12-08
update: 2024-12-08
tags:
  - m1
  - 맥북
  - iTerm2
  - iterm
  - alt mapping
  - word jumping
---

# 1. Overview

When using a terminal in a Linux environment, the Alt key combined with the arrow keys (←, →) lets you move word by word — a feature that's enabled by default and very convenient. However, on the Mac's iTerm2, this feature isn't set up by default; instead, pressing those keys just displays values like `^[D` or `^[C`.

```bash
> helm upgrade --install asynqmon . -f values-dev.yaml -n dev [D[D[C[C
```

In this post, I'll show you how to map the Alt key in iTerm2 so you can use this feature on a Mac as well.

# 2. How to Set Up Alt Key Mapping in iTerm2

In `Settings` > `Profiles` > `Keys` > `Key Mappings`, add new mappings as shown below.

- `⌥←` :
  - Action: select `Send Escape Sequence`
  - Esc +: enter the value `b`
- `⌥→` :
  - Action: select `Send Escape Sequence`
  - Esc +: enter the value `f`

![Adding a new key](image-20241208152913924.png)



In the end, you just need to add the two key mappings shown below.

![Key Mapping](image-20241208152923853.png)

# 3. References

- [Making the Alt Key Work in iTerm2](https://www.clairecodes.com/blog/2018-10-15-making-the-alt-key-work-in-iterm2/)
