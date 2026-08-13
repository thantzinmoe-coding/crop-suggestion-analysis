# GreenVista

GreenVista is a React frontend and FastAPI backend for agricultural crop suggestions,
field-health analysis, weather data, and NDVI analysis.

## Requirements

- Node.js 18+
- Python 3.11+
- MongoDB running locally on port `27017`

## First-time setup

### Backend

```powershell
cd fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
python -m pip install -r requirements.txt
```

Edit `fastapi/.env` with local MongoDB settings. SMTP and other integrations are optional.
Never commit `.env` or real API keys.

### Frontend

In a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
```

## Run the project

Terminal 1:

```powershell
cd fastapi
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`. The backend API documentation is at
`http://localhost:8000/docs`.

On the first backend startup, set `AGROGUARD_INITIALIZE_DATABASE=true` in `fastapi/.env`
to create indexes and seed the initial region/crop records. Repository datasets are read
from the project; MongoDB itself is not included in GitHub.

## Real signup and email

Signup and signin use the local MongoDB `greenvista` database. SMTP settings are required
only if welcome emails should be sent. Each developer must use their own private SMTP
credentials in `fastapi/.env`.

## Useful URLs and commands

| URL or command | Purpose |
|---|---|
| `http://localhost:5173` | React application |
| `http://localhost:8000/docs` | Interactive FastAPI documentation |
| `http://localhost:8000/health` | Backend liveness check |
| `python -m pytest` | Run backend tests |
| `python -m ruff check .` | Run backend lint checks |

### MongoDB initialization

The application uses the local MongoDB database `greenvista`. Set these values in
`fastapi/.env` before starting the backend:

```env
AGROGUARD_MONGODB_URL=mongodb://localhost:27017
AGROGUARD_DATABASE_NAME=greenvista
AGROGUARD_INITIALIZE_DATABASE=true
```

The startup process creates indexes and seeds the initial regions and crop profile.
The repository datasets are read from the project; MongoDB data itself is not stored
in GitHub.

### Signup email

Signup and signin use MongoDB, and passwords are stored as PBKDF2 hashes. Welcome emails
are optional. To enable Gmail SMTP, use a Gmail App Password rather than your normal
Gmail password:

```env
AGROGUARD_SMTP_HOST=smtp.gmail.com
AGROGUARD_SMTP_PORT=587
AGROGUARD_SMTP_USERNAME=your-address@gmail.com
AGROGUARD_SMTP_PASSWORD=your-16-character-app-password
AGROGUARD_SMTP_FROM_EMAIL=your-address@gmail.com
AGROGUARD_SMTP_USE_TLS=true
```

Never commit `.env`, database connection strings, API keys, or SMTP credentials.

### Near-real-time NDVI

The NDVI dashboard reads MongoDB observations first and falls back to the existing CSV
when live observations are unavailable. Copernicus Data Space ingestion is optional:

```env
AGROGUARD_CDSE_ENABLED=true
AGROGUARD_CDSE_CLIENT_ID=your-client-id
AGROGUARD_CDSE_CLIENT_SECRET=your-client-secret
AGROGUARD_CDSE_CLOUD_COVER_MAX=40
```

After MongoDB is running and initialized, run the ingestion job from `fastapi`:

```powershell
python -m app.jobs.ingest_ndvi
```

It can be scheduled daily with Windows Task Scheduler. Satellite availability depends
on revisit timing and cloud cover, so this is near-real-time rather than instantaneous.

### Crop suggestion data

`POST /api/v1/crop-suggestion` uses `fastapi/app/data/plants.csv` for climate-based
matching. Market prices come from the repository’s WFP price data and project price
history. Crops without an available price are excluded from suggestions.
