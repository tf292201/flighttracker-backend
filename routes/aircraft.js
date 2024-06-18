const express = require('express');
const { authenticateJWT, ensureLoggedIn } = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();
const jsonschema = require('jsonschema');
const Aircraft = require('../models/aircraftspotted');
const User = require('../models/user');
const favoriteFlightSchema = require('../schemas/favoriteFlightSchema.json');
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


router.post('/delete', async (req, res) => {
  const { callsign } = req.body;
  try {
    const username = res.locals.user.username;
    const userId = await User.getUserIdByUsername(username);
    console.log(userId);
    console.log(callsign);
    const deletedFlight = await Aircraft.removeFlight(userId, callsign);
  
    res.json(deletedFlight);
  } catch (error) {
    console.error('Error deleting spotted aircraft:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
      try {
        // Use the new method to find aircraft information
        const aircraftData = await Aircraft.findByIcao24(icao24);
        if (!aircraftData) {
          return res.status(404).json({ error: 'Aircraft not found' });
        }

        const { masterRow, acftrefRow } = aircraftData;

        // Fetch aircraft state from OpenSky
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

        // Get plane photo
        const { thumbnailSrc, photographer } = await getPlanePhoto(icao24);

        // Combine all results into a single object
        const combinedResult = {
          tailNum: masterRow['N-NUMBER'],
          manNum: masterRow['MFR MDL CODE'],
          manYear: masterRow['YEAR MFR'],
          regName: masterRow['NAME'],
          manName: acftrefRow ? acftrefRow['MFR'] : null,
          modelNum: acftrefRow ? acftrefRow['MODEL'] : null,
          aircraftState,
          thumbnailSrc,
          photographer
        };

        res.json({ combinedResult });
      } catch (error) {
        console.error('Error fetching plane photo or aircraft state:', error);
        res.status(500).json({ error: 'An error occurred while fetching plane photo or aircraft state' });
      }
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
