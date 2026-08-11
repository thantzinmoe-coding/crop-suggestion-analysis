from dataclasses import dataclass


@dataclass(frozen=True)
class NDVIMeasurement:
    id: int
    region_pcode: str
    label: str
    vim: float
    viq: float
