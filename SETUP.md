# Setup Guide — AT Salon Management Suite

## After Importing from GitHub

When you import this project from GitHub into Replit, follow these steps:

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Workflows
The two workflows below must be running for the app to work:

| Workflow | Command | Purpose |
|---|---|---|
| **Start application** | `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/salon-app run dev` | Frontend (React + Vite) |
| **API Server** | `PORT=8080 pnpm --filter @workspace/api-server run dev` | Backend (Express + MongoDB) |

### 3. Set the Required Secret
Go to **Secrets** in Replit and add:
- `MONGODB_URI` — your MongoDB connection string (e.g. from MongoDB Atlas)

### 4. Preview
The app will be available at the root path `/` in the Replit preview pane.

---

## Why Port 5173?
Replit's preview proxy only forwards traffic from supported ports.
This project uses **port 5173** (standard Vite port) for the frontend and **port 8080** for the API server — both are supported by Replit.

> ⚠️ Do NOT change `localPort` in `artifacts/salon-app/.replit-artifact/artifact.toml` away from `5173`, or the preview pane will stop working.

---

## Project Structure
```
artifacts/
  salon-app/       React + Vite frontend (port 5173)
  api-server/      Express + MongoDB backend (port 8080)
lib/
  api-spec/        OpenAPI specification
  api-client-react/ Generated React Query hooks
```

## Regenerating API Client
If you change the OpenAPI spec (`lib/api-spec/openapi.yaml`), regenerate the client:
```bash
pnpm --filter @workspace/api-client-react run codegen
```
