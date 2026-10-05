const request = require('supertest');
const express = require('express');
const { getRouteSafeStops } = require('../src/services/safeStopsService');

const app = express();
app.use(express.json());

app.post('/api/routes/safe-stops', async (req, res) => {
  try {
    const { geometry, coordinates, radius } = req.body;
    const routeGeom = geometry || coordinates;

    if (!routeGeom) {
      return res.status(400).json({ error: 'Route geometry or coordinates array is required' });
    }

    const coords = Array.isArray(routeGeom) ? routeGeom : routeGeom.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) {
      return res.status(400).json({ error: 'Valid coordinates array is required' });
    }

    const corridorRadius = radius !== undefined ? Number(radius) : 500;
    const result = await getRouteSafeStops(coords, corridorRadius);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

jest.setTimeout(20000);

describe('Safe Stops Endpoint Integration Tests', () => {
  it('should return 400 if no geometry is provided', async () => {
    const res = await request(app).post('/api/routes/safe-stops').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Route geometry or coordinates/);
  });

  it('should return 400 if empty coordinates provided', async () => {
    const res = await request(app).post('/api/routes/safe-stops').send({ coordinates: [] });
    expect(res.statusCode).toBe(400);
  });

  it('should accept valid route coordinates and return structured summary and stops', async () => {
    const sampleCoords = [
      [77.2090, 28.6139],
      [77.2150, 28.6200]
    ];

    const res = await request(app)
      .post('/api/routes/safe-stops')
      .send({ coordinates: sampleCoords, radius: 500 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.radius).toBe(500);
    expect(res.body.summary).toBeDefined();
    expect(Array.isArray(res.body.stops)).toBe(true);
  });
});
