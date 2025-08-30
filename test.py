from flask import Flask, request, jsonify
import ee
import base64
import requests
from datetime import datetime, timedelta
from io import BytesIO
from PIL import Image
import numpy as np

app = Flask(__name__)

# Initialize Earth Engine API
ee.Initialize()

def calculate_ndvi(image):
    nir = image.select('B8')  # NIR band
    red = image.select('B4')  # Red band
    ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
    return ndvi

def ndvi_image_to_array(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    # Convert to grayscale array (NDVI palette mapped to grayscale intensity)
    return np.array(img.convert('L')).astype(float)

@app.route('/get-mangrove-vegetation-analysis', methods=['POST'])
def get_mangrove_vegetation_analysis():
    data = request.json
    lon = data['longitude']
    lat = data['latitude']
    date_str = data['date']  # 'YYYY-MM-DD'
    
    try:
        input_date = datetime.strptime(date_str, '%Y-%m-%d')
        end_date = input_date
        start_date = input_date - timedelta(days=365*8)  # 8 years back
        
        point = ee.Geometry.Point(lon, lat)
        region = point.buffer(250).bounds().getInfo()['coordinates']

        images_found = []
        ndvi_urls = []
        current_start = end_date
        current_end = end_date

        # Fetch Sentinel-2 images over the past 8 years up to 5 images, lowest cloud coverage first
        while len(images_found) < 5 and current_start > start_date:
            current_start = current_start - timedelta(days=365)
            if current_start < start_date:
                current_start = start_date
            
            collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                          .filterBounds(point)
                          .filterDate(current_start.strftime('%Y-%m-%d'), current_end.strftime('%Y-%m-%d'))
                          .sort('CLOUDY_PIXEL_PERCENTAGE'))
            
            count = collection.size().getInfo()
            if count == 0:
                current_end = current_start
                continue
            
            images_list = collection.toList(count)
            for i in range(count):
                if len(images_found) >= 5:
                    break
                image = ee.Image(images_list.get(i))
                
                # RGB thumbnail URL
                rgb_image = image.select(['B4', 'B3', 'B2'])
                rgb_url = rgb_image.getThumbUrl({
                    'region': region,
                    'dimensions': '512x512',  # Medium resolution for balance
                    'format': 'PNG'
                })
                response = requests.get(rgb_url)
                b64_rgb = base64.b64encode(response.content).decode('utf-8')

                # NDVI image URL for vegetation analysis
                ndvi = calculate_ndvi(image).clip(point.buffer(250))
                ndvi_url = ndvi.getThumbUrl({
                    'region': region,
                    'dimensions': '512x512',
                    'format': 'PNG',
                    'min': -1,
                    'max': 1,
                    'palette': ['red', 'yellow', 'green']
                })

                if b64_rgb not in images_found:
                    images_found.append(b64_rgb)
                    ndvi_urls.append(ndvi_url)
            
            current_end = current_start
        
        if len(images_found) < 2:
            return jsonify({'error': 'Not enough images found for vegetation analysis; need at least 2.'}), 404

        # Fetch NDVI images as numpy arrays to calculate vegetation decrease
        ndvi_arrays = [ndvi_image_to_array(url) for url in ndvi_urls]

        # Calculate pixel-wise NDVI difference between first and last images
        ndvi_diff = ndvi_arrays[-1] - ndvi_arrays[0]
        # Define threshold for significant vegetation decrease (pixel intensity drop)
        threshold = 10  # Adjust as needed based on NDVI palette scaling

        vegetation_loss_pixels = np.sum(ndvi_diff < -threshold)
        total_pixels = ndvi_diff.size
        vegetation_loss_percent = (vegetation_loss_pixels / total_pixels) * 100

        # Simple poisoning indicator: excessive sudden NDVI drop area percent > 5%
        poisoning_detected = bool(vegetation_loss_percent > 5)

        return jsonify({
            'vegetation_loss_percent': round(vegetation_loss_percent, 2),
            'poisoning_detected': poisoning_detected,
            'rgb_images_base64': images_found,
            'ndvi_image_urls': ndvi_urls
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
