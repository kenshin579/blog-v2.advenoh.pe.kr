.PHONY: docker-build docker-push docker-run test help

# Docker image configuration
IMAGE_NAME := kenshin579/readme-generator
IMAGE_TAG := latest
FULL_IMAGE := $(IMAGE_NAME):$(IMAGE_TAG)

# Default environment variables (blog 프로젝트 기본값)
CONTENT_DIR ?= contents
BLOG_URL ?= https://blog.advenoh.pe.kr
PROJECT_TITLE ?= Frank's IT Blog
NETLIFY_BADGE_ID ?= 68c25f86-908d-419b-8b5c-925e22a2149d

help:
	@echo "Available targets:"
	@echo "  docker-build         - Build Docker image"
	@echo "  docker-push          - Push Docker image to Docker Hub"
	@echo "  docker-run           - Run Docker container locally"
	@echo "  test                 - Run pytest tests"

docker-build:
	@echo "Building Docker image: $(FULL_IMAGE) for local platform"
	docker build -t $(FULL_IMAGE) .

docker-push:
	@echo "Building and pushing multi-platform Docker image: $(FULL_IMAGE)"
	docker buildx build --platform linux/amd64,linux/arm64 -t $(FULL_IMAGE) --push .

docker-run:
	@echo "Running Docker container with:"
	@echo "  CONTENT_DIR=$(CONTENT_DIR)"
	@echo "  BLOG_URL=$(BLOG_URL)"
	@echo "  PROJECT_TITLE=$(PROJECT_TITLE)"
	@echo "  NETLIFY_BADGE_ID=$(NETLIFY_BADGE_ID)"
	docker run --rm \
		-v $(PWD)/../..:/workspace \
		-e WORKSPACE_DIR=/workspace \
		-e CONTENT_DIR=$(CONTENT_DIR) \
		-e BLOG_URL=$(BLOG_URL) \
		-e PROJECT_TITLE="$(PROJECT_TITLE)" \
		-e NETLIFY_BADGE_ID=$(NETLIFY_BADGE_ID) \
		$(FULL_IMAGE)

test:
	@echo "Running tests..."
	pytest test_generate_readme.py -v
