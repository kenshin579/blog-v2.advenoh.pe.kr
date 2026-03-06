# TODO: Python 로깅 제대로 하기

## 1단계: 샘플 코드 작성

- [ ] `tutorials-python/python/logging/` 디렉토리 생성
- [ ] `requirements.txt` 작성 (structlog, loguru, colorlog, pyyaml, fastapi, uvicorn)
- [ ] `01_basic_logging.py` - getLogger, 로거 계층, propagate, basicConfig vs 수동 설정
- [ ] `02_log_levels.py` - 5개 레벨 출력, 로거/핸들러 레벨 필터링, 환경별 설정
- [ ] `03_handlers.py` - StreamHandler, FileHandler, RotatingFileHandler, TimedRotatingFileHandler, 복수 핸들러
- [ ] `04_formatters.py` - 포맷 속성 조합, datefmt, colorlog
- [ ] `05_dict_config.py` - dictConfig 기반 전체 설정
- [ ] `06_yaml_config.py` + `logging_config.yaml` - YAML 파일 로드 설정
- [ ] `07_structlog_basic.py` - get_logger, 프로세서 파이프라인, stdlib 통합
- [ ] `08_structlog_binding.py` - bind 컨텍스트, 프로세서 체인
- [ ] `09_loguru_basic.py` - 즉시 사용, 파일 핸들러, rotation
- [ ] `10_loguru_advanced.py` - @logger.catch, lazy, InterceptHandler
- [ ] `11_fastapi_logging.py` - 미들웨어 요청/응답 로깅
- [ ] `12_json_correlation_id.py` - JSON 포맷 + 상관관계 ID (contextvars)
- [ ] 각 샘플 코드 실행 테스트

## 2단계: 블로그 글 작성

- [ ] `docs/start/7_23_python_logging/index.md` 파일 생성
- [ ] frontmatter 작성 (title, description, date, tags)
- [ ] 섹션 1: 들어가며 - 왜 print 대신 logging을 써야 하는지
- [ ] 섹션 2.1: logging 모듈 기본 - Logger, Handler, Formatter 개념 + 코드
- [ ] 섹션 2.2: 로그 레벨 - 각 레벨 설명 + 환경별 가이드
- [ ] 섹션 2.3: 핸들러 종류 - 4가지 핸들러 + 복수 핸들러 패턴
- [ ] 섹션 2.4: 포맷터 커스터마이징 - 포맷 속성 + colorlog
- [ ] 섹션 2.5: dictConfig - 딕셔너리/YAML 설정 패턴
- [ ] 섹션 3.1: structlog - 기본 사용법 + 프로세서 + 바인딩
- [ ] 섹션 3.2: loguru - 기본 사용법 + catch + InterceptHandler
- [ ] 섹션 3.3: 비교표 - logging vs structlog vs loguru
- [ ] 섹션 4: 실전 패턴 - FastAPI 로깅, JSON 포맷, 상관관계 ID, ELK 개요
- [ ] 섹션 5: 마무리
- [ ] Mermaid 다이어그램 작성 (로거 계층, 프로세서 파이프라인, ELK 아키텍처)
- [ ] GitHub 샘플 코드 링크 추가

## 3단계: 검증

- [ ] 블로그 글 인코딩 확인 (`file -I`)
- [ ] 로컬 dev 서버에서 글 렌더링 확인
- [ ] 코드 블록 하이라이팅 확인 (Python)
- [ ] Mermaid 다이어그램 렌더링 확인
- [ ] 링크/참고 자료 동작 확인

## 4단계: PR 생성

- [ ] feature 브랜치 생성 (`feature/XX-python-logging`)
- [ ] 커밋 및 push
- [ ] PR 생성 (`gh pr create` + HEREDOC)
