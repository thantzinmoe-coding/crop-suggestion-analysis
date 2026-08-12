from dataclasses import dataclass


@dataclass(slots=True)
class Region:
    pcode: str
    name_en: str
    name_my: str
