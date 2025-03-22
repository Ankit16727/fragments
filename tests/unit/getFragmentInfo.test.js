const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id/info - Fragment metadata', () => {
  test('Returns metadata for a valid fragment', async () => {
    // Step 1: Create a fragment
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello world!')
      .expect(201);

    const id = resPost.body.fragment.id;

    // Step 2: Request metadata for the fragment at /:id/info
    const res = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe(id);
    expect(res.body.fragment.type).toBe('text/plain');
  });

  test('Returns 404 for invalid fragment ID', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id-1234/info')
      .auth('user1@email.com', 'password1')
      .expect(404);

    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });
});
