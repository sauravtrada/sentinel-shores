from flask import Flask, request, jsonify
import ee
import base64
import requests
from datetime import datetime, timedelta
app = Flask(__name__)
# Initialize Earth Engine API
ee.Initialize()
@app.route('/get-mangrove-images', methods=['POST'])
def get_mangrove_images():
    data = request.json
    lon = data['longitude']
    lat = data['latitude']
    date_str = data['date']  # Expecting 'YYYY-MM-DD' format
    
    try:
        # Parse input date
        input_date = datetime.strptime(date_str, '%Y-%m-%d')
        end_date = input_date
        start_date = input_date - timedelta(days=365*8)  # 8 years back
        
        point = ee.Geometry.Point(lon, lat)
        region = point.buffer(250).bounds().getInfo()['coordinates']
        images_found = []
        current_start = end_date
        current_end = end_date
        # Expand date range backwards to gather up to 5 images
        while len(images_found) < 5 and current_start > start_date:
            # Expand the search range backwards by 1 year step at a time
            current_start = current_start - timedelta(days=365)
            if current_start < start_date:
                current_start = start_date
            
            collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
              .filterBounds(point)
              .filterDate(current_start.strftime('%Y-%m-%d'), current_end.strftime('%Y-%m-%d'))
              .sort('CLOUDY_PIXEL_PERCENTAGE'))
            
            count = collection.size().getInfo()
            if count == 0:
                # No images in this range, continue expanding date range
                current_end = current_start
                continue
            
            images_list = collection.toList(count)
            for i in range(count):
                if len(images_found) >= 5:
                    break
                image = ee.Image(images_list.get(i))
                rgb_image = image.select(['B4', 'B3', 'B2'])  # Select RGB bands for thumbnail
                url = rgb_image.getThumbUrl({
                    'region': region,
                    'dimensions': '512x512',
                    'format': 'PNG'
                })
                response = requests.get(url)
                b64_image = base64.b64encode(response.content).decode('utf-8')
                if b64_image not in images_found:
                    images_found.append(b64_image)
            
            # Move date range backwards stepwise
            current_end = current_start
        
        if not images_found:
            return jsonify({'error': 'No images found for the specified location in the past 8 years'}), 404
        
        return jsonify({'images': images_found})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)
