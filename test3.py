import base64
import os
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
import ee

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
        # When start NDVI is zero or negative, calculate absolute change as percentage of NDVI range (-1 to 1)
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
                ndvi_image = calculate_ndvi(image).clip(region)
                mean_dict = ndvi_image.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=10
                ).getInfo()
                if mean_dict and 'NDVI' in mean_dict and mean_dict['NDVI'] is not None:
                    ndvi_mean = mean_dict['NDVI']
                else:
                    continue

                if ndvi_mean not in ndvi_mean_values:
                    ndvi_mean_values.append(ndvi_mean)
                    images_found.append(ndvi_mean)

            current_end = current_start

        if len(images_found) < 2:
            return jsonify({'error': 'Not enough images found for vegetation analysis; need at least 2.'}), 404

        vegetation_loss_percent = calculate_vegetation_loss(ndvi_mean_values)
        poisoning_detected = abs(vegetation_loss_percent) > 5

        return jsonify({
            'vegetation_loss_percent': round(vegetation_loss_percent, 2),
            'poisoning_detected': poisoning_detected
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
