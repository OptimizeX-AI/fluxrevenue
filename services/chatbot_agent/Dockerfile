# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container first to leverage Docker caching
COPY ./services/chatbot_agent/requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download necessary NLTK data
# This step is crucial for the NLPProcessor and IntentClassifier
RUN python -m nltk.downloader punkt

# Copy the rest of the application's code into the container
COPY ./services/chatbot_agent/ .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define the command to run the application
# Uvicorn is a lightning-fast ASGI server, perfect for FastAPI.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
