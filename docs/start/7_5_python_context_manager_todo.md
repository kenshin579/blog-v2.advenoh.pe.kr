# TODO: Python Context Manager (with 문)

## 1단계: 샘플 코드 작성
- [x] `tutorials-python/python/context-manager/` 디렉토리 생성
- [x] `basic_with.py` - with 문 기본 동작 예제
- [x] `custom_context_manager.py` - 클래스 기반 `__enter__`/`__exit__` 구현
- [x] `contextmanager_decorator.py` - `@contextmanager` 데코레이터 예제
- [x] `contextlib_utils.py` - `suppress`, `redirect_stdout`, `closing`, `nullcontext`
- [x] `exit_stack_example.py` - `ExitStack` 동적 관리 예제
- [x] `async_context_manager.py` - 비동기 context manager 예제
- [x] `practical_examples.py` - 실전 활용 (DB, 파일, 락, 임시 리소스, 시간 측정)
- [x] 전체 샘플 코드 실행 및 동작 확인 (13 tests passed)

## 2단계: 블로그 글 작성
- [x] `docs/start/python-context-manager-with문-완벽-가이드/index.md` 생성
- [x] frontmatter 작성 (title, description, date, tags, series)
- [x] `# 1. 개요` - Context Manager의 필요성과 with 문 소개
- [x] `# 2. with 문의 동작 원리` - 실행 흐름, 예외 시 __exit__ 보장
- [x] `# 3. __enter__ / __exit__ 프로토콜` - 프로토콜 구조, 예외 억제, 클래스 구현
- [x] `# 4. contextlib.contextmanager 데코레이터` - yield 기반, try/finally
- [x] `# 5. contextlib 유틸리티` - suppress, redirect, closing, nullcontext
- [x] `# 6. 중첩 Context Manager (ExitStack)` - 동적 관리, callback, LIFO
- [x] `# 7. 비동기 Context Manager` - async with, asynccontextmanager, AsyncExitStack
- [x] `# 8. 실전 활용 패턴` - DB, 파일, 락, 임시 리소스, 시간 측정
- [x] `# 9. 마무리` 작성
- [x] `# 10. 참고` - 참고 링크 정리
- [x] 다이어그램은 Mermaid 형식으로 작성 (with 문 실행 흐름)

## 3단계: 검증 및 PR
- [x] 블로그 글에서 tutorials-python 코드 참조/링크 확인
- [x] UTF-8 인코딩 확인 (`file -I`)
- [ ] feature 브랜치 생성 및 커밋
- [ ] PR 생성 (`gh pr create` + HEREDOC)
