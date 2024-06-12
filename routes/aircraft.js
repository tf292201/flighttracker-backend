const express = require('express');
const { authenticateJWT, ensureLoggedIn } = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();
const jsonschema = require('jsonschema');
const Aircraft = require('../models/aircraftspotted');
const User = require('../models/user');
const favoriteFlightSchema = require('../schemas/favoriteFlightSchema.json');
const { searchInColumn } = require('../helpers/getFaaInfo');
const { getPlanePhoto } = require('../helpers/getPhoto');

/////////////////////////////////////////////////////////////////
// Define route to fetch aircraft within bounding box
router.get('/', async (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query; // Bounding box coordinates
    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({ error: 'Bounding box coordinates are required' });
    }

    const response = await axios.get(`https://opensky-network.org/api/states/all?lamin=${lat1}&lomin=${lon1}&lamax=${lat2}&lomax=${lon2}`);
    const aircraft = response.data.states.map(state => {
      const [
        icao24,
        callsign,
        origin_country,
        time_position,
        last_contact,
        longitude,
        latitude,
        baro_altitude,
        on_ground,
        velocity,
        true_track,
        vertical_rate,
        sensors,
        geo_altitude,
        squawk,
        spi,
        position_source,
        category
      ] = state;
      return {
        icao24,
        callsign,
        origin_country,
        time_position,
        last_contact,
        longitude,
        latitude,
        baro_altitude,
        on_ground,
        velocity,
        true_track,
        vertical_rate,
        sensors,
        geo_altitude,
        squawk,
        spi,
        position_source,
        category 
      };
    });
  
    // Extracting relevant information from each aircraft state
    res.json({ aircraft });
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    res.status(500).json({ error: 'An error occurred while fetching aircraft' });
  }
});

// Define route to fetch specific information on single aircraft
// This route fetches information from two FAA files and a third-party API
router.get('/focus', async (req, res) => {
  try {
    const { icao24 } = req.query; 
    if (!icao24.startsWith('a') && !icao24.startsWith('A')) {
      const response = await axios.get(`https://opensky-network.org/api/states/all?icao24=${icao24}`);
      const aircraftState = response.data.states.map(state => {
        const [
          icao24,
          callsign,
          origin_country,
          time_position,
          last_contact,
          longitude,
          latitude,
          baro_altitude,
          on_ground,
          velocity,
          true_track,
          vertical_rate,
          sensors,
          geo_altitude,
          squawk,
          spi,
          position_source,
          category
        ] = state;
        return {
          icao24,
          callsign,
          origin_country,
          time_position,
          last_contact,
          longitude,
          latitude,
          baro_altitude,
          on_ground,
          velocity,
          true_track,
          vertical_rate,
          sensors,
          geo_altitude,
          squawk,
          spi,
          position_source,
          category 
        };
      });
      const { thumbnailSrc, photographer } = await getPlanePhoto(icao24);
      const combinedResult = {
        aircraftState,
        thumbnailSrc,
        photographer
      };
      res.json({ combinedResult });
    } else {
      const filePath1 = './faa-info/MASTER34.txt';
      const columnIndex1 = 34; 
      const returnColumns1 = [1, 3, 5, 7]; 

      // Call searchInColumn to get initial aircraft info
      searchInColumn(filePath1, columnIndex1, icao24, returnColumns1, async (result) => {
          // Extract the string from column 3 of the result
          const searchString2 = result[1];

          // File path to search in
          const filePath2 = './faa-info/ACFTREF.txt'; 
          const columnIndex2 = 1; // Assuming column index is 1-based for the second file
          const returnColumns2 = [2, 3]; // Assuming you want to return columns 1, 2, and 3 from the second file

          // Search in the second file using the extracted string
          searchInColumn(filePath2, columnIndex2, searchString2, returnColumns2, async (result2) => {
              try {
                  // Fetch aircraft state from opensky
                  const response = await axios.get(`https://opensky-network.org/api/states/all?icao24=${icao24}`);
                  const aircraftState = response.data.states.map(state => {
                      const [
                          icao24,
                          callsign,
                          origin_country,
                          time_position,
                          last_contact,
                          longitude,
                          latitude,
                          baro_altitude,
                          on_ground,
                          velocity,
                          true_track,
                          vertical_rate,
                          sensors,
                          geo_altitude,
                          squawk,
                          spi,
                          position_source,
                          category
                      ] = state;
                      return {
                          icao24,
                          callsign,
                          origin_country,
                          time_position,
                          last_contact,
                          longitude,
                          latitude,
                          baro_altitude,
                          on_ground,
                          velocity,
                          true_track,
                          vertical_rate,
                          sensors,
                          geo_altitude,
                          squawk,
                          spi,
                          position_source,
                          category 
                      };
                  });

                  // Call getPlanePhoto to get thumbnail and photographer
                  const { thumbnailSrc, photographer } = await getPlanePhoto(icao24);
                  
                  // Combine all results into a single object
                  const combinedResult = {
                      tailNum: result[0],
                      manNum: result[1],
                      manYear: result[2],
                      regName: result[3],
                      manName: result2[0],
                      modelNum: result2[1],
                      aircraftState,
                      thumbnailSrc,
                      photographer
                  };
                
                  // Return the combinedResult with aircraft state, thumbnailSrc, and photographer
                  res.json({ combinedResult });
              } catch (error) {
                  console.error('Error fetching plane photo or aircraft state:', error);
                  res.status(500).json({ error: 'An error occurred while fetching plane photo or aircraft state' });
              }
          });
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


// POST route for adding a spotted aircraft
router.post('/spotted', async (req, res) => {
  const { body } = req;

  // Validate incoming data against the schema
  const validationResult = jsonschema.validate(body, favoriteFlightSchema);
  if (!validationResult.valid) {
    return res.status(400).json({ errors: validationResult.errors });
  }
  
  try {
    const username = res.locals.user.username;
  
    const userId = await User.getUserIdByUsername(username);
    // If data is valid, insert it into the database
    const spottedAircraft = await Aircraft.addAircraft({ ...body, userId }); // Use object destructuring to merge body and username
    res.status(201).json(spottedAircraft);
  } catch (error) {
    console.error('Error inserting spotted aircraft:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
