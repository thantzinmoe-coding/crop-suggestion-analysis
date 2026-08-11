from dataclasses import dataclass


@dataclass(frozen=True)
class Region:
    pcode: str
    name_en: str
    name_my: str
