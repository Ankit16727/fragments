const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');

describe('GET /v1/fragments/:id/info - Fragment metadata', () => {
  test('Returns metadata for a valid fragment', async () => {
    logger.info('Creating a new fragment for metadata test');

    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello world!')
      .expect(201);

    const id = resPost.body.fragment.id;
    logger.debug(`Fragment created with ID: ${id}`);

    const res = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1')
      .expect(200);

    logger.info(`Fetched metadata for fragment ${id}`);
    logger.debug('Fragment metadata:', res.body.fragment);

    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe(id);
    expect(res.body.fragment.type).toBe('text/plain');
  });

  test('Returns 404 for invalid fragment ID', async () => {
    const invalidId = 'nonexistent-id-1234';
    logger.info(`Testing metadata request for invalid fragment ID: ${invalidId}`);

    const res = await request(app)
      .get(`/v1/fragments/${invalidId}/info`)
      .auth('user1@email.com', 'password1')
      .expect(404);

    logger.warn(`Expected 404 for fragment ID: ${invalidId}`);
    logger.debug('Error response:', res.body.error);

    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });
});
