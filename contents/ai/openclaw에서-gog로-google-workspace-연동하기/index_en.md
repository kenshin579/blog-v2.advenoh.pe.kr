---
title: "Connecting Google Workspace to OpenClaw with gog"
description: "How to set up gog (Google Workspace CLI) in OpenClaw to control Gmail, Calendar, and Drive from Telegram"
date: 2026-03-08
update: 2026-03-08
tags:
  - openclaw
  - gog
  - google-workspace
  - gmail
  - google-calendar
  - google-drive
  - telegram
  - oauth
  - ai-agent
  - 오픈클로
  - 구글워크스페이스
  - 텔레그램
  - AI에이전트
  - 자동화
series: "OpenClaw Guide"
---
# 1. Overview

Connecting Google Workspace to OpenClaw lets you control Gmail, Calendar, and Drive entirely through Telegram chat. This article walks through setting up [gog (Google Workspace CLI)](https://clawhub.ai/steipete/gog) in OpenClaw.

> **After downloading the OAuth JSON file from the Google Cloud Console, every step was carried out solely through Telegram chat.** I never typed a command directly in a terminal.

- OAuth setup in the Google Cloud Console (web browser)
- After sending the JSON credential file to Telegram, everything was done through Telegram, without typing any CLI command directly

> For the basic OpenClaw installation and Telegram bot integration, see the [Complete OpenClaw Guide](/article/openclaw-완벽-가이드).

# 2. What is gog?

gog is a CLI tool for controlling Google Workspace from the terminal.

Supported services:

- **Gmail** - search, read, send mail, and manage labels
- **Calendar** - view, create, and edit events
- **Drive** - search, upload, and download files
- **Contacts** - manage contacts
- **Docs / Sheets / Slides** - manage documents
- **Tasks** - manage to-dos
- **Chat** - Google Chat messages
- **Forms** - query survey data
- **Apps Script** - manage scripts

By integrating with OpenClaw, you can handle all of this through natural-language conversation.

```mermaid
flowchart LR
    A[User] -->|Telegram message| B[OpenClaw Bot]
    B -->|Run gog CLI| C[gog]
    C -->|OAuth 2.0| D[Google Workspace API]
    D --> E[Gmail]
    D --> F[Calendar]
    D --> G[Drive]
    D --> H[Docs / Sheets / ...]
```

# 3. Prerequisites

- OpenClaw installed and Telegram bot integration complete
- macOS environment (brew available)
- A Google account

# 4. Full Setup Flow

The overall flow can be summarized as follows.

1. **Google Cloud Console** - create an OAuth project & a Client ID → download JSON
2. **Telegram** - send the JSON file to the OpenClaw bot
3. **Telegram** - provide your Gmail address → OpenClaw generates an authentication URL
4. **Browser** - sign in to Google & approve permissions → copy the callback URL
5. **Telegram** - paste the callback URL → OpenClaw exchanges the token & finishes the setup
6. **Google Cloud Console** - enable the Gmail, Calendar, and Drive APIs
7. **Telegram** - "Tell me tomorrow's schedule" → start using Google Workspace

# 5. Installing gog

I asked the OpenClaw bot in Telegram how to set up gog.

> **Me**: I want to set up gog google workspace. https://clawhub.ai/steipete/gog
>
> **OpenClaw**: I already installed `gogcli` earlier. Now we need to **set up Google authentication**. Let's go step by step:
>
> Step 1: Create a Google Cloud OAuth client
>
> 1. Open the **Google Cloud Console** — https://console.cloud.google.com/
> 2. Create a **new project** (name: `gog-cli`)
> 3. Configure **APIs & Services → OAuth consent screen**
> 4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
>    - Application type: **Desktop app**
>    - Download `client_secret_xxxx.json`

![Requesting gog setup from OpenClaw in Telegram](telegram-gog-setup.png)

OpenClaw immediately guides you through the entire setup. If gog is not yet installed, just say "install gog" and OpenClaw runs `brew install gogcli` in the background.

# 6. Google Cloud Console OAuth Setup

This is the only stage that **the user must perform directly in a web browser**.

## 6.1 Create a Project

Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.

- Project name: `gog-cli` (any name you like)

![Create a new project](gcloud-create-project.png)

![Google Cloud Console main screen](gcloud-console-main.png)

## 6.2 Configure the OAuth Consent Screen

Click APIs & Services → OAuth consent screen to go to the OAuth overview page, then click the Get Started button.

Enter the **app information**:

- App name: `gog-cli`
- User support email: your own email

![App information input form](oauth-consent-app-info.png)

Select the **audience**:

- Select **External**

![Audience selection - External](oauth-consent-external.png)

Enter the contact information and finish.

![Final confirmation](oauth-consent-confirm.png)## 6.3 Create an OAuth Client ID

Go to APIs & Services → Credentials → **Create Credentials** → **OAuth client ID**.

![Creating an OAuth client ID from the Credentials menu](credentials-menu.png)

- Application type: **Desktop app**
- Name: `gog-cli`
- Click **Create**

![Create OAuth client ID - select Desktop app](oauth-client-create.png)

Once it is created, click the **Download JSON** button to download the `client_secret_xxxx...xxxx.json` file.

![OAuth client creation complete - download JSON](oauth-client-complete.jpg)

> **This is the last step you do in a web browser.** From here on, you return to Telegram chat.

# 7. gog Authentication Setup (done via Telegram chat)

> From this section on, **you do not operate the terminal directly.** OpenClaw runs every CLI command on your behalf.

## 7.1 Send the JSON Credential File

Send the downloaded JSON file to the Telegram chat as a file attachment.

> **Me**: *(attaching the client_secret_xxxx...xxxx.json file)*
>
> **OpenClaw**: Got the file! I'll proceed with the setup.
>
> **OpenClaw**: Credential registration complete! Now we need to authenticate the Google account.
> Tell me your Gmail address — I'll run it in `--manual` mode and send you the authentication URL!

**OpenClaw background tasks:**

```bash
# 1. Save the JSON file received from Telegram to the Mac Mini
mv /tmp/telegram_download/client_secret_xxxx.json ~/Downloads/

# 2. Register the OAuth credentials with gog
gog auth credentials ~/Downloads/client_secret_xxxx...xxxx.json
```

## 7.2 Provide the Gmail Address → Receive the Authentication URL

Type your Gmail address into the chat, and OpenClaw sends you the authentication URL.

> **Me**: your-email...@gmail.com
>
> **OpenClaw**: Standing by! Now follow the steps below:
>
> **1.** Open this link in your browser:
> `https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=xxxx...xxxx&...`
>
> **2.** Sign in to Google and approve the permissions
>
> **3.** It's normal for the page not to open! Copy the **full URL from the browser's address bar** and send it to me
> It's a URL that looks like `http://127.0.0.1:.../oauth2/callback?state=...&code=...`!

**OpenClaw background tasks:**

```bash
# Start authentication in --manual mode (print the URL directly instead of opening a browser)
gog auth add your-email...@gmail.com --manual

# Send the printed OAuth authentication URL as a Telegram message
# Wait for the local callback server (127.0.0.1:50554) in the background
```

### 7.2.1 Troubleshooting: 403 access_denied

When you first open the authentication URL, you may get a 403 error.

![403 access_denied error screen](403-access-denied.png)

> **Me**: *(sending the 403 access_denied screenshot)*
>
> **OpenClaw**: `403 access_denied` — it's because the OAuth app is still in **test mode**. You need to add a test user.
>
> In the Google Cloud Console:
>
> 1. Go to **APIs & Services → OAuth consent screen**
> 2. In the **Test users** section, click **Add users**
> 3. Add your own email
>
> **Me**: I don't want to add a test user; I just want it to actually work. Can I just click Publish app?
>
> **OpenClaw**: Yes, you can **Publish** the app! If only you use it, there's no problem.
>
> **Me**: Done publishing.

The cause is that OAuth apps are created in **test mode** by default. There are two ways to fix it:

1. **Publish the app**: OAuth consent screen → Audience → click **Publish app** (recommended if only you use it)
2. **Add a test user**: Audience → add your own email to the test users

![App publishing page](oauth-publish-page.png)

![Publish confirmation dialog](oauth-publish-confirm.png)

### 7.2.2 Sign in to Google → Provide the callback URL

After publishing the app, open the authentication URL again and the Google sign-in proceeds normally.

**1. Select an account**

![Google account selection](google-account-select.png)

**2. "Google hasn't verified this app" warning**

A warning appears because the app hasn't gone through Google's official verification. Since you created the app yourself, click **Advanced → Continue**.

![Google hasn't verified this app warning](google-unverified-app.png)

**3. Approve the permission request**

The list of Google services that gog-cli will access is displayed. Click **Continue** to approve all permissions.

![Permission request screen 1](google-permission-1.png)

![Permission request screen 2](google-permission-2.png)

**4. Copy the callback URL**

After approval, you are redirected to a `http://127.0.0.1:50554/oauth2/callback?...` address, and it is **normal** for the page not to open. **Copy the full URL** from the browser's address bar and paste it into Telegram.

> **Me**: `http://127.0.0.1:50554/oauth2/callback?state=xxxx...xxxx&code=4/0Axxxx...xxxx&scope=email%20profile%20...`
>
> **OpenClaw**: Authentication complete!
>
> ```
> email     your-email...@gmail.com
> services  appscript, calendar, chat, classroom, contacts,
>           docs, drive, forms, gmail, people, sheets, slides, tasks
> ```

**OpenClaw background tasks:**

```bash
# 1. Extract the authorization code from the callback URL the user sent
#    http://127.0.0.1:50554/oauth2/callback?code=4/0Axxxx...xxxx&...
#    → code = "4/0Axxxx...xxxx"

# 2. Exchange the authorization code for Google OAuth tokens
#    (internally gog exchanges code → access_token + refresh_token)

# 3. Store the tokens securely in the macOS Keychain

# 4. Verify the authentication result
gog auth list
# → email: your-email...@gmail.com, confirm 13 services connected
```

### 7.2.3 Troubleshooting: macOS Keychain Access

gog stores authentication tokens in the macOS Keychain. On the first run, a Keychain access prompt may appear.

> **OpenClaw**: `gog auth list` keeps hanging — it might be a macOS Keychain access issue. Test it directly in the terminal on the Mac Mini — a Keychain access prompt may appear.
>
> **Me**: A lot of Keychain access prompt windows popped up; I entered my login password and finished.
>
> **OpenClaw**: Great! Now that you've allowed Keychain access, it should work. Let me test again!

The Keychain prompt must be handled directly on the Mac Mini screen. Once allowed, it is accessed automatically thereafter.

## 7.3 Set the Environment Variable

You need to set the `GOG_ACCOUNT` environment variable so you don't have to add the `--account` option every time.

> **Me**: Is the GOG_ACCOUNT environment variable set as well?
>
> **OpenClaw**: It's not! I'll set it up.
>
> **OpenClaw**: Done adding it!
>
> - Added `export GOG_ACCOUNT=your-email...@gmail.com` to `~/.zshrc`
> - Applied automatically from new terminal sessions
>
> **Me**: Run source ~/.zshrc.
>
> **OpenClaw**: Done! `GOG_ACCOUNT=your-email...@gmail.com` is now applied.

**OpenClaw background tasks:**

```bash
# 1. Add the environment variable to ~/.zshrc
echo 'export GOG_ACCOUNT=your-email...@gmail.com' >> ~/.zshrc

# 2. Apply it to the current session
source ~/.zshrc
```

# 8. Enabling Google APIs

Authentication is complete, but you must **enable** the APIs you actually use in the Google Cloud project for them to work. As OpenClaw tries testing, it tells you the list of required APIs and their links.

> **OpenClaw**: We're making progress! Keychain is resolved, and now we need to **enable the APIs in Google Cloud**.
>
> 1. **Gmail API**: `https://console.developers.google.com/apis/api/gmail.googleapis.com/...`
> 2. **Calendar API**: `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/...`
> 3. **Drive API**: `https://console.developers.google.com/apis/api/drive.googleapis.com/...`

In the Google Cloud Console, search for each API and click the **Enable** button.

![Gmail API enable example](gmail-api-enable.png)

![Gmail API enable complete](gmail-api-complete.png)

Once you let OpenClaw know in Telegram that it's enabled, OpenClaw tests it right away.

![API test result - all working](telegram-api-test-result.png)

**OpenClaw background tasks:**

```bash
# Run the test as soon as the user says "I enabled it"
gog gmail search 'newer_than:1d'     # → confirm Gmail API works
gog calendar calendars                # → confirm Calendar API works
gog drive files list                  # → confirm Drive API works

# Summarize the results and respond via Telegram
```

> You can enable additional APIs such as Contacts, Tasks, and Sheets as needed.

# 9. Real-World Usage

Once the setup is complete, you can use Google Workspace right away with natural language.

## 9.1 Querying Calendar Events

![Querying calendar events in Telegram](telegram-calendar-query.jpg)

## 9.2 Natural Language → gog Command Conversion

When the user makes a request in natural language, OpenClaw converts it into the appropriate gog command and runs it. The user doesn't need to know the gog command syntax at all.


| User (natural language)            | Command OpenClaw runs                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| "Tell me tomorrow's schedule"            | `gog calendar events --from 2026-02-20 --to 2026-02-21`               |
| "Also tell me my March weekend schedule"      | `gog calendar events --from 2026-03-01 --to 2026-03-31` + weekend filtering |
| "Check the mail that came in today"       | `gog gmail search 'newer_than:1d'`                                    |
| "Find the XX file in Drive" | `gog drive files list --query 'name contains "XX"'`                   |

# 10. Wrapping Up

The entire setup takes about 10 minutes, and the only parts the user does directly are the Google Cloud Console and the browser authentication.

After setup, you just make requests in natural language from Telegram. Say things like "Check my mail today" or "Tell me this week's schedule," and OpenClaw picks the right gog command on its own and answers with the results organized in a human-readable form.

# 11. References

- [gog official docs (ClaWHub)](https://clawhub.ai/steipete/gog)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Complete OpenClaw Guide](/article/openclaw-완벽-가이드)
- [Setting Up OpenClaw Telegram Multi-Agent](/article/openclaw-telegram-멀티-에이전트-구성하기)
