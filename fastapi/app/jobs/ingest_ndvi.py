"""Run the incremental Copernicus NDVI ingestion job."""

import asyncio

from app.services.satellite import ingest_all_regions


def main() -> None:
    result = asyncio.run(ingest_all_regions())
    print(f"NDVI ingestion complete: {result}")


if __name__ == "__main__":
    main()
