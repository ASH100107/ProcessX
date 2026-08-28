# ProcessX

**Autonomous Business Bottleneck Investigator** — an AI/ML-powered platform that detects process bottlenecks, runs autonomous investigations, simulates interventions, and optimizes ROI.

Repository: [https://github.com/ASH100107/ProcessX](https://github.com/ASH100107/ProcessX)

---

## Team Ownership

| Component | Path | Owner | GitHub |
|-----------|------|-------|--------|
| Frontend (React dashboard) | `frontend/` | ASH100107 | [@ASH100107](https://github.com/ASH100107) |
| Simulation engine & ROI UI | `backend/app/simulation/`, `SimulationLab.jsx` | ASH100107 | [@ASH100107](https://github.com/ASH100107) |
| Backend API (FastAPI) | `backend/` | Sandeep | [@sandeepchakka-2007](https://github.com/sandeepchakka-2007) |
| ML models & metrics | `backend/app/ml/`, `models/` | Sandeep | [@sandeepchakka-2007](https://github.com/sandeepchakka-2007) |
| Autonomous agent | `backend/app/agents/` | Bhuvan | [@bhuvanraj-stack](https://github.com/bhuvanraj-stack) |
| Tests | `backend/tests/` | Shared | Team |
| Docker / DevOps | `docker/`, `Dockerfile.*`, `docker-compose.yml` | Shared | Team |
| CI/CD | `.github/workflows/` | Shared | Team |

> **Note:** Code currently lives under `backend/app/` (monolithic FastAPI layout). Top-level `ml/`, `agent/`, and `simulation/` folders are the target structure for future refactors — do not move files without team agreement.

All contributors push to **this single repository**. Sandeep and Bhuvan do not need separate ProcessX repos.

---

## Branch Workflow

```
main          ← stable / demo-ready releases
  │
  └── develop ← integration branch (default for active work)
        │
        ├── feature/frontend        ← ASH100107 (dashboard, UX)
        ├── feature/simulation      ← ASH100107 (simulation lab, ROI UI)
        ├── feature/backend-ml      ← Sandeep (API, ML models)
        └── feature/agent           ← Bhuvan (investigator agent)
```

### Rules

1. **Never push directly to `main`** — merge via PR from `develop`.
2. **Branch from `develop`** for all feature work.
3. **Open PRs** back into `develop` for review.
4. When demo-ready, merge `develop` → `main`.

### Quick commands

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/frontend   # or feature/backend-ml, etc.
# ... make changes ...
git add .
git commit -m "Describe your change"
git push -u origin feature/frontend
# Open PR on GitHub: feature/frontend → develop
```

---

## Project Structure

```
ProcessX/
├── frontend/                 # React + Vite dashboard
├── backend/
│   ├── app/
│   │   ├── agents/           # Autonomous investigator (Bhuvan)
│   │   ├── ml/               # ML models (Sandeep)
│   │   ├── simulation/       # Intervention simulation (ASH100107)
│   │   ├── api/              # FastAPI routes
│   │   ├── services/         # Business logic
│   │   └── data/             # Event log generation
│   └── tests/
├── models/                   # Trained joblib models + metrics JSON
├── data/                     # Synthetic event logs (4 scenarios)
├── scripts/                  # Data generation & model training
├── docker/                   # nginx config
├── .github/workflows/        # CI (pytest + frontend build) & CD
└── docker-compose.yml
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- Dependencies: `pip install -r backend/requirements.txt` and `npm install` in `frontend/`

Copy environment config:

```powershell
copy .env.example .env
```

---

## Run Locally

### Terminal 1 — Backend (port 8000)

```powershell
cd D:\ProcessX
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Terminal 2 — Frontend (port 5173)

```powershell
cd D:\ProcessX\frontend
npm run dev
```

Dashboard: [http://localhost:5173](http://localhost:5173)

The Vite dev server proxies `/api` requests to the backend automatically.

---

## Run Tests

```powershell
cd D:\ProcessX
python -m pytest backend/tests -v
```

```powershell
cd D:\ProcessX\frontend
npm run build
```

---

## Docker

```powershell
cd D:\ProcessX
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:80`

---

## Scenarios

| Scenario ID | Description |
|-------------|-------------|
| `normal` | Healthy baseline across all 6 stages |
| `payment_verification_bottleneck` | Payment Verification critical backlog |
| `packing_bottleneck` | Order Packing saturation |
| `unknown_inventory_bottleneck` | Hidden Inventory Check bottleneck (agent generalization test) |

Select scenarios from the sidebar in the dashboard, or via `POST /api/scenario/inject`.

---

## Demo Flow

1. Open dashboard → select a bottleneck scenario
2. Click **Run Autonomous Investigation**
3. Review bottleneck ranking, hypotheses, and ROI recommendation
4. Click **Apply Recommended Intervention & Re-evaluate**
5. Open **Process Map** — see original + stacked after-maps showing Critical → Healthy transitions
6. Compare against baseline heuristic on the **Baseline** page

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): runs on push/PR to `main` and `develop` — pytest + frontend build
- **CD** (`.github/workflows/cd.yml`): builds Docker images and verifies health endpoint on push to `main`
