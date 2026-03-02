# PRD: Python 로깅 제대로 하기

## 개요
logging 모듈 기본부터 structlog, loguru 비교까지 다루는 블로그 포스팅.

## 시리즈
- **독립 글**
- **번호**: 7-1
- **난이도**: 초-중급
- **우선순위**: ★★☆

## 다룰 내용
1. logging 모듈 기본 (Logger, Handler, Formatter)
2. 로그 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
3. 핸들러 종류 (StreamHandler, FileHandler, RotatingFileHandler)
4. 포맷터 커스터마이징
5. logging.config (dictConfig, fileConfig)
6. structlog 소개 (구조화된 로깅)
7. loguru 소개 (간편한 로깅)
8. logging vs structlog vs loguru 비교
9. 실전 패턴: FastAPI 로깅, JSON 로그 포맷, 로그 수집 (ELK)

## 샘플 코드
- `tutorials-python/python/logging/`

## 참고
- https://docs.python.org/3/library/logging.html
- https://www.structlog.org/
- https://github.com/Delgan/loguru
