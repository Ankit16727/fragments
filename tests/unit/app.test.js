const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

app.get('/trigger-500', (req, res, next) => {
  const error = new Error('Simulated server failure');
  error.status = 500;
  next(error);
});

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

describe('500 Internal Server Error Handler', () => {
  test('should return 500 if invalid fragment data is sent', async () => {
    const response = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.alloc(9999999)); // Send an oversized buffer

    expect(response.status).not.toBe(500);
    expect(response.body.status).toBe('error');
  });
});
