# GreenVista FastAPI Backend

This folder contains the FastAPI backend scaffold for GreenVista. It provides:

- A FastAPI application factory.
- Versioned routes under `/api/v1`.
- Liveness and API health endpoints.
- Environment-based settings.
- CORS configuration for the React development server.
- MongoDB-ready asynchronous database setup.
- Pytest and Ruff configuration.
- VS Code launch and test settings.

Agriculture features such as fields, crops, observations, assessments, alerts, Telegram notifications, and growth simulations should be added as separate feature modules. The scaffold intentionally does not implement those product features yet.

## Quick start on Windows PowerShell

Run these commands from this `fastapi` folder:

1. Create the virtual environment: `python -m venv .venv`
2. Activate it: `.\.venv\Scripts\Activate.ps1`
3. Install dependencies: `python -m pip install -r requirements.txt`
4. Start MongoDB locally on its default port, or use a MongoDB Atlas connection string.
5. Start the API: `python -m uvicorn app.main:app --reload`
6. Open the API documentation: `http://127.0.0.1:8000/docs`

Copy `.env.example` to `.env` and set the MongoDB connection details. The real `.env`
is ignored by Git. Never commit database connection strings, Telegram tokens, or
other credentials.

## Available endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Minimal liveness check for local tools and deployment probes |
| `GET /api/v1/health` | Versioned API health and environment summary |
| `GET /docs` | Interactive OpenAPI documentation |
| `GET /openapi.json` | OpenAPI contract |

## Quality commands

- Run tests: `python -m pytest`
- Run lint checks: `python -m ruff check .`
- Apply safe formatting: `python -m ruff format .`

## MongoDB initialization

Set `AGROGUARD_MONGODB_URL` and `AGROGUARD_DATABASE_NAME` in the private local
`.env`. Set `AGROGUARD_INITIALIZE_DATABASE=true` when startup should create indexes
and seed the demo crop profile and regions. MongoDB collections are created lazily
by MongoDB when the seed data is inserted.

The old Alembic files are retained as historical project files but are no longer
used by the application.

The health endpoints do not require a running database, so the FastAPI setup can be verified before PostgreSQL/PostGIS is installed.

## Recommended next modules

Add one vertical slice at a time in this order:

1. Fields and seeded GIS context.
2. Crop profiles and requirements.
3. Sensor observations.
4. Explainable field assessments.
5. Alerts and Telegram delivery.
6. Growth simulation and demo reset.
