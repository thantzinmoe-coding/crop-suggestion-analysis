from datetime import UTC, datetime

from app.db.session import database

REGIONS_DATA = [
    ("MMR001", "Sagaing Region"),
    ("MMR002", "Bago Region"),
    ("MMR003", "Magway Region"),
    ("MMR004", "Mandalay Region"),
    ("MMR005", "Tanintharyi Region"),
    ("MMR006", "Ayeyarwady Region"),
    ("MMR007", "Kachin State"),
    ("MMR008", "Kayah State"),
    ("MMR009", "Kayin State"),
    ("MMR010", "Chin State"),
    ("MMR011", "Mon State"),
    ("MMR012", "Rakhine State"),
    ("MMR013", "Shan State (North)"),
    ("MMR014", "Yangon Region"),
    ("MMR015", "Nay Pyi Taw"),
    ("MMR016", "Shan State (South)"),
    ("MMR017", "Shan State (East)"),
    ("MMR018", "Bago Region (East)"),
]


async def init_database() -> None:
    """Create MongoDB indexes and idempotently seed local demo documents."""
    await database.regions.create_index("pcode", unique=True)
    await database.crop_profiles.create_index("id", unique=True)
    await database.crop_profiles.create_index("name", unique=True)
    await database.community_posts.create_index([("created_at", -1)])
    await database.community_posts.create_index([("post_type", 1), ("created_at", -1)])
    await database.community_posts.create_index([("crop", 1), ("created_at", -1)])

    for pcode, name in REGIONS_DATA:
        await database.regions.update_one(
            {"pcode": pcode},
            {"$setOnInsert": {"pcode": pcode, "name_en": name, "name_my": name}},
            upsert=True,
        )

    requirement_rows = [
        ("temperature", 18, 35, "°C", "critical"),
        ("soil_moisture", 40, 80, "%", "important"),
        ("ph", 5.5, 7.5, "pH", "critical"),
        ("light", 60, 100, "%", "important"),
        ("rainfall", 500, 1500, "mm", "advisory"),
        ("humidity", 40, 85, "%", "advisory"),
    ]
    requirements = [
        {
            "id": index,
            "factor": factor,
            "min_value": min_value,
            "max_value": max_value,
            "unit": unit,
            "criticality": criticality,
        }
        for index, (factor, min_value, max_value, unit, criticality) in enumerate(
            requirement_rows,
            start=1,
        )
    ]
    await database.crop_profiles.update_one(
        {"id": 1},
        {
            "$setOnInsert": {
                "id": 1,
                "name": "Maize",
                "description": (
                    "Maize (Zea mays) general agronomic requirements for tropical varieties."
                ),
                "source": "FAO Ecocrop / Myanmar Agriculture Department",
                "source_url": "https://ecocrop.fao.org",
                "requirements": requirements,
                "created_at": datetime.now(UTC),
            }
        },
        upsert=True,
    )
