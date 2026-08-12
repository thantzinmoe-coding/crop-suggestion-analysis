from app.services.satellite import EVALSCRIPT, _bbox_for_region


def test_satellite_bbox_is_valid() -> None:
    west, south, east, north = _bbox_for_region("MMR001")
    assert west < east
    assert south < north


def test_ndvi_evalscript_uses_sentinel_bands_and_cloud_mask() -> None:
    assert '"B04"' in EVALSCRIPT
    assert '"B08"' in EVALSCRIPT
    assert "sample.SCL" in EVALSCRIPT
