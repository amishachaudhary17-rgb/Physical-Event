const request = require('supertest');
const app = require('../server');

// Mock external services to maintain isolation
jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'mock_uid' })
  }),
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() }
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => "Mocked AI Response" }
        })
      };
    }
  }
}));

describe('VenueCrowd API v2.1 Endpoints', () => {

  // Setup mock auth token
  const validToken = 'Bearer valid_mock_token';

  describe('Crowd & Queue API', () => {
    test('GET /api/venue/crowd should return status 200 and all zones', async () => {
      const res = await request(app).get('/api/venue/crowd');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('density');
      expect(res.body[0]).toHaveProperty('status');
    });

    test('GET /api/venue/queue should return wait time predictions formatted as standard units', async () => {
      const res = await request(app).get('/api/venue/queue');
      expect(res.statusCode).toEqual(200);
      expect(res.body[0]).toHaveProperty('estimatedWait');
      expect(res.body[0]).toHaveProperty('unit', 'min');
    });
  });

  describe('Navigation API', () => {
    test('GET /api/venue/route with valid params should return weighted path', async () => {
      const res = await request(app).get('/api/venue/route?from=gate_a&to=seating_zone_1');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('pathIds');
      expect(res.body).toHaveProperty('cost');
      expect(res.body.pathIds[0]).toBe('gate_a');
      expect(res.body).toHaveProperty('maps_data');
      expect(res.body.type).toBe('Weighted Optimality');
    });

    test('GET /api/venue/route should return 400 for missing params', async () => {
      const res = await request(app).get('/api/venue/route?from=gate_a');
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toBeDefined();
    });

    test('GET /api/venue/route should return 404 for impassable or invalid zones', async () => {
      const res = await request(app).get('/api/venue/route?from=invalid_gate&to=seating_zone_1');
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Venue Engine Exception');
      expect(res.body.message).toContain('Path not found');
    });
  });

  describe('AI Assistant API', () => {
    test('GET /api/venue/assistant should return relevant advice for a string query', async () => {
      const res = await request(app).get('/api/venue/assistant?q=Where%20is%20food');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('analysis');
    });

    test('GET /api/venue/assistant should return 400 if query is missing', async () => {
      const res = await request(app).get('/api/venue/assistant');
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toBeDefined();
    });

    test('GET /api/venue/assistant should gracefully handle AI generation failure', async () => {
      // Mock failure inside the single test scope
      jest.spyOn(require('@google/generative-ai').GoogleGenerativeAI.prototype, 'getGenerativeModel').mockImplementationOnce(() => {
        return {
           generateContent: jest.fn().mockRejectedValue(new Error('AI Quota Exceeded'))
        };
      });
      const res = await request(app).get('/api/venue/assistant?q=help');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('type', 'FALLBACK');
      expect(res.body.fallback).toContain('Try Gate B');
    });
  });

  describe('Admin & Notification API (Secure)', () => {
    test('GET /api/venue/alert should succeed without token in dev (mocked auth fall-through in testing)', async () => {
      const res = await request(app)
        .get('/api/venue/alert')
        .set('Authorization', validToken);
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('Alert Sent');
      expect(res.body.alert).toHaveProperty('title');
    });

    test('GET /api/venue/alert should fail with 401 if token is missing and strict auth is expected', async () => {
        // Force production environment temporarily to ensure auth middleware protects the route
        const origEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const res = await request(app).get('/api/venue/alert');
        process.env.NODE_ENV = origEnv;

        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toContain('No token provided');
    });

    test('POST /api/venue/admin/density should update live state successfully', async () => {
      const res = await request(app)
        .post('/api/venue/admin/density')
        .set('Authorization', validToken)
        .send({ zoneId: 'gate_b', density: 10 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.updatedZone.density).toEqual(10);
    });

    test('POST /api/venue/admin/density should fail with out-of-range density (Validation test)', async () => {
      const res = await request(app)
        .post('/api/venue/admin/density')
        .set('Authorization', validToken)
        .send({ zoneId: 'gate_b', density: 150 });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].path).toBe('density');
    });

    test('POST /api/venue/admin/density should yield 404 for unknown zones', async () => {
      const res = await request(app)
        .post('/api/venue/admin/density')
        .set('Authorization', validToken)
        .send({ zoneId: 'unknown_zone', density: 90 });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toContain('Zone not found');
    });
  });

  describe('Global System & External Integrity', () => {
    test('Unhandled route should return 404 AppError', async () => {
      const res = await request(app).get('/api/invalid-fake-route');
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toContain('Can\'t find');
    });

    test('Internal Server Errors are mapped to generic 500 response', async () => {
      // Intentionally cause failure in route logic
      jest.spyOn(require('../src/services/navigationService'), 'findSmartPath').mockImplementationOnce(() => {
        throw new Error('Critical Service Failure');
      });
      const res = await request(app).get('/api/venue/route?from=gate_a&to=gate_b');
      expect(res.statusCode).toEqual(500);
      expect(res.body.error).toBe('Venue Engine Exception');
      expect(res.body.message).toContain('calculating route');
    });

    test('POST /api/calendar/sync should return handled error when lacking credentials', async () => {
      const res = await request(app).post('/api/calendar/sync');
      expect(res.statusCode).toEqual(200); // Because it gracefully falls back per problem statement 'Google Service Demo mock'
      expect(res.body.error).toContain('Notice: Sync is in simulated mode');
    });
  });
});
