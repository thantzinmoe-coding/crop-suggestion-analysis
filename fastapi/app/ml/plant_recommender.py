import re
from functools import lru_cache
from pathlib import Path

import pandas as pd

PRICE_MERGED_PATH = Path(__file__).resolve().parents[1] / "data" / "price_dataset_merged.csv"
CRITERIA_DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "crop_dataset (1)_aligned.xls"
MYANMAR_DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "crop_dataset_mm.xls"
PLANT_DETAILS_PATH = Path(__file__).resolve().parents[1] / "data" / "plants.csv"
NAME_ALIASES = {
    "corn (maize)": "corn",
    "tea leaf": "tealeaf",
    "betel nut (areca palm)": "betel nut",
    "morning glory (water spinach)": "morning glory",
}
TOWNSHIP_DATA_PATH = (
    Path(__file__).resolve().parents[1] / "data" / "township_agricultural_data.csv"
)
_CROP_NAMES_MY = {
    "Rice": "စပါး",
    "Wheat": "ဂျုံ",
    "Corn": "ပြောင်း",
    "Beans": "ပဲ",
    "Sesame": "နှမ်း",
}


class PlantDatasetUnavailableError(RuntimeError):
    """Raised when the plants dataset cannot be read."""


def _average(low: object, high: object) -> float:
    return round((float(low) + float(high)) / 2, 1)


def _name_key(value: object) -> str:
    key = re.sub(r"\s+", " ", str(value).strip().casefold())
    return NAME_ALIASES.get(key, key)


@lru_cache(maxsize=1)
def _load_plants() -> pd.DataFrame:
    if not PRICE_MERGED_PATH.is_file():
        raise PlantDatasetUnavailableError(f"Merged price dataset is missing: {PRICE_MERGED_PATH}")
    if not CRITERIA_DATA_PATH.is_file():
        raise PlantDatasetUnavailableError(f"Criteria dataset is missing: {CRITERIA_DATA_PATH}")
    try:
        prices = pd.read_csv(PRICE_MERGED_PATH)
        criteria = pd.read_csv(CRITERIA_DATA_PATH, sep="\t")
        price_required = ["plant_name", "plant_id", "Current_Market_Price_MMK_per_kg"]
        criteria_required = ["plant_name", "lowest_temp", "highest_temp", "soil_ph_min", "soil_ph_max", "rainfall_min", "rainfall_max", "humidity_min", "humidity_max", "water_need"]
        missing = [column for column in price_required if column not in prices.columns]
        missing += [column for column in criteria_required if column not in criteria.columns]
        if missing:
            raise ValueError(f"Missing crop dataset columns: {', '.join(missing)}")
        price_columns = ["min_height(ft)", "max_height(ft)", "min_area_square_feet", "lifetime(year)", "Current_Market_Price_MMK_per_kg"]
        for column in price_columns:
            if column in prices.columns:
                prices[column] = pd.to_numeric(prices[column].astype(str).str.replace(",", "", regex=False).str.replace('"', "", regex=False), errors="coerce")
        criteria_numeric = [column for column in criteria_required if column not in {"plant_name", "water_need"}]
        for column in criteria_numeric:
            criteria[column] = pd.to_numeric(criteria[column], errors="coerce")
        prices["plant_id"] = pd.to_numeric(prices["plant_id"], errors="coerce")
        prices["plant_name"] = prices["plant_name"].astype(str).str.strip()
        criteria["plant_name"] = criteria["plant_name"].astype(str).str.strip()
        prices["crop_key"] = prices["plant_name"].map(_name_key)
        criteria["crop_key"] = criteria["plant_name"].map(_name_key)
        prices = prices[prices["plant_name"].ne("") & prices["Current_Market_Price_MMK_per_kg"].notna()]
        criteria = criteria[criteria["plant_name"].ne("")].dropna(subset=criteria_numeric)
        prices = prices.groupby(["crop_key", "plant_id", "plant_name"], as_index=False).agg({column: "median" for column in price_columns if column in prices.columns})
        criteria = criteria.groupby("crop_key", as_index=False).agg({**{column: "median" for column in criteria_numeric}, "water_need": "first"})
        plants = prices.merge(criteria, on="crop_key", how="inner")
        if plants.empty:
            raise ValueError("The price and criteria datasets have no matching crop names")
        return plants
    except Exception as exc:
        raise PlantDatasetUnavailableError(f"The crop datasets are invalid: {PRICE_MERGED_PATH} and {CRITERIA_DATA_PATH}") from exc


@lru_cache(maxsize=1)
def _load_light_requirements() -> dict[str, str]:
    try:
        details = pd.read_csv(PLANT_DETAILS_PATH)
        if not {"plant_name", "sunlight"}.issubset(details.columns):
            return {}
        details["crop_key"] = details["plant_name"].map(_name_key)
        return {
            str(row["crop_key"]): str(row["sunlight"]).strip()
            for _, row in details.drop_duplicates("crop_key").iterrows()
            if str(row["sunlight"]).strip()
        }
    except (OSError, ValueError):
        return {}


def search_crop_requirements(
    query: str,
    language: str = "en",
    limit: int = 10,
) -> list[dict[str, object]]:
    plants = _load_plants().drop_duplicates("crop_key").copy()
    light_requirements = _load_light_requirements()
    localized_names: dict[object, str] = {}
    if language == "my":
        try:
            myanmar = pd.read_csv(MYANMAR_DATA_PATH)
            localized_names = {
                row["plant_id"]: str(row["burmese_name_mm"]).strip()
                for _, row in myanmar.drop_duplicates("plant_id").iterrows()
            }
        except (OSError, ValueError, KeyError):
            localized_names = {}

    normalized_query = query.strip().casefold()
    results: list[dict[str, object]] = []
    for _, plant in plants.iterrows():
        name_en = str(plant["plant_name"]).strip()
        localized_name = localized_names.get(plant.get("plant_id"), name_en)
        searchable_names = (name_en.casefold(), localized_name.casefold())
        if normalized_query and not any(normalized_query in name for name in searchable_names):
            continue

        light = light_requirements.get(str(plant["crop_key"]), "Not available")
        water_need = str(plant["water_need"]).strip()
        if language == "my":
            light = {
                "Full Sun": "နေရောင်အပြည့်",
                "Partial Sun": "နေရောင်တစ်စိတ်တစ်ပိုင်း",
                "Not available": "အချက်အလက် မရှိပါ",
            }.get(light, light)
            water_need = {
                "High": "များ",
                "Medium": "အလယ်အလတ်",
                "Low": "နည်း",
            }.get(water_need, water_need)

        results.append(
            {
                "crop": localized_name,
                "crop_key": name_en,
                "average_temperature_c": _average(
                    plant["lowest_temp"], plant["highest_temp"]
                ),
                "water_need": water_need,
                "average_soil_ph": _average(
                    plant["soil_ph_min"], plant["soil_ph_max"]
                ),
                "average_humidity_pct": _average(
                    plant["humidity_min"], plant["humidity_max"]
                ),
                "light_intensity": light,
            }
        )

    results.sort(
        key=lambda item: (
            str(item["crop_key"]).casefold() != normalized_query,
            not str(item["crop_key"]).casefold().startswith(normalized_query),
            str(item["crop_key"]),
        )
    )
    return results[:limit]


def recommend_plants(
    soil_ph: float,
    rainfall_mm: float,
    temperature_c: float,
    field_area_acres: float = 1,
    humidity_pct: float | None = None,
    limit: int = 3,
    language: str = "en",
    crop_only: bool = False,
) -> list[dict[str, object]]:
    plants = _load_plants().copy()
    def range_score(value: float, low: pd.Series, high: pd.Series) -> pd.Series:
        midpoint = (low + high) / 2
        span = (high - low).clip(lower=0.01)
        return (100 - ((float(value) - midpoint).abs() / span * 100)).clip(10, 100)

    temperature_score = range_score(temperature_c, plants["lowest_temp"], plants["highest_temp"])
    ph_score = range_score(soil_ph, plants["soil_ph_min"], plants["soil_ph_max"])
    rainfall_score = range_score(rainfall_mm, plants["rainfall_min"], plants["rainfall_max"])
    humidity_score = range_score(humidity_pct, plants["humidity_min"], plants["humidity_max"]) if humidity_pct is not None else pd.Series(75.0, index=plants.index)
    plants["match_score"] = (temperature_score * 0.30 + ph_score * 0.25 + rainfall_score * 0.25 + humidity_score * 0.10 + 75 * 0.10).clip(10, 98)
    viable = plants

    ranked = (
        viable.sort_values("match_score", ascending=False)
        .drop_duplicates("plant_name")
    )
    best = ranked.head(limit)
    localized: dict[object, tuple[str, str]] = {}
    if language == "my":
        try:
            myanmar = pd.read_csv(MYANMAR_DATA_PATH)
            localized = {
                row["plant_id"]: (
                    str(row["burmese_name_mm"]).strip(),
                    "",
                )
                for _, row in myanmar.drop_duplicates("plant_id").iterrows()
            }
        except (OSError, ValueError, KeyError):
            localized = {}

    results: list[dict[str, object]] = []
    for _, plant in best.iterrows():
        raw_area = plant.get("min_area_square_feet", 1)
        minimum_area = 1 if pd.isna(raw_area) else max(float(raw_area), 1)
        localized_name, localized_description = localized.get(
            plant.get("plant_id"),
            (
                str(plant["plant_name"]).strip(),
                "",
            ),
        )
        results.append(
            {
                "name": localized_name,
                "name_en": str(plant["plant_name"]).strip(),
                "match_score": round(float(plant["match_score"]), 1),
                "estimated_capacity": int(field_area_acres * 43_560 * 0.8 / minimum_area),
                "description": localized_description if localized_description and localized_description.casefold() != "nan" else "",
                "market_price_mmk_per_kg": str(
                    plant.get("Current_Market_Price_MMK_per_kg", "")
                ).strip(),
                "water_need": str(plant.get("water_need", "")).strip(),
                "sunlight": "",
                "growth_period_years": (
                    f"{plant.get('shortest_growth_period(year)', '')}–"
                    f"{plant.get('longest_growth_period(year)', '')}"
                ).strip("–"),
            }
        )
    return results


def recommend_crops(
    soil_ph: float,
    rainfall_mm: float,
    temperature_c: float,
    field_area_acres: float = 1,
    admin1: str | None = None,
    admin2: str | None = None,
    humidity_pct: float | None = None,
    language: str = "en",
    limit: int = 3,
) -> list[dict[str, object]]:
    recommendations = recommend_plants(
        soil_ph,
        rainfall_mm,
        temperature_c,
        field_area_acres=field_area_acres,
        humidity_pct=humidity_pct,
        limit=10,
        language=language,
        crop_only=True,
    )
    for recommendation in recommendations:
        recommendation.update({
            "market_price_mmk_per_kg": float(recommendation.get("market_price_mmk_per_kg", 0) or 0),
            "market_price_source": "price_dataset_merged.csv",
            "market_price_observed_date": None,
            "market_name": None,
            "market_price_is_dynamic": False,
        })
    return sorted(
        [item for item in recommendations if float(item["market_price_mmk_per_kg"]) > 0],
        key=lambda item: float(item["match_score"]), reverse=True,
    )[:limit]

    # Legacy township-history fallback retained below for reference; the
    # current flow intentionally uses only the two joined crop datasets.
    history["crop_key"] = history["best_crop"].astype(str).str.casefold()

    for recommendation in recommendations:
        crop_key = str(recommendation["name_en"])
        crop_history = history[history["crop_key"] == crop_key.casefold()]
        raw_plant_price = str(
            recommendation.get("market_price_mmk_per_kg", "")
        ).replace(",", "").strip()
        try:
            plant_price = round(float(raw_plant_price)) if raw_plant_price else 0
        except ValueError:
            plant_price = 0
        prices = pd.to_numeric(
            crop_history["local_grain_price"], errors="coerce"
        ).dropna()
        township_price = round(float(prices.mean())) if not prices.empty else 0
        market = latest_market_price(crop_key, admin1=admin1, admin2=admin2)
        price = (
            float(market["price_mmk_per_kg"])
            if market
            else float(plant_price or township_price)
        )
        price_source = (
            market.get("source", "WFP Myanmar Food Prices")
            if market
            else ("Project market dataset" if plant_price else "Township agriculture history")
        )
        recommendation.update(
            {
                "estimated_capacity": recommendation["estimated_capacity"],
                "description": (
                    recommendation["description"]
                ),
                "market_price_mmk_per_kg": price,
                "market_price_source": price_source,
                "market_price_observed_date": market.get("observed_date") if market else None,
                "market_name": market.get("market_name") if market else None,
                "market_price_is_dynamic": bool(market),
            }
        )

    feature_names = ["soil_pH", "rainfall_mm", "temperature_c"]
    conditions = pd.Series(
        [soil_ph, rainfall_mm, temperature_c],
        index=feature_names,
    )
    scales = history[feature_names].std().replace(0, 1)
    history["distance"] = (
        ((history[feature_names] - conditions) / scales)
        .pow(2)
        .sum(axis=1)
        .pow(0.5)
    )
    township_candidates: list[dict[str, object]] = []
    existing_names = {
        str(recommendation["name_en"]).casefold()
        for recommendation in recommendations
    }
    for crop, group in history.groupby("best_crop"):
        crop_name = str(crop)
        if crop_name.casefold() in existing_names:
            continue
        nearest = group.nsmallest(20, "distance")
        suitability = max(
            0,
            min(98, 99 * exp(-0.2 * float(nearest["distance"].mean()))),
        )
        prices = pd.to_numeric(nearest["local_grain_price"], errors="coerce").dropna()
        market = latest_market_price(crop_name, admin1=admin1, admin2=admin2)
        price = (
            float(market["price_mmk_per_kg"])
            if market
            else (round(float(prices.mean())) if not prices.empty else 0)
        )
        township_candidates.append(
            {
                "name": (
                    _CROP_NAMES_MY.get(crop_name, crop_name)
                    if language == "my"
                    else crop_name
                ),
                "name_en": crop_name,
                "match_score": round(suitability, 1),
                "estimated_capacity": 0,
                "description": (
                    f"{crop_name} is supported by similar township soil "
                    "and climate records."
                ),
                "market_price_mmk_per_kg": price,
                "market_price_source": (
                    market.get("source", "Township agriculture history")
                    if market
                    else "Township agriculture history"
                ),
                "market_price_observed_date": market.get("observed_date") if market else None,
                "market_name": market.get("market_name") if market else None,
                "market_price_is_dynamic": bool(market),
            }
        )

    recommendations.extend(township_candidates)

    # Do not show a crop that cannot be valued.  A price may come from the
    # latest WFP observation or from the local township history fallback, but
    # zero/blank prices are never useful to the crop-planning UI.
    priced_recommendations = [
        recommendation
        for recommendation in recommendations
        if float(recommendation.get("market_price_mmk_per_kg", 0) or 0) > 0
    ]
    return sorted(
        priced_recommendations,
        key=lambda recommendation: float(recommendation["match_score"]),
        reverse=True,
    )[:limit]
