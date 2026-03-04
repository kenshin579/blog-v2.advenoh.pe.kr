# Go Embed Directive - TODO

> PRD: `6_10_go_embed_directive_prd.md`
> 구현 계획서: `6_10_go_embed_directive_implementation.md`

---

## 1단계: 리소스 파일 생성

- [x] `tutorials-go/golang/embed-directive/static/index.html` 생성
- [x] `tutorials-go/golang/embed-directive/static/style.css` 생성
- [x] `tutorials-go/golang/embed-directive/templates/index.html` 생성 (Go template 문법 포함)
- [x] `tutorials-go/golang/embed-directive/config/default.yaml` 생성

## 2단계: 샘플 코드 작성

- [x] `embed_webserver_test.go` 작성 - embed.FS + http.FileServer 조합
- [x] `embed_template_test.go` 작성 - template.ParseFS() 활용
- [x] `embed_config_test.go` 작성 - 설정 파일 기본값 fallback 패턴

## 3단계: 테스트 실행

- [x] `go test -v ./golang/embed-directive/...` 전체 테스트 통과 확인 (10/10 PASS)
- [x] 기존 `embed_test.go` 4개 테스트 정상 동작 확인

## 4단계: 블로그 글 작성

- [x] `docs/start/6_10_go_embed_directive/index.md` 초안 작성
- [x] Frontmatter 작성 (title, description, date, tags, series)
- [x] 2.1 왜 파일 임베딩이 필요한가?
- [x] 2.2 임베딩 문법 (단일 파일 + 디렉토리)
- [x] 2.3 실전 활용 예제 3개 (FileServer, 템플릿, 설정 파일)
- [x] 2.4 제약사항과 팁 (제약사항 + embed.FS vs os)
- [x] 2.5 버전별 변경 이력 (Go 1.16~1.23)
- [x] GitHub 저장소 코드 링크 추가
- [x] UTF-8 인코딩 확인 (`file -I`) → charset=utf-8 ✅

## 5단계: 최종 검증

- [x] 글 전체 읽기 흐름 확인
- [x] 코드 블록 문법 하이라이팅 확인
- [x] 샘플 코드 ↔ 블로그 내용 일치 확인 (10/10 항목 PASS)
