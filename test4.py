from flask import Flask, request, jsonify
import ee
import base64
import requests
from datetime import datetime, timedelta

app = Flask(__name__)

# Initialize Earth Engine API
ee.Initialize()

def calculate_ndvi(image):
    nir = image.select('B8')
    red = image.select('B4')
    ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI')
    return ndvi

def calculate_vegetation_loss(ndvi_values):
    start_ndvi = ndvi_values[0]
    end_ndvi = ndvi_values[-1]
    if start_ndvi <= 0:
        # When start NDVI is zero or negative, calculate absolute change expressed as percentage of NDVI range (-1 to 1)
        vegetation_loss = start_ndvi - end_ndvi
        vegetation_loss_percent = (vegetation_loss / 2) * 100  # NDVI range is 2 (-1 to 1)
    else:
        ndvi_loss = start_ndvi - end_ndvi
        vegetation_loss_percent = (ndvi_loss / start_ndvi) * 100
    return vegetation_loss_percent

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
        region = point.buffer(250).bounds()
        
        images_found = []
        ndvi_mean_values = []
        ndvi_urls = []
        current_start = end_date
        current_end = end_date

        # Fetch Sentinel-2 images over past 8 years, max 5 with low cloud
        while len(images_found) < 5 and current_start > start_date:
            current_start = current_start - timedelta(days=365)
            if current_start < start_date:
                current_start = start_date
            
            collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                          .filterBounds(point)
                          .filterDate(current_start.strftime('%Y-%m-%d'), current_end.strftime('%Y-%m-%d'))
                          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
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

                # Prepare RGB thumbnail
                rgb_image = image.select(['B4', 'B3', 'B2'])
                rgb_url = rgb_image.getThumbUrl({
                    'region': region.getInfo()['coordinates'],
                    'dimensions': '512x512',
                    'format': 'PNG'
                })
                response = requests.get(rgb_url)
                b64_rgb = base64.b64encode(response.content).decode('utf-8')

                # Calculate NDVI image
                ndvi_image = calculate_ndvi(image).clip(region)

                # NDVI palette URL (for visual reference)
                ndvi_url = ndvi_image.getThumbUrl({
                    'region': region.getInfo()['coordinates'],
                    'dimensions': '512x512',
                    'format': 'PNG',
                    'min': -1,
                    'max': 1,
                    'palette': ['red', 'yellow', 'green']
                })

                # Calculate mean NDVI over the region
                mean_dict = ndvi_image.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=10
                ).getInfo()

                if mean_dict and 'NDVI' in mean_dict and mean_dict['NDVI'] is not None:
                    ndvi_mean = mean_dict['NDVI']
                else:
                    # If no NDVI value, skip this image
                    continue
                
                # Avoid duplicate RGB images by base64 string
                if b64_rgb not in images_found:
                    images_found.append(b64_rgb)
                    ndvi_urls.append(ndvi_url)
                    ndvi_mean_values.append(ndvi_mean)
                
            current_end = current_start

        if len(images_found) < 2:
            return jsonify({'error': 'Not enough images found for vegetation analysis; need at least 2.'}), 404

        # Calculate vegetation loss with improved logic
        vegetation_loss_percent = calculate_vegetation_loss(ndvi_mean_values)
        
        # Detect poisoning if absolute loss exceeds 5%
        poisoning_detected = abs(vegetation_loss_percent) > 5

        return jsonify({
            'vegetation_loss_percent': round(vegetation_loss_percent, 2),
            'poisoning_detected': poisoning_detected,
            'ndvi_mean_values': [round(val, 3) for val in ndvi_mean_values],
            'rgb_images_base64': images_found,
            'ndvi_image_urls': ndvi_urls
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
