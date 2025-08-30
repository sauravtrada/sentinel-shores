import ee
import datetime
import matplotlib.pyplot as plt
import geemap

# Initialize GEE
ee.Initialize()

def get_image(lat, lon, date):
    point = ee.Geometry.Point([lon, lat])

    # Use Sentinel-2 (better resolution than Landsat)
    collection = (ee.ImageCollection("COPERNICUS/S2")
                  .filterBounds(point)
                  .filterDate(date - datetime.timedelta(days=15), date + datetime.timedelta(days=15))
                  .sort('CLOUDY_PIXEL_PERCENTAGE'))

    image = collection.first()
    return image

def download_and_show(image, lat, lon, title):
    vis_params = {
        'bands': ['B4', 'B3', 'B2'],  # RGB
        'min': 0,
        'max': 3000
    }
    # Get URL
    url = image.getThumbURL({
        'region': ee.Geometry.Point([lon, lat]).buffer(500).bounds().getInfo(),
        'dimensions': 512,
        **vis_params
    })

    print(f"{title} Image URL: {url}")

    # Display in Notebook (or open URL in browser)
    m = geemap.Map(center=[lat, lon], zoom=10)
    m.addLayer(image, vis_params, title)
    m.to_streamlit()  # if you want Streamlit later

def main():
    # User input
    lat = float(input("Enter latitude: "))
    lon = float(input("Enter longitude: "))

    today = datetime.date.today()
    dates = {
        "10 Days Ago": today - datetime.timedelta(days=10),
        "Today": today,
        "1 Year Ago": today.replace(year=today.year - 1),
        "2 Years Ago": today.replace(year=today.year - 2),
    }

    for title, date in dates.items():
        image = get_image(lat, lon, date)
        if image:
            download_and_show(image, lat, lon, title)
        else:
            print(f"No image found for {title}")

if __name__ == "__main__":
    main()
