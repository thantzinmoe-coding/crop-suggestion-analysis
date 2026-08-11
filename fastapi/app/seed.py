from app.db.session import get_database

REGIONS_DATA = [
    ("MMR001", "Sagaing Region", "Sagaing Region"),
    ("MMR002", "Bago Region", "Bago Region"),
    ("MMR003", "Magway Region", "Magway Region"),
    ("MMR004", "Mandalay Region", "Mandalay Region"),
    ("MMR005", "Tanintharyi Region", "Tanintharyi Region"),
    ("MMR006", "Ayeyarwady Region", "Ayeyarwady Region"),
    ("MMR007", "Kachin State", "Kachin State"),
    ("MMR008", "Kayah State", "Kayah State"),
    ("MMR009", "Kayin State", "Kayin State"),
    ("MMR010", "Chin State", "Chin State"),
    ("MMR011", "Mon State", "Mon State"),
    ("MMR012", "Rakhine State", "Rakhine State"),
    ("MMR013", "Shan State (North)", "Shan State (North)"),
    ("MMR014", "Yangon Region", "Yangon Region"),
    ("MMR015", "Nay Pyi Taw", "Nay Pyi Taw"),
    ("MMR016", "Shan State (South)", "Shan State (South)"),
    ("MMR017", "Shan State (East)", "Shan State (East)"),
    ("MMR018", "Bago Region (East)", "Bago Region (East)"),
]


async def init_database() -> None:
    db = get_database()
    if await db.crop_profiles.find_one({"id": 1}, {"_id": 1}):
        return

    await db.regions.insert_many(
        [
            {"pcode": pcode, "name_en": name_en, "name_my": name_my}
            for pcode, name_en, name_my in REGIONS_DATA
        ]
    )

    req_list = [
        ("temperature", 18, 35, "°C", "critical"),
        ("soil_moisture", 40, 80, "%", "important"),
        ("ph", 5.5, 7.5, "pH", "critical"),
        ("light", 60, 100, "%", "important"),
        ("rainfall", 500, 1500, "mm", "advisory"),
        ("humidity", 40, 85, "%", "advisory"),
    ]
    await db.crop_profiles.insert_one(
        {
            "id": 1,
            "name": "Maize",
            "description": (
                "Maize (Zea mays) general agronomic requirements for tropical varieties."
            ),
            "source": "FAO Ecocrop / Myanmar Agriculture Department",
            "source_url": "https://ecocrop.fao.org",
            "requirements": [
                {
                    "id": index,
                    "factor": factor,
                    "min_value": minimum,
                    "max_value": maximum,
                    "unit": unit,
                    "criticality": criticality,
                }
                for index, (factor, minimum, maximum, unit, criticality) in enumerate(req_list, 1)
            ],
        }
    )
