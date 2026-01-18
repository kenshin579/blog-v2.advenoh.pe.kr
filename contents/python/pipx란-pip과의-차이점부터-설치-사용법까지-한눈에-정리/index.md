---
title: "pipx란? pip과의 차이점부터 설치, 사용법까지 한눈에 정리"
description: "pipx란? pip과의 차이점부터 설치, 사용법까지 한눈에 정리"
date: 2025-03-26
update: 2025-03-26
tags:
  - python
  - pip
  - pipx
  - 파이썬
  - 패키지
---

# 1. 개요

## pipx를 사용해야 하는 이유

Python 패키지를 설치할 때 일반적으로 `pip`를 사용하지만, 일부 CLI(Application) 패키지는 전역적으로 설치하면서도 격리된 환경에서 실행하는 것이 더 적합할 수 있다. 이를 위해 `pipx`를 사용하면 다음과 같은 장점이 있다.

## pip와의 차이점

| 특징           | `pip`                                            | `pipx`                               |
| -------------- | ------------------------------------------------ | ------------------------------------ |
| 기본 설치 위치 | 가상환경 없음, 시스템 전역 또는 프로젝트 폴더 내 | 개별적인 가상환경에서 격리하여 설치  |
| CLI 앱 실행    | `python -m <패키지>` 혹은 직접 실행              | `pipx run <패키지>`로 직접 실행 가능 |
| 패키지 관리    | 프로젝트별 의존성 관리에 적합                    | 전역 CLI 도구 설치 및 관리에 적합    |

## 주요 기능

- 각 패키지를 별도의 가상환경에 설치하여 시스템 Python 환경을 오염시키지 않음
- `pipx run`을 사용해 별도 설치 없이 CLI 패키지 실행 가능
- 설치된 모든 패키지를 한 번에 업데이트하는 기능 제공
- 에 등록

# 2. pipx 설치 및 기본 사용법

## 2.1 pipx 설치

macOS에서는 `Homebrew`로 설치하거나 `python`의 `pip` 명령어로 설치할 수 있다.

```bash
> pip install pipx

# brew로 설치
> brew install pipx
> pipx ensurepath  # PATH 설정 (터미널 재시작 필요)
```

`pipx`에서는 `ensurepath` 명령어를 실행하여 자동으로 환경 변수를 설정할 수 있다. 환경 변수 설정이 완료되면, 터미널을 재시작하거나 `source ~/.bashrc` 또는 `source ~/.zshrc` 명령어를 실행해야 현재 오픈된 셀에서도 바로 사용할 수 있다.

## 2.2 pipx 사용법

### 2.2.1 패키지 설치

`pipx install <패키지명>` 명령어를 사용하면 해당 패키지가 격리된 가상환경에서 설치된다.

```bash
> pipx install poetry  # poetry를 pipx로 설치
  installed package poetry 2.1.1, installed using Python 3.13.2
  These apps are now globally available
    - poetry
done! ✨ 🌟 ✨
```

`pipx`로 설치된 패키지는 list 명령어로 확인할 수 있다.

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

설치 후 `which` 명령어를 사용하여 실행 경로도 확인할 수 있다.

```bash
> which poetry  # /Users/username/.local/bin/poetry
```

### 2.2.2 패키지 실행

설치된 패키지는 바로 실행할 수 있다.

```bash
> poetry --version
> http --help  # httpie 실행
```

### 2.2.3 패키지 제거

패키지 제거는 `uninstall` 명령어로 제거한다.

```bash
> pipx uninstall poetry
```

설치된 모든 패키지를 한 번에 삭제하려면 다음 명령어를 사용한다.

```bash
> pipx uninstall --all
```

# 3. 마무리

`pipx`를 사용하면 CLI 도구를 격리된 환경에서 안전하게 관리할 수 있다. 특히, `poetry`, `black`, `httpie` 같은 글로벌 CLI 도구를 관리할 때 매우 유용하다. 앞으로 전역적으로 설치할 CLI 패키지는 `pip` 대신 `pipx`를 활용해 보자! 🚀

# 4. 참고

- [파이썬 애플리케이션 배포하기: pipx 편](https://yozm.wishket.com/magazine/detail/2536/)
- [pipx: 격리된 환경의 파이썬 앱 설치 및 실행 환경](https://wikidocs.net/228579)
