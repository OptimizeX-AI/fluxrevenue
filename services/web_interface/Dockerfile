# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package.json and install dependencies first to leverage Docker cache
COPY ./services/web_interface/frontend/package.json ./
RUN npm install

# Copy the rest of the frontend code and build the application
COPY ./services/web_interface/frontend/ ./
RUN npm run build

# Stage 2: Create the final production image with the Python backend
FROM python:3.10-slim
WORKDIR /app

# Copy built frontend assets from the builder stage into the static directory
COPY --from=frontend-builder /app/frontend/dist /app/static

# Copy and install backend dependencies
COPY ./services/web_interface/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY ./services/web_interface/ .

# Expose the port the application will run on
EXPOSE 8000

# Command to run the Uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
