# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any needed dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Download spacy language model
RUN python -m spacy download en_core_web_sm

# Copy the application source code to the working directory
COPY ./app .

# Specify the command to run on container startup
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
