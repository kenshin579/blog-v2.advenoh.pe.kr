.PHONY: docker-build docker-push docker-run test help

# Docker image configuration
IMAGE_NAME := kenshin579/readme-generator
IMAGE_TAG := latest
FULL_IMAGE := $(IMAGE_NAME):$(IMAGE_TAG)

# Default environment variables
CONTENT_DIR ?= contents
BLOG_URL ?= https://blog.advenoh.pe.kr

help:
	@echo "Available targets:"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-push   - Push Docker image to Docker Hub"
	@echo "  docker-run    - Run Docker container locally"
	@echo "  test          - Run pytest tests"

docker-build:
	@echo "Building Docker image: $(FULL_IMAGE)"
	docker build -t $(FULL_IMAGE) .

docker-push:
	@echo "Pushing Docker image: $(FULL_IMAGE)"
	docker push $(FULL_IMAGE)

docker-run:
	@echo "Running Docker container with:"
	@echo "  CONTENT_DIR=$(CONTENT_DIR)"
	@echo "  BLOG_URL=$(BLOG_URL)"
	docker run --rm \
		-v $(PWD)/../..:/workspace \
		-e CONTENT_DIR=$(CONTENT_DIR) \
		-e BLOG_URL=$(BLOG_URL) \
		$(FULL_IMAGE)

test:
	@echo "Running tests..."
	pytest test_generate_readme.py -v
