const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

describe('404 Handler', () => {
  test('should return a HTTP 404 error for unknown routes', async () => {
    const response = await request(app).get('/non-existent-route');

    expect(response.status).toBe(404); // Check for 404 status
    expect(response.body).toEqual({
      status: 'error',
      error: {
        message: 'not found',
        code: 404,
      },
    }); // Verify the response matches the expected output
  });
});
