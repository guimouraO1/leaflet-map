# LABSAT - Interactive Web Application for GOES-16 Data Visualization

LABSAT is a web application developed by CEPAGRI (Center for Meteorological and Climatic Research Applied to Agriculture) to provide interactive visualization of meteorological and environmental data from the GOES-16 satellite. This application aims to facilitate access to high-resolution, real-time satellite data for researchers, professionals, and users in related fields.

## Features

- **Interactive Data Visualization**: Visualize data through an intuitive web interface with features like data layer overlays and analysis tools.
- **High Temporal Frequency**: Access data updated every 10 minutes.
- **High Spatial Resolution**: Utilize high-resolution imagery for detailed analysis.
- **Data Projection**: Maintain the original image acquisition projection.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Leaflet library, and additional plugins (Timedimension, Geocoder, Easybutton).
- **Containers**: Docker for isolation and scalability.
- **Web Server**: Nginx for hosting the web interface and tiles.

## Installation

### Prerequisites

- Docker
- Docker Compose

### Steps

1. **Clone the Repository**

   ```sh
   git clone https://github.com/guimouraO1/leaflet-map
   ```

   ```sh
   cd labsat
   ```

2. **Build and Start the Containers**

   ```sh
   docker-compose up -d
   ```

## Docker Compose Configuration

The `docker-compose.yml` file is configured to set up the necessary containers for the LABSAT application:

- **Frontend Server**: Hosts the web interface using Nginx.
- **Image Processing**: Processing is done by the code https://github.com/guimouraO1/goes2image
- **Tile Hosting**: Serves the image tiles using Nginx.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## Acknowledgements

- **Funding**: This project is funded by the Fundação de \*\*.
- **Support**: Thanks to UNICAMP for cloud servers and INPE (Instituto Nacional de Pesquisas Espaciais) for collaboration and assistance.

## References

1. Kevin Micke. Every pixel of goes-17 imagery at your fingertips. Bulletin of the American Meteorological Society, 2018.
2. RAMMB Regional and Mesoscale Meteorology Branch. RGB Products - Quick Guides.
3. OSGeo Open Source Geospatial Foundation. Tile Map Service Specification, 1999.
4. DSAT - Instituto Nacional de Pesquisas Espaciais – INPE.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For more information, visit the [official website](https://plataforma.labsat.cpa.unicamp.br/).
