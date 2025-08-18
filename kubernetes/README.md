# Kubernetes Manifests for FluxRevenue

This directory contains all the necessary Kubernetes manifest files to deploy the FluxRevenue system to a Kubernetes cluster.

## Directory Structure

The manifests are organized into subdirectories based on the type of Kubernetes resource they define:

-   **/config**: Contains `ConfigMap` and `Secret` resources. These are used to manage the configuration and sensitive data for the services.
-   **/deployments**: Contains `Deployment` resources. Each deployment manages the pods for a specific microservice (e.g., `developer-agent`, `web_interface`).
-   **/services**: Contains `Service` resources. These define how to access the pods of a deployment, providing stable endpoints and load balancing.
-   **/hpa**: Contains `HorizontalPodAutoscaler` resources, which automatically scale the number of pods in a deployment based on observed metrics like CPU and memory usage.

## Deployment Instructions

### Prerequisites

1.  **A Kubernetes Cluster**: You must have access to a running Kubernetes cluster (e.g., Minikube, Docker Desktop, GKE, EKS, AKS).
2.  **`kubectl`**: The Kubernetes command-line tool must be installed and configured to connect to your cluster.
3.  **Container Images**: The Docker images for each service (e.g., `fluxrevenue/developer-agent:latest`) must be built and pushed to a container registry that your Kubernetes cluster can access.

### Applying the Manifests

You can apply these configurations to your cluster using the `kubectl apply` command. It is recommended to apply them in a specific order to ensure dependencies are met.

A good practice is to create a dedicated namespace for the application first.

```bash
# 1. Create a namespace
kubectl create namespace flux-prod

# 2. Apply configurations and secrets first
kubectl apply -f config/

# 3. Apply the deployments
kubectl apply -f deployments/

# 4. Apply the services to expose the deployments
kubectl apply -f services/

# 5. Apply the autoscalers
kubectl apply -f hpa/
```

Alternatively, you can apply all manifests in the entire directory at once (though the ordered approach is safer):

```bash
kubectl apply -k . # If using Kustomize, or `kubectl apply -R -f .` for recursive apply
```

### Accessing the Web Interface

Once deployed, the `web-interface-service` is of type `LoadBalancer`. In a cloud environment, this will provision an external IP address. You can find it by running:

```bash
kubectl get service web-interface-service -n flux-prod
```

Look for the `EXTERNAL-IP` address in the output. You can then access the web interface by navigating to that IP in your browser.
