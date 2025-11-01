# Base image
FROM python:3.13-slim

# Working directory
WORKDIR /app

# Copy dependencies file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy script and data
COPY generate_readme.py .
COPY data/ ./data/

# Set entrypoint
ENTRYPOINT ["python", "generate_readme.py"]
CMD ["-g"]
