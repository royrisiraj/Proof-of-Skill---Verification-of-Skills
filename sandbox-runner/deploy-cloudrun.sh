#!/usr/bin/env bash
# Proof of Skill — Google Cloud Run Production Sandbox Deployment Guide
# Note: Execute this script outside AI Studio using standard gcloud CLI credentials.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-my-gcp-project}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="pos-sandbox-runner"
SERVICE_ACCOUNT="pos-runner-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== Deploying Proof of Skill Isolated Runner to Google Cloud Run ==="
echo "Project: ${PROJECT_ID} | Region: ${REGION} | Service: ${SERVICE_NAME}"

# 1. Create Dedicated Service Account with Least Privilege (Zero IAM roles beyond standard run.invoker)
# gcloud iam service-accounts create pos-runner-sa \
#   --description="Dedicated service identity for Proof of Skill runner" \
#   --display-name="POS Runner Service Account"

# 2. Build Container Image
# gcloud builds submit --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" ./sandbox-runner

# 3. Deploy to Cloud Run with Second Generation Execution Environment (gVisor/microVM isolation)
# gcloud run deploy "${SERVICE_NAME}" \
#   --image="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
#   --platform="managed" \
#   --region="${REGION}" \
#   --execution-environment="gen2" \
#   --service-account="${SERVICE_ACCOUNT}" \
#   --no-allow-unauthenticated \
#   --memory="512Mi" \
#   --cpu="1" \
#   --concurrency=10 \
#   --timeout="10s" \
#   --set-secrets="RUNNER_PRIVATE_KEY=pos-runner-private-key:latest,SANDBOX_API_KEY=pos-sandbox-token:latest"

echo "=== Deployment Guide Ready ==="
