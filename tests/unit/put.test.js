const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');

describe('PUT /v1/fragments/:id - update existing fragment', () => {
  test('Successfully updates fragment data with same content type', async () => {
    logger.info('Creating a new fragment for update test...');
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Initial content');

    const id = postRes.body.fragment.id;
    logger.debug(`Fragment created with ID: ${id}`);

    logger.info('Sending PUT request to update fragment...');
    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated content');

    logger.debug(`PUT status: ${putRes.status}`);
    expect(putRes.status).toBe(200);
    expect(putRes.body.fragment.size).toBe('Updated content'.length);
  });

  test('Fails when content type does not match original', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Initial content');

    const id = postRes.body.fragment.id;
    logger.debug(`Created fragment for type mismatch test: ${id}`);

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ updated: true }));

    logger.warn(`Expected 400 due to content-type mismatch. Got status: ${putRes.status}`);
    expect(putRes.status).toBe(400);
  });

  test('Returns 404 when trying to update non-existent fragment', async () => {
    const fakeId = 'non-existent-id';
    logger.info(`Trying to update non-existent fragment with ID: ${fakeId}`);

    const res = await request(app)
      .put(`/v1/fragments/${fakeId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Some content');

    logger.warn(`Expected 404 for invalid ID. Got: ${res.status}`);
    expect(res.status).toBe(404);
  });
});
