# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY ./services/nlp_engine/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download a pre-trained spaCy model
# This ensures the model is available in the container at runtime.
RUN python -m spacy download en_core_web_sm

# Copy the application code into the container
COPY ./services/nlp_engine/ .

# Command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
