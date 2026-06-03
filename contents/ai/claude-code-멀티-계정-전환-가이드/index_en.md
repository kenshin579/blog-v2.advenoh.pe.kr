---
title: "Claude Code Multi-Account Switching Guide: Keep Working Without Interruption Even When Rate Limited"
description: "A configuration guide for quickly switching between personal and work accounts in Claude Code using OAuth and API Key authentication to work without interruption from rate limits"
date: 2026-02-28
update: 2026-02-28
tags:
  - Claude Code
  - Claude
  - 멀티 계정
  - API Key
  - OAuth
  - rate limit
  - 계정 전환
series: "Claude Code 실전 가이드"
---

# 1. Overview

Have you ever been working with Claude Code only to suddenly hit a rate limit and have your work grind to a halt? If you have both a personal account and a work account, you can switch to the other account and immediately continue working.

In this article, I'll summarize the differences between Claude Code's two authentication methods (OAuth / API Key) and introduce how to configure account switching for each situation.

# 2. OAuth vs API Key: Different Billing Systems

Before setting up account switching, there's a core concept you absolutely need to understand: **OAuth login and API Key are completely separate billing systems**.

| Category | OAuth (`claude auth login`) | API Key (`ANTHROPIC_API_KEY`) |
|------|---------------------------|-------------------------------|
| Billing method | Pro/Team **plan subscription** (monthly fee) | **Prepaid API credits** (deducted by usage) |
| Where to fund | Plan subscription on claude.ai | [console.anthropic.com](https://console.anthropic.com) → Billing |
| Characteristics | Usage included in subscription | Error occurs when credits are not funded |

Even if you're subscribed to a Pro plan, if you have no API credits, the API Key method produces the following error.

```
Credit balance too low · Add funds: https://platform.claude.com/settings/billing
```

## 2.1 Beware of Auth Conflict

If an OAuth session and an API Key **exist at the same time**, a conflict error occurs.

```
Auth conflict: Both a token (claude.ai) and an API key (ANTHROPIC_API_KEY) are set.
This may lead to unexpected behavior.
```

**Key principle: the two authentication methods must not exist simultaneously.** When switching, you must always disable one of them.

- If you want to use the API Key → `claude auth logout` (remove the OAuth session)
- If you want to use OAuth → `unset ANTHROPIC_API_KEY` (remove the environment variable)

# 3. Comparison of Account Switching Methods

| Method | Pros | Cons |
|------|------|------|
| OAuth switching function | Use the plan subscription as-is, no extra cost | Requires browser login (slow) |
| API Key environment variable switching | Instant switching, fastest | Requires separately funding API credits |
| Hybrid (recommended) | OAuth normally + API Key in emergencies | Requires initial setup |

# 4. Recommended Strategies by Situation

## 4.1 Case A: Both Accounts on Pro/Team Plans (My Case)

**Recommended: OAuth switching function**

In my case, both my personal account and work account are subscribed to Pro plans, so I use this method. You can use it within your plan subscription without extra billing, and although switching requires a browser login, you can simplify it with a shell function.

## 4.2 Case B: When Fast Switching Is Important

**Recommended: OAuth normally + API Key in emergencies (hybrid)**

You use your main account with OAuth, fund a small amount ($5–10) of API credits in advance, and temporarily switch to the API Key only when you hit a limit. This is the most practical combination.

# 5. Configuration

## 5.1 Case A: OAuth Switching Function

Add the following function to `~/.zshrc`.

```bash
cs() {
  echo "🔄 Switching account..."
  claude auth logout
  echo "✅ Logout complete. Run claude, then re-authenticate with /login."
}
```

**OAuth re-login flow:**

`claude auth login` prints an authentication link in the terminal, but you can't enter the authentication code that is issued after browser approval back into the terminal. Therefore, you need to run `claude` first and then use the `/login` command inside the REPL.

1. Run `cs` → log out of the existing OAuth session
2. Run `claude` → enter the Claude Code REPL
3. Enter `/login` in the REPL
4. The browser opens automatically → log in with the account you want to switch to
5. Paste the issued authentication code into the REPL → authentication complete

```bash
# When you hit a limit
cs
# → logout complete

claude
# → after entering the REPL
/login
# → browser opens → select the other account → paste the authentication code into the REPL
```

## 5.2 Case B: API Key Switching (Hybrid)

### Prerequisite: Issue an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Settings → API Keys → Create Key
3. Store the key securely (it's only shown once)
4. **Funding credits in Settings → Billing is required**

### ~/.zshrc configuration

```bash
# An Auth conflict occurs if OAuth and the API Key exist at the same time
# When switching, you must always disable one of them

claude-work() {
  claude auth logout 2>/dev/null
  export ANTHROPIC_API_KEY="sk-ant-work-key"
  echo "✅ Switched to work account (API Key)"
}

claude-personal() {
  claude auth logout 2>/dev/null
  export ANTHROPIC_API_KEY="sk-ant-personal-key"
  echo "✅ Switched to personal account (API Key)"
}

claude-oauth() {
  unset ANTHROPIC_API_KEY
  echo "✅ API Key removed. Run claude, then re-authenticate OAuth with /login."
}
```

### Usage

```bash
source ~/.zshrc

# Normally: use OAuth (Pro/Team plan)
claude

# When you hit a limit → switch to API Key instantly
claude-work
claude

# Return to OAuth (plan) again
claude-oauth
claude
# → /login in the REPL → browser authentication → paste code
```

# 6. FAQ

**Q: Does this affect Claude Desktop?**

No. Claude Desktop is based on a separate OAuth and is completely independent of Claude Code's `ANTHROPIC_API_KEY` environment variable.

**Q: I'm subscribed to a Pro plan, so why doesn't it work when I switch to an API Key?**

A Pro/Team plan subscription and API credits are separate billing systems. Even if you're subscribed to a plan, to use the API you must separately fund credits at [console.anthropic.com](https://console.anthropic.com).

**Q: What if I set the environment variable while logged in with OAuth?**

An Auth conflict error occurs. If Claude Code detects both authentication methods at the same time, it prioritizes the API Key, which can lead to an insufficient credit error. Be sure to disable one of them. (`claude auth logout` or `unset ANTHROPIC_API_KEY`)

# 7. Conclusion

To summarize:

- Always be aware that **OAuth and API Key are separate billing systems**
- Pro/Team plan users → recommend the **OAuth switching function (`cs`)**
- If you need fast switching → combine **funding a small amount of API credits + environment variable switching**
- The two authentication methods must not exist simultaneously. Always disable one when switching
- Unrelated to Claude Desktop

# 8. References

- [Anthropic Console - Issue an API Key](https://console.anthropic.com)
- [Claude Code official documentation](https://docs.anthropic.com/en/docs/claude-code)
