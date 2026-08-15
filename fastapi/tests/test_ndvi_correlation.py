from app.services.agriculture_data import ndvi_environment_correlation


def test_ndvi_environment_correlation_uses_regional_records() -> None:
    result = ndvi_environment_correlation("MMR010")

    assert result["scope"] == "regional"
    assert result["sample_count"] >= 60
    assert result["period_start"] == "2018-01"
    assert result["period_end"] == "2023-12"
    assert set(result["correlations"]) == {
        "soil_pH",
        "rainfall_mm",
        "temperature_c",
    }
    assert all(
        coefficient is None or -1 <= coefficient <= 1
        for coefficient in result["correlations"].values()
    )


def test_ndvi_environment_correlation_labels_national_fallback() -> None:
    result = ndvi_environment_correlation("MMR001")

    assert result["scope"] == "national_reference"
    assert result["sample_count"] >= 60
