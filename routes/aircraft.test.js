const request = require('supertest');
const express = require('express');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const aircraftRoutes = require('./aircraft'); // Adjust the path as necessary

const app = express();
app.use(express.json());
app.use('/aircraft', aircraftRoutes);

const mock = new MockAdapter(axios);

describe('Aircraft Routes', () => {
  describe('GET /aircraft', () => {
    it('should return 400 if bounding box coordinates are missing', async () => {
      const response = await request(app).get('/aircraft');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Bounding box coordinates are required' });
    });

    it('should return 200 and an array of aircraft if bounding box coordinates are provided', async () => {
      mock.onGet(/https:\/\/opensky-network.org\/api\/states\/all/).reply(200, {
        states: [
          [
            'abc123',
            'TEST123',
            'TestCountry',
            1625768543,
            1625768543,
            10.0,
            20.0,
            3000,
            false,
            250,
            90,
            0,
            null,
            3200,
            '1234',
            false,
            0,
            'A1'
          ]
        ]
      });

      const response = await request(app).get('/aircraft?lat1=10&lon1=20&lat2=30&lon2=40');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.aircraft)).toBe(true);
      expect(response.body.aircraft.length).toBe(1);
      expect(response.body.aircraft[0]).toEqual({
        icao24: 'abc123',
        callsign: 'TEST123',
        origin_country: 'TestCountry',
        time_position: 1625768543,
        last_contact: 1625768543,
        longitude: 10.0,
        latitude: 20.0,
        baro_altitude: 3000,
        on_ground: false,
        velocity: 250,
        true_track: 90,
        vertical_rate: 0,
        sensors: null,
        geo_altitude: 3200,
        squawk: '1234',
        spi: false,
        position_source: 0,
        category: 'A1'
      });
    });

    it('should return 500 if an error occurs while fetching aircraft', async () => {
      mock.onGet(/https:\/\/opensky-network.org\/api\/states\/all/).reply(500);

      const response = await request(app).get('/aircraft?lat1=10&lon1=20&lat2=30&lon2=40');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'An error occurred while fetching aircraft' });
    });
  });

  describe('GET /aircraft/focus', () => {
    it('should return 404 if aircraft is not found', async () => {
      mock.onGet(/https:\/\/opensky-network.org\/api\/states\/all/).reply(200, {
        states: []
      });

      const response = await request(app).get('/aircraft/focus?icao24=a12345');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Aircraft not found' });
    });
  });

  describe('POST /aircraft/spotted', () => {
    it('should return 400 if data is invalid', async () => {
      const response = await request(app).post('/aircraft/spotted').send({});
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});
