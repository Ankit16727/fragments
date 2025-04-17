const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');

describe('DELETE /v1/fragments/:id - Delete fragment', () => {
  test('Delete fragment successfully', async () => {
    // First create a fragment
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Sample fragment to delete');

    const id = resPost.body.fragment.id;
    logger.debug('Created fragment for delete test with ID:', id);

    // Now delete it
    const resDelete = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');

    expect(resDelete.status).toBe(200);
    expect(resDelete.body.status).toBe('ok');
    expect(resDelete.body.message).toContain(`fragment ${id} was deleted`);
  });

  test('Return 404 if trying to delete a non-existent fragment', async () => {
    const nonExistentId = 'non-existent-fragment-id-12345';

    const res = await request(app)
      .delete(`/v1/fragments/${nonExistentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('Fragment not found');
  });

  test('Return 401 if trying to delete without authentication', async () => {
    // First create a fragment
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment without auth');

    const id = resPost.body.fragment.id;
    logger.debug('Created fragment for unauthenticated delete test with ID:', id);

    // Now delete without authentication
    const resDelete = await request(app).delete(`/v1/fragments/${id}`);
    // No auth!

    expect(resDelete.status).toBe(401); // Unauthorized
  });

  test('Should not allow deleting a fragment owned by another user', async () => {
    // Create a fragment as user1
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment owned by user1');

    const id = resPost.body.fragment.id;
    logger.debug('Created fragment owned by user1 for cross-user delete test with ID:', id);

    // Try deleting with user2
    const resDelete = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user2@email.com', 'password2'); // Different user

    expect(resDelete.status).toBe(404); // Should return 404 (not found for user2)
    expect(resDelete.body.error.message).toContain('Fragment not found');
  });
});
