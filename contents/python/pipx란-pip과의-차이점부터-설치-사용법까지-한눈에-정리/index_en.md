---
title: "What Is pipx? From Differences with pip to Installation and Usage at a Glance"
description: "A clear summary of pipx, including how it differs from pip and how to install and use it."
date: 2025-03-26
update: 2025-03-26
tags:
  - python
  - pip
  - pipx
  - 파이썬
  - 패키지
---

# 1. Overview

## 1.1 Why You Should Use pipx

When installing Python packages, you typically use `pip`, but for some CLI (application) packages, it can be more appropriate to install them globally while still running them in an isolated environment. Using `pipx` for this offers the following advantages.

## 1.2 Differences from pip

| Feature           | `pip`                                            | `pipx`                               |
| -------------- | ------------------------------------------------ | ------------------------------------ |
| Default install location | No virtual environment; system-wide or inside the project folder | Installed in isolation within an individual virtual environment  |
| Running CLI apps    | `python -m <package>` or run directly              | Run directly with `pipx run <package>` |
| Package management    | Suited for managing per-project dependencies                    | Suited for installing and managing global CLI tools    |

## 1.3 Key Features

- Installs each package in a separate virtual environment, so it doesn't pollute the system Python environment
- Lets you run CLI packages with `pipx run` without a separate installation
- Provides a feature to update all installed packages at once
- Registered to PATH

# 2. Installing pipx and Basic Usage

## 2.1 Installing pipx

On macOS, you can install it with `Homebrew` or with Python's `pip` command.

```bash
> pip install pipx

# Install with brew
> brew install pipx
> pipx ensurepath  # Configure PATH (terminal restart required)
```

In `pipx`, you can run the `ensurepath` command to automatically configure the environment variables. Once the environment variables are set, you need to restart the terminal or run `source ~/.bashrc` or `source ~/.zshrc` to use it immediately in the currently open shell.

## 2.2 How to Use pipx

### 2.2.1 Installing a Package

Using the `pipx install <package-name>` command installs the package in an isolated virtual environment.

```bash
> pipx install poetry  # Install poetry with pipx
  installed package poetry 2.1.1, installed using Python 3.13.2
  These apps are now globally available
    - poetry
done! ✨ 🌟 ✨
```

You can check packages installed with `pipx` using the list command.

```bash
> pipx list
venvs are in /Users/user/.local/pipx/venvs
apps are exposed on your $PATH at /Users/user/.local/bin
manual pages are exposed at /Users/user/.local/share/man
   package crawl4ai 0.5.0.post4, installed using Python 3.13.2
    - crawl4ai-doctor
    - crawl4ai-download-models
    - crawl4ai-migrate
    - crawl4ai-setup
    - crwl
   package httpie 3.2.4, installed using Python 3.13.2
    - http
    - httpie
    - https
    - man1/http.1
    - man1/httpie.1
    - man1/https.1
   package poetry 2.1.1, installed using Python 3.13.2
    - poetry
```

After installation, you can also check the execution path using the `which` command.

```bash
> which poetry  # /Users/username/.local/bin/poetry
```

### 2.2.2 Running a Package

Installed packages can be run directly.

```bash
> poetry --version
> http --help  # Run httpie
```

### 2.2.3 Removing a Package

Remove a package with the `uninstall` command.

```bash
> pipx uninstall poetry
```

To remove all installed packages at once, use the following command.

```bash
> pipx uninstall --all
```

# 3. Conclusion

With `pipx`, you can safely manage CLI tools in isolated environments. It is especially useful when managing global CLI tools such as `poetry`, `black`, and `httpie`. From now on, for CLI packages you want to install globally, try using `pipx` instead of `pip`! 🚀

# 4. References

- [Deploying Python Applications: pipx Edition](https://yozm.wishket.com/magazine/detail/2536/)
- [pipx: An environment for installing and running Python apps in isolated environments](https://wikidocs.net/228579)
