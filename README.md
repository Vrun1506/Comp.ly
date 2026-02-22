# Comply 2

Automated infrastructure compliance scanning and remediation platform.

## Architecture

```
comply2/
├── frontend/          # Next.js 14 app (TypeScript + Tailwind)
├── backend/           # FastAPI Python backend
├── demo/              # Demo infra with intentional violations
├── firestore.rules    # Firestore security rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```

## Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS     |
| Auth        | Firebase Auth (Google Sign-In)           |
| Database    | Firestore (Native Mode)                  |
| Storage     | Firebase Storage                         |
| Backend     | FastAPI (Python 3.11+)                   |
| LLM         | Gemini 1.5 Flash                         |
| GitHub      | GitHub OAuth + REST API                  |

## Local Setup

### 1. Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Sign-In** in Authentication
3. Enable **Firestore** in Native Mode
4. Download a **Service Account JSON** to `backend/serviceAccountKey.json`
5. Deploy security rules: `firebase deploy --only firestore:rules,storage`

### 2. GitHub OAuth App

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/api/github/callback`
4. Copy Client ID and Client Secret

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in Firebase and GitHub values
npm install
npm run dev        # http://localhost:3000
```

### 4. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in Firebase, Gemini, GitHub values
# Set FIREBASE_SERVICE_ACCOUNT_JSON=serviceAccountKey.json

uvicorn app.main:app --reload   # http://localhost:8000
```

### 5. Demo Infra

The `demo/sample-infra/` folder contains intentionally insecure IaC files:
- **main.tf** – Public S3, insecure SG, unencrypted RDS, hardcoded secrets
- **kubernetes.yaml** – Privileged containers, wildcard network policies
- **Dockerfile** – Running as root, hardcoded secrets, :latest tag

Push this to a GitHub repo, connect it to a workspace, and run a scan to see Comply in action.

## Demo Flow

1. Sign in with Google
2. Create consultancy
3. Create workspace for "Acme Bank" (GDPR/AWS/Terraform)
4. Connect GitHub OAuth
5. Connect the `demo/sample-infra` repo
6. Trigger a scan
7. Review findings (P0/P1/P2)
8. Approve fix plans
9. Create pull request
10. View PR on GitHub

## Environment Variables

See `frontend/.env.local.example` and `backend/.env.example`.
