---
title: "내가 자주 쓰는 Claude Code Skill 8선: 개발부터 글 다듬기까지"
description: "superpowers, frontend-design, ponytail, understand, agent-memory, claude-video, caveman, humanizer-zh까지 — 작업 단계별로 실제로 자주 쓰는 Claude Code skill 8개를 정리했다."
date: 2026-06-20
update: 2026-07-24
tags:
  - Claude Code
  - Skill
  - Superpowers
  - frontend-design
  - ponytail
  - caveman
  - humanizer
  - AI
  - AI코딩도구
  - 워크플로우자동화
  - Anthropic
series: "Claude Code Complete Guide"
---

# 1. 들어가며

[Claude Code 확장 기능 완벽 가이드: Command, Skill, Subagent](/article/claude-code-확장-기능-완벽-가이드-command-skill-subagent)에서 다뤘듯이, **Skill**은 특정 작업을 수행하는 방법을 캡슐화한 지침 묶음이다. Claude가 "지금 이 상황에 이 skill이 필요하다"고 판단하면 해당 skill의 내용을 읽어와 그대로 따른다. 덕분에 매번 장황하게 프롬프트를 쓰지 않아도, 잘 만들어진 워크플로우를 일관되게 재사용할 수 있다.

흥미로운 건 Anthropic 공식 skill 외에도 **커뮤니티 skill이 빠르게 쏟아지고 있다**는 점이다. [skills.sh](https://www.skills.sh/) 같은 디렉토리에 가보면 수백 개의 skill이 랭킹과 함께 올라와 있고, GitHub 저장소 하나만 추가하면 바로 설치해서 쓸 수 있다.

이 글에서는 그중 **내가 실제로 자주 쓰는 8개**를, 막연히 나열하지 않고 **작업 단계별**로 묶어서 정리했다.

| 단계 | Skill | 한 줄 요약 |
|------|-------|-----------|
| 개발 작업 | **superpowers** | TDD·브레인스토밍·디버깅 등 개발 워크플로우 프레임워크 |
| 개발 작업 | **frontend-design** | "AI 기본값"처럼 안 보이는 의도적·개성 있는 UI 디자인 |
| 개발 작업 | **ponytail** | "이걸 굳이 만들어야 하나?"를 먼저 묻는 최소 코드 편향 |
| 이해·기억 | **understand** | 코드베이스를 탐색 가능한 지식 그래프로 만들어 전체 파악 |
| 이해·기억 | **claude-video** | `/watch`로 영상을 다운로드·전사·분석해 Claude가 "시청" |
| 이해·기억 | **agent-memory** | 세션을 넘어 결정·맥락을 저장하고 다시 불러오기 |
| 출력 다듬기 | **caveman** | 응답의 군더더기를 걷어내 출력 토큰을 크게 절약 |
| 출력 다듬기 | **humanizer-zh** | AI 글 특유의 흔적을 제거해 사람이 쓴 듯한 글로 |

# 2. Skill 설치 방법 (공통)

Claude Code에서 skill을 설치하는 경로는 크게 **두 가지**다. 아래 각 섹션에는 이 중 해당 skill에 맞는 **설치 명령을 바로 복사해 쓸 수 있게** 적어뒀다.

**① 플러그인 마켓플레이스 (`/plugin`)** — 요즘 인기 있는 skill들은 대부분 Claude Code 플러그인으로 배포된다. Claude Code 프롬프트에 아래 두 줄을 **각각** 입력하면 된다(한 번에 붙여넣지 말고 한 줄씩).

```text
/plugin marketplace add <owner>/<repo>
/plugin install <plugin>@<marketplace>
```

- Anthropic **공식 마켓플레이스(`claude-plugins-official`)** 는 Claude Code에 기본 내장돼 있어 `marketplace add` 없이 `/plugin install <name>@claude-plugins-official`만 하면 된다.
- 플러그인은 hook·MCP·여러 skill을 한 번에 묶어 설치하고 마켓플레이스를 통해 **자동 업데이트**된다는 게 장점이다.

**② skills.sh / `npx skills add`** — 플러그인이 아닌 단일 skill은 [skills.sh](https://www.skills.sh/)에서 찾아 설치한다. 상세 페이지의 **Installation** 명령을 그대로 쓰면 되고, 형태는 다음과 같다.

```bash
npx skills add <owner>/<repo> --skill <name> --agent claude-code
```

이 방식은 현재 작업 중인 **프로젝트의 `.claude/skills/`** 아래에 해당 skill을 설치한다. 설치 후에는 Claude가 상황에 맞다고 판단하면 자동으로 불러와 쓴다.

> 설치 명령·옵션은 skill마다 다르므로, 아래 각 섹션의 **설치** 블록을 그대로 복사해 쓰는 게 가장 정확하다. 플러그인 설치 방식의 자세한 내용은 [Claude Code Plugin & Hooks 완벽 가이드](/article/claude-code-plugin-hooks-완벽-가이드)를 참고하면 된다.

# 3. 개발 작업

코드를 직접 쓰고 다듬는 단계에서 가장 자주 손이 가는 세 가지다.

## 3.1 superpowers

> 출처: Obra superpowers marketplace

**설치** — Anthropic 공식 마켓플레이스에 있어 한 줄로 끝난다.

```text
/plugin install superpowers@claude-plugins-official
```

> Obra 마켓플레이스에서 최신판을 받으려면 `/plugin marketplace add obra/superpowers-marketplace` 후 `/plugin install superpowers@superpowers-marketplace`.

**무엇을 하나** — superpowers는 단일 skill이 아니라 **개발 워크플로우 전체를 다루는 skill 묶음**이다. 브레인스토밍 → 설계 → TDD → 디버깅 → 코드리뷰 → PR까지, 각 단계마다 "이렇게 하라"는 규율(skill)을 제공한다. 예를 들어 기능을 만들기 전에는 `brainstorming` skill이 먼저 요구사항을 캐묻고, 구현 단계에서는 `test-driven-development` skill이 테스트부터 쓰게 강제한다.

이 블로그에서는 superpowers만 따로 **[Claude Code Superpowers 완벽 가이드: brainstorm부터 PR까지](/article/claude-code-superpowers-완벽-가이드)** 글에서 풀 사이클로 깊게 다뤘으니, 자세한 내용은 그 글을 참고하면 된다.

> 🔧 **[채울 부분]** 왜/언제 superpowers를 자주 쓰는지 — 어떤 작업에서 특히 효과를 봤는지 한두 줄.

## 3.2 frontend-design

> 출처: Anthropic 공식 플러그인 (claude-plugins-official)

**설치** — 공식 마켓플레이스가 기본 내장이라 `marketplace add` 없이 바로 설치한다.

```text
/plugin install frontend-design@claude-plugins-official
```

**무엇을 하나** — 새 UI를 만들거나 기존 UI를 개선할 때, **"어디서 본 듯한 AI 기본 디자인"을 피하고 의도적이고 개성 있는 비주얼**을 잡아주는 skill이다. 작은 디자인 스튜디오의 아트 디렉터처럼 접근해서, 팔레트·타이포그래피·레이아웃을 이 브리프에 맞게 구체적으로 선택하게 만든다.

특히 이 skill은 현재 AI가 만드는 디자인이 클리셰처럼 몰리는 세 가지 룩(① 크림색 배경 + 고대비 세리프 + 테라코타 포인트, ② 거의 검은 배경 + 형광 그린/버밀리언 포인트 하나, ③ 헤어라인 구분선의 신문 레이아웃)을 **기본값으로 인식하고 일부러 피하도록** 가이드한다. 토큰 시스템(색 4~6개, 폰트 2개 이상 역할, 레이아웃 콘셉트, 시그니처 요소)을 먼저 잡고 → 그게 진부하지 않은지 자기검토한 뒤 → 코드를 작성하는 2-패스 방식이다.

**실제 사용 예시**

```text
이 랜딩 페이지를 frontend-design 관점으로 다시 잡아줘.
주제는 "마크다운 에디터 플러그인"이고, 템플릿처럼 보이지 않게.
```

> 🔧 **[채울 부분]** 실제 어떤 프로젝트(예: 랜딩 페이지)에 적용했고, 결과가 어떻게 달라졌는지 + 스크린샷 한 장.

## 3.3 ponytail

> 출처: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)

**설치** — 마켓플레이스를 등록하고 설치한다. 두 줄을 **각각** 입력한다.

```text
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

**무엇을 하나** — ponytail은 **"가장 게으른 시니어 개발자처럼" 생각하게 만드는 편향**을 코드 생성 직전에 주입한다. 가장 좋은 코드는 애초에 쓰지 않은 코드라는 전제로, 구현에 들어가기 전에 **결정 사다리**를 훑는다 — 이게 꼭 있어야 하나? 이미 코드베이스에 있지 않나? 표준 라이브러리나 네이티브 기능으로 안 되나? 여기까지 통과했을 때만 코드를 쓴다. 그래서 날짜 선택기를 컴포넌트로 404줄 짜는 대신 네이티브 `<input type="date">` 23줄로 끝내는 식의, **과잉 구현(over-build)** 함정에서 특히 효과가 크다.

핵심은 이 사다리가 **문제를 이해한 다음에** 돌아간다는 점이다("해법에는 게으르되, 읽기에는 절대 게으르지 않는다"). 검증·보안·접근성은 타협 대상이 아니며, 오직 불필요한 복잡도만 깎아낸다. `/ponytail [lite|full|ultra|off]`(강도 조절), `/ponytail-review`(현재 diff의 과잉 구현 지적), `/ponytail-audit`(저장소 전체 스캔), `/ponytail-debt`(미뤄둔 최적화 정리), `/ponytail-gain`(벤치마크 지표), `/ponytail-help`처럼 용도별 명령을 제공한다. 저장소 기준으로 FastAPI + React 세션에서 **코드 약 54% 감소·비용 약 20% 절감·속도 약 27% 향상**을 표방한다.

**실제 사용 예시**

```text
/ponytail 이 폼 검증 로직 추가해줘. 새 라이브러리 끌어오지 말고.
/ponytail-review 방금 만든 변경분에서 과하게 짠 부분 짚어줘.
```

> 🔧 **[채울 부분]** 실제로 어떤 작업에서 과잉 구현을 막아줬는지(예: 컴포넌트 대신 네이티브 요소로 대체) 구체적인 사례 하나.

# 4. 이해·기억 (인풋을 Claude에 넣기)

Claude에게 "맥락을 정확히 넣어주는" 단계다. 코드베이스, 영상, 과거 결정처럼 Claude가 스스로는 모르는 정보를 입력으로 주입한다.

## 4.1 understand

> 출처: [lum1104/understand-anything](https://www.skills.sh/lum1104/understand-anything/understand)

**설치** — 마켓플레이스로 설치한다. 두 줄을 **각각** 입력한다.

```text
/plugin marketplace add Egonex-AI/Understand-Anything
/plugin install understand-anything
```

> 플러그인이 아닌 단일 skill로만 받고 싶다면 `npx skills add https://github.com/lum1104/understand-anything --skill understand --agent claude-code`.

**무엇을 하나** — 코드베이스를 **탐색 가능한 지식 그래프**로 변환해, 파일·함수·클래스·의존성 관계를 한눈에 파악하게 해준다. 멀티 에이전트 파이프라인이 프로젝트를 스캔해 그래프를 만들고(`.understand-anything/knowledge-graph.json`), 이후엔 Claude가 매번 모든 파일을 다시 읽는 대신 그래프를 질의한다. 그래서 **토큰을 아끼면서도 전체 구조를 빠르게 이해**할 수 있다.

`/understand-diff`(코드리뷰 전 변경 영향 파악), `/understand-explain`(특정 모듈 깊게 보기), `/understand-chat`(아키텍처에 대해 질문)처럼 용도별 명령을 제공한다. 새 프로젝트에 처음 합류하거나, 큰 변경 전에 아키텍처를 머릿속에 그려야 할 때 특히 유용하다.

**실제 사용 예시**

```text
/understand-chat 인증 흐름이 어디서 시작되고 어떤 미들웨어를 거치는지 알려줘.
```

> 🔧 **[채울 부분]** 어떤 코드베이스에서 효과를 봤는지 (예: 새 프로젝트 합류, 대규모 리팩터링 전 구조 파악).

## 4.2 claude-video

> 출처: [bradautomates/claude-video](https://github.com/bradautomates/claude-video)

**설치** — 마켓플레이스로 설치하면 마켓플레이스를 통해 자동 업데이트된다. 두 줄을 **각각** 입력한다.

```text
/plugin marketplace add bradautomates/claude-video
/plugin install watch@claude-video
```

> `yt-dlp`·`ffmpeg`가 필요하고, 전사에 Whisper(Groq/OpenAI)를 쓰면 해당 API 키가 필요하다.

**무엇을 하나** — `/watch` 명령으로 **Claude에게 영상을 "보게"** 만든다. 영상 생성이 아니라 **영상 이해**가 핵심이다. 동작 흐름은:

1. **다운로드** — `yt-dlp`로 YouTube·TikTok·Vimeo 또는 로컬 영상을 가져온다
2. **프레임 추출** — `ffmpeg`로 길이에 맞춰 프레임을 샘플링한다(짧으면 촘촘히, 길면 듬성듬성, 최대 100장으로 토큰 관리)
3. **전사** — 자막이 있으면 그대로, 없으면 Whisper(Groq/OpenAI)로 음성을 텍스트화
4. **분석** — Claude가 프레임 이미지 + 타임스탬프 전사를 함께 읽고 답한다

**실제 사용 예시**

```text
/watch https://youtu.be/example 30초 지점에서 무슨 일이 일어나?
/watch ~/demo.mp4 --start 2:15 --end 2:45 이 구간만 요약해줘
```

특정 구간만 지정해 분석하면 토큰 소비도 줄일 수 있다.

> 🔧 **[채울 부분]** 영상 요약·튜토리얼 따라하기 등 실제로 자주 쓰는 시나리오 한두 개.

## 4.3 agent-memory

> 출처: [rohitg00/agentmemory](https://github.com/rohitg00/agentmemory)

**설치** — 마켓플레이스로 설치하면 hook 12개·skill 여러 개와 MCP 서버까지 한 번에 엮인다. 두 줄을 **각각** 입력한다.

```text
/plugin marketplace add rohitg00/agentmemory
/plugin install agentmemory
```

**무엇을 하나** — Claude Code는 기본적으로 세션이 끝나면 맥락을 잊는다. agentmemory는 **세션을 넘어 기억을 유지하는 메모리 인프라**다. `/remember`로 저장하고 `/recall`로 불러오며, 12개의 hook으로 작업 내용을 **자동 캡처**하기까지 한다. 메모리는 4단계로 정리된다 — **Working**(원시 관찰) → **Episodic**(세션 요약) → **Semantic**(추출된 사실·패턴) → **Procedural**(워크플로우·결정 패턴). 저장은 SQLite + 벡터 임베딩이고, 검색은 BM25(키워드)·벡터(의미)·지식 그래프를 결합한 하이브리드 방식이다.

**CLAUDE.md와의 차이** — 정적인 `CLAUDE.md`가 "내가 직접 적어두는 규칙"이라면, agentmemory는 **자동으로 쌓이고 의미 기반으로 검색되는 동적 기억**이다. 세션 워밍업에 들어가는 토큰을 크게 줄여(저장소 기준 약 90%대 절감 주장) 컨텍스트를 아낄 수 있고, `localhost:3113` 대시보드로 현재 기억 상태를 눈으로 볼 수도 있다.

**실제 사용 예시**

```text
(세션 1) JWT 인증을 jose 미들웨어로 구현. /remember 이 선택 이유까지 기억해둬.
(세션 2) /recall 우리 인증 구조 알려줘 → 이미 jose 미들웨어와 선택 이유를 안다.
```

> 🔧 **[채울 부분]** 실무에서 agentmemory와 CLAUDE.md를 어떻게 나눠/병행해서 쓰는지 본인 기준.

# 5. 출력 다듬기

## 5.1 caveman

> 출처: [JuliusBrussee/caveman](https://github.com/juliusbrussee/caveman)

**설치** — 마켓플레이스로 설치한다. 두 줄을 **각각** 입력하면 되고, Claude Code에서는 설치 즉시(첫 메시지부터) 켜진다.

```text
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

**무엇을 하나** — caveman은 Claude가 터미널에 뿌리는 **설명 텍스트의 군더더기를 걷어내** 원시인 말투(caveman-speak)처럼 짧게 답하게 만든다. 관사(a/an/the)·필러(just/really/basically)·인사치레·에두르는 표현을 덜어내되, **코드·명령·에러 메시지는 한 글자도 바꾸지 않는다**. humanizer가 "완성된 글"을 사람답게 다듬는 도구라면, caveman은 **작업 중 오가는 응답 자체를 압축**해 읽는 속도와 출력 토큰을 줄이는 쪽이다.

`/caveman [lite|full|ultra|wenyan]`으로 압축 강도를 정하고(세션 내 유지), `/caveman-stats`로 아낀 토큰을 확인하며, "stop caveman"으로 원래 말투로 돌아온다. 저장소 기준으로 10개 작업에서 **평균 출력 65% 감소**(22~87%)를 표방한다. 다만 줄어드는 건 **출력 토큰뿐**이고 입력·추론 토큰은 그대로이며, skill 자체가 턴당 약 1~1.5k 입력 토큰을 더한다는 점은 감안해야 한다. Claude Code에서는 상태줄에 `[CAVEMAN] ⛏`과 누적 절감량이 표시된다.

**실제 사용 예시**

```text
/caveman full   # 이후 응답을 짧게
/caveman-stats  # 이번 세션에서 아낀 토큰 확인
stop caveman    # 원래 말투로 복귀
```

> 🔧 **[채울 부분]** 어떤 상황에서 caveman을 켜고 끄는지(예: 긴 탐색 세션엔 켜고, 설명이 필요한 학습엔 끔) 본인 기준.

## 5.2 humanizer-zh

> 출처: [op7418/humanizer-zh](https://claudemarketplaces.com/skills/op7418/humanizer-zh/humanizer-zh) (blader/humanizer 기반 변형, hardikpandya/stop-slop 참고)

**설치** — 단일 skill이라 `npx skills add`로 설치한다.

```bash
npx -y skills add op7418/humanizer-zh --skill humanizer-zh --agent claude-code
```

**무엇을 하나** — Claude가 쓴 글에서 **AI 특유의 흔적을 걷어내** 사람이 쓴 것처럼 다듬는다. 위키백과의 "Signs of AI writing(AI Cleanup)" 가이드를 기반으로 **24가지 패턴**을 점검한다 — 과장된 의미 부여, 판촉성 표현, 모호한 출처("전문가들은…"), em 대시 남발, 볼드 남용, 기계적인 3분할 리스트("~하고, ~하며, ~하다"), 부정 대구, 상투적 연결어, 지식 컷오프 면책, 아첨조 말투, 군더더기 한정어, 뻔한 긍정 결론 등.

핵심 규칙은 5가지로 압축된다 — ① 군더더기 표현 삭제, ② 공식적 구조 깨기, ③ 문장 리듬에 변화 주기(둘이 셋보다 낫다), ④ 독자를 믿고 직접 말하기, ⑤ "명언처럼 들리는 문장"은 다시 쓰기. 다듬은 뒤에는 **직접성·리듬·신뢰도·진정성·정련도 5개 차원 × 10점 = 50점** 루브릭으로 채점하고(45점 이상이면 우수), 단순히 흔적만 지우는 게 아니라 관점·개성을 더해 다시 쓴다.

`humanizer-zh`는 원래 중국어 텍스트를 타깃으로 한 변형(`blader/humanizer` 번역 + `hardikpandya/stop-slop` 참고)이지만, AI 글 패턴을 잡아내는 틀 자체는 다른 언어에도 응용할 수 있다.

**실제 사용 예시**

```text
방금 쓴 블로그 초안을 humanizer로 다듬어줘. AI 티 나는 표현 위주로.
```

> 🔧 **[채울 부분]** ① 한국어 글에 적용할 때의 체감(잘 통하는지/한계) ② 적용 전후 문장 비교 예시 하나.

# 6. 마치며

여덟 개를 작업 단계로 다시 정리하면 이렇다.

- **개발 작업** — superpowers로 워크플로우를 잡고, frontend-design으로 화면의 개성을 만들며, ponytail로 불필요한 코드를 애초에 안 짜게 한다
- **이해·기억** — understand로 코드를, claude-video로 영상을 Claude에 입력하고, agent-memory로 맥락을 누적한다
- **출력 다듬기** — caveman으로 작업 중 응답을 압축하고, humanizer-zh로 완성된 글에서 AI 티를 걷어낸다

**Skill을 고르는 기준**은 단순하다. "매번 반복해서 길게 프롬프트를 쓰고 있다면, 그건 skill이 될 후보"다. 반대로 **과용은 주의**해야 한다. skill은 활성화될 때 그 내용이 컨텍스트로 로드되므로, 쓰지 않을 skill까지 잔뜩 깔아두면 토큰과 판단 비용이 늘어난다. 정말 자주 쓰는 것만 남기는 게 오히려 생산성에 좋다.

> 🔧 **[채울 부분]** 6개를 조합해서 쓰는 실제 워크플로우(예: understand로 파악 → superpowers로 구현 → humanizer로 문서 다듬기) 한 단락.
