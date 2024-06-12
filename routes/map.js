const express = require('express');
const router = express.Router();
const { GOOGLE_MAPS_API_KEY } = require('../config');

router.get('/', (req, res) => {
    try {
        // Render HTML content to display the map
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Map</title>
                <style>
                    /* Set the size of the map */
                    #map {
                        height: 400px;
                        width: 100%;
                    }
                </style>
            </head>
            <body>
                <h1>Map</h1>
                <div id="map"></div>

                <script>
                    // Initialize and display the map
                    function initMap() {
                        // Check if geolocation is supported by the browser
                        if (navigator.geolocation) {
                            // Get the user's current location
                            navigator.geolocation.getCurrentPosition(function(position) {
                                // Create a new map centered around the user's current location
                                var map = new google.maps.Map(document.getElementById('map'), {
                                    center: { lat: position.coords.latitude, lng: position.coords.longitude },
                                    zoom: 15 // Set the initial zoom level
                                });
                            }, function() {
                                // Handle geolocation errors
                                handleLocationError(true, infoWindow, map.getCenter());
                            });
                        } else {
                            // Browser doesn't support geolocation
                            handleLocationError(false, infoWindow, map.getCenter());
                        }
                    }

                    // Display an error message if geolocation fails
                    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
                        var errorMsg = browserHasGeolocation ?
                            'Error: The Geolocation service failed.' :
                            'Error: Your browser doesn\'t support geolocation.';
                        alert(errorMsg);
                    }
                </script>

                <!-- Include the Google Maps JavaScript API -->
                <script async defer
                src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap">
                </script>
            </body>
            </html>
        `;
        res.send(htmlContent);
    } catch (error) {
        console.error('Error rendering map:', error);
        return res.status(500).json({ error: 'Failed to render map' });
    }
});

module.exports = router;
