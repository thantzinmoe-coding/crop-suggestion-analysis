from functools import lru_cache
import json
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
PROJECT_DATA_DIR = DATA_DIR
BOUNDARY_PATH = DATA_DIR / "geoserver-GetFeature.application"

# Approximate administrative-region centers for map navigation. These points
# select an analysis region; they are not parcel-level boundary coordinates.
REGION_CENTERS = {
    "MMR001": (22.0, 95.3), "MMR002": (18.3, 96.5), "MMR003": (20.15, 94.9),
    "MMR004": (21.98, 96.08), "MMR005": (12.1, 99.0), "MMR006": (16.8, 95.2),
    "MMR007": (25.4, 97.4), "MMR008": (19.3, 97.2), "MMR009": (16.7, 97.6),
    "MMR010": (22.0, 93.6), "MMR011": (16.5, 97.7), "MMR012": (19.8, 93.0),
    "MMR013": (23.7, 97.0), "MMR014": (16.85, 96.2), "MMR015": (19.75, 96.1),
    "MMR016": (21.2, 97.0), "MMR017": (20.8, 100.0), "MMR018": (17.3, 96.7),
}


class AgricultureDatasetError(RuntimeError):
    """Raised when an imported agriculture dataset is unavailable or invalid."""


@lru_cache(maxsize=1)
def load_township_data() -> pd.DataFrame:
    path = DATA_DIR / "township_agricultural_data.csv"
    try:
        data = pd.read_csv(path)
        data["date"] = pd.to_datetime(data["date"], errors="coerce")
        return data.dropna(subset=["date"])
    except (OSError, ValueError, KeyError) as exc:
        raise AgricultureDatasetError(f"Unable to load township dataset: {path}") from exc


@lru_cache(maxsize=1)
def load_ndvi_data() -> pd.DataFrame:
    path = DATA_DIR / "mmr-ndvi-subnat-full.csv"
    columns = ["date", "adm_level", "adm_id", "PCODE", "vim", "vim_avg", "viq"]
    try:
        data = pd.read_csv(path, usecols=columns)
        data["date"] = pd.to_datetime(data["date"], errors="coerce")
        return data.dropna(subset=["date", "PCODE"])
    except (OSError, ValueError, KeyError) as exc:
        raise AgricultureDatasetError(f"Unable to load NDVI dataset: {path}") from exc


def _load_live_ndvi_data() -> pd.DataFrame | None:
    """Read ingested observations from MongoDB when available.

    The CSV remains a deliberate fallback for local development and for a first
    deployment before Copernicus credentials and a MongoDB instance are set up.
    """
    try:
        from pymongo import MongoClient

        from app.core.config import get_settings

        client = MongoClient(get_settings().mongodb_url, serverSelectionTimeoutMS=250)
        collection = client[get_settings().database_name].ndvi_measurements
        collection.find_one({}, {"_id": 1})
        rows = list(collection.find({}, {"_id": 0}))
        client.close()
        if not rows:
            return None
        data = pd.DataFrame(rows).rename(
            columns={"observation_date": "date", "mean_ndvi": "vim"}
        )
        data["date"] = pd.to_datetime(data["date"], errors="coerce", utc=True)
        data["PCODE"] = data["region_pcode"]
        data["viq"] = pd.to_numeric(data.get("viq", 0), errors="coerce").fillna(0)
        return data.dropna(subset=["date", "PCODE"])
    except Exception:
        return None


def get_ndvi_data() -> pd.DataFrame:
    live = _load_live_ndvi_data()
    return live if live is not None and not live.empty else load_ndvi_data()


@lru_cache(maxsize=1)
def load_region_names() -> dict[str, dict[str, str]]:
    """Load authoritative Myanmar PCODE names from the added boundary workbook."""
    path = DATA_DIR / "mmr_admin_boundaries.xlsx"
    try:
        states = pd.read_excel(
            path,
            sheet_name="mmr_admin1",
            usecols=["adm1_name", "adm1_name1", "adm1_pcode", "center_lat", "center_lon"],
        )
        districts = pd.read_excel(
            path,
            sheet_name="mmr_admin2",
            usecols=[
                "adm2_name", "adm2_name1", "adm2_pcode", "adm1_pcode", "center_lat", "center_lon"
            ],
        )
        names: dict[str, dict[str, str]] = {}
        for _, row in states.iterrows():
            pcode = str(row["adm1_pcode"]).strip()
            if pcode and pcode != "nan":
                names[pcode] = {
                    "name_en": str(row["adm1_name"]).strip(),
                    "name_my": str(row["adm1_name1"]).strip(),
                    "level": "state",
                    "latitude": float(row["center_lat"]),
                    "longitude": float(row["center_lon"]),
                }
        for _, row in districts.iterrows():
            pcode = str(row["adm2_pcode"]).strip()
            if pcode and pcode != "nan":
                names[pcode] = {
                    "name_en": str(row["adm2_name"]).strip(),
                    "name_my": str(row["adm2_name1"]).strip(),
                    "state_pcode": str(row["adm1_pcode"]).strip(),
                    "level": "district",
                    "latitude": float(row["center_lat"]),
                    "longitude": float(row["center_lon"]),
                }
        return names
    except (OSError, ImportError, KeyError, ValueError):
        return {}


def dataset_summary() -> dict:
    township = load_township_data()
    ndvi = get_ndvi_data()
    return {
        "total_records": int(len(township)),
        "avg_yield": round(float(township["historic_yield_tons_per_ha"].mean()), 2),
        "avg_rainfall": round(float(township["rainfall_mm"].mean()), 2),
        "township_count": int(township["township"].nunique()),
        "crop_distribution": township["best_crop"].value_counts().to_dict(),
        "ndvi_avg": round(float(ndvi["vim"].mean()), 4),
        "date_range": {
            "start": ndvi["date"].min().date().isoformat(),
            "end": ndvi["date"].max().date().isoformat(),
        },
    }


def dashboard_data() -> list[dict]:
    data = load_township_data()
    grouped = (
        data.groupby("township", as_index=False)
        .agg(
            rainfall_mm=("rainfall_mm", "mean"),
            historic_yield_tons_per_ha=("historic_yield_tons_per_ha", "mean"),
        )
        .round(2)
    )
    return grouped.to_dict(orient="records")


def crop_analysis() -> dict:
    data = load_township_data()
    return {
        "crop_distribution": data["best_crop"].value_counts().to_dict(),
        "avg_yield_per_crop": (
            data.groupby("best_crop")["historic_yield_tons_per_ha"].mean().round(2).to_dict()
        ),
        "avg_price_per_crop": (
            data.groupby("best_crop")["local_grain_price"].mean().round(2).to_dict()
        ),
    }


def ndvi_regions() -> list[dict]:
    data = get_ndvi_data()
    regions = (
        data[["PCODE", "adm_id"]]
        .drop_duplicates()
        .sort_values(["PCODE", "adm_id"])
        .to_dict(orient="records")
    )
    names = load_region_names()
    for region in regions:
        region.update(names.get(region["PCODE"], {}))
        parent = region["PCODE"].split("D", 1)[0]
        latitude, longitude = REGION_CENTERS.get(parent, (20.0, 96.0))
        region.setdefault("latitude", latitude)
        region.setdefault("longitude", longitude)
    return regions


@lru_cache(maxsize=1)
def ndvi_boundaries() -> dict:
    """Return district polygons from the GeoServer GeoJSON export."""
    try:
        with BOUNDARY_PATH.open(encoding="utf-8") as file:
            source = json.load(file)
        names = load_region_names()
        features = []
        for feature in source.get("features", []):
            properties = feature.get("properties", {})
            pcode = str(properties.get("DT_PCODE", "")).strip()
            state_pcode = str(properties.get("ST_PCODE", "")).strip()
            if not pcode or not feature.get("geometry"):
                continue
            name = names.get(pcode, {})
            features.append({
                "type": "Feature",
                "id": pcode,
                "geometry": feature["geometry"],
                "properties": {
                    "PCODE": pcode,
                    "state_pcode": state_pcode,
                    "level": "district",
                    "name_en": name.get("name_en", pcode),
                    "name_my": name.get("name_my", pcode),
                },
            })
        return {"type": "FeatureCollection", "features": features}
    except (OSError, json.JSONDecodeError, TypeError, ValueError) as exc:
        raise AgricultureDatasetError(f"Unable to load boundary GeoJSON: {BOUNDARY_PATH}") from exc


def ndvi_series(pcode: str | None = None) -> dict:
    data = get_ndvi_data()
    cutoff = data["date"].max() - pd.DateOffset(years=5)
    filtered = data[data["date"] >= cutoff].copy()
    if pcode:
        filtered = filtered[filtered["PCODE"] == pcode].copy()
    filtered["month_year"] = filtered["date"].dt.to_period("M").astype(str)
    grouped = (
        filtered.groupby("month_year", as_index=False)
        .agg(vim=("vim", "mean"), viq=("viq", "mean"))
        .sort_values("month_year")
    )
    return {
        "labels": grouped["month_year"].tolist(),
        "vim": grouped["vim"].round(4).tolist(),
        "viq": grouped["viq"].round(2).tolist(),
    }


def ndvi_rainfall_correlation() -> dict:
    township = load_township_data().copy()
    ndvi = get_ndvi_data().copy()
    township["month"] = township["date"].dt.month
    ndvi["month"] = ndvi["date"].dt.month
    rainfall = township.groupby("month")["rainfall_mm"].mean()
    vegetation = ndvi.groupby("month")["vim"].mean()
    months = list(range(1, 13))
    return {
        "labels": [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ],
        "rainfall_mm": [round(float(rainfall.get(month, 0)), 2) for month in months],
        "ndvi_index": [round(float(vegetation.get(month, 0)), 4) for month in months],
    }
