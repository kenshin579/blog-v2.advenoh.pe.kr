# TODO: Hermes Agent 완벽 가이드

## 1단계: 사전 조사 및 실습

- [ ] Hermes Agent 설치 (macOS)
- [ ] 초기 설정 완료 (모델 선택, API 키 등)
- [ ] CLI 기본 사용법 테스트 (`hermes`, `hermes -c`, `hermes chat -q`)
- [ ] 모델 전환 테스트 (`hermes model`)
- [ ] 도구 활성화/비활성화 테스트 (`hermes tools`)
- [ ] Learning Loop 체험: 복잡한 작업 수행 후 Skill 자동 생성 확인
- [ ] 메모리 시스템 확인: MEMORY.md, USER.md 자동 생성/업데이트 확인
- [ ] Session Search 테스트 (`session_search` 도구)
- [ ] `~/.hermes/` 디렉토리 구조 캡처

## 2단계: 블로그 초안 작성

- [x] `docs/start/hermes-agent-완벽-가이드/index.md` 파일 생성
- [x] frontmatter 작성 (title, description, date, tags)
- [x] 섹션 1: 들어가며 - Hermes Agent 소개, Nous Research, 핵심 차별점
- [x] 섹션 2: 설치 및 초기 설정 - Quick Install, 수동 설치, 초기 설정, 디렉토리 구조
- [x] 섹션 3: 핵심 아키텍처 - Agent Loop, 프로젝트 구조, Context Files, 컨텍스트 압축
- [x] 섹션 4: Learning Loop - Skill 자동 생성, Skill 개선, SKILL.md 형식, Skills Hub
- [x] 섹션 5: 다계층 메모리 - MEMORY.md, USER.md, Session Search, Honcho 개요
- [x] 섹션 6: 40+ 내장 도구 - Toolset별 정리, 도구 관리
- [x] 섹션 7: 실전 활용 - CLI, Python 라이브러리, FastAPI, Telegram 연동
- [x] 섹션 8: 고급 기능 - 서브에이전트, MCP, Cron, Checkpoints
- [x] 섹션 9: 다른 에이전트와의 비교 - Claude Code, OpenClaw, Aider 비교표
- [x] 섹션 10: 마무리 - 장단점, 적합 사례, 참고 링크

## 3단계: 다이어그램 작성

- [x] Mermaid: 전체 아키텍처 (Agent Loop → Tools/Memory/Skills/Gateway)
- [x] Mermaid: Learning Loop 4단계 순환 흐름도
- [x] Mermaid: 다계층 메모리 시스템 구조도
- [x] Mermaid: 에이전트 선택 의사결정 흐름도

## 4단계: 스크린샷

- [ ] Hermes CLI 실행 화면 캡처
- [ ] Skill 자동 생성 과정 캡처
- [ ] `~/.hermes/` 디렉토리 구조 캡처
- [ ] (선택) Telegram 연동 대화 캡처

## 5단계: 검증

- [x] 블로그 글 인코딩 확인 (`file -I`)
- [ ] 로컬 dev 서버에서 글 렌더링 확인
- [ ] 코드 블록 하이라이팅 확인 (bash, python, yaml)
- [ ] Mermaid 다이어그램 렌더링 확인
- [ ] 링크/참고 자료 동작 확인
- [ ] OpenClaw 블로그와 중복 내용 최종 확인

## 6단계: PR 생성

- [x] feature 브랜치 생성 (`feat/445-hermes-agent-guide`)
- [ ] 커밋 및 push
- [ ] PR 생성 (`gh pr create` + HEREDOC)
