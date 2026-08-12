"""Market-price helpers backed by the WFP Myanmar food-price export.

The WFP file is an observation history, not a live quote feed.  The service
therefore always reports the newest available observation and its date, and
keeps the source visible to the API consumer.
"""

from functools import lru_cache
from pathlib import Path

import pandas as pd

PROJECT_DATA_DIR = Path(__file__).resolve().parents[3] / "datasets"
WFP_PRICES_PATH = PROJECT_DATA_DIR / "wfp_food_prices_mmr.csv"

_CROP_ALIASES = {
    "rice": "Rice",
    "rice (low quality)": "Rice",
    "rice (high quality)": "Rice",
    "rice (emata)": "Rice",
    "maize": "Corn",
    "corn": "Corn",
    "pulses": "Beans",
    "beans": "Beans",
    "chickpea": "Chickpea",
    "chickpeas": "Chickpea",
    "chickpeas (local)": "Chickpea",
    "kidneybeans": "Kidney beans",
    "kidney beans": "Kidney beans",
    "mungbean": "Mung bean",
    "mung beans": "Mung bean",
    "blackgram": "Black gram",
    "soybeans": "Soybean",
    "soybean": "Soybean",
}


class MarketPriceDatasetUnavailableError(RuntimeError):
    """Raised when the WFP price export cannot be read."""


def normalise_crop_name(value: object) -> str:
    key = " ".join(str(value).strip().casefold().replace("_", " ").split())
    return _CROP_ALIASES.get(key, str(value).strip().title())


@lru_cache(maxsize=1)
def load_wfp_prices() -> pd.DataFrame:
    if not WFP_PRICES_PATH.is_file():
        raise MarketPriceDatasetUnavailableError(
            f"WFP price dataset is missing: {WFP_PRICES_PATH}"
        )
    try:
        data = pd.read_csv(WFP_PRICES_PATH)
        required = {"date", "admin1", "admin2", "market", "commodity", "unit", "price"}
        missing = required.difference(data.columns)
        if missing:
            raise ValueError(f"missing columns: {sorted(missing)}")
        data["date"] = pd.to_datetime(data["date"], errors="coerce")
        data["price"] = pd.to_numeric(data["price"], errors="coerce")
        data["crop_name"] = data["commodity"].map(normalise_crop_name)
        data["admin1_key"] = data["admin1"].astype(str).str.casefold().str.strip()
        data["admin2_key"] = data["admin2"].astype(str).str.casefold().str.strip()
        return data[
            data["date"].notna()
            & data["price"].notna()
            & data["price"].gt(0)
            & data["unit"].astype(str).str.upper().eq("KG")
        ].copy()
    except (OSError, ValueError, KeyError) as exc:
        raise MarketPriceDatasetUnavailableError(
            "The WFP Myanmar food-price dataset is invalid."
        ) from exc


def _filter_location(data: pd.DataFrame, admin1: str | None, admin2: str | None) -> pd.DataFrame:
    if admin2:
        district = data[data["admin2_key"] == admin2.casefold().strip()]
        if not district.empty:
            return district
    if admin1:
        state = data[data["admin1_key"] == admin1.casefold().strip()]
        if not state.empty:
            return state
    return data


def latest_market_price(
    crop_name: str,
    admin1: str | None = None,
    admin2: str | None = None,
) -> dict[str, object] | None:
    data = _filter_location(load_wfp_prices(), admin1, admin2)
    crop_key = normalise_crop_name(crop_name)
    crop = data[data["crop_name"] == crop_key]
    if crop.empty:
        return None
    latest_date = crop["date"].max()
    latest = crop[crop["date"] == latest_date]
    return {
        "price_mmk_per_kg": round(float(latest["price"].median()), 2),
        "observed_date": latest_date.date().isoformat(),
        "market_name": str(latest["market"].mode().iloc[0]),
        "market_count": int(latest["market"].nunique()),
        "source": "WFP Myanmar Food Prices",
    }


def market_price_summary(
    admin1: str | None = None,
    admin2: str | None = None,
) -> list[dict[str, object]]:
    data = _filter_location(load_wfp_prices(), admin1, admin2)
    non_crop_terms = "fuel|wage|egg|meat|salt|oil"
    data = data[
        ~data["commodity"].astype(str).str.contains(
            non_crop_terms, case=False, regex=True
        )
    ]
    results = []
    for crop_name in sorted(data["crop_name"].dropna().unique()):
        price = latest_market_price(crop_name, admin1, admin2)
        if price:
            results.append({"crop": crop_name, **price})
    return results
