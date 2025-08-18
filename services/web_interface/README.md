# FluxRevenue Web Interface Service

## 1. Overview

The `web_interface` service provides a modern, responsive web dashboard for the FluxRevenue system. It allows users to monitor, control, and interact with the various components of the system in an intuitive way.

This service is built as a single, cohesive unit containing both the backend API and the frontend user interface.

## 2. Features

- **Secure Authentication**: Login system based on JWT (JSON Web Tokens).
- **Interactive Dashboard**: A central dashboard providing a high-level overview of the system's status.
- **Real-Time Updates**: Utilizes WebSockets to receive and display live updates for system metrics without needing to refresh the page.
- **Service Integration-Ready**: Designed with a client-based architecture to easily integrate with other microservices within the FluxRevenue ecosystem.

## 3. Tech Stack

- **Backend**:
  - **Framework**: FastAPI
  - **Authentication**: python-jose for JWT
  - **Real-time**: WebSockets
  - **Server**: Uvicorn
- **Frontend**:
  - **Library**: React.js
  - **Build Tool**: Vite
  - **Styling**: Standard CSS
  - **Testing**: Vitest with React Testing Library

## 4. Getting Started

### Prerequisites

- Docker and Docker Compose must be installed on your system.

### Running the Service

The `web_interface` is managed as part of the main `docker-compose.yml` file at the root of the project. To run the service along with the rest of the FluxRevenue system, use the following command from the project root:

```bash
docker-compose up --build web_interface
```

To run all services:
```bash
docker-compose up --build
```

The web interface will be accessible at `http://localhost:8080`.

## 5. Usage

### Logging In

Once the service is running, navigate to `http://localhost:8080` in your web browser. You will be presented with a login screen.

For development and testing purposes, you can use the following mock credentials:
- **Username**: `jules`
- **Password**: `supersecret`

### Dashboard

After logging in, you will be redirected to the main dashboard, which displays:
- A system overview with the number of active projects.
- The status of various agents.
- Real-time system metrics that update automatically.
- A list of recent activities.

## 6. API Documentation

The FastAPI backend automatically generates interactive API documentation. You can access it at the following endpoints while the service is running:

- **Swagger UI**: `http://localhost:8080/docs`
- **ReDoc**: `http://localhost:8080/redoc`

## 7. Testing

The service includes both backend and frontend tests.

### Running Backend Tests

The backend tests are written with `pytest`. To run them, you can execute the following command inside the `web_interface` container:

1.  Find the container ID: `docker ps`
2.  Exec into the container: `docker exec -it <container_id> /bin/bash`
3.  Run the tests from the `/app` directory:
    ```bash
    pytest
    ```

### Running Frontend Tests

The frontend tests are written with `vitest`. To run them, you can use `npm` inside the `frontend` directory or run them inside the container.

To run locally (requires `npm install` first in `services/web_interface/frontend`):
```bash
cd services/web_interface/frontend
npm test
```
