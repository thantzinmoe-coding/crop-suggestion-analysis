# crop-Ai FastAPI Backend

This folder contains the initial FastAPI backend scaffold for crop-Ai. It provides:

- A FastAPI application factory.
- Versioned routes under `/api/v1`.
- Liveness and API health endpoints.
- Environment-based settings.
- CORS configuration for the React development server.
- Async MongoDB connection using PyMongo.
- Idempotent collection indexes and local demo-data seeding.
- Pytest and Ruff configuration.
- VS Code launch and test settings.

Agriculture features such as fields, crops, observations, assessments, alerts, Telegram notifications, and growth simulations should be added as separate feature modules. The scaffold intentionally does not implement those product features yet.

## Quick start on Windows PowerShell

Run these commands from this `fastapi` folder:

1. Create the virtual environment: `python -m venv .venv`
2. Activate it: `.\.venv\Scripts\Activate.ps1`
3. Install dependencies: `python -m pip install -r requirements.txt`
4. Start the API: `python -m uvicorn app.main:app --reload`
5. Open the API documentation: `http://127.0.0.1:8000/docs`

Copy `.env.example` to `.env` and adjust the local MongoDB connection if needed. The
real `.env` is ignored by Git. Never commit database connection strings, Telegram
tokens, or other credentials.

## Available endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Minimal liveness check for local tools and deployment probes |
| `GET /api/v1/health` | Versioned API health and environment summary |
| `GET /api/v1/community/posts` | List farmer field updates and success stories |
| `POST /api/v1/community/posts` | Publish a farmer community post |
| `POST /api/v1/community/media` | Upload a community photo or video |
| `POST /api/v1/community/posts/{post_id}/comments` | Add advice or a comment to a post |
| `GET /docs` | Interactive OpenAPI documentation |
| `GET /openapi.json` | OpenAPI contract |

## Quality commands

- Run tests: `python -m pytest`
- Run lint checks: `python -m ruff check .`
- Apply safe formatting: `python -m ruff format .`

## MongoDB setup

The default connection is `mongodb://127.0.0.1:27017` and the default database is
`crop_ai`. Configure them with `CROP_AI_MONGODB_URL` and
`CROP_AI_MONGODB_DATABASE` in the private local `.env` file.

If authentication is enabled locally, use a URI such as
`mongodb://username:password@127.0.0.1:27017/?authSource=admin`. Percent-encode
special characters in the username or password.

Set `CROP_AI_INITIALIZE_DATABASE=true` only when startup should create missing
indexes and seed the demo documents. Seeding uses upserts, so it is safe to run
more than once.

- Inspect the database: `mongosh mongodb://127.0.0.1:27017/crop_ai`
- List collections: `show collections`
- View crop profiles: `db.crop_profiles.find().pretty()`

MongoDB must be running when the FastAPI application starts. The application checks
the connection during startup and closes the async client during shutdown.

Community uploads are stored in `fastapi/uploads/community` and served from
`/uploads/community`. A post supports up to six attachments. JPG, PNG, WebP, and
GIF images are limited to 10 MB each; MP4, WebM, and MOV videos are limited to
50 MB each. The upload directory is excluded from Git.

## Recommended next modules

Add one vertical slice at a time in this order:

1. Fields and seeded GIS context.
2. Crop profiles and requirements.
3. Sensor observations.
4. Explainable field assessments.
5. Alerts and Telegram delivery.
6. Growth simulation and demo reset.
