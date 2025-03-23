const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');

describe('GET /v1/fragments/:id - get fragment by ID', () => {
  test('Valid ID', async () => {
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('fragment');

    const id = resPost.body.fragment.id;
    logger.debug(`Created fragment with ID: ${id}`);

    const res = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');

    logger.info(`Fetched fragment ${id} - status ${res.status}`);
    expect(res.status).toBe(200);
  });

  test('Invalid ID', async () => {
    const invalidId = '1234';
    logger.debug(`Attempting to fetch invalid fragment ID: ${invalidId}`);

    const res = await request(app)
      .get(`/v1/fragments/${invalidId}`)
      .auth('user1@email.com', 'password1');

    logger.warn(`Request for invalid fragment ID "${invalidId}" returned status ${res.status}`);
    expect(res.status).toBe(404);
  });
});
