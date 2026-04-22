import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/modules/recalls", tags=["recalls"])

NHTSA_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle"


@router.get("/")
async def check_recalls(
    make: str = Query(...),
    model: str = Query(...),
    year: int = Query(...),
):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(NHTSA_URL, params={"make": make, "model": model, "modelYear": year})
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to reach NHTSA API.")

    results = data.get("results", [])
    return [
        {
            "recall_id": r.get("NHTSAActionNumber", ""),
            "component": r.get("Component", ""),
            "summary": r.get("Summary", ""),
            "consequence": r.get("Conequence", r.get("Consequence", "")),
            "remedy": r.get("Remedy", ""),
            "report_date": r.get("ReportReceivedDate", ""),
        }
        for r in results
    ]
