# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./services/domain_orchestrator/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code for this specific agent
COPY ./services/domain_orchestrator/ .

# Command to run the agent service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
