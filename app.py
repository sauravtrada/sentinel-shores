import base64
import io
import os
from datetime import datetime
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

import cv2
import ee
from pyngrok import ngrok

# ---------------------------
# Configuration & Thresholds
# ---------------------------
REGION_BUFFER_METERS = 250 # changed from 250 for testing purposes
S2_CLOUD_PCT = 40 #changed to 40 fron 20 for testing purposes
NUM_PREV_IMAGES = 5

NDVI_VEG_THRESHOLD = 0.5
VARI_VEG_THRESHOLD = 0.1
DEFOREST_PCT_DROP_THRESHOLD = 10.0
POISONING_DROP_DELTA = 0.10
MIN_PIXEL_AREA = 500

# ---------------------------
# FastAPI Models
# ---------------------------
class UserCredentials(BaseModel):
    id: str
    api_key: str

class AnalyzeRequest(BaseModel):
    image_base64: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    timestamp: datetime
    user: UserCredentials

class ImageMetrics(BaseModel):
    source: str
    date: Optional[str]
    mean_greenness: float
    vegetation_fraction: float
    total_pixels: int

class AnalyzeResponse(BaseModel):
    status: str
    message: str
    ngrok_url: Optional[str]
    deforestation_percent_drop: Optional[float]
    poisoning_greenness_drop: Optional[float]
    deforestation_flag: bool
    poisoning_flag: bool
    current_metrics: ImageMetrics
    historical_metrics: List[ImageMetrics]

# ---------------------------
# Init Earth Engine
# ---------------------------
_EE_READY = False
def ensure_ee_initialized():
    global _EE_READY
    if not _EE_READY:
        try:
            ee.Initialize()
            _EE_READY = True
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Google Earth Engine not initialized: {e}")

# ---------------------------
# Image decoding
# ---------------------------
def decode_base64_to_rgb(image_b64: str) -> np.ndarray:
    try:
        img_bytes = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return np.array(img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")

def to_grayscale(arr_rgb: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(arr_rgb, cv2.COLOR_RGB2GRAY)
# ---------------------------
# Greenness metrics
# ---------------------------
def compute_vari(arr_rgb: np.ndarray) -> np.ndarray:
    r = arr_rgb[..., 0].astype(np.float32)
    g = arr_rgb[..., 1].astype(np.float32)
    b = arr_rgb[..., 2].astype(np.float32)
    denom = (g + r - b)
    vari = (g - r) / (denom + 1e-6)
    return np.clip(vari, -1.0, 1.0)

def compute_mask_from_vari(vari: np.ndarray, thr: float = VARI_VEG_THRESHOLD) -> np.ndarray:
    return vari > thr

def compute_metrics_from_rgb(arr_rgb: np.ndarray) -> ImageMetrics:
    vari = compute_vari(arr_rgb)
    veg_mask = compute_mask_from_vari(vari)
    total_px = vari.size
    veg_frac = float(veg_mask.sum() / total_px)
    mean_green = float(np.mean(vari))
    return ImageMetrics(source="current_upload", date=None, mean_greenness=mean_green,
                        vegetation_fraction=veg_frac, total_pixels=int(total_px))

def compute_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    nir = nir.astype(np.float32)
    red = red.astype(np.float32)
    ndvi = (nir - red) / (nir + red + 1e-6)
    return np.clip(ndvi, -1.0, 1.0)

def compute_mask_from_ndvi(ndvi: np.ndarray, thr: float = NDVI_VEG_THRESHOLD) -> np.ndarray:
    return ndvi > thr

def metrics_from_bands(nir: np.ndarray, red: np.ndarray, green: Optional[np.ndarray], date_iso: str) -> ImageMetrics:
    ndvi = compute_ndvi(nir, red)
    veg_mask = compute_mask_from_ndvi(ndvi)
    total_px = ndvi.size
    veg_frac = float(veg_mask.sum() / total_px)
    mean_green = float(np.nanmean(ndvi))
    return ImageMetrics(source="sentinel2", date=date_iso,
                        mean_greenness=mean_green, vegetation_fraction=veg_frac,
                        total_pixels=int(total_px))

# ---------------------------
# Earth Engine helpers
# ---------------------------
# def get_s2_rectangles(lat: float, lon: float, end_dt: datetime, count: int = NUM_PREV_IMAGES):
#     ensure_ee_initialized()
#     region = ee.Geometry.Point([lon, lat]).buffer(REGION_BUFFER_METERS)
#     start_dt = ee.Date(end_dt.isoformat()).advance(-3, 'year')
#     end_ee = ee.Date(end_dt.isoformat())

#     coll = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
#             .filterBounds(region)
#             .filterDate(start_dt, end_ee)
#             #.filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', S2_CLOUD_PCT))
#             .sort('system:time_start', False))

#     imgs = coll.toList(count)
#     results = []
#     for i in range(count):
#         try:
#             img = ee.Image(imgs.get(i))
#             img_date = ee.Date(img.get('system:time_start')).format('YYYY-MM-dd').getInfo()
#             arr_dict = img.select(['B8', 'B4', 'B3']).sampleRectangle(region=region, defaultValue=0).getInfo()

#             if not all(b in arr_dict for b in ['B8','B4','B3']):
#                 continue

#             nir = np.array(arr_dict['B8']['array'])
#             red = np.array(arr_dict['B4']['array'])
#             green = np.array(arr_dict['B3']['array'])

#             # flatten nested [[]] to 2D
#             nir = np.squeeze(nir)
#             red = np.squeeze(red)
#             green = np.squeeze(green)

#             if nir.size == 0 or red.size == 0:
#                 continue

#             results.append((img_date, nir, red, green))
#         except Exception:
#             continue

#     if not results:
#         raise HTTPException(status_code=404, detail="No suitable Sentinel-2 images found for this location/time window.")
#     return results

def get_s2_rectangles(lat: float, lon: float, end_dt: datetime, count: int = NUM_PREV_IMAGES):
    ensure_ee_initialized()
    region = ee.Geometry.Point([lon, lat]).buffer(REGION_BUFFER_METERS)
    print(f"Sampling region: Lat={lat}, Lon={lon}, Buffer={REGION_BUFFER_METERS}m")
    
    max_lookback_years = 8
    earliest_year = end_dt.year - max_lookback_years
    images_found = []
    diagnostic_info = []
    
    current_end = ee.Date(end_dt.isoformat())
    for offset in range(max_lookback_years):
        year = end_dt.year - offset
        if year < earliest_year:
            break
        
        start_dt = ee.Date(f"{year}-01-01")
        end_dt_segment = ee.Date(f"{year}-12-31") if year != end_dt.year else current_end
        
        coll = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate(start_dt, end_dt_segment)
            .sort("system:time_start", False)
        )
        
        try:
            coll_size = coll.size().getInfo()
            print(f"Year {year}: ImageCollection size after filters: {coll_size}")
            diagnostic_info.append(f"Year {year}: ImageCollection size: {coll_size}")
        except Exception as e:
            print(f"Year {year}: Failed to get ImageCollection size: {e}")
            diagnostic_info.append(f"Year {year}: Size error: {e}")
            continue
        
        imgs = coll.toList(count)
        for i in range(count):
            try:
                img = ee.Image(imgs.get(i))
                img_date = ee.Date(img.get("system:time_start")).format("YYYY-MM-dd").getInfo()
                arr_dict = img.select(["B8", "B4", "B3"]).sampleRectangle(region=region, defaultValue=0).getInfo()
                
                arr_shapes = {b: np.array(arr_dict[b]["array"]).shape if b in arr_dict else None for b in ["B8", "B4", "B3"]}
                print(f"Image {i}, Date={img_date}, Array shapes: {arr_shapes}")
                diagnostic_info.append(f"Image {i}, Date={img_date}, Array shapes: {arr_shapes}")
                
                if not all(b in arr_dict for b in ["B8", "B4", "B3"]):
                    continue
                nir = np.array(arr_dict["B8"]["array"])
                red = np.array(arr_dict["B4"]["array"])
                green = np.array(arr_dict["B3"]["array"])
                nir = np.squeeze(nir)
                red = np.squeeze(red)
                green = np.squeeze(green)
                if nir.size == 0 or red.size == 0:
                    continue
                images_found.append((img_date, nir, red, green))
            except Exception as e:
                print(f"Image {i}: Exception: {e}")
                diagnostic_info.append(f"Image {i}: Exception: {e}")
                continue
        
        if images_found:
            break
    
    # Diagnostics available for your review
    print("Diagnostics summary:")
    for msg in diagnostic_info:
        print(msg)
    
    if not images_found:
        raise HTTPException(
            status_code=404,
            detail=f"No suitable Sentinel-2 images found for this location/time window — including an extended lookback period. Diagnostics: {diagnostic_info}"
        )
    
    return images_found[:count]


# ---------------------------
# Auth
# ---------------------------
def validate_user(user: UserCredentials) -> bool:
    return bool(user.id and user.api_key)

# ---------------------------
# Analysis Logic
# ---------------------------
def analyze_change(current_rgb: np.ndarray, lat: float, lon: float, end_dt: datetime):
    current_metrics = compute_metrics_from_rgb(current_rgb)
    s2_data = get_s2_rectangles(lat, lon, end_dt, count=NUM_PREV_IMAGES)

    historical_metrics: List[ImageMetrics] = []
    for date_iso, nir, red, green in s2_data:
        hist_m = metrics_from_bands(nir, red, green, date_iso)
        historical_metrics.append(hist_m)

    hist_veg_fracs = np.array([m.vegetation_fraction for m in historical_metrics], dtype=np.float32)
    hist_mean_veg_frac = float(np.mean(hist_veg_fracs)) if hist_veg_fracs.size else 0.0
    current_veg_frac = current_metrics.vegetation_fraction

    deforest_pct_drop = max(0.0, (hist_mean_veg_frac - current_veg_frac) / (hist_mean_veg_frac + 1e-6) * 100.0)
    min_area_satisfied = current_metrics.total_pixels >= MIN_PIXEL_AREA
    deforestation_flag = (deforest_pct_drop >= DEFOREST_PCT_DROP_THRESHOLD) and min_area_satisfied

    hist_mean_green = float(np.mean([m.mean_greenness for m in historical_metrics])) if historical_metrics else 0.0
    poisoning_drop = float(hist_mean_green - current_metrics.mean_greenness)
    poisoning_flag = poisoning_drop >= POISONING_DROP_DELTA

    return current_metrics, historical_metrics, deforest_pct_drop, poisoning_drop, deforestation_flag, poisoning_flag

# ---------------------------
# FastAPI App
# ---------------------------
app = FastAPI(title="Mangrove Monitor API", version="1.0.0")

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    if not validate_user(req.user):
        raise HTTPException(status_code=401, detail="Invalid user credentials")

    rgb = decode_base64_to_rgb(req.image_base64)

    current_metrics, historical_metrics, deforest_pct_drop, poisoning_drop, deforest_flag, poison_flag = analyze_change(
        current_rgb=rgb, lat=req.lat, lon=req.lon, end_dt=req.timestamp
    )

    return AnalyzeResponse(
        status="ok",
        message="Analysis complete",
        ngrok_url=os.environ.get("PUBLIC_NGROK_URL"),
        deforestation_percent_drop=round(deforest_pct_drop, 2),
        poisoning_greenness_drop=round(poisoning_drop, 3),
        deforestation_flag=deforest_flag,
        poisoning_flag=poison_flag,
        current_metrics=current_metrics,
        historical_metrics=historical_metrics,
    )

# ---------------------------
# Ngrok bootstrap
# ---------------------------
def start_ngrok(port: int = 8000) -> Optional[str]:
    token = os.environ.get("NGROK_AUTH_TOKEN")
    if not token:
        print("[Ngrok] NGROK_AUTH_TOKEN not set.")
        return None
    try:
        ngrok.set_auth_token(token)
        public_url = ngrok.connect(addr=port, proto="http").public_url
        os.environ["PUBLIC_NGROK_URL"] = public_url
        print(f"[Ngrok] Public URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"[Ngrok] Failed to start ngrok: {e}")
        return None

if __name__ == "__main__":
    start_ngrok(8000)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
