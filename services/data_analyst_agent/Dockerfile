# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./services/data_analyst_agent/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the common agent framework, which is a dependency
COPY ./services/common/ /app/services/common

# Copy the application code for this specific agent
COPY ./services/data_analyst_agent/ .

# Command to run the agent service
CMD ["python", "main.py"]
