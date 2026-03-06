# PRD: Python 로깅 제대로 하기

## 개요
logging 모듈 기본부터 structlog, loguru 비교까지 다루는 블로그 포스팅.

## 시리즈
- **독립 글**
- **번호**: -
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용

# 1. 들어가며

# 2. logging 표준 라이브러리

## 2.1 logging 모듈 기본 (Logger, Handler, Formatter)
   - `logging.getLogger(__name__)`: 모듈별 로거 생성
   - 로거 계층 구조: `root` → `app` → `app.services` (점 표기)
   - 로거 전파 (propagation): `propagate=True/False`
   - `basicConfig()` vs 수동 설정 차이

## 2.2 로그 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
   - 각 레벨의 의미와 사용 시나리오
   - 레벨 필터링: 로거 레벨 vs 핸들러 레벨
   - 숫자 값: DEBUG(10), INFO(20), WARNING(30), ERROR(40), CRITICAL(50)
   - 개발 환경 vs 프로덕션 환경 레벨 설정 가이드

## 2.3 핸들러 종류
   - `StreamHandler`: 콘솔 출력 (stdout/stderr)
   - `FileHandler`: 파일 출력
   - `RotatingFileHandler`: 파일 크기 기반 로테이션 (`maxBytes`, `backupCount`)
   - `TimedRotatingFileHandler`: 시간 기반 로테이션 (일별/시간별)
   - 복수 핸들러 등록: 콘솔 + 파일 동시 출력

## 2.4 포맷터 커스터마이징
   - 기본 포맷 속성: `%(asctime)s`, `%(name)s`, `%(levelname)s`, `%(message)s`
   - `%(funcName)s`, `%(lineno)d`: 호출 위치 정보
   - `datefmt` 설정: 시간 형식 커스터마이징
   - 컬러 출력: `colorlog` 라이브러리 활용

## 2.5 logging.config (dictConfig, fileConfig)
   - `dictConfig()`: 딕셔너리 기반 설정 (가장 유연)
   - 설정 딕셔너리 구조: `version`, `handlers`, `loggers`, `formatters`
   - YAML 파일에서 설정 로드 패턴
   - `fileConfig()`: INI 파일 기반 설정 (레거시)

# 3. 서드파티 로깅 라이브러리

## 3.1 structlog 소개 (구조화된 로깅)
   - 구조화된 로깅이란: key=value 쌍으로 로그 데이터 기록
   - `structlog.get_logger()`: 기본 사용법
   - 프로세서 파이프라인: `add_log_level`, `JSONRenderer` 등
   - `structlog.stdlib` 통합: 기존 logging 모듈과 공존
   - 바인딩: `logger.bind(user_id=123)` 컨텍스트 추가

## 3.2 loguru 소개 (간편한 로깅)
   - `from loguru import logger`: 설정 없이 즉시 사용
   - `logger.add("file.log", rotation="10 MB")`: 한 줄로 파일 핸들러
   - `@logger.catch`: 예외 자동 로깅 데코레이터
   - `logger.opt(lazy=True)`: 지연 평가로 성능 최적화
   - 기존 logging 모듈과의 통합 (InterceptHandler)

## 3.3 logging vs structlog vs loguru 비교
   - 비교표: 설정 복잡도, 구조화 지원, 성능, 생태계
   - logging: 표준 라이브러리, 높은 호환성
   - structlog: 구조화된 데이터, 프로세서 파이프라인
   - loguru: 간결함, 빠른 시작, 풍부한 기본 기능
   - 프로젝트 규모별 선택 가이드

# 4. 실전 패턴
   - FastAPI 로깅: 미들웨어 기반 요청/응답 로그
   - JSON 로그 포맷: 로그 수집 시스템과의 호환성
   - 상관관계 ID (correlation ID): 요청 추적
   - ELK (Elasticsearch + Logstash + Kibana) 연동 개요

# 5. 마무리

## 샘플 코드
- `tutorials-python/python/logging/`

## 참고
- https://docs.python.org/3/library/logging.html
- https://www.structlog.org/
- https://github.com/Delgan/loguru
